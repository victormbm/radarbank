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

interface CodInstCandidate {
  tipoInstituicao: 1 | 3;
  codInst: string;
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
  private cadastroCache = new Map<number, IFDataCadastroRow[]>();

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

    // Q4 do ano anterior (Dez 31) fica disponível ~90 dias após o encerramento,
    // ou seja, a partir de 1º de março do ano seguinte.
    if (currentMonth >= 3) {
      return {
        year: currentYear - 1,
        quarter: 4,
        date: `${currentYear - 1}-12-31`,
        availableAfter: new Date(currentYear, 2, 1),
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
    const requestedQuarter = dataBase ? { date: dataBase } as QuarterData : this.getLatestAvailableQuarter();
    const resolvedQuarter = await this.resolveBestAvailableQuarter(requestedQuarter.date, dataBase ? 0 : 4);
    const quarterCandidates = [resolvedQuarter];
    if (!dataBase) {
      let fallbackDate = resolvedQuarter;
      for (let step = 0; step < 4; step++) {
        fallbackDate = this.getPreviousQuarterDate(fallbackDate);
        quarterCandidates.push(fallbackDate);
      }
    }

    for (let index = 0; index < quarterCandidates.length; index++) {
      const activeQuarter = quarterCandidates[index];
      const anoMes = this.toAnoMes(activeQuarter);

      console.log(`\n[BCB IFData] Iniciando coleta oficial`);
      console.log(`[BCB IFData] Data-base: ${activeQuarter} (${anoMes})`);
      if (activeQuarter !== requestedQuarter.date) {
        console.log(`[BCB IFData] Fallback automatico de data-base: ${requestedQuarter.date} -> ${activeQuarter}`);
      }
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

      if (results.length > 0) {
        return results;
      }

      if (dataBase || index === quarterCandidates.length - 1) {
        break;
      }
    }

    throw new Error('Nenhum banco retornou dados oficiais verificaveis do IFData.');
  }

  private async resolveBestAvailableQuarter(startDate: string, maxFallbackSteps: number): Promise<string> {
    let currentDate = startDate;

    for (let step = 0; step <= maxFallbackSteps; step++) {
      const anoMes = this.toAnoMes(currentDate);
      const hasAnyValues = await this.hasAnyValuesForAnoMes(anoMes);
      if (hasAnyValues) {
        return currentDate;
      }

      currentDate = this.getPreviousQuarterDate(currentDate);
    }

    return startDate;
  }

  private async hasAnyValuesForAnoMes(anoMes: number): Promise<boolean> {
    for (const tipo of [1, 3] as const) {
      const url = `${this.BASE_URL}/IfDataValores(AnoMes=${anoMes},TipoInstituicao=${tipo},Relatorio=%27T%27)?$top=1&$format=json`;
      try {
        const data = await this.fetchJson<IFDataValorRow>(url);
        if (Array.isArray(data.value) && data.value.length > 0) {
          return true;
        }
      } catch {
        // Ignora e tenta o outro tipo.
      }
    }

    return false;
  }

  private getPreviousQuarterDate(date: string): string {
    const year = Number(date.slice(0, 4));
    const month = Number(date.slice(5, 7));
    const quarter = Math.ceil(month / 3);

    let previousQuarter = quarter - 1;
    let previousYear = year;
    if (previousQuarter === 0) {
      previousQuarter = 4;
      previousYear -= 1;
    }

    const quarterToDate: Record<number, string> = {
      1: `${previousYear}-03-31`,
      2: `${previousYear}-06-30`,
      3: `${previousYear}-09-30`,
      4: `${previousYear}-12-31`,
    };

    return quarterToDate[previousQuarter];
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
    const cnpj = config.cnpj.replace(/\D/g, '');
    const baseCode = this.toBaseCode(cnpj);
    const escapedSearchTerm = this.escapeODataLiteral(config.searchTerm);
    const escapedLabel = this.escapeODataLiteral(config.label);

    const cadastroUniverse = await this.getCadastroUniverse(anoMes);
    const normalizedLabel = this.normalizeText(config.label);
    const normalizedSearch = this.normalizeText(config.searchTerm);

    const fromUniverse = cadastroUniverse.filter((row) => {
      const rowCnpj = (row.CnpjInstituicaoLider || '').replace(/\D/g, '');
      const rowName = this.normalizeText(row.NomeInstituicao);
      const cnpjMatch = rowCnpj === cnpj || rowCnpj.startsWith(baseCode);
      const nameMatch = rowName.includes(normalizedSearch) || rowName.includes(normalizedLabel);
      return cnpjMatch || nameMatch;
    });

    const universeRows = fromUniverse.length > 0 ? fromUniverse : [];

    if (universeRows.length > 0) {
      const activeRows = universeRows.filter((row) => row.Situacao === 'A');
      const candidateRows = activeRows.length > 0 ? activeRows : universeRows;
      const preferredByOverride = override
        ? candidateRows.find((row) => row.CodInst === override.codInst)
        : null;
      const prudentialRow = candidateRows.find((row) => row.CodInst === row.CodConglomeradoPrudencial)
        || candidateRows.find((row) => row.CodInst.startsWith('C'));
      const chosen = preferredByOverride || prudentialRow || candidateRows[0];

      return {
        slug,
        fullCnpj: config.cnpj,
        baseCode,
        codInst: preferredByOverride?.CodInst || prudentialRow?.CodInst || chosen.CodInst,
        tipoInstituicao: override?.tipoInstituicao || (prudentialRow ? 1 : 3),
        name: chosen.NomeInstituicao || config.label,
        segment: preferredByOverride?.Sr || prudentialRow?.Sr || chosen.Sr || null,
      };
    }

    // Prioriza resolucao por CNPJ para manter trilha auditavel CNPJ <-> CodInst.
    const filters = [
      `CnpjInstituicaoLider eq '${cnpj}'`,
      `contains(CnpjInstituicaoLider,'${baseCode}')`,
      `contains(NomeInstituicao,'${escapedSearchTerm}')`,
      `contains(NomeInstituicao,'${escapedLabel}')`,
    ];

    const rowsMap = new Map<string, IFDataCadastroRow>();
    for (const filter of filters) {
      const currentRows = await this.fetchCadastroRows(anoMes, filter, 80).catch(() => []);
      for (const row of currentRows) {
        if (row?.CodInst) {
          rowsMap.set(row.CodInst, row);
        }
      }
      if (rowsMap.size > 0) {
        break;
      }
    }

    const rows = Array.from(rowsMap.values());

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

  private async getCadastroUniverse(anoMes: number): Promise<IFDataCadastroRow[]> {
    const cached = this.cadastroCache.get(anoMes);
    if (cached) {
      return cached;
    }

    const url = `${this.BASE_URL}/IfDataCadastro(AnoMes=${anoMes})?$select=CodInst,NomeInstituicao,Sr,CodConglomeradoPrudencial,CnpjInstituicaoLider,Situacao&$top=5000&$format=json`;
    const data = await this.fetchJson<IFDataCadastroRow>(url);
    const rows = Array.isArray(data.value) ? data.value : [];
    this.cadastroCache.set(anoMes, rows);
    return rows;
  }

  private async resolveTrackedBankReferenceByValueProbe(
    slug: string,
    config: TrackedBankConfig,
    anoMes: number,
  ): Promise<ResolvedBankReference | null> {
    const candidates = this.buildCodInstCandidates(config.cnpj);
    const override = MANUAL_BANK_OVERRIDES[slug];

    if (override) {
      candidates.unshift({
        tipoInstituicao: override.tipoInstituicao,
        codInst: override.codInst,
      });
    }

    const seen = new Set<string>();
    for (const candidate of candidates) {
      const key = `${candidate.tipoInstituicao}:${candidate.codInst}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);

      const hasValues = await this.hasValueRows(anoMes, candidate.tipoInstituicao, candidate.codInst);
      if (!hasValues) {
        continue;
      }

      return {
        slug,
        fullCnpj: config.cnpj,
        baseCode: this.toBaseCode(config.cnpj),
        codInst: candidate.codInst,
        tipoInstituicao: candidate.tipoInstituicao,
        name: config.label,
        segment: null,
      };
    }

    return null;
  }

  private buildCodInstCandidates(cnpj: string): CodInstCandidate[] {
    const base8 = this.toBaseCode(cnpj);
    const trimmed = base8.replace(/^0+/, '') || '0';
    const values = [base8, trimmed, `C${base8}`, `C${trimmed}`];
    const uniqueCodes = [...new Set(values)];
    const candidates: CodInstCandidate[] = [];

    for (const tipoInstituicao of [1, 3] as const) {
      for (const codInst of uniqueCodes) {
        candidates.push({ tipoInstituicao, codInst });
      }
    }

    return candidates;
  }

  private async hasValueRows(anoMes: number, tipoInstituicao: 1 | 3, codInst: string): Promise<boolean> {
    const filter = encodeURIComponent(`CodInst eq '${codInst}'`);
    const url = `${this.BASE_URL}/IfDataValores(AnoMes=${anoMes},TipoInstituicao=${tipoInstituicao},Relatorio=%27T%27)?$filter=${filter}&$top=1&$format=json`;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!response.ok) {
        return false;
      }
      const data = await response.json() as ODataResponse<IFDataValorRow>;
      return Array.isArray(data.value) && data.value.length > 0;
    } catch {
      return false;
    }
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
    const alavancagem = this.toPercent(this.findValue(rows, ['razao de alavancagem']));
    const totalAssets = this.findValue(rows, ['ativo total']);
    const equity = this.findValue(rows, ['patrimonio liquido']);
    const loanPortfolio = this.findValue(rows, ['carteira de credito classificada']);
    const totalDeposits = this.findValue(rows, ['deposito total']);

    // Profitability: derived from P&L items already present in Relatorio='T'
    const lucroLiquido = this.findValue(rows, ['lucro liquido']);
    const despPessoal = this.findValue(rows, ['despesas de pessoal']);
    const despAdmin = this.findValue(rows, ['despesas administrativas']);
    const disponibilidades = this.findValue(rows, ['disponibilidades']);
    const depositosVista = this.findValue(rows, ['depositos a vista']);
    // Pre-tax result — formula works across TipoInstituicao=1 and =3 report formats
    const preTaskResult = this.findValue(rows, ['resultado antes da tributacao']);

    // ROE (annualised quarterly earnings / equity) — stored in %
    const roe =
      typeof lucroLiquido === 'number' && typeof equity === 'number' && equity > 0
        ? (lucroLiquido / equity) * 4 * 100
        : undefined;

    // ROA (annualised quarterly earnings / total assets) — stored in %
    const roa =
      typeof lucroLiquido === 'number' && typeof totalAssets === 'number' && totalAssets > 0
        ? (lucroLiquido / totalAssets) * 4 * 100
        : undefined;

    // Cost-to-Income: opex / (preTaskResult + opex) — bounded formula that works for
    // both TipoInstituicao=1 (provisions inside NII) and =3 (provisions shown separately)
    const opex = Math.abs(despPessoal ?? 0) + Math.abs(despAdmin ?? 0);
    const costToIncome =
      typeof despPessoal === 'number' && typeof despAdmin === 'number' &&
      typeof preTaskResult === 'number' && preTaskResult > 0
        ? (opex / (preTaskResult + opex)) * 100
        : undefined;

    // Liquidez Imediata: available cash / demand deposits — stored in %
    const liquidez =
      typeof disponibilidades === 'number' && typeof depositosVista === 'number' && depositosVista > 0
        ? (disponibilidades / depositosVista) * 100
        : undefined;

    return {
      cnpj: reference.fullCnpj,
      nome: fallbackName || reference.name,
      segmento: reference.segment ?? 'N/A',
      basileia,
      tier1,
      cet1,
      alavancagem,
      patrimonioLiquido: equity,
      ativoTotal: totalAssets,
      loanPortfolio,
      totalDeposits,
      roe,
      roa,
      nim: undefined,
      costToIncome,
      liquidez,
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

  private escapeODataLiteral(value: string): string {
    return value.replace(/'/g, "''");
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
