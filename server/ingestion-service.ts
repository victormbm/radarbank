import { prisma } from "@/lib/db";

interface BankData {
  name: string;
  slug: string;
  type: "digital" | "traditional";
  country: string;
  metrics: {
    basel_ratio: number;
    roe: number;
    quick_liquidity: number;
    npl_ratio: number;
  };
}

export async function seedSampleData() {
  const now = new Date();

  const existingMetrics = await prisma.metric.findMany();
  let baselMetric = existingMetrics.find((m) => m.key === "basel_ratio");
  let roeMetric = existingMetrics.find((m) => m.key === "roe");
  let liquidityMetric = existingMetrics.find((m) => m.key === "quick_liquidity");
  let nplMetric = existingMetrics.find((m) => m.key === "npl_ratio");

  if (!baselMetric) {
    baselMetric = await prisma.metric.create({
      data: { key: "basel_ratio", label: "Basel Capital Ratio", unit: "%", category: "capital" },
    });
  }
  if (!roeMetric) {
    roeMetric = await prisma.metric.create({
      data: { key: "roe", label: "Return on Equity", unit: "%", category: "profitability" },
    });
  }
  if (!liquidityMetric) {
    liquidityMetric = await prisma.metric.create({
      data: { key: "quick_liquidity", label: "Quick Liquidity Ratio", unit: "%", category: "liquidity" },
    });
  }
  if (!nplMetric) {
    nplMetric = await prisma.metric.create({
      data: { key: "npl_ratio", label: "Non-Performing Loans Ratio", unit: "%", category: "credit" },
    });
  }

  const sampleBanks: BankData[] = [
    {
      name: "Santander Brasil",
      slug: "santander",
      type: "traditional",
      country: "BR",
      metrics: { basel_ratio: 16.8, roe: 18.5, quick_liquidity: 142.0, npl_ratio: 3.3 },
    },
    {
      name: "PagBank",
      slug: "pagbank",
      type: "digital",
      country: "BR",
      metrics: { basel_ratio: 17.5, roe: 21.0, quick_liquidity: 155.0, npl_ratio: 2.5 },
    },
  ];

  const results = [];

  for (const data of sampleBanks) {
    let bank = await prisma.bank.findUnique({
      where: { slug: data.slug },
    });

    if (!bank) {
      bank = await prisma.bank.create({
        data: {
          name: data.name,
          slug: data.slug,
          type: data.type,
          country: data.country,
        },
      });
    }

    await prisma.metricValue.createMany({
      data: [
        {
          bankId: bank.id,
          metricId: baselMetric.id,
          date: now,
          value: data.metrics.basel_ratio,
        },
        {
          bankId: bank.id,
          metricId: roeMetric.id,
          date: now,
          value: data.metrics.roe,
        },
        {
          bankId: bank.id,
          metricId: liquidityMetric.id,
          date: now,
          value: data.metrics.quick_liquidity,
        },
        {
          bankId: bank.id,
          metricId: nplMetric.id,
          date: now,
          value: data.metrics.npl_ratio,
        },
      ],
    });

    results.push(bank);
  }

  return results;
}
