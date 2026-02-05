export const SCORE_WEIGHTS = {
  capital: 0.35,
  liquidity: 0.25,
  profitability: 0.15,
  credit: 0.0,
} as const;

export const METRIC_RANGES = {
  basel_ratio: { min: 8, max: 20, ideal: 15 },
  roe: { min: 0, max: 30, ideal: 20 },
  quick_liquidity: { min: 80, max: 200, ideal: 150 },
  npl_ratio: { min: 10, max: 0, ideal: 1 },
} as const;

export interface ScoreBreakdown {
  capital: number;
  liquidity: number;
  profitability: number;
  credit: number;
}

export interface MetricData {
  key: string;
  value: number;
}

function normalizeMetric(key: string, value: number): number {
  const range = METRIC_RANGES[key as keyof typeof METRIC_RANGES];
  if (!range) return 50;

  if (range.min < range.max) {
    const normalized = ((value - range.min) / (range.max - range.min)) * 100;
    return Math.max(0, Math.min(100, normalized));
  } else {
    const normalized = ((range.min - value) / (range.min - range.max)) * 100;
    return Math.max(0, Math.min(100, normalized));
  }
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
  const creditScore = 0;

  const breakdown: ScoreBreakdown = {
    capital: capitalScore,
    liquidity: liquidityScore,
    profitability: profitabilityScore,
    credit: creditScore,
  };

  const totalScore =
    capitalScore * SCORE_WEIGHTS.capital +
    liquidityScore * SCORE_WEIGHTS.liquidity +
    profitabilityScore * SCORE_WEIGHTS.profitability +
    creditScore * SCORE_WEIGHTS.credit;

  return {
    totalScore: Math.round(totalScore * 100) / 100,
    breakdown,
  };
}

export function getStatusFromScore(
  score: number
): "healthy" | "warning" | "critical" {
  if (score >= 70) return "healthy";
  if (score >= 50) return "warning";
  return "critical";
}
