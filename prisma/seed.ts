import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  await prisma.metricValue.deleteMany();
  await prisma.bankScore.deleteMany();
  await prisma.metric.deleteMany();
  await prisma.bank.deleteMany();

  const metrics = await Promise.all([
    prisma.metric.create({
      data: {
        key: "basel_ratio",
        label: "Basel Capital Ratio",
        unit: "%",
      },
    }),
    prisma.metric.create({
      data: {
        key: "roe",
        label: "Return on Equity",
        unit: "%",
      },
    }),
    prisma.metric.create({
      data: {
        key: "quick_liquidity",
        label: "Quick Liquidity Ratio",
        unit: "%",
      },
    }),
    prisma.metric.create({
      data: {
        key: "npl_ratio",
        label: "Non-Performing Loans Ratio",
        unit: "%",
      },
    }),
  ]);

  const banks = await Promise.all([
    prisma.bank.create({
      data: {
        name: "Nubank",
        slug: "nubank",
        type: "digital",
        country: "BR",
      },
    }),
    prisma.bank.create({
      data: {
        name: "Itaú Unibanco",
        slug: "itau",
        type: "traditional",
        country: "BR",
      },
    }),
    prisma.bank.create({
      data: {
        name: "Banco do Brasil",
        slug: "bb",
        type: "traditional",
        country: "BR",
      },
    }),
    prisma.bank.create({
      data: {
        name: "Inter",
        slug: "inter",
        type: "digital",
        country: "BR",
      },
    }),
    prisma.bank.create({
      data: {
        name: "Bradesco",
        slug: "bradesco",
        type: "traditional",
        country: "BR",
      },
    }),
    prisma.bank.create({
      data: {
        name: "C6 Bank",
        slug: "c6",
        type: "digital",
        country: "BR",
      },
    }),
  ]);

  const now = new Date();
  const oneMonthAgo = new Date(now);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const bankMetrics = [
    { bank: banks[0], basel: 18.5, roe: 22.0, liquidity: 145.0, npl: 2.8 },
    { bank: banks[1], basel: 16.2, roe: 19.5, liquidity: 135.0, npl: 3.2 },
    { bank: banks[2], basel: 17.8, roe: 18.0, liquidity: 140.0, npl: 3.5 },
    { bank: banks[3], basel: 15.5, roe: 15.5, liquidity: 125.0, npl: 4.0 },
    { bank: banks[4], basel: 16.5, roe: 17.8, liquidity: 138.0, npl: 3.4 },
    { bank: banks[5], basel: 17.0, roe: 20.0, liquidity: 130.0, npl: 3.0 },
  ];

  for (const data of bankMetrics) {
    await prisma.metricValue.createMany({
      data: [
        {
          bankId: data.bank.id,
          metricId: metrics[0].id,
          date: now,
          value: data.basel,
        },
        {
          bankId: data.bank.id,
          metricId: metrics[1].id,
          date: now,
          value: data.roe,
        },
        {
          bankId: data.bank.id,
          metricId: metrics[2].id,
          date: now,
          value: data.liquidity,
        },
        {
          bankId: data.bank.id,
          metricId: metrics[3].id,
          date: now,
          value: data.npl,
        },
        {
          bankId: data.bank.id,
          metricId: metrics[0].id,
          date: oneMonthAgo,
          value: data.basel - 0.5,
        },
        {
          bankId: data.bank.id,
          metricId: metrics[1].id,
          date: oneMonthAgo,
          value: data.roe - 1.0,
        },
        {
          bankId: data.bank.id,
          metricId: metrics[2].id,
          date: oneMonthAgo,
          value: data.liquidity - 5.0,
        },
        {
          bankId: data.bank.id,
          metricId: metrics[3].id,
          date: oneMonthAgo,
          value: data.npl + 0.3,
        },
      ],
    });
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
