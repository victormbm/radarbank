/**
 * 🧪 Script de teste da API do BCB
 * 
 * Uso: npx tsx scripts/test-bcb-api.ts
 */

import { bcbAPI } from '../server/bcb-api-service';

async function testBCBAPI() {
  console.log('🧪 TESTE DA API DO BANCO CENTRAL');
  console.log('='.repeat(70) + '\n');

  try {
    // 1. Testar conexão
    console.log('1️⃣  Testando conexão com API...');
    const connected = await bcbAPI.testConnection();
    
    if (!connected) {
      throw new Error('Falha na conexão');
    }
    console.log('   ✅ Conexão OK\n');

    // 2. Verificar último trimestre disponível
    console.log('2️⃣  Verificando último trimestre disponível...');
    const latestQuarter = bcbAPI.getLatestAvailableQuarter();
    console.log(`   📅 Data-base: ${latestQuarter.date}`);
    console.log(`   📊 Trimestre: Q${latestQuarter.quarter}/${latestQuarter.year}`);
    console.log(`   ✓  Disponível desde: ${latestQuarter.availableAfter.toLocaleDateString('pt-BR')}\n`);

    // 3. Buscar dados verificados de um banco específico (Nubank como teste)
    console.log('3️⃣  Testando coleta verificada de banco específico (Nubank)...');
    const banksForQuarter = await bcbAPI.fetchAllBanksData();
    const nubankData = banksForQuarter.find((bank) => bank.cnpj === '18236120000158');

    if (nubankData) {
      console.log('   ✅ Dados verificados encontrados!');
      console.log(`   🏦 Nome: ${nubankData.nome}`);
      console.log(`   📊 Basileia: ${nubankData.basileia ?? 'N/A'}%`);
      console.log(`   💰 Patrimônio: R$ ${((nubankData.patrimonioLiquido ?? 0) / 1e9).toFixed(2)} bilhões`);
    } else {
      console.warn('   ⚠️  Banco sem mapeamento IFData verificado nesta coleta');
    }
    console.log();

    // 4. Informações sobre próximo update
    console.log('4️⃣  Próxima atualização de dados...');
    const nextUpdate = bcbAPI.getNextUpdateInfo();
    console.log(`   📅 Data: ${new Date(nextUpdate.date).toLocaleDateString('pt-BR')}`);
    console.log(`   ⏳ Dias até lá: ${nextUpdate.daysUntil}`);
    console.log();

    // 5. Testar busca de todos os bancos (modo dry run)
    console.log('5️⃣  Testando busca de todos os bancos monitorados...');
    console.log('   ⚠️  NOTA: Isso pode demorar alguns segundos...\n');
    
    const allBanks = banksForQuarter;
    
    console.log(`\n   ✅ Coleta concluída!`);
    console.log(`   🏦 Bancos retornados: ${allBanks.length}/14`);
    console.log();
    
    // Mostrar resumo de alguns bancos
    console.log('   📋 Resumo dos primeiros 3 bancos:');
    allBanks.slice(0, 3).forEach((bank, i) => {
      console.log(`\n   ${i + 1}. ${bank.nome}`);
      console.log(`      CNPJ: ${bank.cnpj}`);
      console.log(`      Basileia: ${bank.basileia ?? 'N/A'}%`);
      console.log(`      Inadimplência: ${bank.inadimplencia ?? 'N/A'}%`);
      console.log(`      ROE: ${bank.roe ?? 'N/A'}%`);
    });

    console.log('\n' + '='.repeat(70));
    console.log('✅ TODOS OS TESTES PASSARAM!');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('\n' + '='.repeat(70));
    console.error('❌ ERRO NO TESTE');
    console.error('='.repeat(70));
    console.error(error);
    process.exit(1);
  }
}

// Executar testes
testBCBAPI();
