export type MetricProvenanceTag =
  | "direct_bcb"
  | "derived_bcb"
  | "non_strict_source"
  | "missing";

export interface MetricProvenance {
  key: string;
  label: string;
  tag: MetricProvenanceTag;
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

type SnapshotLike = {
  basilRatio: number | null;
  tier1Ratio: number | null;
  cet1Ratio: number | null;
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
  totalDeposits: number | null;
  loanPortfolio: number | null;
};

const METRIC_SOURCE_CONFIG: Array<{
  key: keyof SnapshotLike;
  label: string;
  source: "direct_bcb" | "derived_bcb" | "non_strict_source";
}> = [
  { key: "basilRatio", label: "Basileia", source: "direct_bcb" },
  { key: "tier1Ratio", label: "Tier 1", source: "direct_bcb" },
  { key: "cet1Ratio", label: "CET1", source: "direct_bcb" },
  { key: "leverageRatio", label: "Alavancagem", source: "direct_bcb" },
  { key: "totalAssets", label: "Ativo Total", source: "direct_bcb" },
  { key: "equity", label: "Patrimonio Liquido", source: "direct_bcb" },
  { key: "totalDeposits", label: "Depositos Totais", source: "direct_bcb" },
  { key: "loanPortfolio", label: "Carteira de Credito", source: "direct_bcb" },
  { key: "roe", label: "ROE", source: "derived_bcb" },
  { key: "roa", label: "ROA", source: "derived_bcb" },
  { key: "costToIncome", label: "Cost to Income", source: "derived_bcb" },
  { key: "quickLiquidity", label: "Liquidez Imediata", source: "derived_bcb" },
  { key: "lcr", label: "LCR", source: "non_strict_source" },
  { key: "nsfr", label: "NSFR", source: "non_strict_source" },
  { key: "loanToDeposit", label: "Loan to Deposit", source: "non_strict_source" },
  { key: "nplRatio", label: "NPL", source: "non_strict_source" },
  { key: "coverageRatio", label: "Coverage Ratio", source: "non_strict_source" },
  { key: "writeOffRate", label: "Write-off Rate", source: "non_strict_source" },
  { key: "nim", label: "NIM", source: "non_strict_source" },
];

export function buildSnapshotProvenance(snapshot: SnapshotLike): SnapshotProvenance {
  const metrics: MetricProvenance[] = METRIC_SOURCE_CONFIG.map((config) => {
    const value = snapshot[config.key];
    const hasValue = typeof value === "number" && Number.isFinite(value);

    return {
      key: config.key,
      label: config.label,
      value: hasValue ? value : null,
      tag: hasValue ? config.source : "missing",
    };
  });

  const directCount = metrics.filter((m) => m.tag === "direct_bcb").length;
  const derivedCount = metrics.filter((m) => m.tag === "derived_bcb").length;
  const nonStrictCount = metrics.filter((m) => m.tag === "non_strict_source").length;
  const missingCount = metrics.filter((m) => m.tag === "missing").length;
  const totalMetrics = metrics.length;

  const confidencePct = totalMetrics > 0
    ? Math.round(((directCount + derivedCount) / totalMetrics) * 100)
    : 0;

  return {
    metrics,
    summary: {
      totalMetrics,
      directCount,
      derivedCount,
      nonStrictCount,
      missingCount,
      confidencePct,
    },
  };
}
