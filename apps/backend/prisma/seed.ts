import { PrismaClient, Role, BenefitType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function cleanMemberCardsAndBenefits() {
  console.log('🧹 Limpando MemberCards e Benefits existentes...');

  await prisma.memberCard.deleteMany({});
  await prisma.benefit.deleteMany({});

  console.log('✅ Dados anteriores removidos');
}

async function seedMemberCards(users: { admin: { id: string }; colaborador1: { id: string } }) {
  console.log('\n💳 Criando MemberCards...');

  const adminCard = await prisma.memberCard.upsert({
    where: { matricula: 1 },
    update: {},
    create: {
      userId: users.admin.id,
      matricula: 1,
      photo: null,
    },
  });

  const colaboradorCard = await prisma.memberCard.upsert({
    where: { matricula: 2 },
    update: {},
    create: {
      userId: users.colaborador1.id,
      matricula: 2,
      photo: null,
    },
  });

  console.log('✅ MemberCards criados:');
  console.log(`   Admin (matrícula: ${adminCard.matricula}) - QR: ${adminCard.qrCode}`);
  console.log(`   Colaborador (matrícula: ${colaboradorCard.matricula}) - QR: ${colaboradorCard.qrCode}`);

  return { adminCard, colaboradorCard };
}

async function seedBenefits() {
  console.log('\n🎁 Criando Benefits...');

  // Discounts
  const discounts = await Promise.all([
    prisma.benefit.create({
      data: {
        type: BenefitType.DISCOUNT,
        name: 'Restaurante Bella Italia',
        description: '15% de desconto em refeições',
        photos: [],
        city: 'Curitiba',
        street: 'Rua das Flores',
        number: '245',
        neighborhood: 'Centro',
      },
    }),
    prisma.benefit.create({
      data: {
        type: BenefitType.DISCOUNT,
        name: 'Farmácia Saúde',
        description: '10% de desconto em medicamentos',
        photos: [],
        city: 'Curitiba',
        street: 'Avenida Brasil',
        number: '1500',
        neighborhood: 'Batel',
      },
    }),
    prisma.benefit.create({
      data: {
        type: BenefitType.DISCOUNT,
        name: 'Academia Fitness Plus',
        description: '20% de desconto na mensalidade',
        photos: [],
        city: 'Curitiba',
        street: 'Rua XV de Novembro',
        number: '890',
        neighborhood: 'Centro',
      },
    }),
  ]);

  // Partnerships
  const partnerships = await Promise.all([
    prisma.benefit.create({
      data: {
        type: BenefitType.PARTNERSHIP,
        name: 'Clínica Odontológica Sorriso',
        description: 'Convênio com condições especiais',
        photos: [],
        city: 'Curitiba',
        street: 'Rua Marechal Deodoro',
        number: '320',
        neighborhood: 'Centro Cívico',
      },
    }),
    prisma.benefit.create({
      data: {
        type: BenefitType.PARTNERSHIP,
        name: 'Laboratório de Análises Clínicas',
        description: 'Atendimento preferencial',
        photos: [],
        city: 'Curitiba',
        street: 'Avenida Sete de Setembro',
        number: '4500',
        neighborhood: 'Batel',
      },
    }),
    prisma.benefit.create({
      data: {
        type: BenefitType.PARTNERSHIP,
        name: 'Ótica Visão Clara',
        description: 'Parcelamento especial para associados',
        photos: [],
        city: 'Curitiba',
        street: 'Rua Comendador Araújo',
        number: '78',
        neighborhood: 'Centro',
      },
    }),
  ]);

  console.log('✅ Benefits criados:');
  console.log('   Descontos:');
  discounts.forEach((d) => console.log(`     - ${d.name}: ${d.description}`));
  console.log('   Parcerias:');
  partnerships.forEach((p) => console.log(`     - ${p.name}: ${p.description}`));

  return { discounts, partnerships };
}

async function main() {
  console.log('🌱 Iniciando seed...');

  // Limpar dados existentes de MemberCards e Benefits
  await cleanMemberCardsAndBenefits();

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

  // Criar MemberCards (apenas para admin e colaboradores, não para DISPLAY)
  await seedMemberCards({ admin, colaborador1 });

  // Criar Benefits
  await seedBenefits();

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
