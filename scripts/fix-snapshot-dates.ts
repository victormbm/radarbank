/**
 * Migra datas de snapshots do formato seed (1º do mês) para datas-base
 * oficiais do BCB (fim de trimestre: 31/Mar, 30/Jun, 30/Set, 31/Dez).
 *
 * Mapeamento:
 *   2026-03-01 → 2025-12-31  (T4 2025, trimestre mais recente disponível)
 *   2026-02-01 → 2025-09-30  (T3 2025)
 *   2026-01-01 → 2025-06-30  (T2 2025)
 *   2025-12-01 → 2025-03-31  (T1 2025)
 *   2025-11-01 → 2024-12-31  (T4 2024)
 *   2025-10-01 → 2024-09-30  (T3 2024)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DATE_MAP: Array<[string, string]> = [
  ['2026-03-01', '2025-12-31'],
  ['2026-02-01', '2025-09-30'],
  ['2026-01-01', '2025-06-30'],
  ['2025-12-01', '2025-03-31'],
  ['2025-11-01', '2024-12-31'],
  ['2025-10-01', '2024-09-30'],
];

async function main() {
  console.log('🗓️  Corrigindo datas dos snapshots para datas-base oficiais BCB...\n');

  // Mostrar datas existentes para diagnóstico
  const existingDates = await prisma.bankSnapshot.findMany({
    select: { date: true },
    distinct: ['date'],
    orderBy: { date: 'desc' },
  });
  console.log('  Datas atuais no banco:');
  for (const d of existingDates) {
    const count = await prisma.bankSnapshot.count({ where: { date: d.date } });
    console.log(`    ${d.date.toISOString().split('T')[0]} (${count} registros)`);
  }
  console.log('');

  let totalUpdated = 0;

  for (const [fromStr, toStr] of DATE_MAP) {
    const to = new Date(toStr);

    // Buscar snapshots a migrar (range do dia inteiro UTC)
    const toMigrate = await prisma.bankSnapshot.findMany({
      where: {
        date: {
          gte: new Date(fromStr + 'T00:00:00.000Z'),
          lte: new Date(fromStr + 'T23:59:59.999Z'),
        },
      },
      select: { id: true, bankId: true },
    });

    if (toMigrate.length === 0) {
      console.log(`  ⏩ ${fromStr} → ${toStr}: nenhum registro encontrado`);
      continue;
    }

    // Verificar colisões: já existe snapshot com a data alvo para os mesmos bancos?
    const bankIds = toMigrate.map((s) => s.bankId);
    const conflicts = await prisma.bankSnapshot.findMany({
      where: {
        bankId: { in: bankIds },
        date: {
          gte: new Date(toStr + 'T00:00:00.000Z'),
          lte: new Date(toStr + 'T23:59:59.999Z'),
        },
      },
      select: { id: true, bankId: true },
    });

    if (conflicts.length > 0) {
      // Excluir snapshots existentes na data alvo (são duplicatas mais antigas)
      const conflictIds = conflicts.map((c) => c.id);
      await prisma.bankSnapshot.deleteMany({ where: { id: { in: conflictIds } } });
      console.log(`  🗑️  ${toStr}: ${conflictIds.length} duplicata(s) excluída(s) para dar lugar à migração`);
    }

    // Atualizar em lote por ID (para evitar re-checar o range de datas)
    const idsToUpdate = toMigrate.map((s) => s.id);
    const updated = await prisma.bankSnapshot.updateMany({
      where: { id: { in: idsToUpdate } },
      data: { date: to },
    });

    console.log(`  ✅ ${fromStr} → ${toStr}: ${updated.count} registro(s) atualizado(s)`);
    totalUpdated += updated.count;
  }

  // Também corrigir BankScore se existir
  console.log('\n🗓️  Corrigindo datas dos BankScore...');
  let scoreUpdated = 0;
  for (const [fromStr, toStr] of DATE_MAP) {
    const to = new Date(toStr);
    // Remover colisões de BankScore
    const bankIds = (await prisma.bankScore.findMany({
      where: {
        date: {
          gte: new Date(fromStr + 'T00:00:00.000Z'),
          lte: new Date(fromStr + 'T23:59:59.999Z'),
        },
      },
      select: { bankId: true },
    })).map((s) => s.bankId);

    if (bankIds.length > 0) {
      await prisma.bankScore.deleteMany({
        where: {
          bankId: { in: bankIds },
          date: {
            gte: new Date(toStr + 'T00:00:00.000Z'),
            lte: new Date(toStr + 'T23:59:59.999Z'),
          },
        },
      });
      const updated = await prisma.bankScore.updateMany({
        where: {
          bankId: { in: bankIds },
          date: {
            gte: new Date(fromStr + 'T00:00:00.000Z'),
            lte: new Date(fromStr + 'T23:59:59.999Z'),
          },
        },
        data: { date: to },
      });
      if (updated.count > 0) {
        console.log(`  ✅ ${fromStr} → ${toStr}: ${updated.count} score(s) atualizado(s)`);
        scoreUpdated += updated.count;
      }
    }
  }

  console.log(`\n✨ Concluído: ${totalUpdated} snapshot(s) e ${scoreUpdated} score(s) migrados.`);

  // Verificar data mais recente após a migração
  const latest = await prisma.bankSnapshot.findFirst({
    orderBy: { date: 'desc' },
    select: { date: true },
  });
  console.log(`\n📅 Data mais recente no banco: ${latest?.date.toISOString().split('T')[0] ?? 'nenhum'}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Erro:', e);
  process.exit(1);
});
