/**
 * API: Ingestão de Dados de Reputação
 * 
 * POST /api/reputation/ingest
 * 
 * Rota desativada no modo API-only (zero scraping)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Vercel Functions: 60s timeout

/**
 * POST /api/reputation/ingest
 * 
 * Query params:
 * - bankId: ID específico do banco (opcional)
 * - force: ignorar cache e forçar coleta (opcional)
 */
export async function POST(req: NextRequest) {
  const _ = req;
  return NextResponse.json(
    {
      success: false,
      mode: 'api-only',
      message: 'Endpoint desativado: politica zero-scraping habilitada.',
      details: 'A aplicacao usa apenas APIs oficiais/publicas configuradas.',
      timestamp: new Date().toISOString(),
    },
    { status: 410 }
  );
}

/**
 * GET /api/reputation/ingest
 * 
 * Status da última coleta
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bankId = searchParams.get('bankId');

    // Buscar última coleta
    const lastRun = await prisma.bankReputation.findFirst({
      where: bankId ? { bankId } : {},
      orderBy: { lastScraped: 'desc' },
      select: {
        lastScraped: true,
        referenceDate: true,
        bank: {
          select: {
            name: true,
          },
        },
      },
    });

    // Contar total de reputações por fonte
    const stats = await prisma.bankReputation.groupBy({
      by: ['source'],
      _count: true,
    });

    // Contar bancos com dados recentes (últimas 24h)
    const recentCount = await prisma.bankReputation.count({
      where: {
        lastScraped: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    const totalBanks = await prisma.bank.count();

    return NextResponse.json({
      mode: 'api-only',
      scrapingEnabled: false,
      lastRun: lastRun ? {
        timestamp: lastRun.lastScraped,
        referenceDate: lastRun.referenceDate,
        bank: lastRun.bank.name,
      } : null,
      stats: {
        total: stats.reduce((acc, s) => acc + s._count, 0),
        bySource: stats.map(s => ({
          source: s.source,
          count: s._count,
        })),
        recentUpdates: recentCount,
        totalBanks,
        coverage: totalBanks > 0 ? (recentCount / totalBanks * 100).toFixed(1) + '%' : '0%',
      },
    });

  } catch (error) {
    console.error('[Reputation Ingest] Erro ao buscar status:', error);
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
