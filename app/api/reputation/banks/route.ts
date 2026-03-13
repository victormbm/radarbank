/**
 * API para análise combinada de solidez financeira + reclamações
 *
 * Fonte de dados: Banco Central do Brasil (BCB) — dados públicos, uso legal (LAI)
 * https://dadosabertos.bcb.gov.br/dataset/reclamacoes-recebidas-pelo-banco-central
 *
 * Endpoints:
 * GET /api/reputation/banks          - Lista todos os bancos com dados combinados
 * GET /api/reputation/banks?action=ranking      - Ranking por score combinado
 * GET /api/reputation/banks?bankId=<id>         - Detalhes de um banco
 * GET /api/reputation/banks?action=compare      - Comparação de bancos
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Calcular score combinado (60% saúde financeira BCB + 40% reclamações BCB)
function calculateCombinedScore(
  basiliaScore: number | null,
  reputationScore: number | null
): number {
  if (!basiliaScore && !reputationScore) return 0;

  const bcbWeight = basiliaScore ? (basiliaScore / 20) * 60 : 0; // Basileia até 20%
  const complaintsWeight = reputationScore ? (reputationScore / 10) * 40 : 0; // Índice reclamações 0-10

  return Math.round((bcbWeight + complaintsWeight) * 10) / 10;
}

/**
 * GET /api/reputation/banks
 * Lista todos os bancos com dados combinados
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action') || 'list';
  const bankId = searchParams.get('bankId');
  const compareIds = searchParams.getAll('compare');

  try {
    if (action === 'ranking') {
      return handleRanking();
    } else if (action === 'compare' && compareIds.length > 0) {
      return handleComparison(compareIds);
    } else if (bankId) {
      return handleBankDetail(bankId);
    } else {
      return handleBanksList();
    }
  } catch (error) {
    console.error('Erro na API de reputação:', error);
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}

/**
 * Lista todos os bancos com reputação
 */
async function handleBanksList() {
  const banks = await prisma.bank.findMany({
    include: {
      snapshots: {
        orderBy: { date: 'desc' },
        take: 1,
      },
      reputation: {
        where: { source: 'bcb' },
        orderBy: { referenceDate: 'desc' },
        take: 1,
      },
    },
  });

  const enrichedBanks = banks.map(bank => {
    const latestSnapshot = bank.snapshots[0];
    const latestReputation = bank.reputation[0];

    return {
      id: bank.id,
      name: bank.name,
      slug: bank.slug,
      type: bank.type,

      // Dados Financeiros (BCB - IFData)
      financialMetrics: latestSnapshot ? {
        basilRatio: latestSnapshot.basilRatio,
        roe: latestSnapshot.roe,
        nplRatio: latestSnapshot.nplRatio,
        totalAssets: latestSnapshot.totalAssets,
        quickLiquidity: latestSnapshot.quickLiquidity,
        date: latestSnapshot.date,
      } : null,

      // Dados de Reclamações (BCB — Ranking Oficial de Reclamações)
      reputation: latestReputation ? {
        reputationScore: latestReputation.reputationScore,
        resolvedRate: latestReputation.resolvedRate,
        averageRating: latestReputation.averageRating,
        totalComplaints: latestReputation.totalComplaints,
        responseTime: latestReputation.responseTime,
        sentimentScore: latestReputation.sentimentScore,
        topComplaints: [
          latestReputation.topComplaint1,
          latestReputation.topComplaint2,
          latestReputation.topComplaint3,
        ].filter(Boolean),
        lastUpdate: latestReputation.referenceDate,
      } : null,

      // Score Combinado
      combinedScore: calculateCombinedScore(
        latestSnapshot?.basilRatio,
        latestReputation?.reputationScore
      ),

      // Análise Qualitativa
      analysis: generateAnalysis(latestSnapshot, latestReputation),
    };
  });

  return NextResponse.json({
    success: true,
    total: enrichedBanks.length,
    date: new Date().toISOString(),
    banks: enrichedBanks,
  });
}

/**
 * Detalhes completos de um banco
 */
async function handleBankDetail(bankId: string) {
  const bank = await prisma.bank.findUnique({
    where: { id: bankId },
    include: {
      snapshots: {
        orderBy: { date: 'desc' },
        take: 7, // Últimos 7 dias
      },
      reputation: {
        where: { source: 'bcb' },
        orderBy: { referenceDate: 'desc' },
        take: 7, // Últimas 7 coletas
      },
    },
  });

  if (!bank) {
    return NextResponse.json(
      { error: 'Banco não encontrado' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    bank: {
      id: bank.id,
      name: bank.name,
      slug: bank.slug,
      type: bank.type,
      segment: bank.segment,
      
      // Histórico financeiro
      financialHistory: bank.snapshots.map(s => ({
        date: s.date,
        basilRatio: s.basilRatio,
        roe: s.roe,
        nplRatio: s.nplRatio,
        totalAssets: s.totalAssets,
        quickLiquidity: s.quickLiquidity,
        costToIncome: s.costToIncome,
      })),

      // Histórico de reputação
      reputationHistory: bank.reputation.map(r => ({
        date: r.referenceDate,
        reputationScore: r.reputationScore,
        resolvedRate: r.resolvedRate,
        averageRating: r.averageRating,
        totalComplaints: r.totalComplaints,
        responseTime: r.responseTime,
        sentimentScore: r.sentimentScore,
      })),

      // Estatísticas
      stats: {
        avgReputationScore: (
          bank.reputation.reduce((sum, r) => sum + (r.reputationScore || 0), 0) /
          (bank.reputation.length || 1)
        ).toFixed(2),
        
        avgBailiaRatio: (
          bank.snapshots.reduce((sum, s) => sum + (s.basilRatio || 0), 0) /
          (bank.snapshots.length || 1)
        ).toFixed(2),

        avgROE: (
          bank.snapshots.reduce((sum, s) => sum + (s.roe || 0), 0) /
          (bank.snapshots.length || 1)
        ).toFixed(2),

        trendReputationUp: bank.reputation.length > 1 &&
          (bank.reputation[0]?.reputationScore || 0) >
          (bank.reputation[bank.reputation.length - 1]?.reputationScore || 0),
      },
    },
  });
}

/**
 * Ranking de bancos por score combinado
 */
async function handleRanking() {
  const banks = await prisma.bank.findMany({
    include: {
      snapshots: {
        orderBy: { date: 'desc' },
        take: 1,
      },
      reputation: {
        where: { source: 'bcb' },
        orderBy: { referenceDate: 'desc' },
        take: 1,
      },
    },
  });

  const ranking = banks
    .map(bank => {
      const latestSnapshot = bank.snapshots[0];
      const latestReputation = bank.reputation[0];

      return {
        name: bank.name,
        slug: bank.slug,
        basilRatio: latestSnapshot?.basilRatio || 0,
        reputationScore: latestReputation?.reputationScore || 0,
        combinedScore: calculateCombinedScore(
          latestSnapshot?.basilRatio,
          latestReputation?.reputationScore
        ),
      };
    })
    .sort((a, b) => b.combinedScore - a.combinedScore)
    .map((bank, index) => ({ rank: index + 1, ...bank }));

  return NextResponse.json({
    success: true,
    date: new Date().toISOString(),
    ranking,
  });
}

/**
 * Comparação entre bancos
 */
async function handleComparison(bankIds: string[]) {
  const banks = await prisma.bank.findMany({
    where: { id: { in: bankIds } },
    include: {
      snapshots: {
        orderBy: { date: 'desc' },
        take: 1,
      },
      reputation: {
        where: { source: 'bcb' },
        orderBy: { referenceDate: 'desc' },
        take: 1,
      },
    },
  });

  const comparison = banks.map(bank => {
    const latestSnapshot = bank.snapshots[0];
    const latestReputation = bank.reputation[0];

    return {
      name: bank.name,
      slug: bank.slug,
      
      // Financeiro
      basilRatio: latestSnapshot?.basilRatio,
      roe: latestSnapshot?.roe,
      nplRatio: latestSnapshot?.nplRatio,
      
      // Reputação
      reputationScore: latestReputation?.reputationScore,
      resolvedRate: latestReputation?.resolvedRate,
      averageRating: latestReputation?.averageRating,
      
      // Score Combinado
      combinedScore: calculateCombinedScore(
        latestSnapshot?.basilRatio,
        latestReputation?.reputationScore
      ),
    };
  });

  return NextResponse.json({
    success: true,
    comparison,
  });
}

/**
 * Gerar análise qualitativa
 */
function generateAnalysis(snapshot: any, reputation: any): string {
  const points: string[] = [];

  if (snapshot) {
    if (snapshot.basilRatio && snapshot.basilRatio >= 18) {
      points.push('✅ Forte capitalização (Basileia >= 18%)');
    } else if (snapshot.basilRatio && snapshot.basilRatio < 11) {
      points.push('⚠️ Capitalização baixa (Basileia < 11%)');
    }

    if (snapshot.nplRatio && snapshot.nplRatio > 5) {
      points.push('⚠️ Taxa de inadimplência elevada (>5%)');
    }
  }

  if (reputation) {
    if (reputation.reputationScore >= 8) {
      points.push('✅ Excelente reputação (Score >= 8)');
    } else if (reputation.reputationScore < 6.5) {
      points.push('⚠️ Reputação baixa (Score < 6.5)');
    }

    if (reputation.resolvedRate >= 80) {
      points.push('✅ Ótimo atendimento ao cliente (Resolução >= 80%)');
    } else if (reputation.resolvedRate < 70) {
      points.push('⚠️ Atendimento deficiente (Resolução < 70%)');
    }
  }

  return points.length > 0
    ? points.join(' | ')
    : 'Dados insuficientes para análise';
}
