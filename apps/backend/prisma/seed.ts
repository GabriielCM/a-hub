import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // Criar usuários
  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@cristofoli.com.br' },
    update: {},
    create: {
      email: 'admin@cristofoli.com.br',
      name: 'Administrador',
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  const colaborador1 = await prisma.user.upsert({
    where: { email: 'joao@cristofoli.com.br' },
    update: {},
    create: {
      email: 'joao@cristofoli.com.br',
      name: 'João Silva',
      password: userPassword,
      role: Role.COLLABORATOR,
    },
  });

  const colaborador2 = await prisma.user.upsert({
    where: { email: 'maria@cristofoli.com.br' },
    update: {},
    create: {
      email: 'maria@cristofoli.com.br',
      name: 'Maria Santos',
      password: userPassword,
      role: Role.COLLABORATOR,
    },
  });

  const display = await prisma.user.upsert({
    where: { email: 'display@cristofoli.com.br' },
    update: {},
    create: {
      email: 'display@cristofoli.com.br',
      name: 'Display Recepção',
      password: await bcrypt.hash('display123', 10),
      role: Role.DISPLAY,
    },
  });

  console.log('✅ Usuários criados:');
  console.log(`   Admin: ${admin.email} (senha: admin123)`);
  console.log(`   Colaborador: ${colaborador1.email} (senha: user123)`);
  console.log(`   Colaborador: ${colaborador2.email} (senha: user123)`);
  console.log(`   Display: ${display.email} (senha: display123)`);

  // Criar espaços de exemplo
  const salaoFestas = await prisma.space.upsert({
    where: { name: 'Salão de Festas' },
    update: {},
    create: {
      name: 'Salão de Festas',
      value: 500.0,
      description: 'Amplo salão para eventos e confraternizações. Capacidade para 100 pessoas.',
      photos: [],
    },
  });

  const churrasqueira = await prisma.space.upsert({
    where: { name: 'Churrasqueira' },
    update: {},
    create: {
      name: 'Churrasqueira',
      value: 300.0,
      description: 'Área de churrasqueira coberta com mesas e bancos. Capacidade para 30 pessoas.',
      photos: [],
    },
  });

  const quadra = await prisma.space.upsert({
    where: { name: 'Quadra Poliesportiva' },
    update: {},
    create: {
      name: 'Quadra Poliesportiva',
      value: 150.0,
      description: 'Quadra coberta para futsal, vôlei e basquete.',
      photos: [],
    },
  });

  const piscina = await prisma.space.upsert({
    where: { name: 'Piscina' },
    update: {},
    create: {
      name: 'Piscina',
      value: 200.0,
      description: 'Piscina adulto e infantil com área de descanso.',
      photos: [],
    },
  });

  const salaReuniao = await prisma.space.upsert({
    where: { name: 'Sala de Reuniões' },
    update: {},
    create: {
      name: 'Sala de Reuniões',
      value: 100.0,
      description: 'Sala climatizada com projetor e videoconferência. Capacidade para 15 pessoas.',
      photos: [],
    },
  });

  console.log('\n✅ Espaços criados:');
  console.log(`   ${salaoFestas.name} - R$ ${salaoFestas.value}`);
  console.log(`   ${churrasqueira.name} - R$ ${churrasqueira.value}`);
  console.log(`   ${quadra.name} - R$ ${quadra.value}`);
  console.log(`   ${piscina.name} - R$ ${piscina.value}`);
  console.log(`   ${salaReuniao.name} - R$ ${salaReuniao.value}`);

  console.log('\n🎉 Seed concluído com sucesso!');
  console.log('\n📋 Credenciais de acesso:');
  console.log('┌─────────────────────────────────────────────────────┐');
  console.log('│ ADMIN                                               │');
  console.log('│ Email: admin@cristofoli.com.br                      │');
  console.log('│ Senha: admin123                                     │');
  console.log('├─────────────────────────────────────────────────────┤');
  console.log('│ COLABORADOR                                         │');
  console.log('│ Email: joao@cristofoli.com.br                       │');
  console.log('│ Senha: user123                                      │');
  console.log('└─────────────────────────────────────────────────────┘');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
