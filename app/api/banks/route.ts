import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Sempre buscar dados frescos do banco — sem cache em nenhuma camada
export const dynamic = 'force-dynamic';

export async function GET() {
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
      const latestScore = bank.scores[0];
      const previousScore = bank.scores[1];
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
        status: latestScore?.status || 'unknown',
        score: latestScore ? Math.round(latestScore.totalScore) : null,
        scoreTrend,
        
        // Breakdown do score
        capitalScore: latestScore?.capitalScore,
        liquidityScore: latestScore?.liquidityScore,
        profitabilityScore: latestScore?.profitabilityScore,
        creditScore: latestScore?.creditScore,
        reputationScore: latestScore?.reputationScore,
        sentimentScore: latestScore?.sentimentScore,
        marketScore: latestScore?.marketScore,
        
        // Métricas principais
        basilRatio: latestSnapshot?.basilRatio,
        basileaTrend,
        roe: latestSnapshot?.roe,
        roeTrend,
        roa: latestSnapshot?.roa,
        quickLiquidity: latestSnapshot?.quickLiquidity,
        nplRatio: latestSnapshot?.nplRatio,
        nplTrend,
        
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

    return NextResponse.json(rankedBanks);
  } catch (error) {
    console.error("Error fetching banks:", error);
    return NextResponse.json(
      { error: "Failed to fetch banks" },
      { status: 500 }
    );
  }
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
  // Ordenar por score (decrescente)
  const sortedByScore = [...banks]
    .filter(b => b.score !== null)
    .sort((a, b) => (b.score || 0) - (a.score || 0));

  // Adicionar ranking
  return banks.map(bank => {
    const rankingByScore = sortedByScore.findIndex(b => b.id === bank.id) + 1;
    
    return {
      ...bank,
      ranking: rankingByScore || null,
      totalBanks: sortedByScore.length,
    };
  });
}
