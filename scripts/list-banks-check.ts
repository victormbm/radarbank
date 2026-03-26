import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const banks = await prisma.bank.findMany({
    select: { id: true, name: true, slug: true, cnpj: true },
    orderBy: { name: 'asc' },
  });

  console.log('=== Bancos cadastrados no banco de dados ===');
  banks.forEach((bank, i) => {
    console.log(`${i + 1}. ${bank.name} | slug: ${bank.slug} | cnpj: ${bank.cnpj}`);
  });
  console.log(`\nTotal encontrados: ${banks.length}`);

  // Lista dos 14 bancos monitorados no front (ajuste conforme seu código)
  const monitored = [
    'Nu Pagamentos S.A.',
    'Itaú Unibanco S.A.',
    'Banco do Brasil S.A.',
    'Banco Bradesco S.A.',
    'Caixa Econômica Federal',
    'Banco Santander (Brasil) S.A.',
    'Banco Inter S.A.',
    'Banco C6 S.A.',
    'Banco BTG Pactual S.A.',
    'PagSeguro Internet S.A.',
    'Banco Safra S.A.',
    'Banco Original S.A.',
    'Banco Next S.A.',
    'Neon Pagamentos S.A.'
  ];

  const notMonitored = banks.filter(b => !monitored.includes(b.name));
  if (notMonitored.length > 0) {
    console.log('\n=== Bancos NÃO monitorados pelo front ===');
    notMonitored.forEach(b => {
      console.log(`- ${b.name} | slug: ${b.slug} | cnpj: ${b.cnpj}`);
    });
  } else {
    console.log('\nTodos os bancos cadastrados estão na lista monitorada.');
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => prisma.$disconnect());
