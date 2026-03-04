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
  
  // Dados de Reputação (Reclame Aqui)
  reputationScore?: number | null;      // 0-10
  resolvedRate?: number | null;         // 0-100%
  averageRating?: number | null;        // 0-5
  sentimentScore?: number | null;       // -1 a +1
  totalComplaints?: number | null;
  
  // Dados de Mercado
  stockPrice?: number | null;
  stockChange?: number | null;          // %
  marketCap?: number | null;
}

/**
 * Pesos do Score Estrutural
 *
 * 65% Dados Técnicos BCB (4 categorias)
 * 25% Experiência do cliente (Reputação + Sentiment)
 * 10% Mercado (queda/força relativa + volatilidade)
 */
export const SCORE_WEIGHTS = {
  // Dados Técnicos BCB (65% total)
  capital: 0.2275,
  liquidity: 0.1625,
  profitability: 0.13,
  credit: 0.13,
  
  // Experiência + Mercado (35% total)
  reputation: 0.20,
  sentiment: 0.05,
  market: 0.10,
} as const;

/**
 * Peso da composição final do score
 *
 * - Estrutural: saúde de fundamentos (mais estável)
 * - Estresse: sinais de curto prazo (mercado + deterioração)
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
  reputation: number;
  sentiment: number;
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
  previousReputation?: {
    reputationScore?: number | null;
    resolvedRate?: number | null;
    totalComplaints?: number | null;
    sentimentScore?: number | null;
  } | null;
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
 * Calcula score de reputação (Reclame Aqui)
 * 
 * Considera:
 * - Reputation Score (0-10) - peso 40%
 * - Resolved Rate (0-100%) - peso 30%
 * - Average Rating (0-5) - peso 20%
 * - Volume de reclamações (penalidade) - peso 10%
 */
function calculateReputationScore(snapshot: BankSnapshotData): number {
  if (!snapshot.reputationScore && !snapshot.resolvedRate && !snapshot.averageRating) {
    return 50; // Score neutro se não há dados
  }

  let score = 0;
  let weights = 0;

  // Reputation Score (0-10 → 0-100)
  if (snapshot.reputationScore !== null && snapshot.reputationScore !== undefined) {
    score += (snapshot.reputationScore / 10) * 100 * 0.40;
    weights += 0.40;
  }

  // Resolved Rate (0-100% → 0-100)
  if (snapshot.resolvedRate !== null && snapshot.resolvedRate !== undefined) {
    score += snapshot.resolvedRate * 0.30;
    weights += 0.30;
  }

  // Average Rating (0-5 → 0-100)
  if (snapshot.averageRating !== null && snapshot.averageRating !== undefined) {
    score += (snapshot.averageRating / 5) * 100 * 0.20;
    weights += 0.20;
  }

  // Volume de reclamações (penalidade)
  if (snapshot.totalComplaints !== null && snapshot.totalComplaints !== undefined) {
    // Normalizar: até 10k = 100, acima de 100k = 0
    const complaintsScore = Math.max(0, 100 - (snapshot.totalComplaints / 1000));
    score += complaintsScore * 0.10;
    weights += 0.10;
  }

  return weights > 0 ? score / weights : 50;
}

/**
 * Calcula score de sentiment
 * 
 * Converte sentiment score (-1 a +1) para escala 0-100
 */
function calculateSentimentScore(snapshot: BankSnapshotData): number {
  if (snapshot.sentimentScore === null || snapshot.sentimentScore === undefined) {
    return 50; // Neutro
  }

  // -1 = 0, 0 = 50, +1 = 100
  return ((snapshot.sentimentScore + 1) / 2) * 100;
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

function calculateStructuralScore(breakdown: ScoreBreakdown): number {
  return (
    breakdown.capital * SCORE_WEIGHTS.capital +
    breakdown.liquidity * SCORE_WEIGHTS.liquidity +
    breakdown.profitability * SCORE_WEIGHTS.profitability +
    breakdown.credit * SCORE_WEIGHTS.credit +
    breakdown.reputation * SCORE_WEIGHTS.reputation +
    breakdown.sentiment * SCORE_WEIGHTS.sentiment +
    breakdown.market * SCORE_WEIGHTS.market
  );
}

function calculateStressScore(
  snapshot: BankSnapshotData,
  breakdown: ScoreBreakdown,
  context: ScoringContext
): { stressScore: number; reasoning: string[] } {
  const reasoning: string[] = [];
  const previous = context.previousSnapshot;

  // 1) Pressão de mercado (quanto menor, pior)
  const marketSignal = 100 - breakdown.market;
  const marketResilience = 100 - marketSignal;

  // 2) Deterioração de fundamentos vs período anterior
  let fundamentalsResilience = 55;
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

  // 3) Deterioração de reputação
  const prevRep = context.previousReputation;
  let reputationResilience = 55;
  if (prevRep) {
    let penalty = 0;

    if (
      prevRep.reputationScore !== null && prevRep.reputationScore !== undefined &&
      snapshot.reputationScore !== null && snapshot.reputationScore !== undefined
    ) {
      const repDelta = snapshot.reputationScore - prevRep.reputationScore;
      if (repDelta < 0) penalty += Math.min(30, Math.abs(repDelta) * 12);
    }

    if (
      prevRep.resolvedRate !== null && prevRep.resolvedRate !== undefined &&
      snapshot.resolvedRate !== null && snapshot.resolvedRate !== undefined
    ) {
      const resolvedDelta = snapshot.resolvedRate - prevRep.resolvedRate;
      if (resolvedDelta < 0) penalty += Math.min(25, Math.abs(resolvedDelta) * 1.2);
    }

    if (
      prevRep.totalComplaints !== null && prevRep.totalComplaints !== undefined &&
      snapshot.totalComplaints !== null && snapshot.totalComplaints !== undefined &&
      prevRep.totalComplaints > 0
    ) {
      const complaintsDeltaPct = ((snapshot.totalComplaints - prevRep.totalComplaints) / prevRep.totalComplaints) * 100;
      if (complaintsDeltaPct > 0) penalty += Math.min(25, complaintsDeltaPct * 0.6);
    }

    reputationResilience = Math.max(0, 100 - penalty);
  }

  if (marketResilience < 45) reasoning.push("Mercado pressionado no curto prazo");
  if (fundamentalsResilience < 50) reasoning.push("Deterioração recente de fundamentos");
  if (reputationResilience < 50) reasoning.push("Deterioração recente de reputação");

  const stressScore =
    marketResilience * 0.45 +
    fundamentalsResilience * 0.35 +
    reputationResilience * 0.20;

  return {
    stressScore,
    reasoning,
  };
}

function calculateConfidence(snapshot: BankSnapshotData, context: ScoringContext): number {
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

  const reputationFields = [
    snapshot.reputationScore,
    snapshot.resolvedRate,
    snapshot.averageRating,
    snapshot.sentimentScore,
  ];

  const technicalCoverage = technicalFields.filter(v => v !== null && v !== undefined).length / technicalFields.length;
  const reputationCoverage = reputationFields.filter(v => v !== null && v !== undefined).length / reputationFields.length;
  const marketCoverage = context.marketContext &&
    (
      context.marketContext.stockChange30d !== null && context.marketContext.stockChange30d !== undefined ||
      context.marketContext.volatility30d !== null && context.marketContext.volatility30d !== undefined ||
      snapshot.marketCap !== null && snapshot.marketCap !== undefined
    ) ? 1 : 0;

  let confidence =
    technicalCoverage * 0.65 +
    reputationCoverage * 0.25 +
    marketCoverage * 0.10;

  if (context.marketContext?.isProxy) {
    confidence = Math.max(0, confidence - 0.03);
  }

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

  const capitalScore = calculateCategoryScore(capitalMetrics, metricScores, metricsData);
  const liquidityScore = calculateCategoryScore(liquidityMetrics, metricScores, metricsData);
  const profitabilityScore = calculateCategoryScore(profitabilityMetrics, metricScores, metricsData);
  const creditScore = calculateCategoryScore(creditMetrics, metricScores, metricsData);

  // Calcular novos scores
  const reputationScore = calculateReputationScore(snapshot);
  const sentimentScore = calculateSentimentScore(snapshot);
  const marketScore = calculateMarketScore(snapshot, context.marketContext);

  // Adicionar alertas de reputação
  if (snapshot.reputationScore !== null && snapshot.reputationScore !== undefined) {
    if (snapshot.reputationScore < 6.0) {
      alerts.push(`Reputação baixa: ${snapshot.reputationScore.toFixed(1)}/10 no Reclame Aqui`);
    }
  }
  if (snapshot.resolvedRate !== null && snapshot.resolvedRate !== undefined) {
    if (snapshot.resolvedRate < 70) {
      alerts.push(`Taxa de resolução baixa: ${snapshot.resolvedRate.toFixed(1)}%`);
    }
  }

  const breakdown: ScoreBreakdown = {
    capital: capitalScore,
    liquidity: liquidityScore,
    profitability: profitabilityScore,
    credit: creditScore,
    reputation: reputationScore,
    sentiment: sentimentScore,
    market: marketScore,
  };

  const structuralScore = calculateStructuralScore(breakdown);
  const stressAnalysis = calculateStressScore(snapshot, breakdown, context);
  const stressScore = stressAnalysis.stressScore;
  const confidence = calculateConfidence(snapshot, context);

  // Score final = estrutural (longo prazo) + estresse (curto prazo)
  const totalScore =
    structuralScore * FINAL_SCORE_WEIGHTS.structural +
    stressScore * FINAL_SCORE_WEIGHTS.stress;

  const status = getStatusFromScore(totalScore);

  if (context.marketContext?.isProxy) {
    alerts.push("Mercado calculado por proxy (banco sem ticker líquido)");
  }

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
): number {
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

  if (totalWeight === 0) return 0;
  
  // Normalizar para escala 0-100 da categoria
  return (weightedSum / totalWeight);
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

  // Scores neutros para novos componentes (50 = neutro)
  const reputationScore = 50;
  const sentimentScore = 50;
  const marketScore = 50;

  const breakdown: ScoreBreakdown = {
    capital: capitalScore,
    liquidity: liquidityScore,
    profitability: profitabilityScore,
    credit: creditScore,
    reputation: reputationScore,
    sentiment: sentimentScore,
    market: marketScore,
  };

  const totalScore =
    capitalScore * SCORE_WEIGHTS.capital +
    liquidityScore * SCORE_WEIGHTS.liquidity +
    profitabilityScore * SCORE_WEIGHTS.profitability +
    creditScore * SCORE_WEIGHTS.credit +
    reputationScore * SCORE_WEIGHTS.reputation +
    sentimentScore * SCORE_WEIGHTS.sentiment +
    marketScore * SCORE_WEIGHTS.market;

  return {
    totalScore: Math.round(totalScore * 100) / 100,
    breakdown,
  };
}
