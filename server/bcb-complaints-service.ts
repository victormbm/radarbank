/**
 * Serviço de Reclamações Bancárias - Banco Central do Brasil
 *
 * Fonte: API pública do BCB - Ranking de Instituições por Índice de Reclamações
 * Dados: domínio público, conforme Lei de Acesso à Informação (LAI)
 * Dataset: https://dadosabertos.bcb.gov.br/dataset/ranking-de-instituicoes-por-indice-de-reclamacoes
 * API:     https://www3.bcb.gov.br/rdrweb/rest/ext/ranking/arquivo
 *
 * O BCB publica trimestralmente o "Ranking de Reclamações por Instituição"
 * com dados oficiais de reclamações dos consumidores nos canais do Banco Central.
 * Esses dados são 100% legais para uso comercial por serem dados abertos do governo.
 *
 * Formato CSV (separador `;`, encoding ISO-8859-1):
 *   Ano;Trimestre;Categoria;Tipo;CNPJ IF;Instituição financeira;Índice;
 *   Qtd total reclamações respondidas;Qtd reclamações procedentes;...;
 *   Qtd total clientes CCS+SCR;Qtd clientes CCS;Qtd clientes SCR
 */

// ──────────────────────────────────────────────────────────────────────────────
// Tipos
// ──────────────────────────────────────────────────────────────────────────────

export interface BCBComplaintData {
  nome: string;            // Nome da instituição (conforme BCB)
  cnpj: string;            // CNPJ IF (pode ser vazio para conglomerados)
  ano: number;
  trimestre: number;       // 1-4
  categoria: string;       // "Top 15" ou "Demais"
  indiceReclamacao: number; // Reclamações por 1 milhão de clientes (menor = melhor)
  totalRespondidas: number;
  procedentes: number;     // "fundamentadas/procedentes" = confirmadas contra o banco
  totalClientes: number;
  // Computados
  reputationScore: number; // 0-10 (normalizado para BankReputation)
  resolvedRate: number;    // % (0-100) das reclamações que NÃO foram procedentes
  sentimentScore: number;  // -1 a +1
}

// ──────────────────────────────────────────────────────────────────────────────
// URLs da API BCB
// ──────────────────────────────────────────────────────────────────────────────

const BCB_RANKING_LIST_URL = 'https://www3.bcb.gov.br/rdrweb/rest/ext/ranking';

function buildCsvUrl(ano: number, periodo: number): string {
  return `https://www3.bcb.gov.br/rdrweb/rest/ext/ranking/arquivo?ano=${ano}&periodicidade=TRIMESTRAL&periodo=${periodo}&tipo=Bancos+e+financeiras`;
}

// ──────────────────────────────────────────────────────────────────────────────
// Mapeamento nome → slug (case-insensitive, parcial)
// ──────────────────────────────────────────────────────────────────────────────

const NAME_TO_SLUG: Array<[string, string]> = [
  ['nubank',                'nubank'],
  ['nu pagamentos',         'nubank'],
  ['nu ip',                 'nubank'],
  ['itau unibanco',         'itau'],
  ['itaú unibanco',         'itau'],
  ['banco do brasil',       'bb'],
  ['bradesco',              'bradesco'],
  ['caixa economica',       'caixa'],
  ['caixa econômica',       'caixa'],
  ['santander',             'santander'],
  ['btg pactual',           'btg'],
  ['btg',                   'btg'],
  ['safra',                 'safra'],
  ['banco inter',           'inter'],
  ['inter&co',              'inter'],
  ['c6 bank',               'c6'],
  ['c6bank',                'c6'],
  ['banco original',        'original'],
  ['pagbank',               'pagbank'],
  ['pagseguro',             'pagbank'],
  ['banco pan',             'pan'],
  ['pan',                   'pan'],
  ['bmg',                   'bmg'],
  ['neon',                  'neon'],
  ['next',                  'next'],
];

export function nameToSlug(nome: string): string | null {
  const normalized = nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  for (const [fragment, slug] of NAME_TO_SLUG) {
    const normFrag = fragment.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (normalized.includes(normFrag)) return slug;
  }
  return null;
}

// ──────────────────────────────────────────────────────────────────────────────
// Cálculo de scores a partir dos dados BCB
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Converte o Índice de Reclamação BCB para score 0-10
 * Índice = reclamações por 1 milhão de clientes (menor = melhor)
 * Benchmarks reais Q4 2025:
 *   < 5    → excelente   → ~9-10
 *   5-20   → bom         → ~7-8
 *   20-50  → regular     → ~5-6
 *   50-150 → ruim        → ~3-4
 *   150+   → crítico     → ~1-2
 */
export function indiceToScore(indice: number): number {
  if (indice <= 0) return 10;
  const score = 10 * Math.exp(-indice / 80);
  return Math.round(Math.max(0.5, Math.min(10, score)) * 10) / 10;
}

/**
 * Taxa de não-procedência = % reclamações que NÃO foram confirmadas contra o banco
 * Maior = banco respondeu/resolveu melhor
 */
export function computeResolvedRate(total: number, procedentes: number): number {
  if (total === 0) return 95;
  const rate = (1 - procedentes / total) * 100;
  return Math.round(Math.max(0, Math.min(100, rate)) * 10) / 10;
}

export function computeSentimentScore(resolvedRate: number, indice: number): number {
  const fromResolved = (resolvedRate - 50) / 50;
  const fromIndice   = Math.max(-1, 1 - indice / 100);
  const raw          = fromResolved * 0.7 + fromIndice * 0.3;
  return Math.round(Math.max(-1, Math.min(1, raw)) * 100) / 100;
}

// ──────────────────────────────────────────────────────────────────────────────
// Período disponível
// ──────────────────────────────────────────────────────────────────────────────

export interface LatestPeriod { ano: number; trimestre: number }

/**
 * Consulta a API BCB para descobrir o último período disponível
 */
export async function getLatestAvailablePeriod(): Promise<LatestPeriod> {
  try {
    const res = await fetch(BCB_RANKING_LIST_URL, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json() as { anos: Array<{ ano: string; periodicidades: Array<{ periodicidade: string; periodos: Array<{ periodo: number }> }> }> };

    // Pega o último ano com dados trimestrais para "Bancos e financeiras"
    for (let i = json.anos.length - 1; i >= 0; i--) {
      const anoEntry = json.anos[i];
      const trimestral = anoEntry.periodicidades.find(p => p.periodicidade === 'TRIMESTRAL');
      if (trimestral && trimestral.periodos.length > 0) {
        const lastPeriodo = trimestral.periodos[trimestral.periodos.length - 1].periodo;
        return { ano: parseInt(anoEntry.ano), trimestre: lastPeriodo };
      }
    }
  } catch (e) {
    console.warn('[BCB-REC] Não foi possível consultar lista de períodos:', e);
  }
  // Fallback: Q4 2025 (confirmado disponível)
  return { ano: 2025, trimestre: 4 };
}

// ──────────────────────────────────────────────────────────────────────────────
// Parse do CSV BCB
// ──────────────────────────────────────────────────────────────────────────────

function parseCsvLine(line: string): string[] {
  return line.split(';').map(s => s.trim());
}

function parseFloat_BR(s: string): number {
  // BCB uses comma as decimal separator
  if (!s || s.trim() === '') return 0;
  return parseFloat(s.replace(',', '.')) || 0;
}

function parseInt_BR(s: string): number {
  if (!s || s.trim() === '') return 0;
  return parseInt(s.replace(/\D/g, ''), 10) || 0;
}

function parseCsv(raw: string): BCBComplaintData[] {
  const lines = raw.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  // Skip header line
  const results: BCBComplaintData[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length < 12) continue;

    const ano          = parseInt(cols[0]) || 0;
    const trimestreStr = cols[1] ?? '';  // "4º"
    const trimestre    = parseInt(trimestreStr) || 0;
    const categoria    = cols[2] ?? '';
    // cols[3] = Tipo (conglomerado / IF)
    // cols[4] = CNPJ IF (may be blank)
    const nome         = cols[5] ?? '';
    const indice       = parseFloat_BR(cols[6]);
    const totalResp    = parseInt_BR(cols[7]);
    const procedentes  = parseInt_BR(cols[8]);
    // cols[9] = procedentes extrapoladas
    // cols[10] = total analisadas
    const totalClientes = parseInt_BR(cols[11]);

    if (!nome || ano < 2014) continue;

    const resolvedRate    = computeResolvedRate(totalResp, procedentes);
    const reputationScore = indiceToScore(indice);
    const sentimentScore  = computeSentimentScore(resolvedRate, indice);

    results.push({
      nome,
      cnpj:            cols[4] ?? '',
      ano,
      trimestre,
      categoria,
      indiceReclamacao: indice,
      totalRespondidas: totalResp,
      procedentes,
      totalClientes,
      reputationScore,
      resolvedRate,
      sentimentScore,
    });
  }
  return results;
}

// ──────────────────────────────────────────────────────────────────────────────
// Fetch principal
// ──────────────────────────────────────────────────────────────────────────────

export async function fetchBCBComplaints(period?: LatestPeriod): Promise<BCBComplaintData[]> {
  const { ano, trimestre } = period ?? await getLatestAvailablePeriod();
  const url = buildCsvUrl(ano, trimestre);

  console.log(`[BCB-REC] Buscando ranking de reclamações ${ano} T${trimestre}...`);
  console.log(`[BCB-REC] Fonte: dados abertos BCB (LAI) – uso comercial legal ✅`);
  console.log(`[BCB-REC] URL: ${url}`);

  const res = await fetch(url, {
    headers: {
      'Accept': 'text/csv,*/*',
      'User-Agent': 'RadarBank-PublicData/1.0 (dados abertos BCB)',
    },
  });

  if (!res.ok) {
    throw new Error(`BCB retornou HTTP ${res.status} para ${url}`);
  }

  // BCB CSV usa encoding ISO-8859-1 / Windows-1252
  const buffer  = await res.arrayBuffer();
  const decoder = new TextDecoder('windows-1252');
  const raw     = decoder.decode(buffer);

  const data = parseCsv(raw);
  console.log(`[BCB-REC] ✅ ${data.length} instituições encontradas`);
  return data;
}

/**
 * Testa conexão e retorna info do último período disponível
 */
export async function testBCBComplaintsConnection(): Promise<{ ok: boolean; ano: number; trimestre: number; count: number; message: string }> {
  try {
    const period = await getLatestAvailablePeriod();
    const data   = await fetchBCBComplaints(period);
    return {
      ok:        data.length > 0,
      ano:       period.ano,
      trimestre: period.trimestre,
      count:     data.length,
      message:   data.length > 0
        ? `${data.length} instituições no ranking ${period.ano} T${period.trimestre}`
        : 'CSV retornou vazio',
    };
  } catch (err: any) {
    return { ok: false, ano: 0, trimestre: 0, count: 0, message: err.message };
  }
}

