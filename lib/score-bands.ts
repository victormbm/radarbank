export type ScoreStatus = 'healthy' | 'watch' | 'risk' | 'critical' | 'unknown';

export interface DynamicScoreBands {
  aMin: number;
  bMin: number;
  cMin: number;
}

export function percentile(sortedAscending: number[], p: number): number {
  if (sortedAscending.length === 0) return 0;
  const index = (sortedAscending.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sortedAscending[lower];
  const weight = index - lower;
  return sortedAscending[lower] * (1 - weight) + sortedAscending[upper] * weight;
}

export function buildDynamicScoreBands(scores: number[]): DynamicScoreBands {
  if (scores.length === 0) {
    return { aMin: 80, bMin: 65, cMin: 50 };
  }

  const sorted = [...scores].sort((a, b) => a - b);
  const cMin = percentile(sorted, 0.25);
  const bMin = percentile(sorted, 0.5);
  const aMin = percentile(sorted, 0.75);

  return {
    aMin: Number(aMin.toFixed(2)),
    bMin: Number(bMin.toFixed(2)),
    cMin: Number(cMin.toFixed(2)),
  };
}

export function scoreStatusFromBands(
  score: number | null | undefined,
  bands: DynamicScoreBands
): ScoreStatus {
  if (typeof score !== 'number') return 'unknown';
  if (score >= bands.aMin) return 'healthy';
  if (score >= bands.bMin) return 'watch';
  if (score >= bands.cMin) return 'risk';
  return 'critical';
}
