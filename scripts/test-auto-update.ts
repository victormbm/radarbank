/**
 * Script de Teste - Sistema de Atualização Automática
 * 
 * Executa os mesmos passos do CRON job para testar localmente
 */

import { ingestBCBData } from '../server/bcb-data-service';
import { computeScoresForAllBanks } from '../server/scoring-service';
import {
  checkForNewData,
  getLastUpdateMetadata,
  detectSignificantChanges,
} from '../lib/update-tracker';

async function testAutoUpdate() {
  console.log('🧪 TESTE: Sistema de Atualização Automática\n');
  console.log('=' .repeat(60));

  try {
    // PASSO 1: Status atual
    console.log('\n📊 PASSO 1: Verificando status atual...\n');
    const currentStatus = await getLastUpdateMetadata();
    
    if (currentStatus) {
      console.log('✅ Última atualização encontrada:');
      console.log(`   Data: ${currentStatus.lastUpdateDate}`);
      console.log(`   Referência: ${currentStatus.dataReferenceDate}`);
      console.log(`   Bancos: ${currentStatus.banksUpdated}`);
      console.log(`   Scores: ${currentStatus.scoresComputed}`);
    } else {
      console.log('⚠️  Nenhuma atualização anterior encontrada');
    }

    // PASSO 2: Verificar novos dados
    console.log('\n🔍 PASSO 2: Verificando disponibilidade de novos dados...\n');
    const checkResult = await checkForNewData();
    
    console.log(`   ${checkResult.message}`);
    console.log(`   Novos dados disponíveis: ${checkResult.hasNewDataAvailable ? 'SIM ✅' : 'NÃO ❌'}`);
    
    if (!checkResult.hasNewDataAvailable) {
      console.log('\n✅ Sistema está atualizado. Nada a fazer.\n');
      process.exit(0);
    }

    // PASSO 3: Ingerir dados
    console.log('\n📥 PASSO 3: Ingerindo dados do BCB...\n');
    const ingestionStart = Date.now();
    const ingestionResult = await ingestBCBData();
    const ingestionTime = Date.now() - ingestionStart;

    if (!ingestionResult.success) {
      console.error(`❌ Falha na ingestão: ${ingestionResult.error}`);
      process.exit(1);
    }

    console.log(`✅ Ingestão concluída em ${ingestionTime}ms`);
    console.log(`   Bancos processados: ${ingestionResult.banksProcessed}`);
    console.log(`   Snapshots criados: ${ingestionResult.snapshotsCreated}`);
    console.log(`   Nova referência: ${ingestionResult.latestReferenceDate}`);

    // PASSO 4: Recomputar scores
    console.log('\n🧮 PASSO 4: Recomputando scores...\n');
    const scoringStart = Date.now();
    const scoringResult = await computeScoresForAllBanks();
    const scoringTime = Date.now() - scoringStart;

    if (!scoringResult.success) {
      console.warn(`⚠️  Falha parcial no scoring: ${scoringResult.error}`);
    } else {
      console.log(`✅ Scoring concluído em ${scoringTime}ms`);
      console.log(`   Scores computados: ${scoringResult.scoresComputed}`);
    }

    // PASSO 5: Detectar mudanças
    if (currentStatus && ingestionResult.latestReferenceDate) {
      console.log('\n🔍 PASSO 5: Detectando mudanças significativas...\n');
      
      const changes = await detectSignificantChanges(
        currentStatus.dataReferenceDate,
        ingestionResult.latestReferenceDate
      );

      if (changes.length > 0) {
        console.log(`⚠️  ${changes.length} mudanças significativas detectadas:\n`);
        
        const critical = changes.filter(c => c.severity === 'critical');
        const high = changes.filter(c => c.severity === 'high');
        const medium = changes.filter(c => c.severity === 'medium');
        
        console.log(`   Críticas: ${critical.length}`);
        console.log(`   Altas: ${high.length}`);
        console.log(`   Médias: ${medium.length}\n`);
        
        console.log('Detalhes:\n');
        changes.forEach((change, i) => {
          const arrow = change.changePercent > 0 ? '↑' : '↓';
          const emoji = change.severity === 'critical' ? '🔴' : 
                       change.severity === 'high' ? '🟠' : '🟡';
          
          console.log(`${i + 1}. ${emoji} ${change.bankName}`);
          console.log(`   Métrica: ${change.metric}`);
          console.log(`   ${change.oldValue.toFixed(2)} → ${change.newValue.toFixed(2)} (${arrow} ${Math.abs(change.changePercent).toFixed(1)}%)`);
          console.log(`   Severidade: ${change.severity}\n`);
        });
      } else {
        console.log('✅ Nenhuma mudança significativa detectada');
      }
    }

    // Resumo final
    console.log('\n' + '='.repeat(60));
    console.log('✅ TESTE CONCLUÍDO COM SUCESSO\n');
    console.log('Resumo:');
    console.log(`   Bancos atualizados: ${ingestionResult.banksProcessed}`);
    console.log(`   Scores computados: ${scoringResult.scoresComputed || 0}`);
    console.log(`   Tempo total: ${Date.now() - ingestionStart}ms`);
    console.log('='.repeat(60) + '\n');

  } catch (error: any) {
    console.error('\n❌ ERRO DURANTE TESTE:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Executar
testAutoUpdate()
  .then(() => {
    console.log('👋 Encerrando...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
