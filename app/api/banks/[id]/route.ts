import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { applyRateLimit } from "@/lib/rate-limit";
import { bankDetailResponseSchema, bankRouteParamsSchema } from "@/lib/validation";

// Sempre buscar dados frescos do banco — sem cache em nenhuma camada
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimit = await applyRateLimit({
    request,
    scope: "api:banks:detail",
    maxRequests: 300,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  const rateLimitHeaders = new Headers(rateLimit.headers as Record<string, string>);

  try {
    const rawParams = await params;
    const paramsResult = bankRouteParamsSchema.safeParse(rawParams);
    if (!paramsResult.success) {
      return NextResponse.json(
        { error: "Invalid bank id" },
        { status: 400, headers: rateLimitHeaders }
      );
    }

    const { id } = paramsResult.data;

    // Support lookup by either database id or slug
    const bank = await prisma.bank.findFirst({
      where: {
        OR: [
          { id },
          { slug: id },
        ],
      },
      include: {
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

    const latestSnapshot = bank.snapshots[0] ?? null;
    const latestReputation = bank.reputation[0] ?? null;
    const scores = latestSnapshot
      ? computeFallbackScores(latestSnapshot.date, latestSnapshot)
      : null;

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
    const scoreHistory: Array<{
      date: string;
      totalScore: number;
      capitalScore: number;
      liquidityScore: number;
      profitabilityScore: number;
      creditScore: number;
      reputationScore: number | null;
      status: string;
    }> = [];

    const payload = {
      bank: {
        id: bank.id,
        name: bank.name,
        slug: bank.slug,
        cnpj: bank.cnpj,
        type: bank.type,
        country: bank.country,
        segment: bank.segment,
        createdAt: bank.createdAt.toISOString(),
        updatedAt: bank.updatedAt.toISOString(),
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
      scores,
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
    };

    const payloadResult = bankDetailResponseSchema.safeParse(payload);
    if (!payloadResult.success) {
      console.error("Invalid bank detail payload:", payloadResult.error.flatten());
      return NextResponse.json(
        { error: "Invalid bank detail payload" },
        {
          status: 500,
          headers: rateLimitHeaders,
        }
      );
    }

    const responseHeaders = new Headers(rateLimitHeaders);
    responseHeaders.set("Cache-Control", "no-store, no-cache, must-revalidate");
    responseHeaders.set("Pragma", "no-cache");
    responseHeaders.set("Expires", "0");

    return NextResponse.json(payloadResult.data, {
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Error fetching bank details:", error);
    return NextResponse.json(
      { error: "Failed to fetch bank details" },
      { status: 500 }
    );
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function avg(values: Array<number | null | undefined>): number | null {
  const valid = values.filter((v): v is number => typeof v === "number");
  if (valid.length === 0) return null;
  return valid.reduce((acc, value) => acc + value, 0) / valid.length;
}

function scoreStatusFromTotal(total: number) {
  if (total >= 80) return "healthy";
  if (total >= 65) return "watch";
  if (total >= 50) return "risk";
  return "critical";
}

function computeFallbackScores(
  referenceDate: Date,
  snapshot: {
    basilRatio: number | null;
    tier1Ratio: number | null;
    cet1Ratio: number | null;
    lcr: number | null;
    quickLiquidity: number | null;
    nsfr: number | null;
    roe: number | null;
    roa: number | null;
    costToIncome: number | null;
    nplRatio: number | null;
    coverageRatio: number | null;
    writeOffRate: number | null;
  }
) {
  const basilComponent =
    typeof snapshot.basilRatio === "number"
      ? clamp(((snapshot.basilRatio - 11) / (20 - 11)) * 100, 0, 100)
      : null;
  const tier1Component =
    typeof snapshot.tier1Ratio === "number"
      ? clamp(((snapshot.tier1Ratio - 8.5) / (17 - 8.5)) * 100, 0, 100)
      : null;
  const cet1Component =
    typeof snapshot.cet1Ratio === "number"
      ? clamp(((snapshot.cet1Ratio - 7) / (15 - 7)) * 100, 0, 100)
      : null;
  const capitalScore = avg([basilComponent, tier1Component, cet1Component]);

  const lcrComponent =
    typeof snapshot.lcr === "number"
      ? clamp(((snapshot.lcr - 100) / (220 - 100)) * 100, 0, 100)
      : null;
  const quickLiquidityComponent =
    typeof snapshot.quickLiquidity === "number"
      ? clamp(((snapshot.quickLiquidity - 20) / (100 - 20)) * 100, 0, 100)
      : null;
  const nsfrComponent =
    typeof snapshot.nsfr === "number"
      ? clamp(((snapshot.nsfr - 100) / (150 - 100)) * 100, 0, 100)
      : null;
  const liquidityScore = avg([lcrComponent, quickLiquidityComponent, nsfrComponent]);

  const roeComponent =
    typeof snapshot.roe === "number" ? clamp((snapshot.roe / 25) * 100, 0, 100) : null;
  const roaComponent =
    typeof snapshot.roa === "number" ? clamp((snapshot.roa / 2.5) * 100, 0, 100) : null;
  // Mesmos limiares usados em banks/route.ts (faixa 45-85, realidade dos bancos brasileiros)
  const ctiComponent =
    typeof snapshot.costToIncome === "number"
      ? clamp(((85 - snapshot.costToIncome) / (85 - 45)) * 100, 0, 100)
      : null;
  const profitabilityScore = avg([roeComponent, roaComponent, ctiComponent]);

  const nplComponent =
    typeof snapshot.nplRatio === "number"
      ? clamp(((8 - snapshot.nplRatio) / (8 - 1)) * 100, 0, 100)
      : null;
  const coverageComponent =
    typeof snapshot.coverageRatio === "number"
      ? clamp(((snapshot.coverageRatio - 80) / (220 - 80)) * 100, 0, 100)
      : null;
  const writeOffComponent =
    typeof snapshot.writeOffRate === "number"
      ? clamp(((4.5 - snapshot.writeOffRate) / (4.5 - 0.5)) * 100, 0, 100)
      : null;
  const creditScore = avg([nplComponent, coverageComponent, writeOffComponent]);

  const weighted: Array<{ score: number | null; weight: number }> = [
    { score: capitalScore, weight: 35 },
    { score: liquidityScore, weight: 25 },
    { score: profitabilityScore, weight: 20 },
    { score: creditScore, weight: 20 },
  ];

  let weightSum = 0;
  let weightedSum = 0;
  for (const item of weighted) {
    if (typeof item.score === "number") {
      weightSum += item.weight;
      weightedSum += item.score * item.weight;
    }
  }

  const totalScore = weightSum > 0 ? weightedSum / weightSum : null;
  if (totalScore === null) {
    return null;
  }

  return {
    totalScore: Number(totalScore.toFixed(2)),
    capitalScore: capitalScore !== null ? Number(capitalScore.toFixed(2)) : null,
    liquidityScore: liquidityScore !== null ? Number(liquidityScore.toFixed(2)) : null,
    profitabilityScore: profitabilityScore !== null ? Number(profitabilityScore.toFixed(2)) : null,
    creditScore: creditScore !== null ? Number(creditScore.toFixed(2)) : null,
    reputationScore: null,
    sentimentScore: null,
    marketScore: null,
    status: scoreStatusFromTotal(totalScore),
    date: referenceDate.toISOString(),
  };
}
