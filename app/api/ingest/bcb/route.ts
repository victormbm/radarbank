/**
 * 🎯 API Route: Ingestão de dados do Banco Central
 * 
 * GET /api/ingest/bcb - Busca dados da API IFData e salva no banco
 * 
 * Query params:
 * - dataBase: Data-base opcional (ex: "2025-12-31")
 * - historical: Número de trimestres históricos (ex: "6")
 * - dryRun: Se true, não salva no banco (apenas testa)
 */

import { NextRequest, NextResponse } from 'next/server';
import { bcbAPI } from '@/server/bcb-api-service';
import { prisma } from '@/lib/db';
import { requireAdminAccess } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 segundos (Vercel limit)

interface IngestionStats {
  success: boolean;
  startTime: string;
  endTime?: string;
  duration?: string;
  dataBase: string;
  banksProcessed: number;
  snapshotsCreated: number;
  scoresCreated: number;
  errors: string[];
  dryRun: boolean;
}

export async function GET(request: NextRequest) {
  const auth = requireAdminAccess(request);
  if (!auth.allowed) {
    return auth.response;
  }

  // Guardrail operacional: este endpoint deve rodar apenas em modo estrito auditavel.
  const strictOnly = process.env.BCB_STRICT_ONLY !== 'false';
  if (!strictOnly) {
    return NextResponse.json(
      {
        success: false,
        error: 'Modo estrito desativado no ambiente. Operacao bloqueada por politica.',
        message: 'Defina BCB_STRICT_ONLY=true para permitir ingestao oficial.',
      },
      { status: 503 }
    );
  }

  const startTime = new Date();
  const stats: IngestionStats = {
    success: false,
    startTime: startTime.toISOString(),
    dataBase: '',
    banksProcessed: 0,
    snapshotsCreated: 0,
    scoresCreated: 0,
    errors: [],
    dryRun: false,
  };

  try {
    // Parse query params
    const { searchParams } = new URL(request.url);
    const dataBase = searchParams.get('dataBase') || undefined;
    const historical = searchParams.get('historical');
    const dryRun = searchParams.get('dryRun') === 'true';
    
    stats.dryRun = dryRun;

    console.log('\n' + '='.repeat(70));
    console.log('🚀 INICIANDO INGESTÃO DE DADOS DO BCB');
    console.log('='.repeat(70));
    console.log(`📅 Data de execução: ${startTime.toLocaleString('pt-BR')}`);
    console.log(`🔧 Modo: ${dryRun ? 'DRY RUN (teste)' : 'PRODUÇÃO (salva no banco)'}`);
    console.log('='.repeat(70) + '\n');

    // Testar conexão com API
    const connectionOk = await bcbAPI.testConnection();
    if (!connectionOk) {
      throw new Error('Falha ao conectar com API do BCB');
    }

    // Buscar dados
    let banksData;
    if (historical) {
      const quarters = parseInt(historical, 10);
      console.log(`📜 Modo histórico: coletando ${quarters} trimestres`);
      
      const historicalData = await bcbAPI.fetchHistoricalData(quarters);
      
      // Processar cada trimestre
      for (const [date, banks] of historicalData) {
        stats.dataBase = date;
        await processQuarterData(banks, date, stats, dryRun);
      }
      
    } else {
      // Modo padrão: apenas último trimestre
      const quarter = dataBase 
        ? { date: dataBase } 
        : bcbAPI.getLatestAvailableQuarter();
      
      stats.dataBase = quarter.date;
      
      console.log(`📊 Coletando dados do trimestre: ${quarter.date}`);
      banksData = await bcbAPI.fetchAllBanksData(dataBase);
      
      await processQuarterData(banksData, quarter.date, stats, dryRun);
    }

    // Finalização
    const endTime = new Date();
    stats.endTime = endTime.toISOString();
    stats.duration = `${((endTime.getTime() - startTime.getTime()) / 1000).toFixed(2)}s`;
    stats.success = true;

    console.log('\n' + '='.repeat(70));
    console.log('✅ INGESTÃO CONCLUÍDA COM SUCESSO');
    console.log('='.repeat(70));
    console.log(`⏱️  Duração: ${stats.duration}`);
    console.log(`🏦 Bancos processados: ${stats.banksProcessed}`);
    console.log(`📸 Snapshots criados: ${stats.snapshotsCreated}`);
    console.log(`🎯 Scores calculados: ${stats.scoresCreated}`);
    if (stats.errors.length > 0) {
      console.log(`⚠️  Erros encontrados: ${stats.errors.length}`);
    }
    console.log('='.repeat(70) + '\n');

    return NextResponse.json(stats, { status: 200 });

  } catch (error) {
    const endTime = new Date();
    stats.endTime = endTime.toISOString();
    stats.duration = `${((endTime.getTime() - startTime.getTime()) / 1000).toFixed(2)}s`;
    stats.success = false;
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    stats.errors.push(errorMessage);

    console.error('\n' + '='.repeat(70));
    console.error('❌ INGESTÃO FALHOU');
    console.error('='.repeat(70));
    console.error('Erro:', errorMessage);
    console.error('='.repeat(70) + '\n');

    return NextResponse.json(stats, { status: 500 });
  }
}

/**
 * Processa dados de um trimestre específico
 */
async function processQuarterData(
  banksData: any[], 
  dataBase: string, 
  stats: IngestionStats,
  dryRun: boolean
) {
  console.log(`\n📦 Processando trimestre: ${dataBase}`);
  console.log(`🏦 Total de bancos: ${banksData.length}`);
  console.log('─'.repeat(60));

  for (const bankData of banksData) {
    try {
      stats.banksProcessed++;
      
      console.log(`\n[${stats.banksProcessed}/${banksData.length}] ${bankData.nome}`);
      console.log(`   CNPJ: ${bankData.cnpj}`);

      if (dryRun) {
        console.log(`   ⏭️  DRY RUN - Pulando salvamento no banco`);
        console.log(`   📊 Basileia: ${bankData.basileia ?? 'N/A'}%`);
        console.log(`   💰 Patrimônio: R$ ${(bankData.patrimonioLiquido ?? 0) / 1e9} bi`);
        continue;
      }

      // 1. Verificar/criar banco
      let bank = await prisma.bank.findUnique({
        where: { cnpj: bankData.cnpj }
      });

      if (!bank) {
        // Gerar slug a partir do nome
        const slug = bankData.nome
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Remove acentos
          .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
          .trim()
          .replace(/\s+/g, '-') // Substitui espaços por hífens
          .substring(0, 50); // Limita tamanho
        
        bank = await prisma.bank.create({
          data: {
            cnpj: bankData.cnpj,
            name: bankData.nome,
            segment: bankData.segmento || 'S1',
            slug: slug,
            type: 'commercial', // Tipo padrão para bancos comerciais
            country: 'BR', // Brasil
          }
        });
        console.log(`   ✅ Banco criado no sistema (slug: ${slug})`);
      } else {
        console.log(`   ✓  Banco já existe no sistema`);
      }

      // 2. Criar ou atualizar snapshot em modo estrito
      const snapshot = await prisma.bankSnapshot.upsert({
        where: {
          bankId_date: {
            bankId: bank.id,
            date: new Date(dataBase)
          }
        },
        update: {
          bankId: bank.id,
          date: new Date(dataBase),
          // Capital
          basilRatio: bankData.basileia ?? null,
          tier1Ratio: bankData.tier1 ?? null,
          cet1Ratio: bankData.cet1 ?? null,
          leverageRatio: bankData.alavancagem ?? null,
          // Patrimônio e Ativos
          equity: bankData.patrimonioLiquido ?? null,
          totalAssets: bankData.ativoTotal ?? null,
          totalDeposits: bankData.totalDeposits ?? null,
          loanPortfolio: bankData.loanPortfolio ?? null,
          // Rentabilidade
          roe: bankData.roe ?? null,
          roa: bankData.roa ?? null,
          nim: bankData.nim ?? null,
          costToIncome: bankData.costToIncome ?? null,
          // Liquidez
          lcr: bankData.lcr ?? null,
          nsfr: bankData.nsfr ?? null,
          quickLiquidity: bankData.liquidez ?? null,
          loanToDeposit: bankData.loanToDeposit ?? null,
          // Crédito
          nplRatio: bankData.inadimplencia ?? null,
          coverageRatio: bankData.coverageRatio ?? null,
          writeOffRate: bankData.writeOffRate ?? null,
          creditQuality: bankData.creditQuality ?? null,
        },
        create: {
          bankId: bank.id,
          date: new Date(dataBase),
          basilRatio: bankData.basileia ?? null,
          tier1Ratio: bankData.tier1 ?? null,
          cet1Ratio: bankData.cet1 ?? null,
          leverageRatio: bankData.alavancagem ?? null,
          equity: bankData.patrimonioLiquido ?? null,
          totalAssets: bankData.ativoTotal ?? null,
          totalDeposits: bankData.totalDeposits ?? null,
          loanPortfolio: bankData.loanPortfolio ?? null,
          roe: bankData.roe ?? null,
          roa: bankData.roa ?? null,
          nim: bankData.nim ?? null,
          costToIncome: bankData.costToIncome ?? null,
          lcr: bankData.lcr ?? null,
          nsfr: bankData.nsfr ?? null,
          quickLiquidity: bankData.liquidez ?? null,
          loanToDeposit: bankData.loanToDeposit ?? null,
          nplRatio: bankData.inadimplencia ?? null,
          coverageRatio: bankData.coverageRatio ?? null,
          writeOffRate: bankData.writeOffRate ?? null,
          creditQuality: bankData.creditQuality ?? null,
        },
      });

      stats.snapshotsCreated++;
      console.log(`   ✅ Snapshot sincronizado (ID: ${snapshot.id})`);

      // 3. Em modo estritamente auditado, não persistimos score composto.
      await prisma.bankScore.deleteMany({
        where: {
          bankId: bank.id,
          date: new Date(dataBase)
        }
      });
      console.log('   ℹ️  Score composto desativado em modo IFData estrito');

    } catch (error) {
      const errorMsg = `Erro ao processar ${bankData.nome}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
      stats.errors.push(errorMsg);
      console.error(`   ❌ ${errorMsg}`);
    }
  }
}
