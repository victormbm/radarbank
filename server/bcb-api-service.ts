/**
 * 🎯 Serviço de integração com API IFData do Banco Central do Brasil
 * 
 * Documentação oficial: https://dadosabertos.bcb.gov.br/dataset/ifdata---dados-selecionados-de-instituies-financeiras
 * 
 * API gratuita, sem autenticação, dados oficiais trimestrais
 * Atualização: 60 dias após mar/jun/set, 90 dias após dez
 */

import { BCBBankData, BANK_CNPJ_MAP } from './bcb-data-service';

/**
 * Interface da resposta da API IFData (OData)
 */
interface IFDataResponse {
  '@odata.context': string;
  value: IFDataInstitution[];
}

/**
 * Instituição retornada pela API IFData
 */
interface IFDataInstitution {
  CNPJ: string;
  NomeInstituicao: string;
  DataBase: string; // "2025-12-31"
  Segmento?: string;
  // Indicadores de Capital
  IndiceBasileia?: number;
  CapitalNivel1?: number;
  IndiceCET1?: number;
  IndiceAlavancagem?: number;
  PatrimonioLiquido?: number;
  // Ativos e Passivos
  AtivoTotal?: number;
  DepositosTotal?: number;
  CarteiraCredito?: number;
  // Rentabilidade
  LucroLiquido?: number;
  ROE?: number;
  ROA?: number;
  MargemFinanceira?: number;
  IndiceEficiencia?: number;
  // Liquidez
  LiquidezImediata?: number;
  IndiceLCR?: number;
  IndiceNSFR?: number;
  // Crédito
  Inadimplencia90Dias?: number;
  ProvisionamentoCredito?: number;
  TaxaWriteOff?: number;
  // Imobilização
  IndiceImobilizacao?: number;
}

/**
 * Dados de trimestres disponíveis
 */
export interface QuarterData {
  year: number;
  quarter: 1 | 2 | 3 | 4;
  date: string; // "2025-12-31"
  availableAfter: Date; // Quando os dados ficam disponíveis
}

/**
 * Classe principal para integração com API IFData do BCB
 */
export class BCBAPIService {
  private readonly BASE_URL = 'https://olinda.bcb.gov.br/olinda/servico/IFData/versao/v1/odata';
  
  // CNPJs completos dos bancos que monitoramos
  private readonly TRACKED_BANKS = {
    'nubank': '18236120000158',      // Nu Pagamentos S.A.
    'itau': '60701190000104',        // Itaú Unibanco
    'bb': '00000000000191',          // Banco do Brasil
    'bradesco': '60746948000112',    // Bradesco
    'caixa': '00360305000104',       // Caixa Econômica Federal
    'santander': '90400888000142',   // Santander
    'btg': '30306294000145',         // BTG Pactual
    'safra': '58160789000128',       // Safra
    'inter': '00416968000101',       // Banco Inter
    'c6': '31872495000172',          // C6 Bank
    'original': '92894922000135',    // Banco Original
    'pagbank': '10573521000191',     // PagBank
    'next': '74828799000112',        // Banco Next (CNPJ corrigido)
    'neon': '92874270000160',        // Neon Pagamentos
  };

  /**
   * Calcula o último trimestre disponível baseado na data atual
   */
  getLatestAvailableQuarter(): QuarterData {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12
    
    // Dados de DEZ: disponíveis 90 dias depois (final de março)
    // Dados de MAR: disponíveis 60 dias depois (final de maio)
    // Dados de JUN: disponíveis 60 dias depois (final de agosto)
    // Dados de SET: disponíveis 60 dias depois (final de novembro)
    
    if (currentMonth >= 11) {
      // Novembro em diante: dados de SET disponíveis
      return {
        year: currentYear,
        quarter: 3,
        date: `${currentYear}-09-30`,
        availableAfter: new Date(currentYear, 10, 25) // 25 de novembro
      };
    } else if (currentMonth >= 8) {
      // Agosto-outubro: dados de JUN disponíveis
      return {
        year: currentYear,
        quarter: 2,
        date: `${currentYear}-06-30`,
        availableAfter: new Date(currentYear, 7, 25) // 25 de agosto
      };
    } else if (currentMonth >= 5) {
      // Maio-julho: dados de MAR disponíveis
      return {
        year: currentYear,
        quarter: 1,
        date: `${currentYear}-03-31`,
        availableAfter: new Date(currentYear, 4, 25) // 25 de maio
      };
    } else {
      // Janeiro-abril: dados de DEZ do ano anterior
      return {
        year: currentYear - 1,
        quarter: 4,
        date: `${currentYear - 1}-12-31`,
        availableAfter: new Date(currentYear, 2, 30) // 30 de março
      };
    }
  }

  /**
   * Busca lista de todas as instituições autorizadas
   */
  async fetchInstitutionsList(): Promise<string[]> {
    try {
      const url = `${this.BASE_URL}/Instituicoes?$format=json&$select=CNPJ,NomeInstituicao`;
      
      console.log('[BCB API] Buscando lista de instituições...');
      console.log('[BCB API] URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: IFDataResponse = await response.json();
      
      console.log(`[BCB API] ✅ ${data.value.length} instituições encontradas`);
      
      return data.value.map(inst => inst.CNPJ);
      
    } catch (error) {
      console.error('[BCB API] ❌ Erro ao buscar instituições:', error);
      throw error;
    }
  }

  /**
   * Busca dados financeiros de uma instituição específica
   */
  async fetchInstitutionData(cnpj: string, dataBase: string): Promise<IFDataInstitution | null> {
    try {
      // Remover formatação do CNPJ (manter apenas números)
      const cleanCNPJ = cnpj.replace(/\D/g, '');
      
      // API IFData usa filtros OData
      const filter = `CNPJ eq '${cleanCNPJ}' and DataBase eq datetime'${dataBase}'`;
      const url = `${this.BASE_URL}/Instituicoes?$filter=${encodeURIComponent(filter)}&$format=json`;
      
      console.log(`[BCB API] Buscando dados: ${cnpj} em ${dataBase}`);
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn(`[BCB API] ⚠️  HTTP ${response.status} para ${cnpj}`);
        return null;
      }

      const data: IFDataResponse = await response.json();
      
      if (data.value.length === 0) {
        console.warn(`[BCB API] ⚠️  Sem dados para ${cnpj} em ${dataBase}`);
        return null;
      }

      console.log(`[BCB API] ✅ Dados encontrados para ${data.value[0].NomeInstituicao}`);
      
      return data.value[0];
      
    } catch (error) {
      console.error(`[BCB API] ❌ Erro ao buscar ${cnpj}:`, error);
      return null;
    }
  }

  /**
   * Busca dados de todos os bancos monitorados
   * 
   * NOTA: Modo mockado ativo enquanto API BCB não está disponível
   */
  async fetchAllBanksData(dataBase?: string): Promise<BCBBankData[]> {
    const quarter = dataBase ? { date: dataBase } as QuarterData : this.getLatestAvailableQuarter();
    
    console.log(`\n[BCB API] 📊 Iniciando coleta de dados`);
    console.log(`[BCB API] 📅 Data-base: ${quarter.date}`);
    console.log(`[BCB API] 🏦 Bancos monitorados: ${Object.keys(this.TRACKED_BANKS).length}`);
    console.log(`[BCB API] ⚠️  MODO MOCKADO - dados realistas simulados`);
    console.log('─'.repeat(60));
    
    // TODO: Substituir por chamadas reais à API quando disponível
    const results = this.getMockBanksData(quarter.date);
    
    console.log('─'.repeat(60));
    console.log(`[BCB API] ✅ Coleta finalizada: ${results.length}/${Object.keys(this.TRACKED_BANKS).length} bancos\n`);
    
    return results;
  }

  /**
   * Retorna dados mockados realistas baseados no padrão dos dados de produção
   * TODO: Remover quando API real estiver disponível
   */
  private getMockBanksData(dataBase: string): BCBBankData[] {
    return [
      {
        cnpj: '18236120000158',
        nome: 'Nu Pagamentos S.A.',
        segmento: 'S1',
        basileia: 18.5,
        tier1: 16.2,
        cet1: 15.8,
        alavancagem: 8.5,
        patrimonioLiquido: 25000000000,
        ativoTotal: 180000000000,
        totalDeposits: 120000000000,
        loanPortfolio: 95000000000,
        roe: 22.5,
        roa: 3.1,
        nim: 8.2,
        costToIncome: 35.0,
        lcr: 185.0,
        nsfr: 145.0,
        liquidez: 95.0,
        loanToDeposit: 79.2,
        inadimplencia: 5.2,
        coverageRatio: 180.0,
        writeOffRate: 2.1,
        creditQuality: 48.0,
      },
      {
        cnpj: '60701190000104',
        nome: 'Itaú Unibanco S.A.',
        segmento: 'S1',
        basileia: 17.2,
        tier1: 14.8,
        cet1: 13.5,
        patrimonioLiquido: 128000000000,
        ativoTotal: 2150000000000,
        totalDeposits: 1250000000000,
        loanPortfolio: 950000000000,
        roe: 18.5,
        roa: 1.8,
        nim: 6.5,
        costToIncome: 42.0,
        lcr: 165.0,
        nsfr: 128.0,
        inadimplencia: 3.8,
        coverageRatio: 195.0,
      },
      {
        cnpj: '00000000000191',
        nome: 'Banco do Brasil S.A.',
        segmento: 'S1',
        basileia: 16.8,
        tier1: 13.2,
        cet1: 12.0,
        patrimonioLiquido: 115000000000,
        ativoTotal: 1980000000000,
        totalDeposits: 1180000000000,
        loanPortfolio: 890000000000,
        roe: 16.2,
        roa: 1.5,
        inadimplencia: 3.5,
        lcr: 155.0,
      },
      {
        cnpj: '60746948000112',
        nome: 'Banco Bradesco S.A.',
        segmento: 'S1',
        basileia: 16.5,
        tier1: 13.8,
        patrimonioLiquido: 122000000000,
        ativoTotal: 1875000000000,
        totalDeposits: 1150000000000,
        loanPortfolio: 865000000000,
        roe: 17.8,
        roa: 1.6,
        inadimplencia: 3.9,
        lcr: 158.0,
      },
      {
        cnpj: '00360305000104',
        nome: 'Caixa Econômica Federal',
        segmento: 'S1',
        basileia: 15.2,
        tier1: 12.5,
        patrimonioLiquido: 85000000000,
        ativoTotal: 1650000000000,
        totalDeposits: 980000000000,
        loanPortfolio: 750000000000,
        roe: 14.5,
        roa: 1.2,
        inadimplencia: 4.2,
        lcr: 145.0,
      },
      {
        cnpj: '90400888000142',
        nome: 'Banco Santander (Brasil) S.A.',
        segmento: 'S1',
        basileia: 16.8,
        tier1: 14.2,
        patrimonioLiquido: 98000000000,
        ativoTotal: 1520000000000,
        totalDeposits: 920000000000,
        loanPortfolio: 715000000000,
        roe: 17.2,
        roa: 1.6,
        inadimplencia: 3.7,
        lcr: 162.0,
      },
      {
        cnpj: '00416968000101',
        nome: 'Banco Inter S.A.',
        segmento: 'S2',
        basileia: 19.5,
        tier1: 17.8,
        patrimonioLiquido: 8500000000,
        ativoTotal: 95000000000,
        totalDeposits: 58000000000,
        loanPortfolio: 42000000000,
        roe: 15.8,
        roa: 2.2,
        inadimplencia: 4.8,
        lcr: 195.0,
      },
      {
        cnpj: '31872495000172',
        nome: 'Banco C6 S.A.',
        segmento: 'S2',
        basileia: 22.5,
        tier1: 20.2,
        patrimonioLiquido: 7200000000,
        ativoTotal: 82000000000,
        totalDeposits: 48000000000,
        loanPortfolio: 35000000000,
        roe: 12.5,
        roa: 1.8,
        inadimplencia: 4.5,
        lcr: 225.0,
      },
      {
        cnpj: '30306294000145',
        nome: 'Banco BTG Pactual S.A.',
        segmento: 'S2',
        basileia: 21.8,
        tier1: 19.5,
        patrimonioLiquido: 32000000000,
        ativoTotal: 385000000000,
        totalDeposits: 185000000000,
        loanPortfolio: 120000000000,
        roe: 24.5,
        roa: 2.8,
        inadimplencia: 2.8,
        lcr: 215.0,
      },
      {
        cnpj: '10573521000191',
        nome: 'PagSeguro Internet S.A.',
        segmento: 'S3',
        basileia: 25.2,
        tier1: 23.5,
        patrimonioLiquido: 12000000000,
        ativoTotal: 85000000000,
        totalDeposits: 42000000000,
        loanPortfolio: 28000000000,
        roe: 18.5,
        roa: 3.2,
        inadimplencia: 5.5,
        lcr: 285.0,
      },
      {
        cnpj: '58160789000128',
        nome: 'Banco Safra S.A.',
        segmento: 'S2',
        basileia: 18.5,
        tier1: 16.2,
        patrimonioLiquido: 18500000000,
        ativoTotal: 205000000000,
        totalDeposits: 125000000000,
        loanPortfolio: 95000000000,
        roe: 16.8,
        roa: 1.9,
        inadimplencia: 3.2,
        lcr: 175.0,
      },
      {
        cnpj: '92894922000135',
        nome: 'Banco Original S.A.',
        segmento: 'S2',
        basileia: 17.2,
        tier1: 15.5,
        patrimonioLiquido: 5800000000,
        ativoTotal: 68000000000,
        totalDeposits: 38000000000,
        loanPortfolio: 29000000000,
        roe: 14.2,
        roa: 1.6,
        inadimplencia: 4.8,
        lcr: 165.0,
      },
      {
        cnpj: '74828799000112',
        nome: 'Banco Next S.A.',
        segmento: 'S3',
        basileia: 28.5,
        tier1: 26.8,
        patrimonioLiquido: 2200000000,
        ativoTotal: 18000000000,
        totalDeposits: 8500000000,
        loanPortfolio: 5200000000,
        roe: 8.5,
        roa: 1.2,
        inadimplencia: 3.8,
        lcr: 325.0,
      },
      {
        cnpj: '92874270000160',
        nome: 'Neon Pagamentos S.A.',
        segmento: 'S3',
        basileia: 32.5,
        tier1: 30.2,
        patrimonioLiquido: 1800000000,
        ativoTotal: 12000000000,
        totalDeposits: 5200000000,
        loanPortfolio: 2800000000,
        roe: 6.5,
        roa: 0.9,
        inadimplencia: 4.2,
        lcr: 385.0,
      },
    ];
  }

  /**
   * Transforma dados da API IFData para nosso formato interno
   */
  private transformToOurFormat(data: IFDataInstitution): BCBBankData {
    return {
      cnpj: data.CNPJ,
      nome: data.NomeInstituicao,
      segmento: data.Segmento || 'S1', // Default para Segmento 1
      
      // Capital
      basileia: data.IndiceBasileia,
      tier1: data.CapitalNivel1,
      cet1: data.IndiceCET1,
      alavancagem: data.IndiceAlavancagem,
      
      // Patrimônio e Ativos
      patrimonioLiquido: data.PatrimonioLiquido,
      ativoTotal: data.AtivoTotal,
      totalDeposits: data.DepositosTotal,
      loanPortfolio: data.CarteiraCredito,
      
      // Rentabilidade
      roe: data.ROE,
      roa: data.ROA,
      nim: data.MargemFinanceira,
      costToIncome: data.IndiceEficiencia,
      
      // Liquidez
      lcr: data.IndiceLCR,
      nsfr: data.IndiceNSFR,
      liquidez: data.LiquidezImediata,
      loanToDeposit: data.CarteiraCredito && data.DepositosTotal 
        ? (data.CarteiraCredito / data.DepositosTotal) * 100 
        : undefined,
      
      // Crédito
      inadimplencia: data.Inadimplencia90Dias,
      coverageRatio: data.ProvisionamentoCredito,
      writeOffRate: data.TaxaWriteOff,
      creditQuality: data.Inadimplencia90Dias 
        ? 100 - (data.Inadimplencia90Dias * 10) // Score invertido
        : undefined,
    };
  }

  /**
   * Testa conexão com a API
   * 
   * NOTA: A API IFData do BCB está em desenvolvimento/manutenção.
   * Por enquanto, usaremos dados mockados realistas enquanto aguardamos
   * a API estar completamente disponível.
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('[BCB API] 🔍 Testando conexão...');
      console.log('[BCB API] ⚠️  API em desenvolvimento - usando dados mockados');
      
      // TODO: Descomentar quando API estiver disponível
      // const url = `${this.BASE_URL}/Instituicoes?$top=1&$format=json`;
      // const response = await fetch(url, {
      //   headers: { 'Accept': 'application/json' },
      // });
      //
      // if (!response.ok) {
      //   throw new Error(`HTTP ${response.status}`);
      // }
      //
      // const data: IFDataResponse = await response.json();
      // console.log(`[BCB API] ✅ Conexão OK - API retornou ${data.value.length} registro(s)`);
      
      console.log(`[BCB API] ✅ Modo mockado ativo`);
      
      return true;
      
    } catch (error) {
      console.error('[BCB API] ❌ Falha na conexão:', error);
      return false;
    }
  }

  /**
   * Busca dados históricos (múltiplos trimestres)
   */
  async fetchHistoricalData(quarters: number = 6): Promise<Map<string, BCBBankData[]>> {
    const quartersList = this.getLastNQuarters(quarters);
    const historicalData = new Map<string, BCBBankData[]>();
    
    console.log(`[BCB API] 📜 Coletando histórico de ${quarters} trimestres`);
    
    for (const quarter of quartersList) {
      console.log(`\n[BCB API] Trimestre: ${quarter.date}`);
      const data = await this.fetchAllBanksData(quarter.date);
      historicalData.set(quarter.date, data);
      
      // Delay entre trimestres
      await this.sleep(500);
    }
    
    return historicalData;
  }

  /**
   * Calcula os últimos N trimestres
   */
  private getLastNQuarters(n: number): QuarterData[] {
    const quarters: QuarterData[] = [];
    const latest = this.getLatestAvailableQuarter();
    
    let year = latest.year;
    let quarter = latest.quarter;
    
    for (let i = 0; i < n; i++) {
      const month = quarter * 3; // 3, 6, 9, 12
      const lastDay = quarter === 1 ? 31 : quarter === 2 ? 30 : quarter === 3 ? 30 : 31;
      
      quarters.push({
        year,
        quarter: quarter as 1 | 2 | 3 | 4,
        date: `${year}-${String(month).padStart(2, '0')}-${lastDay}`,
        availableAfter: new Date() // Não preciso calcular exato para histórico
      });
      
      // Voltar um trimestre
      quarter--;
      if (quarter === 0) {
        quarter = 4;
        year--;
      }
    }
    
    return quarters;
  }

  /**
   * Helper: Sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Valida se uma data-base está disponível
   */
  isDataAvailable(dataBase: string): boolean {
    const targetDate = new Date(dataBase);
    const latest = this.getLatestAvailableQuarter();
    const availableDate = latest.availableAfter;
    
    return targetDate <= new Date() && new Date() >= availableDate;
  }

  /**
   * Retorna informações sobre o próximo update
   */
  getNextUpdateInfo(): { date: string; daysUntil: number } {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    
    let nextUpdateDate: Date;
    
    if (currentMonth < 3) {
      nextUpdateDate = new Date(now.getFullYear(), 2, 30); // 30 março
    } else if (currentMonth < 5) {
      nextUpdateDate = new Date(now.getFullYear(), 4, 25); // 25 maio
    } else if (currentMonth < 8) {
      nextUpdateDate = new Date(now.getFullYear(), 7, 25); // 25 agosto
    } else if (currentMonth < 11) {
      nextUpdateDate = new Date(now.getFullYear(), 10, 25); // 25 novembro
    } else {
      nextUpdateDate = new Date(now.getFullYear() + 1, 2, 30); // 30 março próximo ano
    }
    
    const daysUntil = Math.ceil((nextUpdateDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      date: nextUpdateDate.toISOString().split('T')[0],
      daysUntil
    };
  }
}

/**
 * Exporta instância singleton
 */
export const bcbAPI = new BCBAPIService();
