import { PrismaClient, Role, BenefitType, PointsTransactionType, KyoskStatus, KyoskProductStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function cleanMemberCardsAndBenefits() {
  console.log('🧹 Limpando dados existentes...');

  // Kyosk data
  await prisma.kyoskOrderItem.deleteMany({});
  await prisma.kyoskOrder.deleteMany({});
  await prisma.kyoskStockMovement.deleteMany({});
  await prisma.kyoskProduct.deleteMany({});
  await prisma.kyosk.deleteMany({});

  // Store data
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.cart.deleteMany({});
  await prisma.stockMovement.deleteMany({});
  await prisma.storeItem.deleteMany({});
  await prisma.pointsTransaction.deleteMany({});
  await prisma.pointsBalance.deleteMany({});
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

async function seedPointsBalance(users: {
  admin: { id: string };
  colaborador1: { id: string };
  colaborador2: { id: string };
}) {
  console.log('\n⭐ Criando PointsBalance...');

  const adminBalance = await prisma.pointsBalance.create({
    data: {
      userId: users.admin.id,
      balance: 500,
      transactions: {
        create: {
          type: PointsTransactionType.CREDIT,
          amount: 500,
          description: 'Bônus inicial de administrador',
        },
      },
    },
  });

  const colaborador1Balance = await prisma.pointsBalance.create({
    data: {
      userId: users.colaborador1.id,
      balance: 150,
      transactions: {
        create: {
          type: PointsTransactionType.CREDIT,
          amount: 150,
          description: 'Bônus de boas-vindas',
        },
      },
    },
  });

  const colaborador2Balance = await prisma.pointsBalance.create({
    data: {
      userId: users.colaborador2.id,
      balance: 75,
      transactions: {
        create: {
          type: PointsTransactionType.CREDIT,
          amount: 75,
          description: 'Bônus de boas-vindas',
        },
      },
    },
  });

  console.log('✅ PointsBalance criados:');
  console.log(`   Admin: ${adminBalance.balance} pontos`);
  console.log(`   João: ${colaborador1Balance.balance} pontos`);
  console.log(`   Maria: ${colaborador2Balance.balance} pontos`);

  return { adminBalance, colaborador1Balance, colaborador2Balance };
}

async function seedStoreItems() {
  console.log('\n🛍️ Criando itens da loja...');

  const items = await Promise.all([
    prisma.storeItem.create({
      data: {
        name: 'Camiseta A-hub',
        description: 'Camiseta oficial da Associação Cristofoli, 100% algodão',
        pointsPrice: 50,
        stock: 20,
        photos: [],
        isActive: true,
        stockHistory: {
          create: {
            quantity: 20,
            reason: 'Estoque inicial',
          },
        },
      },
    }),
    prisma.storeItem.create({
      data: {
        name: 'Caneca Personalizada',
        description: 'Caneca de cerâmica com logo da associação',
        pointsPrice: 30,
        stock: 50,
        photos: [],
        isActive: true,
        stockHistory: {
          create: {
            quantity: 50,
            reason: 'Estoque inicial',
          },
        },
      },
    }),
    prisma.storeItem.create({
      data: {
        name: 'Chaveiro',
        description: 'Chaveiro metálico com brasão da associação',
        pointsPrice: 10,
        stock: 100,
        photos: [],
        isActive: true,
        stockHistory: {
          create: {
            quantity: 100,
            reason: 'Estoque inicial',
          },
        },
      },
    }),
    prisma.storeItem.create({
      data: {
        name: 'Boné Esportivo',
        description: 'Boné com ajuste traseiro e logo bordado',
        pointsPrice: 35,
        stock: 30,
        photos: [],
        isActive: true,
        stockHistory: {
          create: {
            quantity: 30,
            reason: 'Estoque inicial',
          },
        },
      },
    }),
    prisma.storeItem.create({
      data: {
        name: 'Ecobag',
        description: 'Sacola ecológica reutilizável',
        pointsPrice: 15,
        stock: 80,
        photos: [],
        isActive: true,
        stockHistory: {
          create: {
            quantity: 80,
            reason: 'Estoque inicial',
          },
        },
      },
    }),
    prisma.storeItem.create({
      data: {
        name: 'Kit Escritório',
        description: 'Caneta, bloco de notas e porta-cartões',
        pointsPrice: 25,
        stock: 40,
        photos: [],
        isActive: true,
        stockHistory: {
          create: {
            quantity: 40,
            reason: 'Estoque inicial',
          },
        },
      },
    }),
  ]);

  console.log('✅ Itens da loja criados:');
  items.forEach((item) => console.log(`   - ${item.name}: ${item.pointsPrice} pts (${item.stock} em estoque)`));

  return items;
}

async function seedKyosks() {
  console.log('\n🏪 Criando Kyosks...');

  // Kyosk Cantina
  const cantina = await prisma.kyosk.create({
    data: {
      name: 'Cantina Central',
      description: 'Ponto de venda de lanches e bebidas na entrada principal',
      status: KyoskStatus.ACTIVE,
      lowStockThreshold: 5,
      products: {
        create: [
          {
            name: 'Água Mineral 500ml',
            description: 'Água mineral sem gás',
            pointsPrice: 5,
            stock: 50,
            status: KyoskProductStatus.ACTIVE,
            stockHistory: {
              create: {
                quantity: 50,
                reason: 'Estoque inicial',
              },
            },
          },
          {
            name: 'Refrigerante Lata',
            description: 'Refrigerante 350ml - diversos sabores',
            pointsPrice: 8,
            stock: 40,
            status: KyoskProductStatus.ACTIVE,
            stockHistory: {
              create: {
                quantity: 40,
                reason: 'Estoque inicial',
              },
            },
          },
          {
            name: 'Salgado Assado',
            description: 'Salgado assado - coxinha, esfiha ou empada',
            pointsPrice: 10,
            stock: 30,
            status: KyoskProductStatus.ACTIVE,
            stockHistory: {
              create: {
                quantity: 30,
                reason: 'Estoque inicial',
              },
            },
          },
          {
            name: 'Café Expresso',
            description: 'Café expresso tradicional',
            pointsPrice: 6,
            stock: 100,
            status: KyoskProductStatus.ACTIVE,
            stockHistory: {
              create: {
                quantity: 100,
                reason: 'Estoque inicial',
              },
            },
          },
          {
            name: 'Barra de Cereal',
            description: 'Barra de cereal integral',
            pointsPrice: 7,
            stock: 3,
            status: KyoskProductStatus.ACTIVE,
            stockHistory: {
              create: {
                quantity: 3,
                reason: 'Estoque inicial',
              },
            },
          },
        ],
      },
    },
    include: {
      products: true,
    },
  });

  // Kyosk Piscina
  const piscina = await prisma.kyosk.create({
    data: {
      name: 'Quiosque Piscina',
      description: 'Ponto de venda na área da piscina',
      status: KyoskStatus.ACTIVE,
      lowStockThreshold: 3,
      products: {
        create: [
          {
            name: 'Água de Coco',
            description: 'Água de coco natural 300ml',
            pointsPrice: 12,
            stock: 25,
            status: KyoskProductStatus.ACTIVE,
            stockHistory: {
              create: {
                quantity: 25,
                reason: 'Estoque inicial',
              },
            },
          },
          {
            name: 'Sorvete Picolé',
            description: 'Picolé de frutas',
            pointsPrice: 8,
            stock: 40,
            status: KyoskProductStatus.ACTIVE,
            stockHistory: {
              create: {
                quantity: 40,
                reason: 'Estoque inicial',
              },
            },
          },
          {
            name: 'Protetor Solar',
            description: 'Protetor solar FPS 30 - sachê',
            pointsPrice: 15,
            stock: 2,
            status: KyoskProductStatus.ACTIVE,
            stockHistory: {
              create: {
                quantity: 2,
                reason: 'Estoque inicial',
              },
            },
          },
          {
            name: 'Toalha Descartável',
            description: 'Toalha descartável para uso na piscina',
            pointsPrice: 20,
            stock: 15,
            status: KyoskProductStatus.ACTIVE,
            stockHistory: {
              create: {
                quantity: 15,
                reason: 'Estoque inicial',
              },
            },
          },
        ],
      },
    },
    include: {
      products: true,
    },
  });

  // Kyosk Inativo (para teste)
  const quadra = await prisma.kyosk.create({
    data: {
      name: 'Quiosque Quadra',
      description: 'Ponto de venda na quadra poliesportiva (em manutenção)',
      status: KyoskStatus.INACTIVE,
      lowStockThreshold: 5,
      products: {
        create: [
          {
            name: 'Isotônico 500ml',
            description: 'Bebida isotônica para esportistas',
            pointsPrice: 10,
            stock: 20,
            status: KyoskProductStatus.ACTIVE,
            stockHistory: {
              create: {
                quantity: 20,
                reason: 'Estoque inicial',
              },
            },
          },
        ],
      },
    },
    include: {
      products: true,
    },
  });

  console.log('✅ Kyosks criados:');
  console.log(`   🟢 ${cantina.name} - ${cantina.products.length} produtos`);
  cantina.products.forEach((p) => console.log(`      - ${p.name}: ${p.pointsPrice} pts (${p.stock} un.)`));
  console.log(`   🟢 ${piscina.name} - ${piscina.products.length} produtos`);
  piscina.products.forEach((p) => console.log(`      - ${p.name}: ${p.pointsPrice} pts (${p.stock} un.)`));
  console.log(`   🔴 ${quadra.name} - ${quadra.products.length} produtos (INATIVO)`);

  return { cantina, piscina, quadra };
}

async function main() {
  console.log('🌱 Iniciando seed...');

  // Limpar dados existentes
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

  // Criar PointsBalance para usuários
  await seedPointsBalance({ admin, colaborador1, colaborador2 });

  // Criar itens da loja
  await seedStoreItems();

  // Criar Kyosks
  await seedKyosks();

  console.log('\n🎉 Seed concluído com sucesso!');
  console.log('\n📋 Credenciais de acesso:');
  console.log('┌─────────────────────────────────────────────────────┐');
  console.log('│ ADMIN                                               │');
  console.log('│ Email: admin@cristofoli.com.br                      │');
  console.log('│ Senha: admin123                                     │');
  console.log('│ Pontos: 500                                         │');
  console.log('├─────────────────────────────────────────────────────┤');
  console.log('│ COLABORADOR                                         │');
  console.log('│ Email: joao@cristofoli.com.br                       │');
  console.log('│ Senha: user123                                      │');
  console.log('│ Pontos: 150                                         │');
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
