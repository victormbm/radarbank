/**
 * Script para verificar e criar usuário demo
 */

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../lib/password';

const prisma = new PrismaClient();

async function main() {
  console.log('Verificando usuário demo...\n');

  const demoEmail = 'demo@bancosegurobr.com';
  const demoPassword = 'demo123';

  // Buscar usuário demo
  const existingUser = await prisma.user.findUnique({
    where: { email: demoEmail },
  });

  if (existingUser) {
    console.log('✓ Usuário demo encontrado:');
    console.log(`  ID: ${existingUser.id}`);
    console.log(`  Nome: ${existingUser.name}`);
    console.log(`  Email: ${existingUser.email}`);
    console.log(`  Criado em: ${existingUser.createdAt}`);
    
    // Atualizar senha para garantir que está correta
    console.log('\nAtualizando senha para "demo123"...');
    const hashedPassword = await hashPassword(demoPassword);
    
    await prisma.user.update({
      where: { id: existingUser.id },
      data: { password: hashedPassword },
    });
    
    console.log('✓ Senha atualizada com sucesso!');
  } else {
    console.log('✗ Usuário demo não encontrado. Criando...\n');
    
    const hashedPassword = await hashPassword(demoPassword);
    
    const user = await prisma.user.create({
      data: {
        email: demoEmail,
        name: 'Demo User',
        password: hashedPassword,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${demoEmail}`,
      },
    });
    
    console.log('✓ Usuário demo criado com sucesso:');
    console.log(`  ID: ${user.id}`);
    console.log(`  Nome: ${user.name}`);
    console.log(`  Email: ${user.email}`);
  }
  
  console.log('\n✓ Credenciais de login:');
  console.log(`  Email: ${demoEmail}`);
  console.log(`  Senha: ${demoPassword}`);
}

main()
  .catch((e) => {
    console.error('Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
