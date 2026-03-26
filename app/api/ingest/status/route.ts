/**
 * Status de Atualização - Endpoint de Monitoramento
 * 
 * Retorna informações sobre última atualização e próxima atualização esperada
 * Útil para dashboards e monitoramento
 */

import { NextResponse } from 'next/server';
import { getLastUpdateMetadata, checkForNewData } from '@/lib/update-tracker';
import {
  DATA_POLICY,
  evaluateDataStatus,
  getUpdateRoutineSummary,
} from '@/lib/data-freshness-policy';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const lastUpdate = await getLastUpdateMetadata();
    const checkResult = await checkForNewData();

    if (!lastUpdate) {
      return NextResponse.json({
        success: true,
        status: 'no_data',
        message: 'Nenhuma atualização encontrada. Execute primeira ingestão.',
        hasNewDataAvailable: checkResult.hasNewData,
        routines: getUpdateRoutineSummary(),
        metadata: {
          source: DATA_POLICY.source,
          publicationModel: DATA_POLICY.publicationModel,
          checkFrequency: `A cada ${DATA_POLICY.checkIntervalHours} horas`,
          auditFrequency: `A cada ${DATA_POLICY.auditIntervalHours} horas`,
          apiCache: `${DATA_POLICY.apiCacheMinutes} minutos`,
          uiRefresh: `${DATA_POLICY.uiRefreshMinutes} minutos`,
        },
      });
    }

    // Calcular próxima data esperada de atualização BCB
    const refDate = new Date(lastUpdate.dataReferenceDate);
    const today = new Date();
    
    // BCB publica trimestralmente
    const quarter = Math.floor(refDate.getMonth() / 3) + 1;
    const year = refDate.getFullYear();
    
    // Próximo trimestre
    let nextQuarter = quarter + 1;
    let nextYear = year;
    if (nextQuarter > 4) {
      nextQuarter = 1;
      nextYear += 1;
    }
    
    // Data aproximada de publicação (15 dias após fim do trimestre + 30 dias de processamento BCB)
    const quarterEndMonth = nextQuarter * 3 - 1;
    const expectedPublishDate = new Date(nextYear, quarterEndMonth + 1, 15);
    
    const daysSinceUpdate = Math.floor(
      (today.getTime() - lastUpdate.lastUpdateDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const daysUntilNextExpected = Math.floor(
      (expectedPublishDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Status baseado no ciclo trimestral oficial do IFData.
    const dataStatus = evaluateDataStatus(daysSinceUpdate);

    return NextResponse.json({
      success: true,
      status: dataStatus,
      lastUpdate: {
        date: lastUpdate.lastUpdateDate,
        dataReferenceDate: lastUpdate.dataReferenceDate,
        referenceQuarter: `Q${quarter} ${year}`,
        banksUpdated: lastUpdate.banksUpdated,
        scoresComputed: lastUpdate.scoresComputed,
        daysSinceUpdate,
      },
      nextExpectedUpdate: {
        estimatedDate: expectedPublishDate,
        quarter: `Q${nextQuarter} ${nextYear}`,
        daysUntilExpected: daysUntilNextExpected,
        isOverdue: daysUntilNextExpected < 0,
      },
      hasNewDataAvailable: checkResult.hasNewData,
      message: checkResult.message,
      routines: getUpdateRoutineSummary(),
      metadata: {
        source: DATA_POLICY.source,
        publicationModel: DATA_POLICY.publicationModel,
        checkFrequency: `A cada ${DATA_POLICY.checkIntervalHours} horas`,
        auditFrequency: `A cada ${DATA_POLICY.auditIntervalHours} horas`,
        apiCache: `${DATA_POLICY.apiCacheMinutes} minutos`,
        uiRefresh: `${DATA_POLICY.uiRefreshMinutes} minutos`,
      },
    });
  } catch (error: any) {
    console.error('Erro ao buscar status:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
