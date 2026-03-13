import { NextResponse } from "next/server";
import { dataIngestionService } from "@/server/data-ingestion-service";
import { reclameAquiService } from "@/server/reclameaqui-service";
import { prisma } from "@/lib/db";

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
    reputationBanks: number;
    scoresComputed: number;
  };
}

/**
 * POST /api/ingest/update-all
 * 
 * Executa uma atualização completa de todos os dados:
 * 1. Ingestão de dados do Banco Central (BCB)
 * 2. Coleta de dados de reputação (Reclame Aqui)
 * 3. Recomputação de scores
 * 
 * Retorna um relatório completo da operação
 */
export async function POST() {
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

    // ─── PASSO 2: Coleta de dados de Reputação (Reclame Aqui) ──────────────────

    console.log("\n📱 [2/3] Coleta de dados de Reputação (Reclame Aqui)...\n");
    const reclameStartTime = Date.now();

    const reputationErrors: string[] = [];
    let reputationDataCollected = 0;
    let reputationDataSaved = 0;
    let totalBanks = 0;

    try {
      // Buscar todos os bancos
      const banks = await prisma.bank.findMany();
      totalBanks = banks.length;

      console.log(`   Processando ${totalBanks} bancos...`);

      // Para cada banco, buscar e salvar dados de reputação
      for (const bank of banks) {
        try {
          const reputationData = await reclameAquiService.fetchBankReputation(
            bank.slug
          );

          if (reputationData) {
            reputationDataCollected++;
            await reclameAquiService.saveReputationData(
              bank.id,
              reputationData
            );
            reputationDataSaved++;

            console.log(
              `   ✓ ${bank.name} (Score: ${reputationData.reputationScore})`
            );
          } else {
            console.log(`   ⚠ ${bank.name} (sem dados)`);
          }
        } catch (error) {
          const errorMsg = `Erro ao processar ${bank.name}: ${error}`;
          console.log(`   ✗ ${errorMsg}`);
          reputationErrors.push(errorMsg);
        }
      }
    } catch (error) {
      const errorMsg = `Erro geral na coleta de reputação: ${error}`;
      console.log(`   ✗ ${errorMsg}`);
      reputationErrors.push(errorMsg);
    }

    const reclameDuration = Date.now() - reclameStartTime;
    results.steps.reputation = {
      banksProcessed: totalBanks,
      dataCollected: reputationDataCollected,
      dataSaved: reputationDataSaved,
      errors: reputationErrors,
      durationMs: reclameDuration,
    };

    console.log(
      `✅ Reputação Completa (${reclameDuration}ms) - ${reputationDataSaved}/${totalBanks} salvos`
    );

    // ─── PASSO 3: Recomputação de Scores ───────────────────────────────────────

    console.log("\n🎯 [3/3] Recomputação de Scores...\n");
    const scoresStartTime = Date.now();

    let scoresComputed = 0;
    const scoresErrors: string[] = [];

    try {
      const banks = await prisma.bank.findMany();
      console.log(`   Recomputando scores para ${banks.length} bancos...`);

      for (const bank of banks) {
        try {
          // Delete existing scores for this bank to avoid unique constraint violations
          await prisma.bankScore.deleteMany({
            where: { bankId: bank.id },
          });

          // Recompute the score
          await (
            await import("@/server/scoring-service")
          ).computeBankScore(bank.id);

          scoresComputed++;
          console.log(`   ✓ ${bank.name}`);
        } catch (error) {
          const errorMsg = `Erro ao computar score de ${bank.name}: ${error}`;
          console.log(`   ✗ ${errorMsg}`);
          scoresErrors.push(errorMsg);
        }
      }
    } catch (error) {
      const errorMsg = `Erro geral na recomputação de scores: ${error}`;
      console.log(`   ✗ ${errorMsg}`);
      scoresErrors.push(errorMsg);
    }

    const scoresDuration = Date.now() - scoresStartTime;
    results.steps.scores = {
      banksWithScores: scoresComputed,
      errors: scoresErrors,
      durationMs: scoresDuration,
    };

    console.log(`✅ Scores Completo (${scoresDuration}ms)`);
    console.log(`   • Bancos com scores: ${scoresComputed}`);

    // ─── Resumo Final ──────────────────────────────────────────────────────────

    const totalDuration = Date.now() - startTime;

    results.status = "success";
    results.totalDurationMs = totalDuration;
    results.summary = {
      message: "✅ Atualização completa executada com sucesso!",
      totalTime: `${(totalDuration / 1000).toFixed(2)}s`,
      bcbBanks: bcbResult.banksProcessed,
      reputationBanks: reputationDataSaved,
      scoresComputed: scoresComputed,
    };

    console.log("\n" + "=".repeat(70));
    console.log("✅ ATUALIZAÇÃO CONCLUÍDA COM SUCESSO!");
    console.log("=".repeat(70));
    console.log(`Tempo total: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log(`• BCB: ${bcbResult.banksProcessed} bancos`);
    console.log(`• Reputação: ${reputationDataSaved} bancos`);
    console.log(`• Scores: ${scoresComputed} bancos`);
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
