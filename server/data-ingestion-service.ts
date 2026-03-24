/**
 * Serviço de Ingestão Completo - Dados Bancários
 * 
 * Responsável por:
 * 1. Coletar dados do Banco Central
 * 2. Processar e normalizar
 * 3. Salvar no banco de dados
 * 4. Calcular scores
 */

import { prisma } from "@/lib/db";
import { bcbDataService, BANK_CNPJ_MAP, type BCBBankData } from "./bcb-data-service";
import { METRICS_CONFIG } from "@/lib/metrics-config";
import { bcbAPI } from "./bcb-api-service";

export interface IngestionResult {
  success: boolean;
  banksProcessed: number;
  metricsCollected: number;
  errors: string[];
  duration: number;
}

export class DataIngestionService {
  
  /**
   * Executa coleta completa de dados
   */
  async runFullIngestion(referenceDate?: string): Promise<IngestionResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let banksProcessed = 0;
    let metricsCollected = 0;

    // Criar log de ingestão
    const ingestionLog = await prisma.dataIngestionLog.create({
      data: {
        source: 'bcb',
        status: 'running',
        recordsCount: 0,
      },
    });

    try {
      console.log('[INGESTÃO] Iniciando coleta de dados do BCB...');

      // Sempre persistir snapshots com a data-base oficial da publicação IFData.
      const effectiveReferenceDate = referenceDate || bcbAPI.getLatestAvailableQuarter().date;
      
      // 1. Coletar dados do BCB
      const bcbData = await bcbDataService.fetchConsolidatedData(effectiveReferenceDate);
      
      console.log(`[INGESTÃO] Coletados dados de ${bcbData.size} bancos`);

      // 2. Processar cada banco
      for (const [cnpj, bankData] of bcbData.entries()) {
        try {
          await this.processBankData(cnpj, bankData, effectiveReferenceDate);
          banksProcessed++;
          metricsCollected += this.countMetrics(bankData);
        } catch (error) {
          const errorMsg = `Erro ao processar banco ${bankData.nome}: ${error}`;
          console.error(`[INGESTÃO] ${errorMsg}`);
          errors.push(errorMsg);
        }
      }

      // 3. Atualizar log com sucesso
      await prisma.dataIngestionLog.update({
        where: { id: ingestionLog.id },
        data: {
          status: errors.length === 0 ? 'success' : 'partial',
          recordsCount: banksProcessed,
          errorMessage: errors.length > 0 ? errors.join('\n') : null,
          completedAt: new Date(),
        },
      });

      const duration = Date.now() - startTime;

      console.log(`[INGESTÃO] Concluída em ${duration}ms`);
      console.log(`[INGESTÃO] Bancos processados: ${banksProcessed}`);
      console.log(`[INGESTÃO] Métricas coletadas: ${metricsCollected}`);
      if (errors.length > 0) {
        console.log(`[INGESTÃO] Erros: ${errors.length}`);
      }

      return {
        success: errors.length === 0,
        banksProcessed,
        metricsCollected,
        errors,
        duration,
      };

    } catch (error) {
      // Erro fatal
      const errorMsg = `Erro fatal na ingestão: ${error}`;
      console.error(`[INGESTÃO] ${errorMsg}`);
      
      await prisma.dataIngestionLog.update({
        where: { id: ingestionLog.id },
        data: {
          status: 'error',
          errorMessage: errorMsg,
          completedAt: new Date(),
        },
      });

      throw error;
    }
  }

  /**
   * Processa dados de um banco específico
   */
  private async processBankData(cnpj: string, bankData: BCBBankData, referenceDate?: string) {
    const date = referenceDate ? new Date(referenceDate) : new Date();
    const normalizedCnpj = cnpj.replace(/\D/g, '');
    const slug = this.getSlugFromCNPJ(normalizedCnpj) || `bank-${normalizedCnpj}`;

    // 1. Encontrar ou criar banco
    let bank = await prisma.bank.findFirst({
      where: {
        OR: [
          { cnpj: normalizedCnpj },
          { slug },
        ],
      },
    });

    if (!bank) {
      bank = await prisma.bank.create({
        data: {
          name: bankData.nome,
          slug,
          cnpj: normalizedCnpj,
          type: this.inferBankType(bankData.nome),
          country: 'BR',
          segment: bankData.segmento || 'S4',
        },
      });
      
      console.log(`[INGESTÃO] Novo banco criado: ${bank.name}`);
    } else if (bank.cnpj !== normalizedCnpj || bank.name !== bankData.nome) {
      bank = await prisma.bank.update({
        where: { id: bank.id },
        data: {
          cnpj: normalizedCnpj,
          name: bankData.nome,
          segment: bankData.segmento || bank.segment || 'S4',
        },
      });
    }

    // 2. Criar ou atualizar snapshot com todos os dados
    await prisma.bankSnapshot.upsert({
      where: {
        bankId_date: {
          bankId: bank.id,
          date,
        },
      },
      update: {
        // Capital
        basilRatio: bankData.basileia ?? null,
        tier1Ratio: bankData.tier1 ?? null,
        cet1Ratio: bankData.cet1 ?? null,
        leverageRatio: bankData.alavancagem ?? null,
        
        // Liquidez
        lcr: bankData.lcr ?? null,
        nsfr: bankData.nsfr ?? null,
        quickLiquidity: bankData.liquidez ?? null,
        loanToDeposit: bankData.loanToDeposit ?? null,
        
        // Rentabilidade
        roe: bankData.roe ?? null,
        roa: bankData.roa ?? null,
        nim: bankData.nim ?? null,
        costToIncome: bankData.costToIncome ?? null,
        
        // Qualidade de Crédito
        nplRatio: bankData.inadimplencia ?? null,
        coverageRatio: bankData.coverageRatio ?? null,
        writeOffRate: bankData.writeOffRate ?? null,
        creditQuality: bankData.creditQuality ?? null,
        
        // Tamanho
        totalAssets: bankData.ativoTotal ?? null,
        equity: bankData.patrimonioLiquido ?? null,
        totalDeposits: bankData.totalDeposits ?? null,
        loanPortfolio: bankData.loanPortfolio ?? null,
        
        // Crescimento
        assetGrowth: bankData.assetGrowth ?? null,
        loanGrowth: bankData.loanGrowth ?? null,
        depositGrowth: bankData.depositGrowth ?? null,
      },
      create: {
        bankId: bank.id,
        date,
        
        // Capital
        basilRatio: bankData.basileia ?? null,
        tier1Ratio: bankData.tier1 ?? null,
        cet1Ratio: bankData.cet1 ?? null,
        leverageRatio: bankData.alavancagem ?? null,
        
        // Liquidez
        lcr: bankData.lcr ?? null,
        nsfr: bankData.nsfr ?? null,
        quickLiquidity: bankData.liquidez ?? null,
        loanToDeposit: bankData.loanToDeposit ?? null,
        
        // Rentabilidade
        roe: bankData.roe ?? null,
        roa: bankData.roa ?? null,
        nim: bankData.nim ?? null,
        costToIncome: bankData.costToIncome ?? null,
        
        // Qualidade de Crédito
        nplRatio: bankData.inadimplencia ?? null,
        coverageRatio: bankData.coverageRatio ?? null,
        writeOffRate: bankData.writeOffRate ?? null,
        creditQuality: bankData.creditQuality ?? null,
        
        // Tamanho
        totalAssets: bankData.ativoTotal ?? null,
        equity: bankData.patrimonioLiquido ?? null,
        totalDeposits: bankData.totalDeposits ?? null,
        loanPortfolio: bankData.loanPortfolio ?? null,
        
        // Crescimento
        assetGrowth: bankData.assetGrowth ?? null,
        loanGrowth: bankData.loanGrowth ?? null,
        depositGrowth: bankData.depositGrowth ?? null,
      },
    });

    // 3. Criar valores de métricas individuais (para compatibilidade com o sistema antigo)
    await this.createMetricValues(bank.id, bankData, date);

    console.log(`[INGESTÃO] Snapshot criado para ${bank.name}`);
  }

  /**
   * Cria valores de métricas individuais
   */
  private async createMetricValues(bankId: string, bankData: BCBBankData, date: Date) {
    const metrics = await prisma.metric.findMany();
    const metricsMap = new Map(metrics.map(m => [m.key, m]));

    const valuesToCreate = [];

    // Mapear dados do BCB para métricas
    const dataMapping: Record<string, number | undefined> = {
      'basel_ratio': bankData.basileia,
      'roe': bankData.roe,
      'roa': bankData.roa,
      'quick_liquidity': bankData.liquidez,
      'npl_ratio': bankData.inadimplencia,
      'total_assets': bankData.ativoTotal,
      'equity': bankData.patrimonioLiquido,
      'lcr': bankData.lcr,
      'nsfr': bankData.nsfr,
      'nim': bankData.nim,
      'cost_to_income': bankData.costToIncome,
    };

    for (const [key, value] of Object.entries(dataMapping)) {
      if (value !== undefined && value !== null) {
        const metric = metricsMap.get(key);
        if (metric) {
          valuesToCreate.push({
            bankId,
            metricId: metric.id,
            date,
            value,
          });
        }
      }
    }

    if (valuesToCreate.length > 0) {
      await prisma.metricValue.createMany({
        data: valuesToCreate,
        skipDuplicates: true,
      });
    }
  }

  /**
   * Conta métricas coletadas
   */
  private countMetrics(bankData: BCBBankData): number {
    let count = 0;
    const fields = [
      'basileia', 'roe', 'roa', 'liquidez', 'inadimplencia',
      'lcr', 'nsfr', 'nim', 'costToIncome', 'ativoTotal', 'patrimonioLiquido'
    ];
    
    for (const field of fields) {
      if (bankData[field as keyof BCBBankData] !== undefined && bankData[field as keyof BCBBankData] !== null) {
        count++;
      }
    }
    
    return count;
  }

  /**
   * Obtém slug do banco pelo CNPJ
   */
  private getSlugFromCNPJ(cnpj: string): string | null {
    for (const [slug, mappedCnpj] of Object.entries(BANK_CNPJ_MAP)) {
      if (mappedCnpj === cnpj) {
        return slug;
      }
    }
    return null;
  }

  /**
   * Infere tipo do banco pelo nome
   */
  private inferBankType(name: string): string {
    const digitalKeywords = ['digital', 'fintech', 'neon', 'nubank', 'inter', 'c6', 'next', 'original', 'pagbank'];
    const nameLower = name.toLowerCase();
    
    for (const keyword of digitalKeywords) {
      if (nameLower.includes(keyword)) {
        return 'digital';
      }
    }
    
    return 'traditional';
  }

  /**
   * Inicializa métricas no banco de dados
   */
  async initializeMetrics() {
    console.log('[INGESTÂO] Inicializando métricas...');
    
    for (const metricConfig of Object.values(METRICS_CONFIG)) {
      await prisma.metric.upsert({
        where: { key: metricConfig.key },
        update: {
          label: metricConfig.label,
          unit: metricConfig.unit,
          category: metricConfig.category,
          description: metricConfig.description,
        },
        create: {
          key: metricConfig.key,
          label: metricConfig.label,
          unit: metricConfig.unit,
          category: metricConfig.category,
          description: metricConfig.description,
        },
      });
    }
    
    console.log(`[INGESTÃO] ${Object.keys(METRICS_CONFIG).length} métricas inicializadas`);
  }
}

export const dataIngestionService = new DataIngestionService();
