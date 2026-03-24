import { prisma } from "@/lib/db";
import { computeDetailedScore } from "@/lib/scoring-v2";
import { marketStressService } from "@/server/market-stress-service";

export async function computeBankScore(bankId: string, date: Date = new Date()) {
  const bank = await prisma.bank.findUnique({
    where: { id: bankId },
  });

  if (!bank) {
    throw new Error(`Banco não encontrado: ${bankId}`);
  }

  // Buscar snapshot mais recente e o anterior para detectar deterioração
  const snapshots = await prisma.bankSnapshot.findMany({
    where: {
      bankId,
      date: {
        lte: date,
      },
    },
    orderBy: {
      date: "desc",
    },
    take: 2,
  });

  const snapshot = snapshots[0];
  const previousSnapshot = snapshots[1] || null;

  if (!snapshot) {
    throw new Error(`Nenhum snapshot encontrado para banco ${bankId}`);
  }

  // Buscar reputação mais recente até a data do snapshot
  const reputations = await prisma.bankReputation.findMany({
    where: {
      bankId,
      source: "reclameaqui",
      referenceDate: {
        lte: snapshot.date,
      },
    },
    orderBy: {
      referenceDate: "desc",
    },
    take: 2,
  });

  const latestReputation = reputations[0] || null;
  const previousReputation = reputations[1] || null;

  const marketSignal = await marketStressService.getMarketSignal(
    bank.slug,
    bank.type as "digital" | "traditional"
  );

  const scoringInput = {
    ...snapshot,
    reputationScore: latestReputation?.reputationScore ?? null,
    resolvedRate: latestReputation?.resolvedRate ?? null,
    averageRating: latestReputation?.averageRating ?? null,
    sentimentScore: latestReputation?.sentimentScore ?? null,
    totalComplaints: latestReputation?.totalComplaints ?? null,
    stockChange: marketSignal.stockChange30d,
  };

  const scoreData = computeDetailedScore(scoringInput, {
    bankType: bank.type as "digital" | "traditional",
    previousSnapshot,
    previousReputation: previousReputation
      ? {
          reputationScore: previousReputation.reputationScore,
          resolvedRate: previousReputation.resolvedRate,
          totalComplaints: previousReputation.totalComplaints,
          sentimentScore: previousReputation.sentimentScore,
        }
      : null,
    marketContext: {
      stockChange30d: marketSignal.stockChange30d,
      ibovChange30d: marketSignal.ibovChange30d,
      volatility30d: marketSignal.volatility30d,
      isProxy: marketSignal.isProxy,
      source: marketSignal.source,
    },
  });

  // Salva score de forma idempotente para permitir recomputacoes frequentes.
  const score = await prisma.bankScore.upsert({
    where: {
      bankId_date: {
        bankId,
        date: snapshot.date,
      },
    },
    update: {
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
    create: {
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
