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
  capitalScore: number;
  liquidityScore: number;
  profitabilityScore: number;
  creditScore: number;
  reputationScore: number | null;
  sentimentScore: number | null;
  marketScore: number | null;
  /** healthy | watch | risk | critical */
  status: string;
  date: string;
}

/** Reputation data from BankReputation record */
export interface BankDetailReputation {
  reputationScore: number | null;
  resolvedRate: number | null;
  averageRating: number | null;
  totalComplaints: number | null;
  responseTime: number | null;
  sentimentScore: number | null;
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
  reputation: BankDetailReputation | null;
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
    reputationScore: number | null;
    status: string;
  }>;
}
