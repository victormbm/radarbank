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
  roa?: number;S
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
  'nubank': '18236120', // Nu Pagamentos S.A.
  'itau': '60701190', // Itaú Unibanco
  'bb': '00000000', // Banco do Brasil
  'bradesco': '60746948', // Bradesco
  'caixa': '00360305', // Caixa Econômica Federal
  'santander': '90400888', // Santander
  'btg': '30306294', // BTG Pactual
  'safra': '58160789', // Safra
  'inter': '00416968', // Banco Inter
  'c6': '31872495', // C6 Bank
  'pan': '59285411', // Banco Pan
  'original': '92894922', // Banco Original
  'bmg': '61186680', // BMG
  'neon': '92874270', // Neon (Banco Votorantim)
  'pagbank': '10573521', // PagBank
};

/**
 * Busca dados do Banco Central via API
 * Nota: Esta é uma implementação de referência. 
 * A API real do BCB pode requerer ajustes nos endpoints.
 */
export class BCBDataService {
  private baseUrl = 'https://olinda.bcb.gov.br/olinda/servico';

  /**
   * Busca índice de Basileia das instituições financeiras
   * Endpoint exemplo (verificar documentação oficial do BCB)
   */
  async fetchBasileiaData(referenceDate?: string): Promise<BCBBankData[]> {
    try {
      // Exemplo de endpoint - VERIFICAR DOCUMENTAÇÃO OFICIAL
      const date = referenceDate || this.getLastMonthEndDate();
      
      console.log(`[BCB] Buscando dados de Basileia para ${date}...`);
      
      // Em produção, fazer fetch real:
      // const url = `${this.baseUrl}/IFDATA/versao/v1/odata/IndicesBasileia?$filter=Data eq '${date}'&$format=json`;
      // const response = await fetch(url);
      // const data: BCBApiResponse = await response.json();
      
      // Por enquanto, retorna dados mock indicando fonte real
      return this.getMockDataWithRealStructure();
      
    } catch (error) {
      console.error('[BCB] Erro ao buscar dados de Basileia:', error);
      throw error;
    }
  }

  /**
   * Busca dados de inadimplência
   */
  async fetchInadimplenciaData(referenceDate?: string): Promise<BCBBankData[]> {
    try {
      const date = referenceDate || this.getLastMonthEndDate();
      
      console.log(`[BCB] Buscando dados de Inadimplência para ${date}...`);
      
      // URL exemplo - verificar documentação
      // const url = `${this.baseUrl}/IFDATA/versao/v1/odata/Inadimplencia?$filter=Data eq '${date}'&$format=json`;
      
      return this.getMockDataWithRealStructure();
      
    } catch (error) {
      console.error('[BCB] Erro ao buscar dados de Inadimplência:', error);
      throw error;
    }
  }

  /**
   * Busca dados consolidados de múltiplas métricas
   */
  async fetchConsolidatedData(referenceDate?: string): Promise<Map<string, BCBBankData>> {
    const date = referenceDate || this.getLastMonthEndDate();
    
    console.log(`[BCB] Iniciando coleta consolidada para ${date}...`);
    
    // Buscar dados em paralelo
    const [basileiaData, inadimplenciaData] = await Promise.all([
      this.fetchBasileiaData(date),
      this.fetchInadimplenciaData(date),
    ]);

    // Consolidar dados por CNPJ
    const consolidated = new Map<string, BCBBankData>();

    for (const data of basileiaData) {
      consolidated.set(data.cnpj, { ...data });
    }

    for (const data of inadimplenciaData) {
      const existing = consolidated.get(data.cnpj);
      if (existing) {
        consolidated.set(data.cnpj, { ...existing, inadimplencia: data.inadimplencia });
      }
    }

    console.log(`[BCB] Coleta concluída: ${consolidated.size} bancos processados`);
    
    return consolidated;
  }

  /**
   * Obtém a data do último dia útil do mês anterior
   */
  private getLastMonthEndDate(): string {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDay = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
    
    return lastDay.toISOString().split('T')[0];
  }

  /**
   * Dados mock com estrutura real para desenvolvimento
   * TODO: Substituir por chamadas reais à API do BCB
   */
  private getMockDataWithRealStructure(): BCBBankData[] {
    return [
      {
        cnpj: '18236120',
        nome: 'Nu Pagamentos S.A.',
        segmento: 'S1',
        basileia: 17.2,
        patrimonioLiquido: 28500000,
        ativoTotal: 185000000,
        roe: 22.5,
        inadimplencia: 4.8,
        liquidez: 168.5,
      },
      {
        cnpj: '60701190',
        nome: 'Itaú Unibanco S.A.',
        segmento: 'S1',
        basileia: 16.9,
        patrimonioLiquido: 145000000,
        ativoTotal: 2350000000,
        roe: 19.8,
        inadimplencia: 2.9,
        liquidez: 142.0,
      },
      {
        cnpj: '60746948',
        nome: 'Banco Bradesco S.A.',
        segmento: 'S1',
        basileia: 16.5,
        patrimonioLiquido: 128000000,
        ativoTotal: 2180000000,
        roe: 17.5,
        inadimplencia: 3.1,
        liquidez: 138.5,
      },
      {
        cnpj: '90400888',
        nome: 'Banco Santander Brasil S.A.',
        segmento: 'S1',
        basileia: 16.8,
        patrimonioLiquido: 95000000,
        ativoTotal: 1520000000,
        roe: 18.2,
        inadimplencia: 3.3,
        liquidez: 145.0,
      },
      {
        cnpj: '00416968',
        nome: 'Banco Inter S.A.',
        segmento: 'S2',
        basileia: 18.5,
        patrimonioLiquido: 8500000,
        ativoTotal: 95000000,
        roe: 15.8,
        inadimplencia: 5.2,
        liquidez: 155.0,
      },
      {
        cnpj: '31872495',
        nome: 'Banco C6 S.A.',
        segmento: 'S2',
        basileia: 19.2,
        patrimonioLiquido: 6200000,
        ativoTotal: 78000000,
        roe: 12.5,
        inadimplencia: 4.5,
        liquidez: 172.0,
      },
      {
        cnpj: '10573521',
        nome: 'PagBank',
        segmento: 'S2',
        basileia: 17.5,
        patrimonioLiquido: 12000000,
        ativoTotal: 125000000,
        roe: 21.0,
        inadimplencia: 2.5,
        liquidez: 158.0,
      },
    ];
  }
}

/**
 * Guia de Implementação Real
 * 
 * Para implementar a coleta real de dados:
 * 
 * 1. Acessar documentação oficial do BCB:
 *    https://www3.bcb.gov.br/ifdata/
 * 
 * 2. Endpoints principais (verificar URLs atuais):
 *    - Basileia: /IFDATA/versao/v1/odata/IndicesBasileia
 *    - Balanço: /IFDATA/versao/v1/odata/BalanceteConsolidado
 *    - Demonstrativo: /IFDATA/versao/v1/odata/DemonstrativoResultado
 * 
 * 3. Autenticação (se necessária):
 *    - Verificar se é necessária chave API
 *    - Implementar headers de autenticação
 * 
 * 4. Rate limiting:
 *    - Implementar delays entre requisições
 *    - Cache de dados para evitar requisições excessivas
 * 
 * 5. Tratamento de erros:
 *    - Retry logic para falhas temporárias
 *    - Logging de erros
 *    - Fallback para dados em cache
 */

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
