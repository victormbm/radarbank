/** Snapshot data from the latest BankSnapshot record */
export interface BankDetailSnapshot {
  date: string;
  // Capital
  basilRatio: number | null;
  cet1Ratio: number | null;
  tier1Ratio: number | null;
  leverageRatio: number | null;
  // Liquidity
  lcr: number | null;
  nsfr: number | null;
  quickLiquidity: number | null;
  loanToDeposit: number | null;
  // Profitability
  roe: number | null;
  roa: number | null;
  nim: number | null;
  costToIncome: number | null;
  // Credit quality
  nplRatio: number | null;
  coverageRatio: number | null;
  writeOffRate: number | null;
  // Size
  totalAssets: number | null;
  equity: number | null;
  totalDeposits: number | null;
  loanPortfolio: number | null;
}

/** Computed scores from the latest BankScore record */
export interface BankDetailScores {
  totalScore: number;
  capitalScore: number | null;
  liquidityScore: number | null;
  profitabilityScore: number | null;
  creditScore: number | null;
  sizeScore: number | null;
  marketScore: number | null;
  /** healthy | watch | risk | critical */
  status: string;
  date: string;
}

export interface MetricProvenance {
  key: string;
  label: string;
  tag: "direct_bcb" | "derived_bcb" | "non_strict_source" | "missing";
  value: number | null;
}

export interface SnapshotProvenance {
  metrics: MetricProvenance[];
  summary: {
    totalMetrics: number;
    directCount: number;
    derivedCount: number;
    nonStrictCount: number;
    missingCount: number;
    confidencePct: number;
  };
}

/** Full response from GET /api/banks/[slug] */
export interface BankDetail {
  bank: {
    id: string;
    name: string;
    slug: string;
    cnpj: string | null;
    type: string;
    country: string;
    segment: string | null;
  };
  snapshot: BankDetailSnapshot | null;
  scores: BankDetailScores | null;
  segmentContext?: {
    segment: string;
    segmentLabel: string;
    rank: number | null;
    total: number;
    avgScore: number | null;
    aboveAverage: boolean | null;
  } | null;
  metrics: Array<{
    date: string;
    basilRatio: number | null;
    cet1Ratio: number | null;
    tier1Ratio: number | null;
    leverageRatio: number | null;
    lcr: number | null;
    nsfr: number | null;
    quickLiquidity: number | null;
    loanToDeposit: number | null;
    roe: number | null;
    roa: number | null;
    nim: number | null;
    costToIncome: number | null;
    nplRatio: number | null;
    coverageRatio: number | null;
    writeOffRate: number | null;
    totalAssets: number | null;
    equity: number | null;
  }>;
  scoreHistory: Array<{
    date: string;
    totalScore: number;
    capitalScore: number;
    liquidityScore: number;
    profitabilityScore: number;
    creditScore: number;
    status: string;
  }>;
  provenance?: SnapshotProvenance | null;
}
