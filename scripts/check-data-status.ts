import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDataStatus() {
  console.log('📊 Status dos Dados do Banco:\n');
  
  const banks = await prisma.bank.count();
  const snapshots = await prisma.bankSnapshot.count();
  const latestSnapshot = await prisma.bankSnapshot.findFirst({
    orderBy: { date: 'desc' },
    include: { bank: true }
  });
  
  const banksWithData = await prisma.bank.findMany({
    include: {
      snapshots: {
        orderBy: { date: 'desc' },
        take: 1
      }
    },
    take: 5
  });
  
  console.log(`✅ Total de Bancos: ${banks}`);
  console.log(`✅ Total de Snapshots: ${snapshots}`);
  console.log(`✅ Última atualização: ${latestSnapshot?.date.toISOString().split('T')[0]}`);
  console.log(`\n📈 Exemplos de dados disponíveis:`);
  
  for (const bank of banksWithData) {
    const latest = bank.snapshots[0];
    if (latest) {
      console.log(`\n  🏦 ${bank.name}:`);
      console.log(`     - Basileia: ${latest.basilRatio}%`);
      console.log(`     - ROE: ${latest.roe}%`);
      console.log(`     - NPL: ${latest.nplRatio}%`);
      console.log(`     - Ativos: R$ ${latest.totalAssets?.toLocaleString('pt-BR')}M`);
    }
  }
  
  console.log('\n✨ Dados prontos para agregar valor aos usuários!');
  
  await prisma.$disconnect();
}

checkDataStatus().catch(console.error);
