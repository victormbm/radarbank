import { prisma } from "@/lib/db";
import { computeScore, type MetricData } from "@/lib/scoring";

export async function computeBankScore(bankId: string, date: Date = new Date()) {
  const latestMetrics = await prisma.metricValue.findMany({
    where: {
      bankId,
      date: {
        lte: date,
      },
    },
    include: {
      metric: true,
    },
    orderBy: {
      date: "desc",
    },
  });

  const metricsByKey = new Map<string, MetricData>();
  
  for (const mv of latestMetrics) {
    if (!metricsByKey.has(mv.metric.key)) {
      metricsByKey.set(mv.metric.key, {
        key: mv.metric.key,
        value: mv.value,
      });
    }
  }

  const metricsArray = Array.from(metricsByKey.values());
  const { totalScore, breakdown } = computeScore(metricsArray);

  const score = await prisma.bankScore.create({
    data: {
      bankId,
      date,
      totalScore,
      breakdownJson: JSON.stringify(breakdown),
    },
  });

  return score;
}

export async function recomputeAllScores(date: Date = new Date()) {
  const banks = await prisma.bank.findMany();
  const scores = [];

  for (const bank of banks) {
    const score = await computeBankScore(bank.id, date);
    scores.push(score);
  }

  return scores;
}

export async function getLatestScore(bankId: string) {
  const score = await prisma.bankScore.findFirst({
    where: { bankId },
    orderBy: { date: "desc" },
  });

  return score;
}
