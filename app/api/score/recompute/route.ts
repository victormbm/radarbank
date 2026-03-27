import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeDetailedScore } from "@/lib/scoring-v2";
import { marketStressService } from "@/server/market-stress-service";
import { requireAdminAccess } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const auth = requireAdminAccess(request);
  if (!auth.allowed) {
    return auth.response;
  }

  try {
    console.log("[SCORE] Iniciando recálculo de scores...");

    // Buscar todos os bancos
    const banks = await prisma.bank.findMany();
    
    let scoresCreated = 0;
    const results = [];

    for (const bank of banks) {
      const marketSignal = await marketStressService.getMarketSignal(
        bank.slug,
        bank.type as "digital" | "traditional"
      );

      // Buscar snapshots para cálculo contextual
      const snapshots = await prisma.bankSnapshot.findMany({
        where: { bankId: bank.id },
        orderBy: { date: "desc" },
      });

      for (let index = 0; index < snapshots.length; index++) {
        const snapshot = snapshots[index];
        const previousSnapshot = snapshots[index + 1] || null;

        const scoringInput = {
          ...snapshot,
          stockChange: marketSignal.stockChange30d,
        };

        const scoreData = computeDetailedScore(scoringInput, {
          bankType: bank.type as "digital" | "traditional",
          previousSnapshot,
          marketContext: {
            stockChange30d: marketSignal.stockChange30d,
            ibovChange30d: marketSignal.ibovChange30d,
            volatility30d: marketSignal.volatility30d,
            isProxy: marketSignal.isProxy,
            source: marketSignal.source,
          },
        });

        // Criar ou atualizar score
        const existingScore = await prisma.bankScore.findFirst({
          where: {
            bankId: bank.id,
            date: snapshot.date,
          },
        });

        if (existingScore) {
          await prisma.bankScore.update({
            where: { id: existingScore.id },
            data: {
              totalScore: scoreData.totalScore,
              capitalScore: scoreData.breakdown.capital,
              liquidityScore: scoreData.breakdown.liquidity,
              profitabilityScore: scoreData.breakdown.profitability,
              creditScore: scoreData.breakdown.credit,
              marketScore: scoreData.breakdown.market,
              status: scoreData.status,
            },
          });
        } else {
          await prisma.bankScore.create({
            data: {
              bankId: bank.id,
              date: snapshot.date,
              totalScore: scoreData.totalScore,
              capitalScore: scoreData.breakdown.capital,
              liquidityScore: scoreData.breakdown.liquidity,
              profitabilityScore: scoreData.breakdown.profitability,
              creditScore: scoreData.breakdown.credit,
              marketScore: scoreData.breakdown.market,
              status: scoreData.status,
            },
          });
          scoresCreated++;
        }

        results.push({
          bank: bank.name,
          date: snapshot.date.toISOString().split('T')[0],
          score: scoreData.totalScore,
          confidence: scoreData.confidence,
          structuralScore: scoreData.structuralScore,
          stressScore: scoreData.stressScore,
          status: scoreData.status,
        });
      }

      console.log(`  ✓ ${bank.name}: ${snapshots.length} scores`);
    }

    console.log(`[SCORE] ✅ Recálculo completo: ${scoresCreated} novos scores`);

    return NextResponse.json({
      success: true,
      message: `Scores recalculados para ${banks.length} bancos`,
      data: {
        banksProcessed: banks.length,
        scoresCreated,
        totalScores: results.length,
      },
      scores: results,
    });
  } catch (error) {
    console.error("[SCORE] Erro ao recalcular scores:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Falha ao recalcular scores",
        message: error instanceof Error ? error.message : "Erro desconhecido"
      },
      { status: 500 }
    );
  }
}
