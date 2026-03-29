/**
 * CRON Job - Atualização Automática
 * 
 * Executa varias vezes por dia para checar novas publicacoes do BCB
 * - Verifica se há novos dados BCB
 * - Ingere dados incrementais
 * - Recomputa scores
 * - Detecta mudanças significativas
 * - (Futuro) Dispara alertas
 */

import { NextResponse } from 'next/server';
import { ingestBCBData } from '@/server/bcb-data-service';
import { recomputeAllScores } from '@/server/scoring-service';
import {
  checkForNewData,
  saveUpdateMetadata,
  getLastUpdateMetadata,
  detectSignificantChanges,
} from '@/lib/update-tracker';

export const maxDuration = 300; // 5 minutos timeout
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const startTime = Date.now();
  const strictOnly = process.env.BCB_STRICT_ONLY !== 'false';

  if (!strictOnly) {
    return NextResponse.json(
      {
        success: false,
        action: 'blocked',
        error: 'Modo estrito desativado no ambiente. Cron bloqueado por politica.',
      },
      { status: 503 }
    );
  }
  
  // Validar autenticação do CRON (Vercel envia header específico)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      {
        success: false,
        error: 'Server misconfiguration - CRON_SECRET ausente',
      },
      { status: 500 }
    );
  }
  
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Unauthorized - Invalid CRON secret',
        message: 'Configure CRON_SECRET nas variáveis de ambiente'
      },
      { status: 401 }
    );
  }

  console.log('🔄 [CRON] Iniciando job de atualização automática...');

  try {
    // PASSO 1: Verificar se há novos dados
    console.log('📊 [CRON] Verificando disponibilidade de novos dados...');
    const checkResult = await checkForNewData();
    
    console.log(`ℹ️  [CRON] ${checkResult.message}`);
    
    if (!checkResult.hasNewData) {
      return NextResponse.json({
        success: true,
        action: 'skipped',
        message: checkResult.message,
        localLatestDate: checkResult.localLatestDate,
        executionTimeMs: Date.now() - startTime,
      });
    }

    // PASSO 2: Buscar última atualização para comparação posterior
    const previousUpdate = await getLastUpdateMetadata();
    const previousReferenceDate = previousUpdate?.dataReferenceDate || null;

    // PASSO 3: Ingerir novos dados do BCB
    console.log('📥 [CRON] Ingerindo dados do BCB...');
    const ingestionResult = await ingestBCBData();

    if (!ingestionResult.success) {
      throw new Error(ingestionResult.error || 'Falha na ingestão');
    }

    console.log(`✅ [CRON] ${ingestionResult.banksProcessed} bancos processados`);
    console.log(`📈 [CRON] ${ingestionResult.snapshotsCreated} snapshots criados`);

    // PASSO 4: Recomputar scores
    console.log('🧮 [CRON] Recomputando scores...');
    const scores = await recomputeAllScores();
    console.log(`✅ [CRON] ${scores.length} scores computados`);

    // PASSO 5: Detectar mudanças significativas
    let significantChanges: any[] = [];
    if (previousReferenceDate && ingestionResult.latestReferenceDate) {
      console.log('🔍 [CRON] Detectando mudanças significativas...');
      significantChanges = await detectSignificantChanges(
        previousReferenceDate,
        ingestionResult.latestReferenceDate
      );
      
      if (significantChanges.length > 0) {
        console.log(`⚠️  [CRON] ${significantChanges.length} mudanças significativas detectadas:`);
        significantChanges.forEach((change) => {
          console.log(
            `   - ${change.bankName}: ${change.metric} ${change.changePercent > 0 ? '↑' : '↓'} ${Math.abs(change.changePercent).toFixed(1)}% [${change.severity}]`
          );
        });
      } else {
        console.log('✅ [CRON] Nenhuma mudança significativa detectada');
      }
    }

    // PASSO 6: Salvar metadados da atualização
    const updateMetadata = {
      lastUpdateDate: new Date(),
      dataReferenceDate: ingestionResult.latestReferenceDate || 'unknown',
      banksUpdated: ingestionResult.banksProcessed || 0,
      scoresComputed: scores.length,
      significantChanges,
    };

    await saveUpdateMetadata(updateMetadata);

    const executionTime = Date.now() - startTime;
    console.log(`✅ [CRON] Job concluído em ${executionTime}ms`);

    // PASSO 7: (Futuro) Disparar alertas por email/webhook
    if (significantChanges.length > 0) {
      // TODO: Implementar sistema de alertas
      console.log('📧 [FUTURO] Aqui dispararíamos alertas para usuários...');
    }

    return NextResponse.json({
      success: true,
      action: 'updated',
      message: 'Dados atualizados com sucesso',
      data: {
        previousReferenceDate,
        newReferenceDate: ingestionResult.latestReferenceDate,
        banksProcessed: ingestionResult.banksProcessed,
        snapshotsCreated: ingestionResult.snapshotsCreated,
        scoresComputed: scores.length,
        significantChanges: {
          count: significantChanges.length,
          critical: significantChanges.filter((c) => c.severity === 'critical').length,
          high: significantChanges.filter((c) => c.severity === 'high').length,
          details: significantChanges,
        },
        executionTimeMs: executionTime,
      },
    });
  } catch (error: any) {
    console.error('❌ [CRON] Erro durante execução:', error);

    return NextResponse.json(
      {
        success: false,
        action: 'failed',
        error: error.message,
        executionTimeMs: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

// Permitir POST também (para testes manuais via Postman/curl)
export async function POST(request: Request) {
  return GET(request);
}
