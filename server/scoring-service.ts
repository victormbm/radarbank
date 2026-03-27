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

  const marketSignal = await marketStressService.getMarketSignal(
    bank.slug,
    bank.type as "digital" | "traditional"
  );

  const scoringInput = {
    ...snapshot,
    stockChange: marketSignal.stockChange30d,
  };

  const scoreData = computeDetailedScore(scoringInput, {
    bankType: bank.type as "digital" | "traditional",
    previousSnapshot,
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
