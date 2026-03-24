import { prisma } from "../lib/db";
import { bcbAPI } from "../server/bcb-api-service";

const VERIFIED_FIELDS = [
  ["basilRatio", "basileia"],
  ["tier1Ratio", "tier1"],
  ["cet1Ratio", "cet1"],
  ["totalAssets", "ativoTotal"],
  ["equity", "patrimonioLiquido"],
  ["loanPortfolio", "loanPortfolio"],
] as const;

const EPSILON = 0.000001;

function nearlyEqual(left: number | null | undefined, right: number | null | undefined) {
  if (left == null && right == null) return true;
  if (left == null || right == null) return false;
  return Math.abs(left - right) <= EPSILON;
}

async function main() {
  const quarter = bcbAPI.getLatestAvailableQuarter();

  let officialData: Awaited<ReturnType<typeof bcbAPI.fetchAllBanksData>>;
  try {
    officialData = await bcbAPI.fetchAllBanksData(quarter.date);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("BLOQUEADO: auditoria estrita indisponivel porque a API oficial de cadastro nao respondeu.");
    console.error("Detalhe:", message);
    console.error("Acao: aguardar normalizacao do endpoint IfDataCadastro e executar novamente.");
    process.exitCode = 2;
    return;
  }

  const officialByCnpj = new Map(officialData.map((item) => [item.cnpj, item]));

  const banks = await prisma.bank.findMany({
    where: { cnpj: { not: null } },
    include: {
      snapshots: {
        where: { date: new Date(quarter.date) },
        orderBy: { date: "desc" },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  });

  let failures = 0;

  console.log(`Auditoria IFData BCB - data-base ${quarter.date}`);
  console.log("=".repeat(72));

  for (const bank of banks) {
    const official = bank.cnpj ? officialByCnpj.get(bank.cnpj) : null;
    const snapshot = bank.snapshots[0] ?? null;

    if (!official) {
      console.log(`SKIP ${bank.name}: sem correspondencia oficial nesta coleta`);
      continue;
    }

    if (!snapshot) {
      failures++;
      console.log(`FAIL ${bank.name}: sem snapshot salvo para ${quarter.date}`);
      continue;
    }

    const diffs: string[] = [];

    for (const [snapshotField, officialField] of VERIFIED_FIELDS) {
      const dbValue = snapshot[snapshotField];
      const sourceValue = official[officialField];
      if (!nearlyEqual(dbValue, sourceValue)) {
        diffs.push(`${snapshotField}: db=${dbValue ?? "null"} | bcb=${sourceValue ?? "null"}`);
      }
    }

    if (diffs.length > 0) {
      failures++;
      console.log(`FAIL ${bank.name}`);
      for (const diff of diffs) {
        console.log(`  - ${diff}`);
      }
    } else {
      console.log(`PASS ${bank.name}`);
    }
  }

  console.log("=".repeat(72));
  if (failures > 0) {
    console.log(`Resultado: ${failures} banco(s) com divergencia.`);
    process.exit(1);
  }

  console.log("Resultado: snapshots verificados contra IFData oficial.");
}

main()
  .catch((error) => {
    console.error("Erro na auditoria IFData:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
