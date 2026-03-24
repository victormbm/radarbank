import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { applyRateLimit } from "@/lib/rate-limit";
import { getBankVisual } from "@/lib/brazilian-banks";

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

      const score = calculateBCBSafetyScore({
        basilRatio: latestSnapshot?.basilRatio,
        lcr: latestSnapshot?.lcr,
        quickLiquidity: latestSnapshot?.quickLiquidity,
        roe: latestSnapshot?.roe,
        nplRatio: latestSnapshot?.nplRatio,
      });
      const previousScore = calculateBCBSafetyScore({
        basilRatio: previousSnapshot?.basilRatio,
        lcr: previousSnapshot?.lcr,
        quickLiquidity: previousSnapshot?.quickLiquidity,
        roe: previousSnapshot?.roe,
        nplRatio: previousSnapshot?.nplRatio,
      });

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
        type: bank.type,
        country: bank.country,
        segment: bank.segment,
        
        // Score tecnico estrito usando apenas dados do BCB
        status: scoreStatusFromTotal(score),
        score,
        scoreTrend,
        
        // Breakdown permanece indisponivel na listagem estrita
        capitalScore: null,
        liquidityScore: null,
        profitabilityScore: null,
        creditScore: null,
        reputationScore: null,
        sentimentScore: null,
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
  const weightedComponents: Array<{ score: number; weight: number }> = [];

  if (typeof metrics.basilRatio === 'number') {
    const basileiaScore = clamp(((metrics.basilRatio - 11) / (20 - 11)) * 100, 0, 100);
    weightedComponents.push({ score: basileiaScore, weight: 0.35 });
  }

  if (typeof metrics.lcr === 'number') {
    const lcrScore = clamp(((metrics.lcr - 100) / (220 - 100)) * 100, 0, 100);
    weightedComponents.push({ score: lcrScore, weight: 0.25 });
  } else if (typeof metrics.quickLiquidity === 'number') {
    const quickLiquidityScore = clamp(((metrics.quickLiquidity - 20) / (100 - 20)) * 100, 0, 100);
    weightedComponents.push({ score: quickLiquidityScore, weight: 0.25 });
  }

  if (typeof metrics.roe === 'number') {
    const roeScore = clamp((metrics.roe / 25) * 100, 0, 100);
    weightedComponents.push({ score: roeScore, weight: 0.2 });
  }

  if (typeof metrics.nplRatio === 'number') {
    const nplScore = clamp(((8 - metrics.nplRatio) / (8 - 1)) * 100, 0, 100);
    weightedComponents.push({ score: nplScore, weight: 0.2 });
  }

  if (weightedComponents.length < 2) {
    return null;
  }

  const weightedSum = weightedComponents.reduce((acc, current) => acc + current.score * current.weight, 0);
  const totalWeight = weightedComponents.reduce((acc, current) => acc + current.weight, 0);

  if (totalWeight <= 0) {
    return null;
  }

  return Number((weightedSum / totalWeight).toFixed(2));
}

function scoreStatusFromTotal(totalScore: number | null): 'healthy' | 'watch' | 'risk' | 'critical' | 'unknown' {
  if (typeof totalScore !== 'number') {
    return 'unknown';
  }

  if (totalScore >= 80) return 'healthy';
  if (totalScore >= 65) return 'watch';
  if (totalScore >= 50) return 'risk';
  return 'critical';
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
