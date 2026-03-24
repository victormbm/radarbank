/**
 * Serviço de coleta de dados do Banco Central do Brasil
 * 
 * APIs disponíveis:
 * - IF.data: https://www3.bcb.gov.br/ifdata/
 * - API Olinda: https://olinda.bcb.gov.br/olinda/servico/
 */

export interface BCBBankData {
  cnpj: string;
  nome: string;
  segmento: string;
  // Capital
  basileia?: number;
  tier1?: number;
  cet1?: number;
  alavancagem?: number;
  // Patrimônio e Ativos
  patrimonioLiquido?: number;
  ativoTotal?: number;
  totalDeposits?: number;
  loanPortfolio?: number;
  // Rentabilidade
  roe?: number;
  roa?: number;
  nim?: number;
  costToIncome?: number;
  // Liquidez
  liquidez?: number;
  lcr?: number;
  nsfr?: number;
  loanToDeposit?: number;
  // Crédito
  inadimplencia?: number;
  coverageRatio?: number;
  writeOffRate?: number;
  creditQuality?: number;
  // Crescimento
  assetGrowth?: number;
  loanGrowth?: number;
  depositGrowth?: number;
}

/**
 * Mapeamento de CNPJs dos principais bancos brasileiros
 */
export const BANK_CNPJ_MAP: Record<string, string> = {
  // CNPJs completos (14 dígitos) — devem coincidir com TRACKED_BANKS em bcb-api-service.ts
  'nubank':    '18236120000158', // Nu Pagamentos S.A.
  'itau':      '60701190000104', // Itaú Unibanco
  'bb':        '00000000000191', // Banco do Brasil
  'bradesco':  '60746948000112', // Bradesco
  'caixa':     '00360305000104', // Caixa Econômica Federal
  'santander': '90400888000142', // Santander
  'btg':       '30306294000145', // BTG Pactual
  'safra':     '58160789000128', // Safra
  'inter':     '00416968000101', // Banco Inter
  'c6':        '31872495000172', // C6 Bank
  'original':  '92894922000135', // Banco Original
  'pagbank':   '10573521000191', // PagBank
  'next':      '74828799000112', // Banco Next
  'neon':      '92874270000160', // Neon Pagamentos
};

/**
 * Busca dados do Banco Central via API
 * Nota: Esta é uma implementação de referência. 
 * A API real do BCB pode requerer ajustes nos endpoints.
 */
export class BCBDataService {
  /**
   * Busca dados consolidados de múltiplas métricas
   */
  async fetchConsolidatedData(referenceDate?: string): Promise<Map<string, BCBBankData>> {
    const { bcbAPI } = await import('./bcb-api-service');
    const date = referenceDate || bcbAPI.getLatestAvailableQuarter().date;
    
    console.log(`[BCB] Iniciando coleta consolidada via API oficial para ${date}...`);

    const apiData = await bcbAPI.fetchAllBanksData(date);

    if (!apiData.length) {
      throw new Error('A API oficial do BCB retornou zero bancos.');
    }

    // Consolidar dados por CNPJ
    const consolidated = new Map<string, BCBBankData>();

    for (const data of apiData) {
      const cnpj = data.cnpj?.replace(/\D/g, '');
      if (!cnpj) {
        continue;
      }

      consolidated.set(cnpj, { ...data, cnpj });
    }

    console.log(`[BCB] Coleta concluída: ${consolidated.size} bancos processados`);

    if (consolidated.size === 0) {
      throw new Error('Nenhum dado consolidado válido foi encontrado na API do BCB.');
    }
    
    return consolidated;
  }
}

export const bcbDataService = new BCBDataService();

/**
 * Função auxiliar para ingestão de dados BCB
 * Wrapper para DataIngestionService com retorno padronizado
 */
export async function ingestBCBData(): Promise<{
  success: boolean;
  banksProcessed: number;
  snapshotsCreated: number;
  latestReferenceDate: string | null;
  error?: string;
}> {
  try {
    const { DataIngestionService } = await import('./data-ingestion-service');
    const service = new DataIngestionService();
    
    const result = await service.runFullIngestion();
    
    // Buscar data de referência mais recente após ingestão
    const { prisma } = await import('@/lib/db');
    const latestSnapshot = await prisma.bankSnapshot.findFirst({
      orderBy: { date: 'desc' },
      select: { date: true },
    });
    
    return {
      success: result.success,
      banksProcessed: result.banksProcessed,
      snapshotsCreated: result.banksProcessed, // Assumindo 1 snapshot por banco
      latestReferenceDate: latestSnapshot?.date.toISOString() || null,
    };
  } catch (error: any) {
    console.error('[ingestBCBData] Erro:', error);
    return {
      success: false,
      banksProcessed: 0,
      snapshotsCreated: 0,
      latestReferenceDate: null,
      error: error.message || 'Erro desconhecido na ingestão',
    };
  }
}
