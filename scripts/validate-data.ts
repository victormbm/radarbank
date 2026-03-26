import { prisma } from "@/lib/db";

async function validateData() {
  console.log("\n" + "=".repeat(70));
  console.log("🔍 VALIDAÇÃO DE DADOS NO PRISMA");
  console.log("=".repeat(70) + "\n");

  try {
    // 1. Contar bancos
    const banksCount = await prisma.bank.count();
    console.log(`📊 Bancos cadastrados: ${banksCount}`);

    // 2. Contar banco snapshots
    const snapshotsCount = await prisma.bankSnapshot.count();
    const latestSnapshot = await prisma.bankSnapshot.findFirst({
      orderBy: { date: "desc" },
      select: { date: true, bank: { select: { name: true } } },
    });
    console.log(`📈 Bank Snapshots: ${snapshotsCount}`);
    if (latestSnapshot) {
      console.log(`   Mais recente: ${latestSnapshot.bank.name} (${latestSnapshot.date.toLocaleDateString("pt-BR")})`);
    }

    // 3. Contar reputações
    const reputationsCount = await prisma.bankReputation.count();
    const latestReputation = await prisma.bankReputation.findFirst({
      orderBy: { referenceDate: "desc" },
      select: { referenceDate: true, reputationScore: true, bank: { select: { name: true } } },
    });
    console.log(`⭐ Bank Reputations: ${reputationsCount}`);
    if (latestReputation) {
      console.log(`   Mais recente: ${latestReputation.bank.name} (Score: ${latestReputation.reputationScore}, Data: ${latestReputation.referenceDate.toLocaleDateString("pt-BR")})`);
    }

    // 4. Contar scores
    const scoresCount = await prisma.bankScore.count();
    const latestScore = await prisma.bankScore.findFirst({
      orderBy: { date: "desc" },
      select: { date: true, totalScore: true, status: true, bank: { select: { name: true } } },
    });
    console.log(`🎯 Bank Scores: ${scoresCount}`);
    if (latestScore) {
      console.log(`   Mais recente: ${latestScore.bank.name} (Score: ${latestScore.totalScore.toFixed(1)}, Status: ${latestScore.status}, Data: ${latestScore.date.toLocaleDateString("pt-BR")})`);
    }

    // 5. Mostrar alguns bancos com todos os dados
    console.log("\n📋 Amostra de bancos com dados completos:\n");
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

    for (const bank of banksWithData) {
      console.log(`\n${bank.name}:`);
      console.log(`  Snapshot: ${bank.snapshots.length > 0 ? "✅" : "❌"} ${bank.snapshots[0]?.basilRatio ? `(Basileia: ${bank.snapshots[0].basilRatio}%)` : ""}`);
      console.log(`  Score: ${bank.scores.length > 0 ? "✅" : "❌"} ${bank.scores[0]?.totalScore ? `(${bank.scores[0].totalScore.toFixed(1)}, ${bank.scores[0].status})` : ""}`);
      console.log(`  Reputação: ${bank.reputation.length > 0 ? "✅" : "❌"} ${bank.reputation[0]?.reputationScore ? `(${bank.reputation[0].reputationScore}/10)` : ""}`);
    }

    console.log("\n" + "=".repeat(70));
    console.log("✅ VALIDAÇÃO CONCLUÍDA");
    console.log("=".repeat(70) + "\n");
  } catch (error) {
    console.error("Erro na validação:", error);
  } finally {
    await prisma.$disconnect();
  }
}

validateData();
