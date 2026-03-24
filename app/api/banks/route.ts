import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { applyRateLimit } from "@/lib/rate-limit";

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
        scores: {
          orderBy: {
            date: 'desc'
          },
          take: 2 // Último e penúltimo para calcular tendência
        },
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
      const latestScore = bank.scores[0] ?? null;
      const previousScore = bank.scores[1] ?? null;
      const latestSnapshot = bank.snapshots[0];
      const previousSnapshot = bank.snapshots[1];

      // Calcular tendências
      const scoreTrend = latestScore && previousScore 
        ? latestScore.totalScore - previousScore.totalScore 
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
        type: bank.type,
        country: bank.country,
        segment: bank.segment,
        
        // Score
        status: latestScore?.status ?? 'unknown',
        score: latestScore?.totalScore ?? null,
        scoreTrend,
        
        // Breakdown do score
        capitalScore: latestScore?.capitalScore ?? null,
        liquidityScore: latestScore?.liquidityScore ?? null,
        profitabilityScore: latestScore?.profitabilityScore ?? null,
        creditScore: latestScore?.creditScore ?? null,
        reputationScore: latestScore?.reputationScore ?? null,
        sentimentScore: latestScore?.sentimentScore ?? null,
        marketScore: latestScore?.marketScore ?? null,
        
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
        bcbSafetyScore: calculateBCBSafetyScore({
          basilRatio: latestSnapshot?.basilRatio,
          lcr: latestSnapshot?.lcr,
          quickLiquidity: latestSnapshot?.quickLiquidity,
          roe: latestSnapshot?.roe,
          nplRatio: latestSnapshot?.nplRatio,
        }),
        bcbDataCoverage: getBCBDataCoverage({
          basilRatio: latestSnapshot?.basilRatio,
          lcr: latestSnapshot?.lcr,
          quickLiquidity: latestSnapshot?.quickLiquidity,
          roe: latestSnapshot?.roe,
          nplRatio: latestSnapshot?.nplRatio,
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

    // Adicionar rankings
    const rankedBanks = addRankings(uniqueBanks);

    const responseHeaders = new Headers({
      "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
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
  lcr?: number | null;
  quickLiquidity?: number | null;
  roe?: number | null;
  nplRatio?: number | null;
}): number | null {
  const components: number[] = [];

  if (typeof metrics.basilRatio === 'number') {
    const basileiaScore = clamp(((metrics.basilRatio - 11) / (20 - 11)) * 100, 0, 100);
    components.push(basileiaScore * 0.35);
  }

  if (typeof metrics.lcr === 'number') {
    const lcrScore = clamp(((metrics.lcr - 100) / (220 - 100)) * 100, 0, 100);
    components.push(lcrScore * 0.25);
  } else if (typeof metrics.quickLiquidity === 'number') {
    const quickLiquidityScore = clamp(((metrics.quickLiquidity - 20) / (100 - 20)) * 100, 0, 100);
    components.push(quickLiquidityScore * 0.25);
  }

  if (typeof metrics.roe === 'number') {
    const roeScore = clamp((metrics.roe / 25) * 100, 0, 100);
    components.push(roeScore * 0.2);
  }

  if (typeof metrics.nplRatio === 'number') {
    const nplScore = clamp(((8 - metrics.nplRatio) / (8 - 1)) * 100, 0, 100);
    components.push(nplScore * 0.2);
  }

  if (components.length < 2) {
    return null;
  }

  return Number(components.reduce((acc, current) => acc + current, 0).toFixed(2));
}

function getBCBDataCoverage(metrics: {
  basilRatio?: number | null;
  lcr?: number | null;
  quickLiquidity?: number | null;
  roe?: number | null;
  nplRatio?: number | null;
}) {
  const hasLiquidity = typeof metrics.lcr === 'number' || typeof metrics.quickLiquidity === 'number';
  const usedMetrics = [
    typeof metrics.basilRatio === 'number',
    hasLiquidity,
    typeof metrics.roe === 'number',
    typeof metrics.nplRatio === 'number',
  ].filter(Boolean).length;

  return {
    usedMetrics,
    totalMetrics: 4,
    coveragePct: Number(((usedMetrics / 4) * 100).toFixed(0)),
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
        totalBasilea: 0,
        totalRoe: 0,
        totalNpl: 0,
        totalScore: 0,
      };
    }

    const snapshot = bank.snapshots[0];
    const score = bank.scores[0];

    segments[segment].count++;
    if (snapshot.basilRatio) segments[segment].totalBasilea += snapshot.basilRatio;
    if (snapshot.roe) segments[segment].totalRoe += snapshot.roe;
    if (snapshot.nplRatio) segments[segment].totalNpl += snapshot.nplRatio;
    if (score) segments[segment].totalScore += score.totalScore;
  });

  // Calcular médias
  Object.keys(segments).forEach(segment => {
    const stats = segments[segment];
    segments[segment] = {
      avgBasilea: stats.totalBasilea / stats.count,
      avgRoe: stats.totalRoe / stats.count,
      avgNpl: stats.totalNpl / stats.count,
      avgScore: stats.totalScore / stats.count,
    };
  });

  return segments;
}

/**
 * Consolida bancos duplicados, priorizando registros com CNPJ completo
 */
function consolidateDuplicateBanks(banks: any[]) {
  const cnpjMap = new Map<string, any>();

  banks.forEach(bank => {
    // Normalizar CNPJ (pegar apenas os 8 primeiros dígitos - base CNPJ)
    const baseCnpj = bank.cnpj?.substring(0, 8);
    
    if (!baseCnpj) return;

    const existing = cnpjMap.get(baseCnpj);

    // Se não existe ou o atual tem CNPJ mais completo (14 dígitos), usar este
    if (!existing || (bank.cnpj?.length === 14 && existing.cnpj?.length !== 14)) {
      cnpjMap.set(baseCnpj, bank);
    }
  });

  return Array.from(cnpjMap.values());
}

/**
 * Adiciona rankings aos bancos
 */
function addRankings(banks: any[]) {
  // Ordenar por score de segurança BCB (decrescente)
  const sortedByBCBScore = [...banks]
    .filter(b => b.bcbSafetyScore !== null && b.bcbSafetyScore !== undefined)
    .sort((a, b) => (b.bcbSafetyScore || 0) - (a.bcbSafetyScore || 0));

  // Adicionar ranking
  return banks.map(bank => {
    const rankingByBCB = sortedByBCBScore.findIndex(b => b.id === bank.id) + 1;
    const ranking = rankingByBCB || null;
    const totalBanks = sortedByBCBScore.length;
    
    return {
      ...bank,
      ranking,
      totalBanks,
      rankingSource: 'bcb',
    };
  });
}
