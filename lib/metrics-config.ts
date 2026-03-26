/**
 * Configuração centralizada de todas as métricas bancárias
 */

export interface MetricConfig {
  key: string;
  label: string;
  unit: string;
  category: 'capital' | 'liquidity' | 'profitability' | 'credit' | 'size' | 'growth';
  description: string;
  min: number;
  max: number;
  ideal: number;
  critical: number; // Valor crítico que indica alerta
  weight: number; // Peso no cálculo do score geral
}

export const METRICS_CONFIG: Record<string, MetricConfig> = {
  // CAPITAL (Basileia) - 35% do score
  basel_ratio: {
    key: 'basel_ratio',
    label: 'Índice de Basileia',
    unit: '%',
    category: 'capital',
    description: 'Capital total dividido por ativos ponderados pelo risco',
    min: 0,
    max: 25,
    ideal: 15,
    critical: 10.5, // Mínimo regulatório
    weight: 0.15,
  },
  tier1_ratio: {
    key: 'tier1_ratio',
    label: 'Capital Principal (Tier 1)',
    unit: '%',
    category: 'capital',
    description: 'Capital de Nível 1 dividido por ativos ponderados pelo risco',
    min: 0,
    max: 20,
    ideal: 12,
    critical: 8.0,
    weight: 0.10,
  },
  cet1_ratio: {
    key: 'cet1_ratio',
    label: 'CET1',
    unit: '%',
    category: 'capital',
    description: 'Common Equity Tier 1',
    min: 0,
    max: 18,
    ideal: 10,
    critical: 4.5,
    weight: 0.05,
  },
  leverage_ratio: {
    key: 'leverage_ratio',
    label: 'Índice de Alavancagem',
    unit: '%',
    category: 'capital',
    description: 'Capital de Nível 1 dividido por exposição total',
    min: 0,
    max: 15,
    ideal: 6,
    critical: 3.0,
    weight: 0.05,
  },

  // LIQUIDEZ - 25% do score
  lcr: {
    key: 'lcr',
    label: 'LCR',
    unit: '%',
    category: 'liquidity',
    description: 'Liquidity Coverage Ratio - Ativos líquidos / Saídas de caixa líquidas',
    min: 0,
    max: 200,
    ideal: 150,
    critical: 100, // Mínimo regulatório
    weight: 0.10,
  },
  nsfr: {
    key: 'nsfr',
    label: 'NSFR',
    unit: '%',
    category: 'liquidity',
    description: 'Net Stable Funding Ratio - Financiamento estável / Financiamento necessário',
    min: 0,
    max: 150,
    ideal: 120,
    critical: 100,
    weight: 0.08,
  },
  quick_liquidity: {
    key: 'quick_liquidity',
    label: 'Liquidez Imediata',
    unit: '%',
    category: 'liquidity',
    description: 'Disponibilidades / Depósitos à vista',
    min: 0,
    max: 200,
    ideal: 140,
    critical: 80,
    weight: 0.05,
  },
  loan_to_deposit: {
    key: 'loan_to_deposit',
    label: 'Empréstimos / Depósitos',
    unit: '%',
    category: 'liquidity',
    description: 'Relação entre carteira de crédito e depósitos',
    min: 0,
    max: 150,
    ideal: 80,
    critical: 120, // Acima de 120% pode indicar dependência excessiva de funding
    weight: 0.02,
  },

  // RENTABILIDADE - 20% do score
  roe: {
    key: 'roe',
    label: 'ROE',
    unit: '%',
    category: 'profitability',
    description: 'Return on Equity - Lucro Líquido / Patrimônio Líquido',
    min: -10,
    max: 40,
    ideal: 18,
    critical: 5, // Abaixo de 5% é preocupante
    weight: 0.08,
  },
  roa: {
    key: 'roa',
    label: 'ROA',
    unit: '%',
    category: 'profitability',
    description: 'Return on Assets - Lucro Líquido / Ativo Total',
    min: -5,
    max: 10,
    ideal: 2,
    critical: 0.5,
    weight: 0.06,
  },
  nim: {
    key: 'nim',
    label: 'Margem Líquida de Juros',
    unit: '%',
    category: 'profitability',
    description: 'Net Interest Margin - Receitas de juros líquidas / Ativos geradores',
    min: 0,
    max: 15,
    ideal: 6,
    critical: 2,
    weight: 0.04,
  },
  cost_to_income: {
    key: 'cost_to_income',
    label: 'Eficiência Operacional',
    unit: '%',
    category: 'profitability',
    description: 'Despesas Operacionais / Receitas',
    min: 20,
    max: 100,
    ideal: 40,
    critical: 80, // Acima de 80% é muito ineficiente
    weight: 0.02,
  },

  // QUALIDADE DE CRÉDITO - 20% do score
  npl_ratio: {
    key: 'npl_ratio',
    label: 'Taxa de Inadimplência',
    unit: '%',
    category: 'credit',
    description: 'Créditos vencidos há mais de 90 dias / Carteira Total',
    min: 0,
    max: 15,
    ideal: 2,
    critical: 6, // Acima de 6% é preocupante
    weight: 0.10,
  },
  coverage_ratio: {
    key: 'coverage_ratio',
    label: 'Cobertura de Provisões',
    unit: '%',
    category: 'credit',
    description: 'Provisões para perdas / Créditos vencidos',
    min: 0,
    max: 200,
    ideal: 150,
    critical: 80, // Abaixo de 80% é insuficiente
    weight: 0.05,
  },
  write_off_rate: {
    key: 'write_off_rate',
    label: 'Taxa de Baixa',
    unit: '%',
    category: 'credit',
    description: 'Créditos baixados como prejuízo / Carteira Total',
    min: 0,
    max: 10,
    ideal: 2,
    critical: 5,
    weight: 0.03,
  },
  credit_quality: {
    key: 'credit_quality',
    label: 'Índice de Qualidade',
    unit: '%',
    category: 'credit',
    description: 'Percentual de créditos classificados como AA-A',
    min: 0,
    max: 100,
    ideal: 80,
    critical: 50,
    weight: 0.02,
  },

  // TAMANHO - Não entra no score, apenas indicativo
  total_assets: {
    key: 'total_assets',
    label: 'Ativos Totais',
    unit: 'R$ MM',
    category: 'size',
    description: 'Total de ativos da instituição',
    min: 0,
    max: 3000000,
    ideal: 500000,
    critical: 10000, // Muito baixo pode indicar fragilidade
    weight: 0,
  },
  equity: {
    key: 'equity',
    label: 'Patrimônio Líquido',
    unit: 'R$ MM',
    category: 'size',
    description: 'Patrimônio líquido total',
    min: 0,
    max: 200000,
    ideal: 50000,
    critical: 1000,
    weight: 0,
  },
  total_deposits: {
    key: 'total_deposits',
    label: 'Depósitos Totais',
    unit: 'R$ MM',
    category: 'size',
    description: 'Total de depósitos captados',
    min: 0,
    max: 1500000,
    ideal: 300000,
    critical: 5000,
    weight: 0,
  },
  loan_portfolio: {
    key: 'loan_portfolio',
    label: 'Carteira de Crédito',
    unit: 'R$ MM',
    category: 'size',
    description: 'Total da carteira de empréstimos',
    min: 0,
    max: 1200000,
    ideal: 250000,
    critical: 3000,
    weight: 0,
  },

  // CRESCIMENTO - Não entra no score, apenas indicativo
  asset_growth: {
    key: 'asset_growth',
    label: 'Crescimento de Ativos',
    unit: '%',
    category: 'growth',
    description: 'Crescimento anual de ativos totais',
    min: -30,
    max: 100,
    ideal: 15,
    critical: -10, // Contração muito forte
    weight: 0,
  },
  loan_growth: {
    key: 'loan_growth',
    label: 'Crescimento de Empréstimos',
    unit: '%',
    category: 'growth',
    description: 'Crescimento anual da carteira de crédito',
    min: -30,
    max: 100,
    ideal: 12,
    critical: -15,
    weight: 0,
  },
  deposit_growth: {
    key: 'deposit_growth',
    label: 'Crescimento de Depósitos',
    unit: '%',
    category: 'growth',
    description: 'Crescimento anual de depósitos',
    min: -30,
    max: 100,
    ideal: 10,
    critical: -20,
    weight: 0,
  },
};

// Lista de métricas por categoria
export const METRICS_BY_CATEGORY = {
  capital: ['basel_ratio', 'tier1_ratio', 'cet1_ratio', 'leverage_ratio'],
  liquidity: ['lcr', 'nsfr', 'quick_liquidity', 'loan_to_deposit'],
  profitability: ['roe', 'roa', 'nim', 'cost_to_income'],
  credit: ['npl_ratio', 'coverage_ratio', 'write_off_rate', 'credit_quality'],
  size: ['total_assets', 'equity', 'total_deposits', 'loan_portfolio'],
  growth: ['asset_growth', 'loan_growth', 'deposit_growth'],
};

// Métricas que entram no cálculo do score
export const SCORED_METRICS = Object.values(METRICS_CONFIG).filter(m => m.weight > 0);

// Validação: pesos devem somar 100%
const totalWeight = SCORED_METRICS.reduce((sum, m) => sum + m.weight, 0);
if (Math.abs(totalWeight - 1.0) > 0.001) {
  console.warn(`[METRICS CONFIG] Soma dos pesos = ${totalWeight} (deveria ser 1.0)`);
}
