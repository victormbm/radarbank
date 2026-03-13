import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 1. Contar bancos
    const banksCount = await prisma.bank.count();

    // 2. Contar banco snapshots
    const snapshotsCount = await prisma.bankSnapshot.count();
    const latestSnapshot = await prisma.bankSnapshot.findFirst({
      orderBy: { date: "desc" },
      include: { bank: { select: { name: true } } },
    });

    // 3. Contar reputações
    const reputationsCount = await prisma.bankReputation.count();
    const latestReputation = await prisma.bankReputation.findFirst({
      orderBy: { referenceDate: "desc" },
      include: { bank: { select: { name: true } } },
    });

    // 4. Contar scores
    const scoresCount = await prisma.bankScore.count();
    const latestScore = await prisma.bankScore.findFirst({
      orderBy: { date: "desc" },
      include: { bank: { select: { name: true } } },
    });

    // 5. Mostrar alguns bancos com todos os dados
    const banksWithData = await prisma.bank.findMany({
      take: 5,
      include: {
        snapshots: {
          orderBy: { date: "desc" },
          take: 1,
        },
        scores: {
          orderBy: { date: "desc" },
          take: 1,
        },
        reputation: {
          orderBy: { referenceDate: "desc" },
          take: 1,
        },
      },
    });

    const banksSample = banksWithData.map((bank) => ({
      name: bank.name,
      snapshot: bank.snapshots[0]
        ? {
            date: bank.snapshots[0].date,
            basilRatio: bank.snapshots[0].basilRatio,
            roe: bank.snapshots[0].roe,
          }
        : null,
      score: bank.scores[0]
        ? {
            date: bank.scores[0].date,
            totalScore: bank.scores[0].totalScore,
            status: bank.scores[0].status,
          }
        : null,
      reputation: bank.reputation[0]
        ? {
            date: bank.reputation[0].referenceDate,
            score: bank.reputation[0].reputationScore,
          }
        : null,
    }));

    return NextResponse.json({
      counts: {
        banks: banksCount,
        snapshots: snapshotsCount,
        reputations: reputationsCount,
        scores: scoresCount,
      },
      latest: {
        snapshot: latestSnapshot
          ? {
              bank: latestSnapshot.bank.name,
              date: latestSnapshot.date,
            }
          : null,
        reputation: latestReputation
          ? {
              bank: latestReputation.bank.name,
              date: latestReputation.referenceDate,
              score: latestReputation.reputationScore,
            }
          : null,
        score: latestScore
          ? {
              bank: latestScore.bank.name,
              date: latestScore.date,
              score: latestScore.totalScore,
              status: latestScore.status,
            }
          : null,
      },
      samples: banksSample,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
