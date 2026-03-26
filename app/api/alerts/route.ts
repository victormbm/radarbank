import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * API de Alertas - Identifica mudanças críticas nos bancos
 * 
 * Verifica:
 * - Queda significativa no score (>10 pontos)
 * - Mudança de status (healthy → warning → critical)
 * - Métricas abaixo do crítico
 */

export async function GET() {
  try {
    const alerts = [];

    // Buscar todos os bancos
    const banks = await prisma.bank.findMany();

    for (const bank of banks) {
      // Buscar últimos 2 scores
      const scores = await prisma.bankScore.findMany({
        where: { bankId: bank.id },
        orderBy: { date: "desc" },
        take: 2,
      });

      if (scores.length < 2) continue;

      const [current, previous] = scores;
      const scoreDrop = previous.totalScore - current.totalScore;

      // Alerta: Queda significativa no score
      if (scoreDrop > 10) {
        alerts.push({
          bankId: bank.id,
          bankName: bank.name,
          type: "score_drop",
          severity: scoreDrop > 20 ? "critical" : "warning",
          message: `Score caiu ${scoreDrop.toFixed(1)} pontos (${previous.totalScore.toFixed(1)} → ${current.totalScore.toFixed(1)})`,
          currentScore: current.totalScore,
          previousScore: previous.totalScore,
          date: current.date,
        });
      }

      // Alerta: Mudança de status
      if (current.status !== previous.status) {
        const statusChange = `${previous.status} → ${current.status}`;
        alerts.push({
          bankId: bank.id,
          bankName: bank.name,
          type: "status_change",
          severity: current.status === "critical" ? "critical" : "warning",
          message: `Status mudou: ${statusChange}`,
          currentStatus: current.status,
          previousStatus: previous.status,
          date: current.date,
        });
      }

      // Buscar último snapshot para verificar métricas
      const snapshot = await prisma.bankSnapshot.findFirst({
        where: { bankId: bank.id },
        orderBy: { date: "desc" },
      });

      if (snapshot) {
        // Alerta: Basileia abaixo do mínimo (11%)
        if (snapshot.basilRatio && snapshot.basilRatio < 11) {
          alerts.push({
            bankId: bank.id,
            bankName: bank.name,
            type: "metric_critical",
            severity: "critical",
            message: `Índice de Basileia CRÍTICO: ${snapshot.basilRatio.toFixed(1)}% (mínimo: 11%)`,
            metric: "basilRatio",
            value: snapshot.basilRatio,
            threshold: 11,
            date: snapshot.date,
          });
        }

        // Alerta: NPL alto (>5%)
        if (snapshot.nplRatio && snapshot.nplRatio > 5) {
          alerts.push({
            bankId: bank.id,
            bankName: bank.name,
            type: "metric_critical",
            severity: "warning",
            message: `Inadimplência elevada: ${snapshot.nplRatio.toFixed(1)}% (ideal: <3%)`,
            metric: "nplRatio",
            value: snapshot.nplRatio,
            threshold: 5,
            date: snapshot.date,
          });
        }

        // Alerta: Liquidez baixa (<100%)
        if (snapshot.lcr && snapshot.lcr < 100) {
          alerts.push({
            bankId: bank.id,
            bankName: bank.name,
            type: "metric_critical",
            severity: "critical",
            message: `Liquidez CRÍTICA: ${snapshot.lcr.toFixed(1)}% (mínimo: 100%)`,
            metric: "lcr",
            value: snapshot.lcr,
            threshold: 100,
            date: snapshot.date,
          });
        }
      }
    }

    // Ordenar por severidade (critical primeiro)
    alerts.sort((a, b) => {
      if (a.severity === "critical" && b.severity !== "critical") return -1;
      if (a.severity !== "critical" && b.severity === "critical") return 1;
      return 0;
    });

    return NextResponse.json({
      success: true,
      count: alerts.length,
      alerts,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[ALERTS] Erro ao gerar alertas:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Falha ao gerar alertas",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Enviar alertas por email/WhatsApp (implementação futura)
 */
export async function POST(req: Request) {
  try {
    const { userId, bankIds, channels } = await req.json();

    // TODO: Implementar envio de alertas
    // - Buscar preferências do usuário
    // - Filtrar alertas pelos bancos selecionados
    // - Enviar para canais configurados (email/WhatsApp)

    return NextResponse.json({
      success: true,
      message: "Alertas configurados com sucesso",
      userId,
      bankIds,
      channels,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Falha ao configurar alertas" },
      { status: 500 }
    );
  }
}
