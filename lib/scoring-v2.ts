/**
 * Sistema de Scoring Melhorado - Banco Seguro BR
 * 
 * Calcula score de saúde bancária baseado em múltiplas métricas
 */

import { METRICS_CONFIG } from "./metrics-config";

export interface BankSnapshotData {
  basilRatio?: number | null;
  tier1Ratio?: number | null;
  cet1Ratio?: number | null;
  leverageRatio?: number | null;
  lcr?: number | null;
  nsfr?: number | null;
  quickLiquidity?: number | null;
  loanToDeposit?: number | null;
  roe?: number | null;
  roa?: number | null;
  nim?: number | null;
  costToIncome?: number | null;
  nplRatio?: number | null;
  coverageRatio?: number | null;
  writeOffRate?: number | null;
  creditQuality?: number | null;
  totalAssets?: number | null;
  equity?: number | null;
  totalDeposits?: number | null;
  loanPortfolio?: number | null;
  assetGrowth?: number | null;
  loanGrowth?: number | null;
  depositGrowth?: number | null;

  // Dados de Mercado
  stockPrice?: number | null;
  stockChange?: number | null;          // %
  marketCap?: number | null;
}

/**
 * Pesos do Score Estrutural
 *
 * 100% Dados Técnicos BCB (4 categorias + porte)
 */
export const SCORE_WEIGHTS = {
  // Dados Técnicos BCB (100% total)
  capital: 0.31,
  liquidity: 0.23,
  profitability: 0.16,
  credit: 0.16,
  size: 0.10,

  // Mantido por compatibilidade de payload, sem efeito no score
  market: 0,
} as const;

/**
 * Peso da composição final do score
 *
 * - Estrutural: saúde de fundamentos (mais estável)
 * - Estresse: deterioração recente de fundamentos
 */
export const FINAL_SCORE_WEIGHTS = {
  structural: 0.80,
  stress: 0.20,
} as const;

export interface ScoreBreakdown {
  capital: number;
  liquidity: number;
  profitability: number;
  credit: number;
  size: number;
  market: number;
}

export interface DetailedScore {
  totalScore: number;
  structuralScore: number;
  stressScore: number;
  breakdown: ScoreBreakdown;
  confidence: number;
  reasoning: string[];
  status: 'healthy' | 'warning' | 'critical';
  alerts: string[];
  metricScores: Record<string, number>;
}

export interface MarketContext {
  stockChange30d?: number | null;
  ibovChange30d?: number | null;
  volatility30d?: number | null;
  isProxy?: boolean;
  source?: string;
}

export interface ScoringContext {
  bankType?: 'digital' | 'traditional';
  previousSnapshot?: Partial<BankSnapshotData> | null;
  marketContext?: MarketContext | null;
}

/**
 * Normaliza uma métrica para uma escala de 0-100
 */
function normalizeMetric(key: string, value: number): number {
  const config = METRICS_CONFIG[key];
  if (!config) return 50;

  // Para métricas onde menor é melhor (ex: NPL, Cost/Income)
  const isReversed = ['npl_ratio', 'cost_to_income', 'write_off_rate'].includes(key);

  if (isReversed) {
    // Quanto maior o valor, pior o score
    if (value <= config.ideal) {
      return 100;
    } else if (value >= config.max) {
      return 0;
    } else {
      const normalized = 100 - ((value - config.ideal) / (config.max - config.ideal)) * 100;
      return Math.max(0, Math.min(100, normalized));
    }
  } else {
    // Quanto maior o valor, melhor o score
    if (value >= config.ideal) {
      return 100;
    } else if (value <= config.min) {
      return 0;
    } else {
      const normalized = ((value - config.min) / (config.ideal - config.min)) * 100;
      return Math.max(0, Math.min(100, normalized));
    }
  }
}

/**
 * Calcula score de mercado (ações, etc)
 * 
 * Considera variação do preço das ações e market cap
 */
function calculateMarketScore(snapshot: BankSnapshotData, marketContext?: MarketContext | null): number {
  const stockChange = snapshot.stockChange ?? marketContext?.stockChange30d;
  const ibovChange = marketContext?.ibovChange30d ?? 0;
  const volatility = marketContext?.volatility30d;

  if (stockChange === null || stockChange === undefined) {
    if (snapshot.marketCap === null || snapshot.marketCap === undefined) {
      return 50;
    }
  }

  if ((stockChange === null || stockChange === undefined) && !volatility && !snapshot.marketCap) {
    return 50; // Neutro se não há dados
  }

  let weightedScore = 0;
  let totalWeight = 0;

  // Performance relativa ao IBOV em 30d
  if (stockChange !== null && stockChange !== undefined) {
    const relativePerformance = stockChange - ibovChange;
    const normalizedRelative = Math.max(-30, Math.min(30, relativePerformance));
    const relativeScore = ((normalizedRelative + 30) / 60) * 100;
    weightedScore += relativeScore * 0.60;
    totalWeight += 0.60;
  }

  // Volatilidade anualizada (menor = melhor)
  if (volatility !== null && volatility !== undefined) {
    const boundedVolatility = Math.max(15, Math.min(80, volatility));
    const volatilityScore = 100 - ((boundedVolatility - 15) / 65) * 100;
    weightedScore += volatilityScore * 0.25;
    totalWeight += 0.25;
  }

  // Market Cap (indicador relativo de tamanho/estabilidade)
  if (snapshot.marketCap !== null && snapshot.marketCap !== undefined) {
    const capScore = snapshot.marketCap > 10_000_000_000 ? 100 : 
                     snapshot.marketCap > 5_000_000_000 ? 80 :
                     snapshot.marketCap > 1_000_000_000 ? 60 : 50;
    weightedScore += capScore * 0.15;
    totalWeight += 0.15;
  }

  const baseScore = totalWeight > 0 ? weightedScore / totalWeight : 50;

  // Se for proxy (banco sem ação listada), puxar para neutro
  if (marketContext?.isProxy) {
    return baseScore * 0.70 + 50 * 0.30;
  }

  return baseScore;
}

function logScaleScore(value: number, min: number, max: number): number {
  if (value <= 0 || min <= 0 || max <= min) return 50;
  const normalized = (Math.log10(value) - Math.log10(min)) / (Math.log10(max) - Math.log10(min));
  return Math.max(0, Math.min(100, normalized * 100));
}

/**
 * Ajuste de porte usando apenas dados BCB de balanço.
 *
 * Objetivo: reduzir distorções entre bancos muito grandes e instituições de nicho,
 * sem depender de fontes externas de reputação.
 */
function calculateSizeScore(snapshot: BankSnapshotData): number {
  const components = [
    {
      value: snapshot.totalAssets,
      min: 10_000,
      max: 3_000_000,
      weight: 0.45,
    },
    {
      value: snapshot.equity,
      min: 1_000,
      max: 200_000,
      weight: 0.25,
    },
    {
      value: snapshot.totalDeposits,
      min: 5_000,
      max: 1_500_000,
      weight: 0.20,
    },
    {
      value: snapshot.loanPortfolio,
      min: 3_000,
      max: 1_200_000,
      weight: 0.10,
    },
  ];

  let weighted = 0;
  let totalWeight = 0;

  for (const item of components) {
    if (typeof item.value === "number" && item.value > 0) {
      weighted += logScaleScore(item.value, item.min, item.max) * item.weight;
      totalWeight += item.weight;
    }
  }

  return totalWeight > 0 ? weighted / totalWeight : 50;
}

function calculateStructuralScore(
  breakdown: ScoreBreakdown,
  availability: {
    capital: boolean;
    liquidity: boolean;
    profitability: boolean;
    credit: boolean;
    size: boolean;
  }
): number {
  let weightedSum = 0;
  let activeWeight = 0;

  if (availability.capital) {
    weightedSum += breakdown.capital * SCORE_WEIGHTS.capital;
    activeWeight += SCORE_WEIGHTS.capital;
  }

  if (availability.liquidity) {
    weightedSum += breakdown.liquidity * SCORE_WEIGHTS.liquidity;
    activeWeight += SCORE_WEIGHTS.liquidity;
  }

  if (availability.profitability) {
    weightedSum += breakdown.profitability * SCORE_WEIGHTS.profitability;
    activeWeight += SCORE_WEIGHTS.profitability;
  }

  if (availability.credit) {
    weightedSum += breakdown.credit * SCORE_WEIGHTS.credit;
    activeWeight += SCORE_WEIGHTS.credit;
  }

  if (availability.size) {
    weightedSum += breakdown.size * SCORE_WEIGHTS.size;
    activeWeight += SCORE_WEIGHTS.size;
  }

  // Sem cobertura mínima de dados, manter neutro para evitar viés artificial.
  if (activeWeight === 0) {
    return 50;
  }

  return weightedSum / activeWeight;
}

function calculateStressScore(
  snapshot: BankSnapshotData,
  breakdown: ScoreBreakdown,
  context: ScoringContext
): { stressScore: number; reasoning: string[] } {
  const reasoning: string[] = [];
  const previous = context.previousSnapshot;

  // Deterioração de fundamentos vs período anterior
  let fundamentalsResilience = 50;
  if (previous) {
    let penalty = 0;

    if (
      previous.nplRatio !== null && previous.nplRatio !== undefined &&
      snapshot.nplRatio !== null && snapshot.nplRatio !== undefined
    ) {
      const nplDelta = snapshot.nplRatio - previous.nplRatio;
      if (nplDelta > 0) penalty += Math.min(40, nplDelta * 20);
    }

    if (
      previous.basilRatio !== null && previous.basilRatio !== undefined &&
      snapshot.basilRatio !== null && snapshot.basilRatio !== undefined
    ) {
      const baselDelta = snapshot.basilRatio - previous.basilRatio;
      if (baselDelta < 0) penalty += Math.min(30, Math.abs(baselDelta) * 8);
    }

    if (
      previous.roe !== null && previous.roe !== undefined &&
      snapshot.roe !== null && snapshot.roe !== undefined
    ) {
      const roeDelta = snapshot.roe - previous.roe;
      if (roeDelta < 0) penalty += Math.min(20, Math.abs(roeDelta) * 2);
    }

    fundamentalsResilience = Math.max(0, 100 - penalty);
  }

  if (!previous) {
    reasoning.push("Sem historico suficiente para avaliar estresse de tendencia");
  }

  if (fundamentalsResilience < 50) reasoning.push("Deterioração recente de fundamentos");

  const stressScore = fundamentalsResilience;

  return {
    stressScore,
    reasoning,
  };
}

function calculateConfidence(snapshot: BankSnapshotData, context: ScoringContext): number {
  const _ = context;
  const technicalFields = [
    snapshot.basilRatio,
    snapshot.tier1Ratio,
    snapshot.cet1Ratio,
    snapshot.leverageRatio,
    snapshot.lcr,
    snapshot.nsfr,
    snapshot.quickLiquidity,
    snapshot.loanToDeposit,
    snapshot.roe,
    snapshot.roa,
    snapshot.nim,
    snapshot.costToIncome,
    snapshot.nplRatio,
    snapshot.coverageRatio,
    snapshot.writeOffRate,
    snapshot.creditQuality,
  ];

  const technicalCoverage = technicalFields.filter(v => v !== null && v !== undefined).length / technicalFields.length;
  const confidence = technicalCoverage;

  return Math.round(confidence * 10000) / 100;
}

/**
 * Calcula score detalhado com base nas métricas
 */
export function computeDetailedScore(snapshot: BankSnapshotData, context: ScoringContext = {}): DetailedScore {
  const metricScores: Record<string, number> = {};
  const alerts: string[] = [];

  // Mapear snapshot para métricas
  const metricsData: Record<string, number | null | undefined> = {
    basel_ratio: snapshot.basilRatio,
    tier1_ratio: snapshot.tier1Ratio,
    cet1_ratio: snapshot.cet1Ratio,
    leverage_ratio: snapshot.leverageRatio,
    lcr: snapshot.lcr,
    nsfr: snapshot.nsfr,
    quick_liquidity: snapshot.quickLiquidity,
    loan_to_deposit: snapshot.loanToDeposit,
    roe: snapshot.roe,
    roa: snapshot.roa,
    nim: snapshot.nim,
    cost_to_income: snapshot.costToIncome,
    npl_ratio: snapshot.nplRatio,
    coverage_ratio: snapshot.coverageRatio,
    write_off_rate: snapshot.writeOffRate,
    credit_quality: snapshot.creditQuality,
  };

  // Calcular scores individuais e detectar alertas
  for (const metricKey of Object.keys(metricsData)) {
    const value = metricsData[metricKey];
    const config = METRICS_CONFIG[metricKey];
    
    if (value !== null && value !== undefined && config) {
      const score = normalizeMetric(metricKey, value);
      metricScores[metricKey] = score;

      // Verificar se está em nível crítico
      if (config.weight > 0) { // Apenas métricas com peso
        const isCritical = 
          (['npl_ratio', 'cost_to_income', 'write_off_rate'].includes(metricKey) && value > config.critical) ||
          (!['npl_ratio', 'cost_to_income', 'write_off_rate'].includes(metricKey) && value < config.critical);

        if (isCritical) {
          alerts.push(`${config.label}: ${value}${config.unit} (crítico: ${config.critical}${config.unit})`);
        }
      }
    }
  }

  // Calcular scores por categoria
  const capitalMetrics = ['basel_ratio', 'tier1_ratio', 'cet1_ratio', 'leverage_ratio'];
  const liquidityMetrics = ['lcr', 'nsfr', 'quick_liquidity', 'loan_to_deposit'];
  const profitabilityMetrics = ['roe', 'roa', 'nim', 'cost_to_income'];
  const creditMetrics = ['npl_ratio', 'coverage_ratio', 'write_off_rate', 'credit_quality'];

  const capitalCategory = calculateCategoryScore(capitalMetrics, metricScores, metricsData);
  const liquidityCategory = calculateCategoryScore(liquidityMetrics, metricScores, metricsData);
  const profitabilityCategory = calculateCategoryScore(profitabilityMetrics, metricScores, metricsData);
  const creditCategory = calculateCategoryScore(creditMetrics, metricScores, metricsData);
  const hasSizeData =
    typeof snapshot.totalAssets === "number" && snapshot.totalAssets > 0 ||
    typeof snapshot.equity === "number" && snapshot.equity > 0 ||
    typeof snapshot.totalDeposits === "number" && snapshot.totalDeposits > 0 ||
    typeof snapshot.loanPortfolio === "number" && snapshot.loanPortfolio > 0;
  const sizeScore = hasSizeData ? calculateSizeScore(snapshot) : 50;

  const marketScore = 50;

  const breakdown: ScoreBreakdown = {
    capital: capitalCategory.score,
    liquidity: liquidityCategory.score,
    profitability: profitabilityCategory.score,
    credit: creditCategory.score,
    size: sizeScore,
    market: marketScore,
  };

  const structuralScore = calculateStructuralScore(breakdown, {
    capital: capitalCategory.hasData,
    liquidity: liquidityCategory.hasData,
    profitability: profitabilityCategory.hasData,
    credit: creditCategory.hasData,
    size: hasSizeData,
  });
  const stressAnalysis = calculateStressScore(snapshot, breakdown, context);
  const stressScore = stressAnalysis.stressScore;
  const confidence = calculateConfidence(snapshot, context);

  if (!creditCategory.hasData) {
    stressAnalysis.reasoning.push("Score de credito desconsiderado por ausencia de dados oficiais suficientes");
  }

  // Score final = estrutural (longo prazo) + estresse (curto prazo)
  const totalScore =
    structuralScore * FINAL_SCORE_WEIGHTS.structural +
    stressScore * FINAL_SCORE_WEIGHTS.stress;

  const status = getStatusFromScore(totalScore);

  return {
    totalScore: Math.round(totalScore * 100) / 100,
    structuralScore: Math.round(structuralScore * 100) / 100,
    stressScore: Math.round(stressScore * 100) / 100,
    breakdown,
    confidence,
    reasoning: stressAnalysis.reasoning,
    status,
    alerts,
    metricScores,
  };
}

/**
 * Calcula score de uma categoria
 */
function calculateCategoryScore(
  metricKeys: string[], 
  metricScores: Record<string, number>,
  metricsData: Record<string, number | null | undefined>
): { score: number; hasData: boolean } {
  let totalWeight = 0;
  let weightedSum = 0;

  for (const key of metricKeys) {
    const config = METRICS_CONFIG[key];
    const value = metricsData[key];
    
    if (value !== null && value !== undefined && config && config.weight > 0) {
      const score = metricScores[key] || 0;
      weightedSum += score * config.weight;
      totalWeight += config.weight;
    }
  }

  if (totalWeight === 0) {
    return {
      score: 50,
      hasData: false,
    };
  }
  
  // Normalizar para escala 0-100 da categoria
  return {
    score: weightedSum / totalWeight,
    hasData: true,
  };
}

/**
 * Determina status baseado no score
 */
export function getStatusFromScore(
  score: number
): "healthy" | "warning" | "critical" {
  if (score >= 70) return "healthy";
  if (score >= 50) return "warning";
  return "critical";
}

/**
 * Calcula score simplificado (compatibilidade com versão antiga)
 */
export interface MetricData {
  key: string;
  value: number;
}

export function computeScore(metrics: MetricData[]): {
  totalScore: number;
  breakdown: ScoreBreakdown;
} {
  const metricMap = new Map(metrics.map((m) => [m.key, m.value]));

  const capitalScore = normalizeMetric(
    "basel_ratio",
    metricMap.get("basel_ratio") ?? 0
  );
  const liquidityScore = normalizeMetric(
    "quick_liquidity",
    metricMap.get("quick_liquidity") ?? 0
  );
  const profitabilityScore = normalizeMetric("roe", metricMap.get("roe") ?? 0);
  const creditScore = normalizeMetric("npl_ratio", metricMap.get("npl_ratio") ?? 0);
  const sizeScore = 50;

  const marketScore = 50;

  const breakdown: ScoreBreakdown = {
    capital: capitalScore,
    liquidity: liquidityScore,
    profitability: profitabilityScore,
    credit: creditScore,
    size: sizeScore,
    market: marketScore,
  };

  const totalScore =
    capitalScore * SCORE_WEIGHTS.capital +
    liquidityScore * SCORE_WEIGHTS.liquidity +
    profitabilityScore * SCORE_WEIGHTS.profitability +
    creditScore * SCORE_WEIGHTS.credit +
    sizeScore * SCORE_WEIGHTS.size +
    marketScore * SCORE_WEIGHTS.market;

  return {
    totalScore: Math.round(totalScore * 100) / 100,
    breakdown,
  };
}
