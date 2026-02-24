/**
 * CRON Job: Atualização Automática de Dados de Reputação
 * 
 * GET /api/reputation/cron
 * 
 * Executado automaticamente 2x/dia (10h AM, 10h PM)
 * Configurar no vercel.json
 */

import { NextRequest, NextResponse } from 'next/server';
import { reclameAquiService } from '@/server/reclameaqui-service';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * CRON endpoint - somente GET
 * 
 * Vercel CRON automaticamente chama este endpoint
 */
export async function GET(req: NextRequest) {
  try {
    // Verificar se é request do Vercel CRON
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Em produção, validar CRON secret
    if (process.env.NODE_ENV === 'production') {
      if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
          { error: 'Unauthorized - CRON secret inválido' },
          { status: 401 }
        );
      }
    }

    console.log('\n⏰ [CRON Reputation] Iniciando atualização automática...');
    const startTime = Date.now();

    // Buscar todos os bancos ativos
    const banks = await prisma.bank.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    if (banks.length === 0) {
      console.log('⚠️  [CRON Reputation] Nenhum banco encontrado');
      return NextResponse.json({
        success: true,
        message: 'Nenhum banco para processar',
        timestamp: new Date().toISOString(),
      });
    }

    const results = {
      success: [] as string[],
      failed: [] as string[],
      total: banks.length,
    };

    // Processar cada banco
    for (const bank of banks) {
      try {
        console.log(`📊 [${bank.name}] Coletando dados do Reclame Aqui...`);

        // Coletar dados
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
        console.log(`✅ [${bank.name}] Dados atualizados!`);

        // Rate limiting: 1 segundo entre bancos
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`❌ [${bank.name}] Erro:`, error);
        results.failed.push(bank.name);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n📈 [CRON Reputation] Resumo:');
    console.log(`   ✅ Sucesso: ${results.success.length}`);
    console.log(`   ❌ Falha: ${results.failed.length}`);
    console.log(`   ⏱️  Tempo: ${duration}s`);

    // Após atualizar reputação, recomputar scores
    console.log('\n🔄 [CRON Reputation] Recomputando scores...');
    
    try {
      // Recomputar scores (chama scoring service)
      const scoreResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/score/recompute`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (scoreResponse.ok) {
        console.log('✅ [CRON Reputation] Scores recomputados com sucesso!');
      } else {
        console.warn('⚠️  [CRON Reputation] Erro ao recomputar scores');
      }
    } catch (error) {
      console.error('❌ [CRON Reputation] Erro ao recomputar scores:', error);
    }

    console.log('\n✅ [CRON Reputation] Atualização completa!\n');

    return NextResponse.json({
      success: true,
      message: 'Atualização de reputação concluída',
      results,
      duration: `${duration}s`,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ [CRON Reputation] Erro geral:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
