import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Sempre buscar dados frescos do banco — sem cache em nenhuma camada
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Support lookup by either database id or slug
    let bank = await prisma.bank.findFirst({
      where: {
        OR: [
          { id },
          { slug: id },
        ],
      },
      include: {
        scores: {
          orderBy: { date: "desc" },
          take: 10,
        },
        snapshots: {
          orderBy: { date: "desc" },
          take: 10,
        },
        reputation: {
          orderBy: { referenceDate: "desc" },
          take: 1,
        },
      },
    });

    if (!bank) {
      return NextResponse.json({ error: "Bank not found" }, { status: 404 });
    }

    const latestScore = bank.scores[0] ?? null;
    const latestSnapshot = bank.snapshots[0] ?? null;
    const latestReputation = bank.reputation[0] ?? null;

    // Historical snapshots for charts
    const metrics = bank.snapshots.map((s) => ({
      date: s.date.toISOString(),
      basilRatio: s.basilRatio,
      cet1Ratio: s.cet1Ratio,
      tier1Ratio: s.tier1Ratio,
      leverageRatio: s.leverageRatio,
      lcr: s.lcr,
      nsfr: s.nsfr,
      quickLiquidity: s.quickLiquidity,
      loanToDeposit: s.loanToDeposit,
      roe: s.roe,
      roa: s.roa,
      nim: s.nim,
      costToIncome: s.costToIncome,
      nplRatio: s.nplRatio,
      coverageRatio: s.coverageRatio,
      writeOffRate: s.writeOffRate,
      totalAssets: s.totalAssets,
      equity: s.equity,
    }));

    // Historical scores for charts
    const scoreHistory = bank.scores.map((s) => ({
      date: s.date.toISOString(),
      totalScore: s.totalScore,
      capitalScore: s.capitalScore,
      liquidityScore: s.liquidityScore,
      profitabilityScore: s.profitabilityScore,
      creditScore: s.creditScore,
      reputationScore: s.reputationScore,
      status: s.status,
    }));

    return NextResponse.json({
      bank: {
        id: bank.id,
        name: bank.name,
        slug: bank.slug,
        cnpj: bank.cnpj,
        type: bank.type,
        country: bank.country,
        segment: bank.segment,
        createdAt: bank.createdAt,
        updatedAt: bank.updatedAt,
      },
      snapshot: latestSnapshot
        ? {
            date: latestSnapshot.date.toISOString(),
            // Capital
            basilRatio: latestSnapshot.basilRatio,
            cet1Ratio: latestSnapshot.cet1Ratio,
            tier1Ratio: latestSnapshot.tier1Ratio,
            leverageRatio: latestSnapshot.leverageRatio,
            // Liquidity
            lcr: latestSnapshot.lcr,
            nsfr: latestSnapshot.nsfr,
            quickLiquidity: latestSnapshot.quickLiquidity,
            loanToDeposit: latestSnapshot.loanToDeposit,
            // Profitability
            roe: latestSnapshot.roe,
            roa: latestSnapshot.roa,
            nim: latestSnapshot.nim,
            costToIncome: latestSnapshot.costToIncome,
            // Credit quality
            nplRatio: latestSnapshot.nplRatio,
            coverageRatio: latestSnapshot.coverageRatio,
            writeOffRate: latestSnapshot.writeOffRate,
            // Size
            totalAssets: latestSnapshot.totalAssets,
            equity: latestSnapshot.equity,
            totalDeposits: latestSnapshot.totalDeposits,
            loanPortfolio: latestSnapshot.loanPortfolio,
          }
        : null,
      scores: latestScore
        ? {
            totalScore: latestScore.totalScore,
            capitalScore: latestScore.capitalScore,
            liquidityScore: latestScore.liquidityScore,
            profitabilityScore: latestScore.profitabilityScore,
            creditScore: latestScore.creditScore,
            reputationScore: latestScore.reputationScore,
            sentimentScore: latestScore.sentimentScore,
            marketScore: latestScore.marketScore,
            status: latestScore.status,
            date: latestScore.date.toISOString(),
          }
        : null,
      reputation: latestReputation
        ? {
            reputationScore: latestReputation.reputationScore,
            resolvedRate: latestReputation.resolvedRate,
            averageRating: latestReputation.averageRating,
            totalComplaints: latestReputation.totalComplaints,
            responseTime: latestReputation.responseTime,
            sentimentScore: latestReputation.sentimentScore,
          }
        : null,
      metrics,
      scoreHistory,
    });
  } catch (error) {
    console.error("Error fetching bank details:", error);
    return NextResponse.json(
      { error: "Failed to fetch bank details" },
      { status: 500 }
    );
  }
}
