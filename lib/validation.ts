import { z } from "zod";

export const bankSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  type: z.enum(["digital", "traditional"]),
  country: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const metricSchema = z.object({
  id: z.string(),
  key: z.string(),
  label: z.string(),
  unit: z.string(),
});

export const metricValueSchema = z.object({
  id: z.string(),
  bankId: z.string(),
  metricId: z.string(),
  date: z.date(),
  value: z.number(),
});

export const bankScoreSchema = z.object({
  id: z.string(),
  bankId: z.string(),
  date: z.date(),
  totalScore: z.number(),
  breakdownJson: z.string(),
});

const finiteNumber = z.number().refine(Number.isFinite, {
  message: "Expected a finite number",
});

const nullableFiniteNumber = finiteNumber.nullable();

export const bankRouteParamsSchema = z.object({
  id: z.string().trim().min(1).max(120),
});

export const bankDetailSnapshotApiSchema = z.object({
  date: z.string().datetime(),
  basilRatio: nullableFiniteNumber,
  cet1Ratio: nullableFiniteNumber,
  tier1Ratio: nullableFiniteNumber,
  leverageRatio: nullableFiniteNumber,
  lcr: nullableFiniteNumber,
  nsfr: nullableFiniteNumber,
  quickLiquidity: nullableFiniteNumber,
  loanToDeposit: nullableFiniteNumber,
  roe: nullableFiniteNumber,
  roa: nullableFiniteNumber,
  nim: nullableFiniteNumber,
  costToIncome: nullableFiniteNumber,
  nplRatio: nullableFiniteNumber,
  coverageRatio: nullableFiniteNumber,
  writeOffRate: nullableFiniteNumber,
  totalAssets: nullableFiniteNumber,
  equity: nullableFiniteNumber,
  totalDeposits: nullableFiniteNumber,
  loanPortfolio: nullableFiniteNumber,
});

export const bankDetailScoresApiSchema = z.object({
  totalScore: finiteNumber,
  capitalScore: nullableFiniteNumber,
  liquidityScore: nullableFiniteNumber,
  profitabilityScore: nullableFiniteNumber,
  creditScore: nullableFiniteNumber,
  reputationScore: nullableFiniteNumber,
  sentimentScore: nullableFiniteNumber,
  marketScore: nullableFiniteNumber,
  status: z.string(),
  date: z.string().datetime(),
});

export const bankDetailReputationApiSchema = z.object({
  reputationScore: nullableFiniteNumber,
  resolvedRate: nullableFiniteNumber,
  averageRating: nullableFiniteNumber,
  totalComplaints: z.number().int().nonnegative().nullable(),
  responseTime: nullableFiniteNumber,
  sentimentScore: nullableFiniteNumber,
});

export const bankDetailMetricPointApiSchema = z.object({
  date: z.string().datetime(),
  basilRatio: nullableFiniteNumber,
  cet1Ratio: nullableFiniteNumber,
  tier1Ratio: nullableFiniteNumber,
  leverageRatio: nullableFiniteNumber,
  lcr: nullableFiniteNumber,
  nsfr: nullableFiniteNumber,
  quickLiquidity: nullableFiniteNumber,
  loanToDeposit: nullableFiniteNumber,
  roe: nullableFiniteNumber,
  roa: nullableFiniteNumber,
  nim: nullableFiniteNumber,
  costToIncome: nullableFiniteNumber,
  nplRatio: nullableFiniteNumber,
  coverageRatio: nullableFiniteNumber,
  writeOffRate: nullableFiniteNumber,
  totalAssets: nullableFiniteNumber,
  equity: nullableFiniteNumber,
});

export const bankDetailScoreHistoryPointApiSchema = z.object({
  date: z.string().datetime(),
  totalScore: finiteNumber,
  capitalScore: finiteNumber,
  liquidityScore: finiteNumber,
  profitabilityScore: finiteNumber,
  creditScore: finiteNumber,
  reputationScore: nullableFiniteNumber,
  status: z.string(),
});

export const bankDetailResponseSchema = z.object({
  bank: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    cnpj: z.string().nullable(),
    type: z.string(),
    country: z.string(),
    segment: z.string().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),
  snapshot: bankDetailSnapshotApiSchema.nullable(),
  scores: bankDetailScoresApiSchema.nullable(),
  reputation: bankDetailReputationApiSchema.nullable(),
  metrics: z.array(bankDetailMetricPointApiSchema),
  scoreHistory: z.array(bankDetailScoreHistoryPointApiSchema),
});

export type Bank = z.infer<typeof bankSchema>;
export type Metric = z.infer<typeof metricSchema>;
export type MetricValue = z.infer<typeof metricValueSchema>;
export type BankScore = z.infer<typeof bankScoreSchema>;
export type BankRouteParams = z.infer<typeof bankRouteParamsSchema>;
export type BankDetailApiResponse = z.infer<typeof bankDetailResponseSchema>;
