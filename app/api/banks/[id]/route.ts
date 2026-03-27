import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { applyRateLimit } from "@/lib/rate-limit";
import { bankDetailResponseSchema, bankRouteParamsSchema } from "@/lib/validation";
import { computeDetailedScore } from "@/lib/scoring-v2";
import { buildDynamicScoreBands, scoreStatusFromBands, type DynamicScoreBands } from "@/lib/score-bands";
import { buildSnapshotProvenance } from "@/lib/data-provenance";

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
      },
    });

    if (!bank) {
      return NextResponse.json({ error: "Bank not found" }, { status: 404 });
    }

    const latestSnapshot = bank.snapshots[0] ?? null;
    const previousSnapshot = bank.snapshots[1] ?? null;

    // Calibração dinâmica usando a amostra atual de scores BCB (mesma base da listagem)
    const allLatest = await prisma.bank.findMany({
      include: {
        snapshots: {
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
    });

    const scoreBands = buildDynamicScoreBands(
      allLatest
        .map((b) => b.snapshots[0])
        .filter((s): s is NonNullable<typeof s> => !!s)
        .map((s) => computeDetailedScore(s).totalScore)
    );

    const scores = latestSnapshot
      ? computeScoreFromSnapshot(latestSnapshot, previousSnapshot, scoreBands)
      : null;

    // Segment context: rank and avg score among peers in same segment
    const SEGMENT_LABELS: Record<string, string> = {
      S1: 'Grandes Bancos (S1)',
      S2: 'Bancos Médios (S2)',
      S3: 'Bancos Digitais e Pequenos (S3)',
      S4: 'Bancos Pequenos (S4)',
      S5: 'Micro Bancos (S5)',
    };

    let segmentContext = null;
    if (bank.segment) {
      const peers = await prisma.bank.findMany({
        where: { segment: bank.segment },
        include: { snapshots: { orderBy: { date: 'desc' }, take: 1 } },
      });

      const peerScores = peers.map(p => ({
        id: p.id,
        score: p.snapshots[0]
          ? computeScoreFromSnapshot(p.snapshots[0], null, scoreBands)?.totalScore ?? null
          : null,
      }));

      const withScore = peerScores.filter((p): p is { id: string; score: number } => typeof p.score === 'number');
      const sorted = [...withScore].sort((a, b) => b.score - a.score);
      const rankIdx = sorted.findIndex(p => p.id === bank.id);
      const avgScore = withScore.length > 0
        ? Number((withScore.reduce((sum, p) => sum + p.score, 0) / withScore.length).toFixed(2))
        : null;
      const thisScore = scores?.totalScore ?? null;

      segmentContext = {
        segment: bank.segment,
        segmentLabel: SEGMENT_LABELS[bank.segment] ?? bank.segment,
        rank: rankIdx >= 0 ? rankIdx + 1 : null,
        total: sorted.length,
        avgScore,
        aboveAverage: typeof thisScore === 'number' && typeof avgScore === 'number'
          ? thisScore > avgScore
          : null,
      };
    }

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
      metrics,
      scoreHistory,
      segmentContext,
      provenance: latestSnapshot ? buildSnapshotProvenance(latestSnapshot) : null,
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

function computeScoreFromSnapshot(
  snapshot: {
    date: Date;
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
    creditQuality: number | null;
    totalAssets: number | null;
    equity: number | null;
    totalDeposits: number | null;
    loanPortfolio: number | null;
  },
  previousSnapshot: {
    basilRatio: number | null;
    nplRatio: number | null;
    roe: number | null;
  } | null,
  scoreBands: DynamicScoreBands
) {
  const detailed = computeDetailedScore(snapshot, {
    previousSnapshot,
  });

  return {
    totalScore: detailed.totalScore,
    capitalScore: detailed.breakdown.capital,
    liquidityScore: detailed.breakdown.liquidity,
    profitabilityScore: detailed.breakdown.profitability,
    creditScore: detailed.breakdown.credit,
    sizeScore: detailed.breakdown.size,
    marketScore: null,
    status: scoreStatusFromBands(detailed.totalScore, scoreBands),
    date: snapshot.date.toISOString(),
  };
}
