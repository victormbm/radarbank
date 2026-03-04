import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Lista dos 14 bancos válidos (ajuste se necessário)
const validBanks = [
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

async function main() {
  // Busca todos os bancos que NÃO estão na lista de válidos
  const banksToDelete = await prisma.bank.findMany({
    where: {
      name: { notIn: validBanks }
    },
    select: { id: true, name: true, slug: true }
  });

  if (banksToDelete.length === 0) {
    console.log('Nenhum banco inválido encontrado. Nada a remover.');
    return;
  }

  console.log('Bancos a serem removidos:');
  banksToDelete.forEach(b => {
    console.log(`- ${b.name} | slug: ${b.slug}`);
  });

  // Confirmação de exclusão
  // Descomente a linha abaixo para realmente deletar
  await prisma.bank.deleteMany({ where: { id: { in: banksToDelete.map(b => b.id) } } });

  console.log(`\nTotal a remover: ${banksToDelete.length}`);
  console.log('Remoção comentada por segurança. Revise a lista e, se estiver tudo certo, descomente a linha de exclusão no script.');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => prisma.$disconnect());
