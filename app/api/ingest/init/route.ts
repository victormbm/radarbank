import { NextResponse } from "next/server";
import { dataIngestionService } from "@/server/data-ingestion-service";

/**
 * POST /api/ingest/init
 * 
 * Inicializa métricas no banco de dados
 */
export async function POST() {
  try {
    console.log('[API] Inicializando métricas...');
    
    await dataIngestionService.initializeMetrics();

    return NextResponse.json({
      success: true,
      message: 'Métricas inicializadas com sucesso',
    });

  } catch (error) {
    console.error('[API] Erro ao inicializar métricas:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Erro ao inicializar métricas',
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
