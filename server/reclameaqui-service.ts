/**
 * Serviço de Coleta de Dados do Reclame Aqui
 * 
 * Coleta métricas de reputação dos bancos para análise de experiência do consumidor
 * 
 * IMPORTANTE: Esta implementação usa dados mockados baseados em dados reais
 * Para produção, implementar scraping ético ou API oficial (se disponível)
 */

import { prisma } from '@/lib/db';

export interface ReclameAquiData {
  bankName: string;
  cnpj?: string;
  reputationScore: number; // 0-10
  resolvedRate: number; // 0-100%
  averageRating: number; // 0-5 estrelas
  totalComplaints: number;
  responseTime: number; // horas
  topComplaints: string[];
  sentimentScore: number; // -1 a +1
  lastUpdate: Date;
}

/**
 * Mapeamento de bancos para URLs do Reclame Aqui
 * TODO: Implementar scraping real em produção
 */
const RECLAMEAQUI_BANK_MAP: Record<string, string> = {
  'nubank': 'nu-pagamentos-sa',
  'itau': 'itau-unibanco',
  'bradesco': 'bradesco',
  'santander': 'santander',
  'inter': 'banco-inter',
  'c6': 'c6-bank',
  'pagbank': 'pagbank',
  'btg': 'btg-pactual',
  'safra': 'banco-safra',
  'original': 'banco-original',
  'pan': 'banco-pan',
  'bmg': 'banco-bmg',
  'neon': 'neon',
  'next': 'next',
};

export class ReclameAquiService {
  
  /**
   * Coleta dados de reputação de um banco específico
   */
  async fetchBankReputation(bankSlug: string): Promise<ReclameAquiData | null> {
    console.warn(
      `[ReclameAqui] Coleta bloqueada para ${bankSlug}: politica zero-scraping (modo API-only).`,
    );
    return null;
  }

  /**
   * Normaliza slug do banco para encontrar match no mapeamento
   * 
   * Exemplos:
   * - "banco-bradesco-sa" -> "bradesco"
   * - "banco-do-brasil-sa" -> "brasil" (não ideal, mas funciona com mock)
   * - "nu-pagamentos-sa" -> "nubank"
   */
  private normalizeBankSlug(slug: string): string {
    const lower = slug.toLowerCase();
    
    // Mapeamento especial para casos conhecidos
    const specialCases: Record<string, string> = {
      'nu-pagamentos-sa': 'nubank',
      'banco-do-brasil-sa': 'brasil',
      'banco-do-brasil': 'brasil',
      'caixa-economica-federal': 'caixa',
      'itau-unibanco-sa': 'itau',
      'banco-bradesco-sa': 'bradesco',
      'banco-santander-brasil-sa': 'santander',
      'banco-inter-sa': 'inter',
      'banco-c6-sa': 'c6',
      'banco-btg-pactual-sa': 'btg',
      'pagseguro-internet-sa': 'pagbank',
      'banco-safra-sa': 'safra',
      'banco-original-sa': 'original',
      'banco-next-sa': 'next',
      'neon-pagamentos-sa': 'neon',
      'banco-pan-sa': 'pan',
      'banco-bmg-sa': 'bmg',
    };

    // Verificar correspondência direta
    if (specialCases[lower]) {
      return specialCases[lower];
    }

    // Tentar extrair nome do banco removendo prefixos/sufixos comuns
    const cleaned = lower
      .replace(/^banco-/, '')
      .replace(/^nu-/, 'nubank-')
      .replace(/-s\.?a\.?$/, '')
      .replace(/-pagamentos.*$/, '')
      .replace(/-internet.*$/, '');

    // Pegar primeira palavra significativa
    const parts = cleaned.split('-');
    if (parts[0] === 'do' || parts[0] === 'da') {
      return parts[1] || parts[0]; // "do brasil" -> "brasil"
    }

    return parts[0];
  }

  /**
   * Coleta dados de todos os bancos
   */
  async fetchAllBanks(): Promise<Map<string, ReclameAquiData>> {
    const results = new Map<string, ReclameAquiData>();
    
    for (const bankSlug of Object.keys(RECLAMEAQUI_BANK_MAP)) {
      try {
        const data = await this.fetchBankReputation(bankSlug);
        if (data) {
          results.set(bankSlug, data);
        }
        
        // Rate limiting: aguardar 1 segundo entre requisições
        await this.sleep(1000);
        
      } catch (error) {
        console.error(`[ReclameAqui] Erro em ${bankSlug}:`, error);
      }
    }
    
    return results;
  }

  /**
   * Salva dados de reputação no banco de dados
   */
  async saveReputationData(bankId: string, data: ReclameAquiData): Promise<void> {
    try {
      await prisma.bankReputation.upsert({
        where: {
          bankId_source_referenceDate: {
            bankId,
            source: 'reclameaqui',
            referenceDate: data.lastUpdate,
          },
        },
        update: {
          reputationScore: data.reputationScore,
          resolvedRate: data.resolvedRate,
          averageRating: data.averageRating,
          totalComplaints: data.totalComplaints,
          responseTime: data.responseTime,
          topComplaint1: data.topComplaints[0] || null,
          topComplaint2: data.topComplaints[1] || null,
          topComplaint3: data.topComplaints[2] || null,
          sentimentScore: data.sentimentScore,
          rawData: JSON.stringify(data),
          lastScraped: new Date(),
        },
        create: {
          bankId,
          source: 'reclameaqui',
          referenceDate: data.lastUpdate,
          reputationScore: data.reputationScore,
          resolvedRate: data.resolvedRate,
          averageRating: data.averageRating,
          totalComplaints: data.totalComplaints,
          responseTime: data.responseTime,
          topComplaint1: data.topComplaints[0] || null,
          topComplaint2: data.topComplaints[1] || null,
          topComplaint3: data.topComplaints[2] || null,
          sentimentScore: data.sentimentScore,
          rawData: JSON.stringify(data),
          lastScraped: new Date(),
        },
      });
      
      console.log(`✅ [ReclameAqui] Dados salvos para banco ${bankId}`);
    } catch (error) {
      console.error(`❌ [ReclameAqui] Erro ao salvar dados:`, error);
      throw error;
    }
  }

  /**
   * Busca última reputação de um banco
   */
  async getLatestReputation(bankId: string): Promise<ReclameAquiData | null> {
    try {
      const latest = await prisma.bankReputation.findFirst({
        where: { bankId, source: 'reclameaqui' },
        orderBy: { referenceDate: 'desc' },
      });

      if (!latest) return null;

      return {
        bankName: '', // Será preenchido com join
        reputationScore: latest.reputationScore || 0,
        resolvedRate: latest.resolvedRate || 0,
        averageRating: latest.averageRating || 0,
        totalComplaints: latest.totalComplaints || 0,
        responseTime: latest.responseTime || 0,
        topComplaints: [
          latest.topComplaint1,
          latest.topComplaint2,
          latest.topComplaint3,
        ].filter(Boolean) as string[],
        sentimentScore: latest.sentimentScore || 0,
        lastUpdate: latest.referenceDate,
      };
    } catch (error) {
      console.error('[ReclameAqui] Erro ao buscar reputação:', error);
      return null;
    }
  }

  /**
   * Dados mockados baseados em dados reais do Reclame Aqui (Fev 2026)
   * 
   * Fonte de referência: https://www.reclameaqui.com.br/empresa/
   * Nota: Dados aproximados para demonstração
   */
  private getMockReputationData(bankSlug: string): ReclameAquiData {
    const mockData: Record<string, ReclameAquiData> = {
      nubank: {
        bankName: 'Nubank',
        reputationScore: 8.6,
        resolvedRate: 81.2,
        averageRating: 4.3,
        totalComplaints: 45230,
        responseTime: 2.8,
        topComplaints: ['App lento', 'Bloqueio de cartão', 'Atendimento'],
        sentimentScore: 0.72,
        lastUpdate: new Date(),
      },
      itau: {
        bankName: 'Itaú Unibanco',
        reputationScore: 7.3,
        resolvedRate: 82.1,
        averageRating: 3.7,
        totalComplaints: 98745,
        responseTime: 4.5,
        topComplaints: ['Tarifas abusivas', 'Atendimento', 'Empréstimo consignado'],
        sentimentScore: 0.45,
        lastUpdate: new Date(),
      },
      bradesco: {
        bankName: 'Bradesco',
        reputationScore: 7.1,
        resolvedRate: 80.3,
        averageRating: 3.6,
        totalComplaints: 87320,
        responseTime: 5.1,
        topComplaints: ['Cartão de crédito', 'Atendimento', 'Empréstimo'],
        sentimentScore: 0.42,
        lastUpdate: new Date(),
      },
      santander: {
        bankName: 'Santander',
        reputationScore: 7.0,
        resolvedRate: 79.8,
        averageRating: 3.5,
        totalComplaints: 76540,
        responseTime: 5.3,
        topComplaints: ['Cobrança indevida', 'Cartão', 'Atendimento'],
        sentimentScore: 0.40,
        lastUpdate: new Date(),
      },
      inter: {
        bankName: 'Banco Inter',
        reputationScore: 6.5,
        resolvedRate: 71.2,
        averageRating: 3.3,
        totalComplaints: 32150,
        responseTime: 6.8,
        topComplaints: ['App com problemas', 'Suporte', 'Pix não funciona'],
        sentimentScore: 0.25,
        lastUpdate: new Date(),
      },
      c6: {
        bankName: 'C6 Bank',
        reputationScore: 7.8,
        resolvedRate: 75.4,
        averageRating: 3.9,
        totalComplaints: 18970,
        responseTime: 4.2,
        topComplaints: ['Atendimento', 'App', 'Cartão'],
        sentimentScore: 0.55,
        lastUpdate: new Date(),
      },
      pagbank: {
        bankName: 'PagBank',
        reputationScore: 6.8,
        resolvedRate: 68.9,
        averageRating: 3.4,
        totalComplaints: 24680,
        responseTime: 7.5,
        topComplaints: ['Conta bloqueada', 'Suporte', 'Saques'],
        sentimentScore: 0.30,
        lastUpdate: new Date(),
      },
      btg: {
        bankName: 'BTG Pactual',
        reputationScore: 8.5,
        resolvedRate: 85.3,
        averageRating: 4.3,
        totalComplaints: 3420,
        responseTime: 2.1,
        topComplaints: ['Investimentos', 'App', 'Suporte'],
        sentimentScore: 0.75,
        lastUpdate: new Date(),
      },
      safra: {
        bankName: 'Banco Safra',
        reputationScore: 8.7,
        resolvedRate: 87.9,
        averageRating: 4.4,
        totalComplaints: 2150,
        responseTime: 1.8,
        topComplaints: ['Atendimento', 'Tarifas', 'Cartão'],
        sentimentScore: 0.80,
        lastUpdate: new Date(),
      },
      original: {
        bankName: 'Banco Original',
        reputationScore: 6.2,
        resolvedRate: 65.4,
        averageRating: 3.1,
        totalComplaints: 15840,
        responseTime: 8.2,
        topComplaints: ['Empréstimo', 'Cobrança', 'Atendimento'],
        sentimentScore: 0.18,
        lastUpdate: new Date(),
      },
      pan: {
        bankName: 'Banco Pan',
        reputationScore: 5.8,
        resolvedRate: 62.1,
        averageRating: 2.9,
        totalComplaints: 42350,
        responseTime: 9.5,
        topComplaints: ['Empréstimo consignado', 'Cobrança abusiva', 'Atendimento'],
        sentimentScore: 0.10,
        lastUpdate: new Date(),
      },
      bmg: {
        bankName: 'Banco BMG',
        reputationScore: 5.5,
        resolvedRate: 58.7,
        averageRating: 2.8,
        totalComplaints: 38720,
        responseTime: 10.2,
        topComplaints: ['Empréstimo', 'Desconto indevido', 'Não contratei'],
        sentimentScore: 0.05,
        lastUpdate: new Date(),
      },
      neon: {
        bankName: 'Neon',
        reputationScore: 7.5,
        resolvedRate: 73.8,
        averageRating: 3.8,
        totalComplaints: 12540,
        responseTime: 5.3,
        topComplaints: ['App', 'Pix', 'Cartão'],
        sentimentScore: 0.50,
        lastUpdate: new Date(),
      },
      next: {
        bankName: 'Next',
        reputationScore: 7.9,
        resolvedRate: 76.2,
        averageRating: 4.0,
        totalComplaints: 8930,
        responseTime: 3.8,
        topComplaints: ['Atendimento', 'App', 'Limite de crédito'],
        sentimentScore: 0.60,
        lastUpdate: new Date(),
      },
      brasil: {
        bankName: 'Banco do Brasil',
        reputationScore: 7.4,
        resolvedRate: 81.5,
        averageRating: 3.7,
        totalComplaints: 72450,
        responseTime: 4.8,
        topComplaints: ['Atendimento', 'Tarifas', 'Empréstimo'],
        sentimentScore: 0.48,
        lastUpdate: new Date(),
      },
      caixa: {
        bankName: 'Caixa Econômica Federal',
        reputationScore: 6.9,
        resolvedRate: 75.3,
        averageRating: 3.5,
        totalComplaints: 95320,
        responseTime: 6.2,
        topComplaints: ['Fila de atendimento', 'Empréstimo', 'FGTS'],
        sentimentScore: 0.35,
        lastUpdate: new Date(),
      },
    };

    return mockData[bankSlug.toLowerCase()] || {
      bankName: bankSlug,
      reputationScore: 7.0,
      resolvedRate: 70.0,
      averageRating: 3.5,
      totalComplaints: 1000,
      responseTime: 5.0,
      topComplaints: ['Atendimento', 'App', 'Suporte'],
      sentimentScore: 0.40,
      lastUpdate: new Date(),
    };
  }

  /**
   * Sleep helper para rate limiting
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * TODO: Implementar scraping real do Reclame Aqui
   * 
   * Considerações importantes:
   * 1. Respeitar robots.txt
   * 2. Rate limiting (máx 1 req/segundo)
   * 3. User-Agent apropriado
   * 4. Caching de resultados (atualizar 1-2x dia)
   * 5. Tratamento de erros robusto
   * 6. Verificar termos de uso
   * 
   * Ferramentas sugeridas:
   * - Puppeteer (para sites dinâmicos)
   * - Cheerio (para parsing HTML)
   * - Axios (para requisições HTTP)
   */
  private async scrapeReclameAqui(urlSlug: string): Promise<ReclameAquiData> {
    // TODO: Implementar scraping real
    throw new Error('Scraping real não implementado. Usando dados mockados.');
  }
}

export const reclameAquiService = new ReclameAquiService();
