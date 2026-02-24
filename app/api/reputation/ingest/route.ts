/**
 * API: Ingestão de Dados de Reputação
 * 
 * POST /api/reputation/ingest
 * 
 * Coleta dados do Reclame Aqui e salva no banco de dados
 * Pode ser executado manualmente ou via CRON job
 */

import { NextRequest, NextResponse } from 'next/server';
import { reclameAquiService } from '@/server/reclameaqui-service';
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
  try {
    const { searchParams } = new URL(req.url);
    const bankId = searchParams.get('bankId');
    const force = searchParams.get('force') === 'true';

    console.log('\n🔄 [Reputation Ingest] Iniciando coleta de dados...');
    const startTime = Date.now();

    // Buscar todos os bancos do sistema
    const banks = await prisma.bank.findMany({
      where: bankId ? { id: bankId } : {},
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    if (banks.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum banco encontrado' },
        { status: 404 }
      );
    }

    const results = {
      success: [] as string[],
      failed: [] as string[],
      skipped: [] as string[],
      total: banks.length,
    };

    // Processar cada banco
    for (const bank of banks) {
      try {
        // Verificar se já existe dado recente (últimas 12 horas)
        if (!force) {
          const recent = await prisma.bankReputation.findFirst({
            where: {
              bankId: bank.id,
              source: 'reclameaqui',
              lastScraped: {
                gte: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12h
              },
            },
          });

          if (recent) {
            console.log(`⏭️  [${bank.name}] Dados recentes encontrados, pulando...`);
            results.skipped.push(bank.name);
            continue;
          }
        }

        console.log(`📊 [${bank.name}] Coletando dados do Reclame Aqui...`);

        // Coletar dados do Reclame Aqui
        const reputationData = await reclameAquiService.fetchBankReputation(
          bank.slug || bank.name.toLowerCase()
        );

        if (!reputationData) {
          console.warn(`⚠️  [${bank.name}] Sem dados disponíveis`);
          results.failed.push(bank.name);
          continue;
        }

        // Salvar no banco de dados
        await reclameAquiService.saveReputationData(bank.id, reputationData);

        results.success.push(bank.name);
        console.log(`✅ [${bank.name}] Dados salvos com sucesso!`);

      } catch (error) {
        console.error(`❌ [${bank.name}] Erro ao processar:`, error);
        results.failed.push(bank.name);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n📈 [Reputation Ingest] Resumo:');
    console.log(`   ✅ Sucesso: ${results.success.length}`);
    console.log(`   ❌ Falha: ${results.failed.length}`);
    console.log(`   ⏭️  Pulados: ${results.skipped.length}`);
    console.log(`   ⏱️  Tempo: ${duration}s\n`);

    return NextResponse.json({
      success: true,
      message: 'Coleta de reputação concluída',
      results,
      duration: `${duration}s`,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ [Reputation Ingest] Erro geral:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
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
