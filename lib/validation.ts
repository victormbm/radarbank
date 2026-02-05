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

export type Bank = z.infer<typeof bankSchema>;
export type Metric = z.infer<typeof metricSchema>;
export type MetricValue = z.infer<typeof metricValueSchema>;
export type BankScore = z.infer<typeof bankScoreSchema>;
