import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Buscar banco com scores e snapshots
    const bank = await prisma.bank.findUnique({
      where: { id },
      include: {
        scores: {
          orderBy: { date: 'desc' },
          take: 10, // Últimos 10 trimestres
        },
        snapshots: {
          orderBy: { date: 'desc' },
          take: 10, // Últimos 10 trimestres
        },
      },
    });

    if (!bank) {
      return NextResponse.json({ error: "Bank not found" }, { status: 404 });
    }

    const latestScore = bank.scores[0];
    const latestSnapshot = bank.snapshots[0];

    // Formatar métricas históricas para gráficos
    const metrics = bank.snapshots.map(snapshot => ({
      date: snapshot.date.toISOString(),
      basilRatio: snapshot.basilRatio,
      roe: snapshot.roe,
      roa: snapshot.roa,
      nplRatio: snapshot.nplRatio,
      quickLiquidity: snapshot.quickLiquidity,
      totalAssets: snapshot.totalAssets,
      equity: snapshot.equity,
    }));

    // Formatar histórico de scores
    const scoreHistory = bank.scores.map(score => ({
      date: score.date.toISOString(),
      totalScore: score.totalScore,
      capitalScore: score.capitalScore,
      liquidityScore: score.liquidityScore,
      profitabilityScore: score.profitabilityScore,
      creditScore: score.creditScore,
      status: score.status,
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
      score: latestScore ? Math.round(latestScore.totalScore) : null,
      breakdown: latestScore ? {
        capital: latestScore.capitalScore,
        liquidity: latestScore.liquidityScore,
        profitability: latestScore.profitabilityScore,
        credit: latestScore.creditScore,
      } : null,
      status: latestScore?.status || 'unknown',
      snapshot: latestSnapshot,
      metrics,
      scoreHistory,
      lastScoreDate: latestScore?.date,
    });
  } catch (error) {
    console.error("Error fetching bank details:", error);
    return NextResponse.json(
      { error: "Failed to fetch bank details" },
      { status: 500 }
    );
  }
}
