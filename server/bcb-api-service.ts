/**
 * Integracao oficial com o IFData (BCB / Olinda OData v1).
 *
 * Regras deste adaptador:
 * - Usa apenas endpoints oficialmente documentados pelo BCB.
 * - Usa apenas colunas efetivamente encontradas no payload real do IFData.
 * - Mantem metricas nao auditadas como null/undefined, em vez de inferir valores.
 */

import { BCBBankData } from './bcb-data-service';

interface ODataResponse<T> {
  '@odata.context': string;
  value: T[];
}

interface IFDataCadastroRow {
  CodInst: string;
  Data: string;
  NomeInstituicao: string;
  DataInicioAtividade: number;
  Tcb: string | null;
  Td: string | null;
  Tc: number | null;
  SegmentoTb: string | null;
  Atividade: string | null;
  Uf: string | null;
  Municipio: string | null;
  Sr: string | null;
  CodConglomeradoFinanceiro: string | null;
  CodConglomeradoPrudencial: string | null;
  CnpjInstituicaoLider: string | null;
  Situacao: string | null;
}

interface IFDataValorRow {
  TipoInstituicao: number;
  CodInst: string;
  AnoMes: string;
  NomeRelatorio: string;
  NumeroRelatorio: string;
  Grupo: string | null;
  Conta: string;
  NomeColuna: string;
  DescricaoColuna: string;
  Saldo: number | null;
}

interface ResolvedBankReference {
  slug: string;
  fullCnpj: string;
  baseCode: string;
  codInst: string;
  tipoInstituicao: 1 | 3;
  name: string;
  segment: string | null;
}

interface TrackedBankConfig {
  cnpj: string;
  label: string;
  searchTerm: string;
}

const MANUAL_BANK_OVERRIDES: Partial<Record<string, { codInst: string; tipoInstituicao: 1 | 3 }>> = {
  nubank: {
    codInst: 'C0084693',
    tipoInstituicao: 1,
  },
};

export interface QuarterData {
  year: number;
  quarter: 1 | 2 | 3 | 4;
  date: string;
  availableAfter: Date;
}

export class BCBAPIService {
  private readonly BASE_URL = 'https://olinda.bcb.gov.br/olinda/servico/IFDATA/versao/v1/odata';

  private readonly TRACKED_BANKS: Record<string, TrackedBankConfig> = {
    nubank: { cnpj: '18236120000158', label: 'Nu Pagamentos S.A.', searchTerm: 'NU' },
    itau: { cnpj: '60701190000104', label: 'Itau Unibanco S.A.', searchTerm: 'ITAU' },
    bb: { cnpj: '00000000000191', label: 'Banco do Brasil S.A.', searchTerm: 'BANCO DO BRASIL' },
    bradesco: { cnpj: '60746948000112', label: 'Banco Bradesco S.A.', searchTerm: 'BRADESCO' },
    caixa: { cnpj: '00360305000104', label: 'Caixa Economica Federal', searchTerm: 'CAIXA ECONOMICA FEDERAL' },
    santander: { cnpj: '90400888000142', label: 'Banco Santander (Brasil) S.A.', searchTerm: 'SANTANDER' },
    btg: { cnpj: '30306294000145', label: 'Banco BTG Pactual S.A.', searchTerm: 'BTG' },
    safra: { cnpj: '58160789000128', label: 'Banco Safra S.A.', searchTerm: 'SAFRA' },
    inter: { cnpj: '00416968000101', label: 'Banco Inter S.A.', searchTerm: 'INTER' },
    c6: { cnpj: '31872495000172', label: 'Banco C6 S.A.', searchTerm: 'C6' },
    original: { cnpj: '92894922000135', label: 'Banco Original S.A.', searchTerm: 'ORIGINAL' },
    pagbank: { cnpj: '10573521000191', label: 'PagSeguro Internet S.A.', searchTerm: 'PAGSEGURO' },
    next: { cnpj: '74828799000112', label: 'Banco Next S.A.', searchTerm: 'NEXT' },
    neon: { cnpj: '92874270000160', label: 'Neon Pagamentos S.A.', searchTerm: 'NEON' },
  };

  getLatestAvailableQuarter(): QuarterData {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();

    if (currentMonth >= 11 && currentDay >= 30) {
      return {
        year: currentYear,
        quarter: 3,
        date: `${currentYear}-09-30`,
        availableAfter: new Date(currentYear, 10, 30),
      };
    }

    if (currentMonth > 8 || (currentMonth === 8 && currentDay >= 31)) {
      return {
        year: currentYear,
        quarter: 2,
        date: `${currentYear}-06-30`,
        availableAfter: new Date(currentYear, 7, 31),
      };
    }

    if (currentMonth > 5 || (currentMonth === 5 && currentDay >= 31)) {
      return {
        year: currentYear,
        quarter: 1,
        date: `${currentYear}-03-31`,
        availableAfter: new Date(currentYear, 4, 31),
      };
    }

    if (currentMonth > 3 || (currentMonth === 3 && currentDay >= 31)) {
      return {
        year: currentYear - 1,
        quarter: 4,
        date: `${currentYear - 1}-12-31`,
        availableAfter: new Date(currentYear, 2, 31),
      };
    }

    return {
      year: currentYear - 1,
      quarter: 3,
      date: `${currentYear - 1}-09-30`,
      availableAfter: new Date(currentYear - 1, 10, 30),
    };
  }

  async fetchInstitutionsList(): Promise<string[]> {
    const anoMes = this.toAnoMes(this.getLatestAvailableQuarter().date);
    const url = `${this.BASE_URL}/IfDataCadastro(AnoMes=${anoMes})?$select=CodInst,NomeInstituicao&$top=5000&$format=json`;
    const data = await this.fetchJson<IFDataCadastroRow>(url);
    return data.value.map((row) => row.CodInst);
  }

  async fetchInstitutionData(cnpj: string, dataBase?: string): Promise<ResolvedBankReference | null> {
    const quarterDate = dataBase || this.getLatestAvailableQuarter().date;
    const anoMes = this.toAnoMes(quarterDate);
    const trackedEntry = Object.entries(this.TRACKED_BANKS).find(([, config]) => config.cnpj === cnpj);
    if (trackedEntry) {
      return this.resolveTrackedBankReference(trackedEntry[0], trackedEntry[1], anoMes);
    }

    return this.resolveBankReferenceByCnpj(cnpj, anoMes);
  }

  async fetchAllBanksData(dataBase?: string): Promise<BCBBankData[]> {
    const quarter = dataBase ? { date: dataBase } as QuarterData : this.getLatestAvailableQuarter();
    const anoMes = this.toAnoMes(quarter.date);

    console.log(`\n[BCB IFData] Iniciando coleta oficial`);
    console.log(`[BCB IFData] Data-base: ${quarter.date} (${anoMes})`);
    console.log(`[BCB IFData] Bancos monitorados: ${Object.keys(this.TRACKED_BANKS).length}`);
    console.log('-'.repeat(60));

    const cadastroAvailable = await this.isCadastroAvailable(anoMes);
    if (!cadastroAvailable) {
      throw new Error(
        `IfDataCadastro indisponivel para AnoMes=${anoMes} (HTTP 500 no endpoint oficial). `
        + 'Sem cadastro oficial nao existe vinculo auditavel CNPJ<->CodInst; coleta estrita abortada.',
      );
    }

    const results: BCBBankData[] = [];

    for (const [slug, config] of Object.entries(this.TRACKED_BANKS)) {
      try {
        const ref = await this.resolveTrackedBankReference(slug, config, anoMes);
        if (!ref) {
          console.warn(`[BCB IFData] Sem referencia oficial resolvida para ${slug}`);
          continue;
        }

        const rows = await this.fetchValueRows(ref, anoMes, 'T');
        if (rows.length === 0) {
          console.warn(`[BCB IFData] Sem valores IFData para ${slug} (${ref.codInst})`);
          continue;
        }

        results.push(this.transformToOurFormat(ref, rows, config.label));
        await this.sleep(120);
      } catch (error) {
        console.error(`[BCB IFData] Falha ao processar ${slug}:`, error);
      }
    }

    console.log('-'.repeat(60));
    console.log(`[BCB IFData] Coleta concluida: ${results.length}/${Object.keys(this.TRACKED_BANKS).length} bancos\n`);

    if (results.length === 0) {
      throw new Error('Nenhum banco retornou dados oficiais verificaveis do IFData.');
    }

    return results;
  }

  async testConnection(): Promise<boolean> {
    try {
      const serviceDocument = await fetch(`${this.BASE_URL}/`, {
        headers: { Accept: 'application/json' },
      });

      if (!serviceDocument.ok) {
        throw new Error(`HTTP ${serviceDocument.status}`);
      }

      const listResponse = await fetch(`${this.BASE_URL}/ListaDeRelatorio()?$top=1&$format=json`, {
        headers: { Accept: 'application/json' },
      });

      if (!listResponse.ok) {
        throw new Error(`ListaDeRelatorio HTTP ${listResponse.status}`);
      }

      const listData: ODataResponse<{ NomeRelatorio: string; NumeroRelatorio: string }> = await listResponse.json();
      console.log(`[BCB IFData] Conexao OK - ${listData.value.length} relatorio(s) de teste retornado(s)`);

      const anoMes = this.toAnoMes(this.getLatestAvailableQuarter().date);
      const cadastroAvailable = await this.isCadastroAvailable(anoMes);
      if (!cadastroAvailable) {
        console.warn(`[BCB IFData] Aviso: IfDataCadastro indisponivel para AnoMes=${anoMes}`);
      }

      return true;
    } catch (error) {
      console.error('[BCB IFData] Falha na conexao:', error);
      return false;
    }
  }

  async fetchHistoricalData(quarters: number = 6): Promise<Map<string, BCBBankData[]>> {
    const quartersList = this.getLastNQuarters(quarters);
    const historicalData = new Map<string, BCBBankData[]>();

    for (const quarter of quartersList) {
      historicalData.set(quarter.date, await this.fetchAllBanksData(quarter.date));
      await this.sleep(500);
    }

    return historicalData;
  }

  isDataAvailable(dataBase: string): boolean {
    const targetDate = new Date(dataBase);
    const latest = this.getLatestAvailableQuarter();
    return targetDate <= new Date() && new Date() >= latest.availableAfter;
  }

  getNextUpdateInfo(): { date: string; daysUntil: number } {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;

    let nextUpdateDate: Date;

    if (currentMonth < 3) {
      nextUpdateDate = new Date(now.getFullYear(), 2, 31);
    } else if (currentMonth < 5) {
      nextUpdateDate = new Date(now.getFullYear(), 4, 31);
    } else if (currentMonth < 8) {
      nextUpdateDate = new Date(now.getFullYear(), 7, 31);
    } else if (currentMonth < 11) {
      nextUpdateDate = new Date(now.getFullYear(), 10, 30);
    } else {
      nextUpdateDate = new Date(now.getFullYear() + 1, 2, 31);
    }

    const daysUntil = Math.ceil((nextUpdateDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return {
      date: nextUpdateDate.toISOString().split('T')[0],
      daysUntil,
    };
  }

  private async resolveTrackedBankReference(
    slug: string,
    config: TrackedBankConfig,
    anoMes: number,
  ): Promise<ResolvedBankReference | null> {
    const override = MANUAL_BANK_OVERRIDES[slug];
    const rows = await this.fetchCadastroRows(
      anoMes,
      `contains(NomeInstituicao,'${config.searchTerm}')`,
      50,
    ).catch(() => []);

    if (rows.length === 0) {
      return null;
    }

    const activeRows = rows.filter((row) => row.Situacao === 'A');
    const candidateRows = activeRows.length > 0 ? activeRows : rows;
    const preferredByOverride = override
      ? candidateRows.find((row) => row.CodInst === override.codInst)
      : null;
    const prudentialRow = candidateRows.find((row) => row.CodInst === row.CodConglomeradoPrudencial)
      || candidateRows.find((row) => row.CodInst.startsWith('C'));
    const namedRow = candidateRows.find((row) => this.normalizeText(row.NomeInstituicao).includes(this.normalizeText(config.searchTerm)));
    const chosen = preferredByOverride || prudentialRow || namedRow || candidateRows[0];

    return {
      slug,
      fullCnpj: config.cnpj,
      baseCode: this.toBaseCode(config.cnpj),
      codInst: preferredByOverride?.CodInst || prudentialRow?.CodInst || chosen.CodInst,
      tipoInstituicao: override?.tipoInstituicao || (prudentialRow ? 1 : 3),
      name: chosen.NomeInstituicao || config.label,
      segment: preferredByOverride?.Sr || prudentialRow?.Sr || chosen.Sr || null,
    };
  }

  private async resolveBankReferenceByCnpj(
    fullCnpj: string,
    anoMes: number,
    slug = 'bank',
    label = 'Banco',
  ): Promise<ResolvedBankReference | null> {
    const trackedEntry = Object.entries(this.TRACKED_BANKS).find(([, config]) => config.cnpj === fullCnpj);
    if (trackedEntry) {
      return this.resolveTrackedBankReference(trackedEntry[0], trackedEntry[1], anoMes);
    }

    return {
      slug,
      fullCnpj,
      baseCode: this.toBaseCode(fullCnpj),
      codInst: this.toBaseCode(fullCnpj),
      tipoInstituicao: 3,
      name: label,
      segment: null,
    };
  }

  private async fetchCadastroRows(anoMes: number, filter: string, top = 20): Promise<IFDataCadastroRow[]> {
    const url = `${this.BASE_URL}/IfDataCadastro(AnoMes=${anoMes})?$filter=${encodeURIComponent(filter)}&$top=${top}&$format=json`;
    const data = await this.fetchJson<IFDataCadastroRow>(url);
    return data.value;
  }

  private async isCadastroAvailable(anoMes: number): Promise<boolean> {
    const url = `${this.BASE_URL}/IfDataCadastro(AnoMes=${anoMes})?$top=1&$format=json`;

    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async fetchValueRows(
    reference: ResolvedBankReference,
    anoMes: number,
    relatorio: string,
  ): Promise<IFDataValorRow[]> {
    const url = `${this.BASE_URL}/IfDataValores(AnoMes=${anoMes},TipoInstituicao=${reference.tipoInstituicao},Relatorio=%27${relatorio}%27)?$filter=${encodeURIComponent(`CodInst eq '${reference.codInst}'`)}&$top=5000&$format=json`;
    const data = await this.fetchJson<IFDataValorRow>(url);
    return data.value;
  }

  private transformToOurFormat(reference: ResolvedBankReference, rows: IFDataValorRow[], fallbackName: string): BCBBankData {
    const basileia = this.toPercent(this.findValue(rows, ['indice de basileia']));
    const tier1 = this.toPercent(this.findValue(rows, ['indice de capital nivel i']));
    const cet1 = this.toPercent(this.findValue(rows, ['indice de capital principal']));
    const totalAssets = this.findValue(rows, ['ativo total']);
    const equity = this.findValue(rows, ['patrimonio liquido']);
    const loanPortfolio = this.findValue(rows, ['carteira de credito classificada']);

    return {
      cnpj: reference.fullCnpj,
      nome: fallbackName || reference.name,
      segmento: reference.segment ?? 'N/A',
      basileia,
      tier1,
      cet1,
      patrimonioLiquido: equity,
      ativoTotal: totalAssets,
      loanPortfolio,
      alavancagem: undefined,
      totalDeposits: undefined,
      roe: undefined,
      roa: undefined,
      nim: undefined,
      costToIncome: undefined,
      liquidez: undefined,
      lcr: undefined,
      nsfr: undefined,
      loanToDeposit: undefined,
      inadimplencia: undefined,
      coverageRatio: undefined,
      writeOffRate: undefined,
      creditQuality: undefined,
    };
  }

  private findValue(rows: IFDataValorRow[], needles: string[]): number | undefined {
    const normalizedNeedles = needles.map((needle) => this.normalizeText(needle));
    const row = rows.find((candidate) => {
      const normalized = this.normalizeText(candidate.NomeColuna);
      return normalizedNeedles.some((needle) => normalized.startsWith(needle));
    });

    return row?.Saldo ?? undefined;
  }

  private normalizeText(value: string | null | undefined): string {
    return (value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  private toPercent(value: number | undefined): number | undefined {
    if (typeof value !== 'number') {
      return undefined;
    }

    return value <= 1.5 ? Number((value * 100).toFixed(6)) : value;
  }

  private toBaseCode(cnpj: string): string {
    return cnpj.replace(/\D/g, '').slice(0, 8);
  }

  private toAnoMes(date: string): number {
    return Number(date.slice(0, 4) + date.slice(5, 7));
  }

  private async fetchJson<T>(url: string): Promise<ODataResponse<T>> {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${url}`);
    }

    return response.json();
  }

  private getLastNQuarters(n: number): QuarterData[] {
    const quarters: QuarterData[] = [];
    const latest = this.getLatestAvailableQuarter();

    let year = latest.year;
    let quarter = latest.quarter;

    for (let index = 0; index < n; index++) {
      const month = quarter * 3;
      const lastDay = quarter === 1 ? 31 : quarter === 2 ? 30 : quarter === 3 ? 30 : 31;

      quarters.push({
        year,
        quarter: quarter as 1 | 2 | 3 | 4,
        date: `${year}-${String(month).padStart(2, '0')}-${lastDay}`,
        availableAfter: new Date(),
      });

      quarter--;
      if (quarter === 0) {
        quarter = 4;
        year--;
      }
    }

    return quarters;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const bcbAPI = new BCBAPIService();
