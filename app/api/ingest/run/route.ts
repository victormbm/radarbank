import { NextResponse } from "next/server";
import { dataIngestionService } from "@/server/data-ingestion-service";

/**
 * POST /api/ingest/run
 * 
 * Executa a ingestão manual de dados do Banco Central
 * 
 * Body (opcional):
 * {
 *   "referenceDate": "2026-01-31" // Data de referência dos dados
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { referenceDate } = body;

    console.log('[API] Iniciando ingestão de dados...');
    
    // Executar ingestão
    const result = await dataIngestionService.runFullIngestion(referenceDate);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Ingestão concluída com sucesso',
        data: {
          banksProcessed: result.banksProcessed,
          metricsCollected: result.metricsCollected,
          duration: `${result.duration}ms`,
        },
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Ingestão concluída com erros',
        data: {
          banksProcessed: result.banksProcessed,
          metricsCollected: result.metricsCollected,
          duration: `${result.duration}ms`,
          errors: result.errors,
        },
      }, { status: 207 }); // Multi-Status
    }

  } catch (error) {
    console.error('[API] Erro na ingestão:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Erro ao executar ingestão',
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

/**
 * GET /api/ingest/run
 * 
 * Retorna informações sobre a última ingestão
 */
export async function GET() {
  try {
    const { prisma } = await import("@/lib/db");
    
    const lastIngestion = await prisma.dataIngestionLog.findFirst({
      orderBy: { startedAt: 'desc' },
    });

    if (!lastIngestion) {
      return NextResponse.json({
        message: 'Nenhuma ingestão executada ainda',
      });
    }

    return NextResponse.json({
      lastIngestion: {
        source: lastIngestion.source,
        status: lastIngestion.status,
        recordsCount: lastIngestion.recordsCount,
        startedAt: lastIngestion.startedAt,
        completedAt: lastIngestion.completedAt,
        duration: lastIngestion.completedAt 
          ? lastIngestion.completedAt.getTime() - lastIngestion.startedAt.getTime()
          : null,
        errorMessage: lastIngestion.errorMessage,
      },
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
