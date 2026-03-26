/**
 * Script: update-bcb-complaints.ts
 *
 * Atualiza a tabela BankReputation com dados oficiais de reclamações do BCB.
 *
 * Uso:
 *   npx tsx scripts/update-bcb-complaints.ts             # período mais recente
 *   npx tsx scripts/update-bcb-complaints.ts --test      # só testa a conexão
 *   npx tsx scripts/update-bcb-complaints.ts --periodo 202409
 *
 * Dados: domínio público do Banco Central do Brasil (Lei de Acesso à Informação)
 * Fonte: https://dadosabertos.bcb.gov.br/dataset/reclamacoes-recebidas-pelo-banco-central
 */

import { PrismaClient } from '@prisma/client';
import {
  fetchBCBComplaints,
  testBCBComplaintsConnection,
  getLatestAvailablePeriod,
  nameToSlug,
  type BCBComplaintData,
} from '../server/bcb-complaints-service';

const prisma = new PrismaClient();

// ──────────────────────────────────────────────────────────────────────────────
// Parse de argumentos CLI
// ──────────────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const isTest      = args.includes('--test');
const periodoArg  = args.find(a => a.startsWith('--periodo='))?.split('=')[1]
                  ?? (args.indexOf('--periodo') >= 0 ? args[args.indexOf('--periodo') + 1] : undefined);
// --periodo accepts "2025T4" or "2025/4" or "2025 4"
function parsePeriodoArg(s: string): { ano: number; trimestre: number } | null {
  const m = s.match(/(\d{4})[^\d]?(\d)/);
  if (m) return { ano: parseInt(m[1]), trimestre: parseInt(m[2]) };
  return null;
}

// ──────────────────────────────────────────────────────────────────────────────
// Funções auxiliares
// ──────────────────────────────────────────────────────────────────────────────

function periodoToDate(data: BCBComplaintData): Date {
  // Trimestre 1 = março, 2 = junho, 3 = setembro, 4 = dezembro
  const month = data.trimestre * 3;
  return new Date(data.ano, month - 1, 1);
}

async function findBankId(data: BCBComplaintData): Promise<string | null> {
  // 1. Por nome (mapping principal)
  const slug = nameToSlug(data.nome);
  if (slug) {
    const bank = await prisma.bank.findUnique({ where: { slug } });
    if (bank) return bank.id;
  }

  // 2. Busca parcial por nome no DB
  const firstWord = data.nome.split(' ')[0];
  if (firstWord.length >= 4) {
    const bank = await prisma.bank.findFirst({
      where: { name: { contains: firstWord, mode: 'insensitive' } },
    });
    if (bank) return bank.id;
  }
  return null;
}

// ──────────────────────────────────────────────────────────────────────────────
// Salva dados de reputação no DB
// ──────────────────────────────────────────────────────────────────────────────

async function saveComplaintData(bankId: string, data: BCBComplaintData): Promise<void> {
  const referenceDate = periodoToDate(data);

  await prisma.bankReputation.upsert({
    where: {
      bankId_source_referenceDate: {
        bankId,
        source: 'bcb',
        referenceDate,
      },
    },
    update: {
      reputationScore:  data.reputationScore,
      resolvedRate:     data.resolvedRate,
      averageRating:    null, // BCB não fornece nota média de avaliação
      totalComplaints:  data.totalRespondidas,
      responseTime:     null, // BCB não fornece tempo de resposta
      topComplaint1:    data.categoria ?? null,
      topComplaint2:    null,
      topComplaint3:    null,
      sentimentScore:   data.sentimentScore,
      rawData:          JSON.stringify({
        nome:              data.nome,
        cnpj:              data.cnpj,
        ano:               data.ano,
        trimestre:         data.trimestre,
        indiceReclamacao:  data.indiceReclamacao,
        totalRespondidas:  data.totalRespondidas,
        procedentes:       data.procedentes,
        totalClientes:     data.totalClientes,
        categoria:         data.categoria,
        fonte:             'BCB - Ranking de Reclamações por Instituição',
        lei:               'Dados abertos - LAI (domínio público)',
        url:               'https://dadosabertos.bcb.gov.br/dataset/ranking-de-instituicoes-por-indice-de-reclamacoes',
      }),
      lastScraped: new Date(),
    },
    create: {
      bankId,
      source:          'bcb',
      referenceDate,
      reputationScore: data.reputationScore,
      resolvedRate:    data.resolvedRate,
      averageRating:   null,
      totalComplaints: data.totalRespondidas,
      responseTime:    null,
      topComplaint1:   data.categoria ?? null,
      topComplaint2:   null,
      topComplaint3:   null,
      sentimentScore:  data.sentimentScore,
      rawData:         JSON.stringify({
        nome:              data.nome,
        cnpj:              data.cnpj,
        ano:               data.ano,
        trimestre:         data.trimestre,
        indiceReclamacao:  data.indiceReclamacao,
        totalRespondidas:  data.totalRespondidas,
        procedentes:       data.procedentes,
        totalClientes:     data.totalClientes,
        categoria:         data.categoria,
        fonte:             'BCB - Ranking de Reclamações por Instituição',
        lei:               'Dados abertos - LAI (domínio público)',
        url:               'https://dadosabertos.bcb.gov.br/dataset/ranking-de-instituicoes-por-indice-de-reclamacoes',
      }),
      lastScraped:     new Date(),
    },
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  ATUALIZAÇÃO DE RECLAMAÇÕES – BANCO CENTRAL DO BRASIL');
  console.log('  Fonte: dados abertos/públicos (LAI) – uso legal ✅');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  // ── Modo teste ─────────────────────────────────────────────────────────────
  if (isTest) {
    console.log('🧪 Modo teste: verificando conexão com API BCB...\n');
    const result = await testBCBComplaintsConnection();
    console.log('');
    if (result.ok) {
      console.log(`✅ API BCB respondendo!`);
      console.log(`   Último período: ${result.ano} T${result.trimestre}`);
      console.log(`   ${result.message}`);
    } else {
      console.log('❌ API BCB não respondeu.');
      console.log(`   ${result.message}`);
      console.log('');
      console.log('Dataset oficial:');
      console.log('   https://dadosabertos.bcb.gov.br/dataset/ranking-de-instituicoes-por-indice-de-reclamacoes');
    }
    return;
  }

  // ── Modo normal ────────────────────────────────────────────────────────────
  const period = periodoArg ? parsePeriodoArg(periodoArg) ?? await getLatestAvailablePeriod()
                            : await getLatestAvailablePeriod();
  console.log(`📅 Período alvo: ${period.ano} T${period.trimestre}`);
  console.log('');

  // Buscar dados da API
  const complaintsData = await fetchBCBComplaints(period);

  if (complaintsData.length === 0) {
    console.error('');
    console.error('❌ Nenhum dado retornado pela API BCB.');
    console.error('');
    console.error('Possíveis causas:');
    console.error('  1. Período ainda não publicado (BCB publica ~90 dias após o trimestre)');
    console.error('  2. Instabilidade temporária da API');
    console.error('');
    console.error('Exemplos de uso:');
    console.error('  npx tsx scripts/update-bcb-complaints.ts --periodo 2025T4');
    console.error('  npx tsx scripts/update-bcb-complaints.ts --periodo 2025T3');
    process.exit(1);
  }

  // Buscar bancos cadastrados no DB
  const dbBanks = await prisma.bank.findMany({ select: { id: true, name: true, slug: true } });
  console.log(`🏦 Bancos no DB: ${dbBanks.length}`);
  console.log(`📊 Instituições do BCB: ${complaintsData.length}`);
  console.log('');

  let matched    = 0;
  let notMatched = 0;

  const table: Array<{ banco: string; score: string; reclamacoes: number; indice: string; status: string }> = [];

  for (const item of complaintsData) {
    const bankId = await findBankId(item);

    if (!bankId) {
      notMatched++;
      continue;
    }

    try {
      await saveComplaintData(bankId, item);
      matched++;
      table.push({
        banco:       item.nome.slice(0, 30),
        score:       `${item.reputationScore}/10`,
        reclamacoes: item.totalRespondidas,
        indice:      item.indiceReclamacao.toFixed(2),
        status:      '✅ Salvo',
      });
    } catch (err: any) {
      console.error(`   ❌ Erro ao salvar ${item.nome}: ${err.message}`);
      table.push({
        banco:       item.nome.slice(0, 30),
        score:       '—',
        reclamacoes: item.totalRespondidas,
        indice:      item.indiceReclamacao.toFixed(2),
        status:      '❌ Erro',
      });
    }
  }

  // ── Resultado ──────────────────────────────────────────────────────────────
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  RESULTADO');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  if (table.length > 0) {
    const header = `  ${'Banco'.padEnd(31)} ${'Score'.padEnd(8)} ${'Recl.'.padEnd(8)} ${'Índice'.padEnd(8)} Status`;
    console.log(header);
    console.log('  ' + '─'.repeat(70));
    for (const row of table) {
      console.log(
        `  ${row.banco.padEnd(31)} ${row.score.padEnd(8)} ${String(row.reclamacoes).padEnd(8)} ${row.indice.padEnd(8)} ${row.status}`
      );
    }
  }

  console.log('');
  console.log(`  ✅ Bancos atualizados: ${matched}`);
  console.log(`  ⚠️  Não identificados: ${notMatched}`);
  console.log('');
  console.log(`  Fonte: Banco Central do Brasil – dados de domínio público`);
  console.log(`  Período: ${period.ano} T${period.trimestre}`);
  console.log('');

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
