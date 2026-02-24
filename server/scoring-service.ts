import { prisma } from "@/lib/db";
import { computeDetailedScore } from "@/lib/scoring-v2";

export async function computeBankScore(bankId: string, date: Date = new Date()) {
  // Buscar o snapshot mais recente da data especificada
  const snapshot = await prisma.bankSnapshot.findFirst({
    where: {
      bankId,
      date: {
        lte: date,
      },
    },
    orderBy: {
      date: "desc",
    },
  });

  if (!snapshot) {
    throw new Error(`Nenhum snapshot encontrado para banco ${bankId}`);
  }

  // Computar score usando scoring-v2
  const scoreData = computeDetailedScore(snapshot);

  // Criar score no banco
  const score = await prisma.bankScore.create({
    data: {
      bankId,
      date: snapshot.date,
      totalScore: scoreData.totalScore,
      status: scoreData.status,
      capitalScore: scoreData.breakdown.capital,
      liquidityScore: scoreData.breakdown.liquidity,
      profitabilityScore: scoreData.breakdown.profitability,
      creditScore: scoreData.breakdown.credit,
      reputationScore: scoreData.breakdown.reputation,
      sentimentScore: scoreData.breakdown.sentiment,
      marketScore: scoreData.breakdown.market,
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
