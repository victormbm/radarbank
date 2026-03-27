import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { applyRateLimit } from "@/lib/rate-limit";
import { getBankVisual } from "@/lib/brazilian-banks";
import { computeDetailedScore } from "@/lib/scoring-v2";
import { buildDynamicScoreBands, scoreStatusFromBands } from "@/lib/score-bands";

// Sempre buscar dados frescos do banco — sem cache em nenhuma camada
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const rateLimit = await applyRateLimit({
    request,
    scope: "api:banks:list",
    maxRequests: 120,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  try {
    // Buscar bancos do banco de dados
    const banks = await prisma.bank.findMany({
      orderBy: {
        name: 'asc'
      },
      include: {
        snapshots: {
          orderBy: {
            date: 'desc'
          },
          take: 2 // Último e penúltimo para calcular tendência
        }
      }
    });

    // Calcular médias por segmento
    const segmentStats = calculateSegmentStats(banks);

    // Transformar para o formato esperado pela interface
    const formattedBanks = banks.map(bank => {
      const latestSnapshot = bank.snapshots[0];
      const previousSnapshot = bank.snapshots[1];

      const currentScoreData = latestSnapshot
        ? computeDetailedScore(latestSnapshot, {
            previousSnapshot: previousSnapshot ?? null,
          })
        : null;
      const previousScoreData = previousSnapshot
        ? computeDetailedScore(previousSnapshot)
        : null;

      const score = currentScoreData?.totalScore ?? null;
      const previousScore = previousScoreData?.totalScore ?? null;

      // Calcular tendências
      const scoreTrend = typeof score === 'number' && typeof previousScore === 'number'
        ? score - previousScore
        : null;

      const basileaTrend = latestSnapshot?.basilRatio && previousSnapshot?.basilRatio
        ? latestSnapshot.basilRatio - previousSnapshot.basilRatio
        : null;

      const roeTrend = latestSnapshot?.roe && previousSnapshot?.roe
        ? latestSnapshot.roe - previousSnapshot.roe
        : null;

      const nplTrend = latestSnapshot?.nplRatio && previousSnapshot?.nplRatio
        ? latestSnapshot.nplRatio - previousSnapshot.nplRatio
        : null;

      // Obter médias do segmento
      const segmentAvg = bank.segment ? segmentStats[bank.segment] : null;

      return {
        id: bank.id,
        name: bank.name,
        slug: bank.slug,
        cnpj: bank.cnpj,
        type: normalizeBankType(bank.type, bank.slug, bank.name),
        country: bank.country,
        segment: bank.segment,
        
        // Status definido dinamicamente na amostra BCB atual (aplicado abaixo)
        status: 'unknown',
        score,
        scoreTrend,
        
        // Breakdown do motor central
        capitalScore: currentScoreData?.breakdown.capital ?? null,
        liquidityScore: currentScoreData?.breakdown.liquidity ?? null,
        profitabilityScore: currentScoreData?.breakdown.profitability ?? null,
        creditScore: currentScoreData?.breakdown.credit ?? null,
        marketScore: null,
        
        // Métricas principais
        basilRatio: latestSnapshot?.basilRatio,
        basileaTrend,
        lcr: latestSnapshot?.lcr,
        roe: latestSnapshot?.roe,
        roeTrend,
        roa: latestSnapshot?.roa,
        quickLiquidity: latestSnapshot?.quickLiquidity,
        nplRatio: latestSnapshot?.nplRatio,
        nplTrend,

        // Score técnico de segurança usando apenas dados BCB
        bcbSafetyScore: score,
        bcbDataCoverage: getBCBDataCoverage({
          basilRatio: latestSnapshot?.basilRatio,
          tier1Ratio: latestSnapshot?.tier1Ratio,
          cet1Ratio: latestSnapshot?.cet1Ratio,
          lcr: latestSnapshot?.lcr,
          nsfr: latestSnapshot?.nsfr,
          quickLiquidity: latestSnapshot?.quickLiquidity,
          roe: latestSnapshot?.roe,
          roa: latestSnapshot?.roa,
          costToIncome: latestSnapshot?.costToIncome,
          nplRatio: latestSnapshot?.nplRatio,
          coverageRatio: latestSnapshot?.coverageRatio,
          writeOffRate: latestSnapshot?.writeOffRate,
          totalAssets: latestSnapshot?.totalAssets,
          equity: latestSnapshot?.equity,
          totalDeposits: latestSnapshot?.totalDeposits,
          loanPortfolio: latestSnapshot?.loanPortfolio,
        }),
        bcbReferenceDate: latestSnapshot?.date || null,
        
        // Tamanho
        totalAssets: latestSnapshot?.totalAssets,
        equity: latestSnapshot?.equity,
        
        // Comparação com segmento
        segmentAverage: segmentAvg,
        
        // Timestamps
        createdAt: bank.createdAt,
        updatedAt: bank.updatedAt,
        lastDataUpdate: latestSnapshot?.date || bank.updatedAt
      };
    });

    // Consolidar bancos duplicados (priorizar CNPJ completo)
    const uniqueBanks = consolidateDuplicateBanks(formattedBanks);

    const scoreBands = buildDynamicScoreBands(
      uniqueBanks
        .map((bank) => bank.score)
        .filter((score): score is number => typeof score === 'number')
    );

    const banksWithDynamicStatus = uniqueBanks.map((bank) => ({
      ...bank,
      status: scoreStatusFromBands(bank.score, scoreBands),
    }));

    // Adicionar rankings
    const rankedBanks = addRankings(banksWithDynamicStatus);

    const responseHeaders = new Headers({
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });
    for (const [key, value] of Object.entries(rateLimit.headers)) {
      if (typeof value === "string") {
        responseHeaders.set(key, value);
      }
    }

    return NextResponse.json(rankedBanks, {
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Error fetching banks:", error);
    return NextResponse.json(
      { error: "Failed to fetch banks" },
      { status: 500 }
    );
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Score 0-100 com base somente em indicadores técnicos do BCB.
 */
function calculateBCBSafetyScore(metrics: {
  basilRatio?: number | null;
  tier1Ratio?: number | null;
  cet1Ratio?: number | null;
  lcr?: number | null;
  nsfr?: number | null;
  quickLiquidity?: number | null;
  roe?: number | null;
  roa?: number | null;
  costToIncome?: number | null;
  nplRatio?: number | null;
  coverageRatio?: number | null;
  writeOffRate?: number | null;
}): number | null {
  const weightedComponents: Array<{ score: number; weight: number }> = [];

  const capitalParts: number[] = [];
  if (typeof metrics.basilRatio === 'number') {
    capitalParts.push(clamp(((metrics.basilRatio - 11) / (20 - 11)) * 100, 0, 100));
  }
  if (typeof metrics.tier1Ratio === 'number') {
    capitalParts.push(clamp(((metrics.tier1Ratio - 8.5) / (17 - 8.5)) * 100, 0, 100));
  }
  if (typeof metrics.cet1Ratio === 'number') {
    capitalParts.push(clamp(((metrics.cet1Ratio - 7) / (15 - 7)) * 100, 0, 100));
  }
  if (capitalParts.length > 0) {
    weightedComponents.push({
      score: capitalParts.reduce((acc, current) => acc + current, 0) / capitalParts.length,
      weight: 0.35,
    });
  }

  const liquidityParts: number[] = [];
  if (typeof metrics.lcr === 'number') {
    liquidityParts.push(clamp(((metrics.lcr - 100) / (220 - 100)) * 100, 0, 100));
  }
  if (typeof metrics.quickLiquidity === 'number') {
    liquidityParts.push(clamp(((metrics.quickLiquidity - 20) / (100 - 20)) * 100, 0, 100));
  }
  if (typeof metrics.nsfr === 'number') {
    liquidityParts.push(clamp(((metrics.nsfr - 100) / (150 - 100)) * 100, 0, 100));
  }
  if (liquidityParts.length > 0) {
    weightedComponents.push({
      score: liquidityParts.reduce((acc, current) => acc + current, 0) / liquidityParts.length,
      weight: 0.25,
    });
  }

  const profitabilityParts: number[] = [];
  if (typeof metrics.roe === 'number') {
    profitabilityParts.push(clamp((metrics.roe / 25) * 100, 0, 100));
  }
  if (typeof metrics.roa === 'number') {
    profitabilityParts.push(clamp((metrics.roa / 2.5) * 100, 0, 100));
  }
  if (typeof metrics.costToIncome === 'number') {
    // Brazilian large banks typically range 50-85%; thresholds adjusted to that reality
    profitabilityParts.push(clamp(((85 - metrics.costToIncome) / (85 - 45)) * 100, 0, 100));
  }
  if (profitabilityParts.length > 0) {
    weightedComponents.push({
      score: profitabilityParts.reduce((acc, current) => acc + current, 0) / profitabilityParts.length,
      weight: 0.2,
    });
  }

  const creditParts: number[] = [];
  if (typeof metrics.nplRatio === 'number') {
    creditParts.push(clamp(((8 - metrics.nplRatio) / (8 - 1)) * 100, 0, 100));
  }
  if (typeof metrics.coverageRatio === 'number') {
    creditParts.push(clamp(((metrics.coverageRatio - 80) / (220 - 80)) * 100, 0, 100));
  }
  if (typeof metrics.writeOffRate === 'number') {
    creditParts.push(clamp(((4.5 - metrics.writeOffRate) / (4.5 - 0.5)) * 100, 0, 100));
  }
  if (creditParts.length > 0) {
    weightedComponents.push({
      score: creditParts.reduce((acc, current) => acc + current, 0) / creditParts.length,
      weight: 0.2,
    });
  }

  if (weightedComponents.length === 0) {
    return null;
  }

  const weightedSum = weightedComponents.reduce((acc, current) => acc + current.score * current.weight, 0);
  const totalWeight = weightedComponents.reduce((acc, current) => acc + current.weight, 0);

  if (totalWeight <= 0) {
    return null;
  }

  return Number((weightedSum / totalWeight).toFixed(2));
}

function getBCBDataCoverage(metrics: {
  basilRatio?: number | null;
  tier1Ratio?: number | null;
  cet1Ratio?: number | null;
  lcr?: number | null;
  nsfr?: number | null;
  quickLiquidity?: number | null;
  roe?: number | null;
  roa?: number | null;
  costToIncome?: number | null;
  nplRatio?: number | null;
  coverageRatio?: number | null;
  writeOffRate?: number | null;
  totalAssets?: number | null;
  equity?: number | null;
  totalDeposits?: number | null;
  loanPortfolio?: number | null;
}) {
  const hasCapital = typeof metrics.basilRatio === 'number' || typeof metrics.tier1Ratio === 'number' || typeof metrics.cet1Ratio === 'number';
  const hasLiquidity = typeof metrics.lcr === 'number' || typeof metrics.quickLiquidity === 'number' || typeof metrics.nsfr === 'number';
  const hasProfitability = typeof metrics.roe === 'number' || typeof metrics.roa === 'number' || typeof metrics.costToIncome === 'number';
  const hasCredit = typeof metrics.nplRatio === 'number' || typeof metrics.coverageRatio === 'number' || typeof metrics.writeOffRate === 'number';
  const hasSize = typeof metrics.totalAssets === 'number' || typeof metrics.equity === 'number' || typeof metrics.totalDeposits === 'number' || typeof metrics.loanPortfolio === 'number';
  const usedMetrics = [hasCapital, hasLiquidity, hasProfitability, hasCredit, hasSize].filter(Boolean).length;

  return {
    usedMetrics,
    totalMetrics: 5,
    coveragePct: Number(((usedMetrics / 5) * 100).toFixed(0)),
  };
}

/**
 * Calcula estatísticas por segmento
 */
function calculateSegmentStats(banks: any[]) {
  const segments: Record<string, any> = {};

  banks.forEach(bank => {
    const segment = bank.segment;
    if (!segment || !bank.snapshots[0]) return;

    if (!segments[segment]) {
      segments[segment] = {
        count: 0,
        basileaCount: 0,
        roeCount: 0,
        nplCount: 0,
        totalBasilea: 0,
        totalRoe: 0,
        totalNpl: 0,
      };
    }

    const snapshot = bank.snapshots[0];

    segments[segment].count++;
    if (typeof snapshot.basilRatio === 'number') {
      segments[segment].totalBasilea += snapshot.basilRatio;
      segments[segment].basileaCount++;
    }
    if (typeof snapshot.roe === 'number') {
      segments[segment].totalRoe += snapshot.roe;
      segments[segment].roeCount++;
    }
    if (typeof snapshot.nplRatio === 'number') {
      segments[segment].totalNpl += snapshot.nplRatio;
      segments[segment].nplCount++;
    }
  });

  // Calcular médias
  Object.keys(segments).forEach(segment => {
    const stats = segments[segment];
    segments[segment] = {
      avgBasilea: stats.basileaCount > 0 ? stats.totalBasilea / stats.basileaCount : null,
      avgRoe: stats.roeCount > 0 ? stats.totalRoe / stats.roeCount : null,
      avgNpl: stats.nplCount > 0 ? stats.totalNpl / stats.nplCount : null,
      avgScore: null,
    };
  });

  return segments;
}

/**
 * Consolida bancos duplicados, priorizando registros com CNPJ completo
 */
function consolidateDuplicateBanks(banks: any[]) {
  const uniqueMap = new Map<string, any>();

  banks.forEach(bank => {
    // Tentar deduplicar primeiro por identidade visual/canonica do banco.
    const visual = getBankVisual({ slug: bank.slug, name: bank.name });
    if (visual?.slug) {
      const key = `visual:${visual.slug}`;
      const existing = uniqueMap.get(key);
      if (!existing || getDataCompleteness(bank) > getDataCompleteness(existing)) {
        uniqueMap.set(key, bank);
      }
      return;
    }

    // Fallback por base de CNPJ (8 primeiros dígitos)
    const baseCnpj = bank.cnpj?.substring(0, 8);
    const key = baseCnpj ? `cnpj:${baseCnpj}` : `slug:${normalizeKey(bank.slug || bank.name || bank.id)}`;

    const existing = uniqueMap.get(key);
    if (!existing || getDataCompleteness(bank) > getDataCompleteness(existing)) {
      uniqueMap.set(key, bank);
    }
  });

  return Array.from(uniqueMap.values());
}

function getDataCompleteness(bank: any) {
  const score = [
    bank.basilRatio,
    bank.lcr,
    bank.quickLiquidity,
    bank.roe,
    bank.nplRatio,
    bank.totalAssets,
    bank.equity,
  ].filter((value) => typeof value === 'number').length;

  const hasFullCnpj = typeof bank.cnpj === 'string' && bank.cnpj.length === 14 ? 1 : 0;
  return score + hasFullCnpj;
}

function normalizeKey(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function normalizeBankType(type: string | null | undefined, slug: string, name: string): 'digital' | 'traditional' {
  if (type === 'digital' || type === 'traditional') {
    return type;
  }

  const visual = getBankVisual({ slug, name });
  if (visual?.type === 'digital' || visual?.type === 'traditional') {
    return visual.type;
  }

  const normalized = `${slug} ${name} ${type ?? ''}`.toLowerCase();
  const digitalHints = ['nubank', 'neon', 'inter', 'c6', 'next', 'original', 'pagbank', 'nu pagamentos'];
  return digitalHints.some((hint) => normalized.includes(hint)) ? 'digital' : 'traditional';
}

/**
 * Adiciona rankings aos bancos
 */
function addRankings(banks: any[]) {
  // Ranking global por score BCB
  const sortedByBCBScore = [...banks]
    .filter(b => b.bcbSafetyScore !== null && b.bcbSafetyScore !== undefined)
    .sort((a, b) => (b.bcbSafetyScore || 0) - (a.bcbSafetyScore || 0));

  // Ranking por segmento
  const segmentGroups: Record<string, any[]> = {};
  banks.forEach(bank => {
    const seg = bank.segment || 'outro';
    if (!segmentGroups[seg]) segmentGroups[seg] = [];
    segmentGroups[seg].push(bank);
  });

  const sortedSegments: Record<string, any[]> = {};
  const segmentAvgScores: Record<string, number | null> = {};
  Object.entries(segmentGroups).forEach(([seg, segBanks]) => {
    const withScore = segBanks.filter(b => typeof b.bcbSafetyScore === 'number');
    sortedSegments[seg] = [...withScore].sort((a, b) => (b.bcbSafetyScore || 0) - (a.bcbSafetyScore || 0));
    segmentAvgScores[seg] = withScore.length > 0
      ? Number((withScore.reduce((sum, b) => sum + b.bcbSafetyScore, 0) / withScore.length).toFixed(2))
      : null;
  });

  return banks.map(bank => {
    const globalRankIdx = sortedByBCBScore.findIndex(b => b.id === bank.id);
    const seg = bank.segment || 'outro';
    const segBanks = sortedSegments[seg] || [];
    const segRankIdx = segBanks.findIndex(b => b.id === bank.id);

    return {
      ...bank,
      ranking: globalRankIdx >= 0 ? globalRankIdx + 1 : null,
      totalBanks: sortedByBCBScore.length,
      segmentRank: segRankIdx >= 0 ? segRankIdx + 1 : null,
      segmentTotal: segBanks.length,
      segmentAverage: {
        ...(bank.segmentAverage || {}),
        avgScore: segmentAvgScores[seg] ?? null,
      },
      rankingSource: 'bcb',
    };
  });
}
