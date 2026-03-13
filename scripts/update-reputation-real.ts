import { PrismaClient } from '@prisma/client';
import { reclameAquiScraperReal } from '../server/reclameaqui-scraper';

const prisma = new PrismaClient();

/**
 * Script para coletar dados REAIS do Reclame Aqui
 * 
 * Executar 3x ao dia: 8h, 14h, 20h
 * 
 * Uso:
 *   npx tsx scripts/update-reputation-real.ts
 */

async function updateReputationFromRealData() {
  console.log('🔄 Iniciando coleta REAL de dados do Reclame Aqui...');
  console.log(`📅 Data/Hora: ${new Date().toLocaleString('pt-BR')}\n`);

  try {
    // Buscar todos os bancos cadastrados
    const banks = await prisma.bank.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    console.log(`📊 Encontrados ${banks.length} bancos para atualizar\n`);

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    const results: Array<{
      bank: string;
      status: string;
      score?: number;
      oldScore?: number;
      change?: string;
    }> = [];

    // Inicializar scraper
    await reclameAquiScraperReal.initialize();

    // Processar cada banco
    for (const bank of banks) {
      try {
        console.log(`🏦 Processando: ${bank.name} (${bank.slug})...`);

        // Buscar dados anteriores
        const previousData = await prisma.bankReputation.findFirst({
          where: {
            bankId: bank.id,
            source: 'reclameaqui',
          },
          orderBy: {
            referenceDate: 'desc',
          },
        });

        // Fazer scraping REAL
        const reputationData = await reclameAquiScraperReal.scrapeBankData(bank.slug);

        if (!reputationData) {
          console.log(`   ⚠️  Nenhum dado coletado para ${bank.name}`);
          skippedCount++;
          results.push({ bank: bank.name, status: 'Sem dados' });
          continue;
        }

        // Verificar se houve mudança significativa
        const oldScore = previousData?.reputationScore || 0;
        const newScore = reputationData.reputationScore;
        const scoreDiff = newScore - oldScore;

        // Salvar no banco de dados
        await prisma.bankReputation.create({
          data: {
            bankId: bank.id,
            source: 'reclameaqui',
            referenceDate: reputationData.lastUpdate,
            reputationScore: reputationData.reputationScore,
            resolvedRate: reputationData.resolvedRate,
            averageRating: reputationData.averageRating,
            totalComplaints: reputationData.totalComplaints,
            responseTime: reputationData.responseTime,
            topComplaint1: reputationData.topComplaints[0] || null,
            topComplaint2: reputationData.topComplaints[1] || null,
            topComplaint3: reputationData.topComplaints[2] || null,
            sentimentScore: reputationData.sentimentScore,
            rawData: JSON.stringify(reputationData),
            lastScraped: new Date(),
          },
        });

        // Determinar mudança
        let changeIcon = '→';
        if (scoreDiff > 0.2) changeIcon = '📈';
        else if (scoreDiff < -0.2) changeIcon = '📉';

        console.log(`   ✅ Dados atualizados`);
        console.log(`      Score: ${oldScore.toFixed(1)} → ${newScore.toFixed(1)} (${scoreDiff >= 0 ? '+' : ''}${scoreDiff.toFixed(1)})`);
        console.log(`      Resolução: ${reputationData.resolvedRate}%`);
        console.log(`      Reclamações: ${reputationData.totalComplaints.toLocaleString('pt-BR')}`);

        successCount++;
        results.push({
          bank: bank.name,
          status: 'Sucesso',
          score: newScore,
          oldScore: oldScore,
          change: `${changeIcon} ${scoreDiff >= 0 ? '+' : ''}${scoreDiff.toFixed(1)}`,
        });

        // Rate limiting: aguardar 3-5 segundos entre bancos
        await sleep(3000 + Math.random() * 2000);

      } catch (error) {
        console.error(`   ❌ Erro ao processar ${bank.name}:`, error);
        errorCount++;
        results.push({ bank: bank.name, status: 'Erro' });
      }
    }

    // Fechar scraper
    await reclameAquiScraperReal.close();

    // Resumo final
    console.log('\n' + '='.repeat(70));
    console.log('📈 RESUMO DA ATUALIZAÇÃO');
    console.log('='.repeat(70));
    console.log(`✅ Sucesso: ${successCount} bancos`);
    console.log(`⚠️  Pulados: ${skippedCount} bancos`);
    console.log(`❌ Erro: ${errorCount} bancos`);
    console.log(`📊 Total processado: ${banks.length} bancos\n`);

    // Tabela de mudanças
    console.log('📋 Mudanças detectadas:');
    console.log('-'.repeat(70));
    for (const result of results.filter(r => r.status === 'Sucesso')) {
      const scoreStr = result.score ? `${result.score.toFixed(1)}/10` : '';
      const changeStr = result.change || '';
      console.log(`  ${result.bank.padEnd(30)} ${scoreStr.padEnd(10)} ${changeStr}`);
    }
    console.log('-'.repeat(70));

    // Alertas de mudanças significativas
    const significantChanges = results.filter(
      r => r.oldScore && r.score && Math.abs(r.score - r.oldScore) > 0.5
    );

    if (significantChanges.length > 0) {
      console.log('\n🚨 ALERTAS: Mudanças Significativas (>0.5 pontos)');
      console.log('-'.repeat(70));
      for (const change of significantChanges) {
        const diff = change.score! - change.oldScore!;
        console.log(`  ⚠️  ${change.bank}: ${change.oldScore!.toFixed(1)} → ${change.score!.toFixed(1)} (${diff >= 0 ? '+' : ''}${diff.toFixed(1)})`);
      }
      console.log('-'.repeat(70));
    }

    // Estatísticas finais
    const totalRecords = await prisma.bankReputation.count({
      where: { source: 'reclameaqui' },
    });

    console.log(`\n💾 Total de registros históricos: ${totalRecords}`);
    console.log(`⏰ Próxima execução sugerida: ${getNextExecutionTime()}`);
    console.log('\n✨ Atualização finalizada com sucesso!');

  } catch (error) {
    console.error('❌ Erro fatal durante a atualização:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    // Garantir que o navegador seja fechado
    await reclameAquiScraperReal.close();
  }
}

/**
 * Calcular próxima execução (8h, 14h ou 20h)
 */
function getNextExecutionTime(): string {
  const now = new Date();
  const hour = now.getHours();

  let nextHour: number;
  if (hour < 8) nextHour = 8;
  else if (hour < 14) nextHour = 14;
  else if (hour < 20) nextHour = 20;
  else nextHour = 8; // Próximo dia

  const next = new Date(now);
  if (nextHour <= hour) {
    next.setDate(next.getDate() + 1);
  }
  next.setHours(nextHour, 0, 0, 0);

  return next.toLocaleString('pt-BR');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Executar o script
console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║           🔄 ATUALIZAÇÃO REAL - RECLAME AQUI (Scraping)             ║
║                                                                      ║
║  Este script coleta dados REAIS diretamente do site reclameaqui.com ║
║  Executar 3x ao dia: 8h, 14h, 20h                                   ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
`);

updateReputationFromRealData().catch((error) => {
  console.error('💥 Erro crítico ao executar script:', error);
  process.exit(1);
});
