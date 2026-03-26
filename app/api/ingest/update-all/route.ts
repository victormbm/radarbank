import { NextResponse } from "next/server";
import { dataIngestionService } from "@/server/data-ingestion-service";
import { prisma } from "@/lib/db";
import { requireAdminAccess } from "@/lib/admin-auth";

interface UpdateResults {
  timestamp: string;
  status: "processing" | "success" | "error";
  steps: Record<string, object>;
  error?: string;
  totalDurationMs?: number;
  summary?: {
    message: string;
    totalTime: string;
    bcbBanks: number;
    scoresComputed: number;
  };
}

/**
 * POST /api/ingest/update-all
 * 
 * Executa uma atualização completa de todos os dados:
 * 1. Ingestão de dados do Banco Central (BCB)
 * 2. Limpeza de score legado (modo estrito)
 * 
 * Retorna um relatório completo da operação
 */
export async function POST(request: Request) {
  const auth = requireAdminAccess(request);
  if (!auth.allowed) {
    return auth.response;
  }

  const startTime = Date.now();
  const results: UpdateResults = {
    timestamp: new Date().toISOString(),
    status: "processing",
    steps: {},
  };

  try {
    console.log("\n" + "=".repeat(70));
    console.log("🚀 INICIANDO ATUALIZAÇÃO COMPLETA DE DADOS");
    console.log("=".repeat(70) + "\n");

    // ─── PASSO 1: Ingestão de dados do BCB ─────────────────────────────────────

    console.log("📊 [1/3] Ingestão de dados do Banco Central (BCB)...\n");
    const bcbStartTime = Date.now();

    const bcbResult = await dataIngestionService.runFullIngestion();

    const bcbDuration = Date.now() - bcbStartTime;
    results.steps.bcb = {
      success: bcbResult.success,
      banksProcessed: bcbResult.banksProcessed,
      metricsCollected: bcbResult.metricsCollected,
      errors: bcbResult.errors,
      durationMs: bcbDuration,
    };

    console.log(`✅ BCB Completo (${bcbDuration}ms)`);
    console.log(`   • Bancos processados: ${bcbResult.banksProcessed}`);
    console.log(`   • Métricas coletadas: ${bcbResult.metricsCollected}`);
    if (bcbResult.errors.length > 0) {
      console.log(`   • Erros: ${bcbResult.errors.length}`);
      bcbResult.errors.forEach((e) => console.log(`     - ${e}`));
    }

    // ─── PASSO 2: Recomputação de Scores ───────────────────────────────────────

    console.log("\n🧹 [2/2] Limpeza de Scores Legados...\n");
    const scoresStartTime = Date.now();

    let scoresComputed = 0;
    const scoresErrors: string[] = [];

    try {
      const deleted = await prisma.bankScore.deleteMany();
      scoresComputed = 0;
      console.log(`   ✓ ${deleted.count} score(s) legado(s) removido(s)`);
      console.log("   ℹ️  Modo estrito IFData ativo: score composto externo desativado");
    } catch (error) {
      const errorMsg = `Erro geral na limpeza de scores legados: ${error}`;
      console.log(`   ✗ ${errorMsg}`);
      scoresErrors.push(errorMsg);
    }

    const scoresDuration = Date.now() - scoresStartTime;
    results.steps.scores = {
      banksWithScores: scoresComputed,
      errors: scoresErrors,
      durationMs: scoresDuration,
    };

    console.log(`✅ Limpeza de Scores Completa (${scoresDuration}ms)`);
    console.log(`   • Scores compostos gerados: ${scoresComputed}`);

    // ─── Resumo Final ──────────────────────────────────────────────────────────

    const totalDuration = Date.now() - startTime;

    results.status = "success";
    results.totalDurationMs = totalDuration;
    results.summary = {
      message: "✅ Atualização completa executada com sucesso!",
      totalTime: `${(totalDuration / 1000).toFixed(2)}s`,
      bcbBanks: bcbResult.banksProcessed,
      scoresComputed: scoresComputed,
    };

    console.log("\n" + "=".repeat(70));
    console.log("✅ ATUALIZAÇÃO CONCLUÍDA COM SUCESSO!");
    console.log("=".repeat(70));
    console.log(`Tempo total: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log(`• BCB: ${bcbResult.banksProcessed} bancos`);
    console.log(`• Scores compostos gerados: ${scoresComputed}`);
    console.log("=".repeat(70) + "\n");

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("\n❌ ERRO NA ATUALIZAÇÃO:", errorMsg);

    results.status = "error";
    results.error = errorMsg;
    results.totalDurationMs = Date.now() - startTime;

    return NextResponse.json(results, { status: 500 });
  }
}
