import { NextResponse } from "next/server";
import { dataIngestionService } from "@/server/data-ingestion-service";
import { requireAdminAccess } from "@/lib/admin-auth";

/**
 * POST /api/ingest/init
 * 
 * Inicializa métricas no banco de dados
 */
export async function POST(request: Request) {
  const auth = requireAdminAccess(request);
  if (!auth.allowed) {
    return auth.response;
  }

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
