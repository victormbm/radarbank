import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminAccess } from "@/lib/admin-auth";

export const maxDuration = 300; // segundos — permite Vercel Pro/Enterprise

/**
 * POST /api/admin/reseed
 *
 * Re-popula o banco de dados com dados realistas e completos dos 14 bancos.
 * Apaga todos os dados anteriores de bancos/snapshots e recria tudo do zero.
 *
 * Protegido por ADMIN_API_KEY ou CRON_SECRET.
 *
 * Uso:
 *   curl -X POST https://<seu-dominio>/api/admin/reseed \
 *     -H "Authorization: Bearer <ADMIN_API_KEY>"
 */
export async function POST(request: Request) {
  const auth = requireAdminAccess(request);
  if (!auth.allowed) {
    return auth.response;
  }

  const startTime = Date.now();

  try {
    // ------------------------------------------------------------------ //
    //  Dados realistas dos 14 principais bancos brasileiros (Fev 2026)    //
    //  Baseado em dados públicos de balanços e relatórios do BCB          //
    // ------------------------------------------------------------------ //
    const BANKS_REAL_DATA = [
      {
        name: "Nubank",
        slug: "nubank",
        cnpj: "18236120",
        type: "digital",
        segment: "S3",
        metrics: {
          basilRatio: 17.2,
          tier1Ratio: 15.8,
          cet1Ratio: 15.8,
          leverageRatio: 8.5,
          lcr: 245.0,
          nsfr: 165.0,
          quickLiquidity: 180.0,
          loanToDeposit: 45.0,
          roe: 24.5,
          roa: 3.8,
          nim: 12.5,
          costToIncome: 42.0,
          nplRatio: 5.2,
          coverageRatio: 95.0,
          writeOffRate: 4.5,
          creditQuality: 85.0,
          totalAssets: 95000.0,
          equity: 28000.0,
          totalDeposits: 85000.0,
          loanPortfolio: 38000.0,
          assetGrowth: 85.0,
          loanGrowth: 92.0,
          depositGrowth: 78.0,
        },
      },
      {
        name: "Itaú Unibanco",
        slug: "itau",
        cnpj: "60701190",
        type: "traditional",
        segment: "S1",
        metrics: {
          basilRatio: 14.8,
          tier1Ratio: 13.2,
          cet1Ratio: 12.8,
          leverageRatio: 7.2,
          lcr: 158.0,
          nsfr: 118.0,
          quickLiquidity: 42.0,
          loanToDeposit: 78.0,
          roe: 21.5,
          roa: 1.8,
          nim: 8.2,
          costToIncome: 46.0,
          nplRatio: 2.8,
          coverageRatio: 220.0,
          writeOffRate: 2.2,
          creditQuality: 92.0,
          totalAssets: 2850000.0,
          equity: 185000.0,
          totalDeposits: 980000.0,
          loanPortfolio: 765000.0,
          assetGrowth: 8.5,
          loanGrowth: 11.2,
          depositGrowth: 9.8,
        },
      },
      {
        name: "Banco do Brasil",
        slug: "bb",
        cnpj: "00000000",
        type: "traditional",
        segment: "S1",
        metrics: {
          basilRatio: 16.2,
          tier1Ratio: 14.5,
          cet1Ratio: 14.2,
          leverageRatio: 8.1,
          lcr: 165.0,
          nsfr: 125.0,
          quickLiquidity: 38.0,
          loanToDeposit: 72.0,
          roe: 18.2,
          roa: 1.4,
          nim: 7.8,
          costToIncome: 52.0,
          nplRatio: 3.2,
          coverageRatio: 185.0,
          writeOffRate: 2.5,
          creditQuality: 89.0,
          totalAssets: 2680000.0,
          equity: 172000.0,
          totalDeposits: 1050000.0,
          loanPortfolio: 756000.0,
          assetGrowth: 6.2,
          loanGrowth: 8.5,
          depositGrowth: 7.1,
        },
      },
      {
        name: "Bradesco",
        slug: "bradesco",
        cnpj: "60746948",
        type: "traditional",
        segment: "S1",
        metrics: {
          basilRatio: 15.1,
          tier1Ratio: 13.4,
          cet1Ratio: 13.0,
          leverageRatio: 7.5,
          lcr: 152.0,
          nsfr: 115.0,
          quickLiquidity: 35.0,
          loanToDeposit: 82.0,
          roe: 14.8,
          roa: 1.2,
          nim: 7.5,
          costToIncome: 58.0,
          nplRatio: 3.8,
          coverageRatio: 168.0,
          writeOffRate: 3.1,
          creditQuality: 87.0,
          totalAssets: 2150000.0,
          equity: 142000.0,
          totalDeposits: 820000.0,
          loanPortfolio: 672000.0,
          assetGrowth: 4.8,
          loanGrowth: 6.2,
          depositGrowth: 5.5,
        },
      },
      {
        name: "Caixa Econômica Federal",
        slug: "caixa",
        cnpj: "36074390",
        type: "traditional",
        segment: "S1",
        metrics: {
          basilRatio: 18.5,
          tier1Ratio: 16.8,
          cet1Ratio: 16.8,
          leverageRatio: 9.2,
          lcr: 178.0,
          nsfr: 135.0,
          quickLiquidity: 45.0,
          loanToDeposit: 68.0,
          roe: 12.5,
          roa: 0.8,
          nim: 6.8,
          costToIncome: 65.0,
          nplRatio: 2.5,
          coverageRatio: 205.0,
          writeOffRate: 1.8,
          creditQuality: 91.0,
          totalAssets: 2250000.0,
          equity: 95000.0,
          totalDeposits: 1250000.0,
          loanPortfolio: 850000.0,
          assetGrowth: 5.5,
          loanGrowth: 7.8,
          depositGrowth: 6.2,
        },
      },
      {
        name: "Santander Brasil",
        slug: "santander",
        cnpj: "90400888",
        type: "traditional",
        segment: "S1",
        metrics: {
          basilRatio: 14.5,
          tier1Ratio: 12.8,
          cet1Ratio: 12.5,
          leverageRatio: 7.0,
          lcr: 145.0,
          nsfr: 112.0,
          quickLiquidity: 32.0,
          loanToDeposit: 85.0,
          roe: 16.2,
          roa: 1.5,
          nim: 8.8,
          costToIncome: 50.0,
          nplRatio: 3.5,
          coverageRatio: 195.0,
          writeOffRate: 2.8,
          creditQuality: 88.0,
          totalAssets: 1050000.0,
          equity: 95000.0,
          totalDeposits: 580000.0,
          loanPortfolio: 493000.0,
          assetGrowth: 7.2,
          loanGrowth: 9.5,
          depositGrowth: 8.1,
        },
      },
      {
        name: "BTG Pactual",
        slug: "btg",
        cnpj: "30306294",
        type: "traditional",
        segment: "S1",
        metrics: {
          basilRatio: 21.5,
          tier1Ratio: 19.8,
          cet1Ratio: 19.5,
          leverageRatio: 11.2,
          lcr: 285.0,
          nsfr: 182.0,
          quickLiquidity: 95.0,
          loanToDeposit: 35.0,
          roe: 22.8,
          roa: 2.8,
          nim: 5.8,
          costToIncome: 38.0,
          nplRatio: 1.2,
          coverageRatio: 380.0,
          writeOffRate: 0.8,
          creditQuality: 96.0,
          totalAssets: 780000.0,
          equity: 72000.0,
          totalDeposits: 285000.0,
          loanPortfolio: 99750.0,
          assetGrowth: 18.5,
          loanGrowth: 22.0,
          depositGrowth: 20.5,
        },
      },
      {
        name: "Banco Safra",
        slug: "safra",
        cnpj: "58160789",
        type: "traditional",
        segment: "S2",
        metrics: {
          basilRatio: 16.8,
          tier1Ratio: 15.2,
          cet1Ratio: 14.8,
          leverageRatio: 8.8,
          lcr: 172.0,
          nsfr: 128.0,
          quickLiquidity: 48.0,
          loanToDeposit: 65.0,
          roe: 15.5,
          roa: 1.6,
          nim: 7.2,
          costToIncome: 45.0,
          nplRatio: 1.8,
          coverageRatio: 285.0,
          writeOffRate: 1.4,
          creditQuality: 94.0,
          totalAssets: 295000.0,
          equity: 28000.0,
          totalDeposits: 185000.0,
          loanPortfolio: 120250.0,
          assetGrowth: 9.5,
          loanGrowth: 12.0,
          depositGrowth: 10.8,
        },
      },
      {
        name: "Banco Inter",
        slug: "inter",
        cnpj: "00416968",
        type: "digital",
        segment: "S3",
        metrics: {
          basilRatio: 19.5,
          tier1Ratio: 17.8,
          cet1Ratio: 17.5,
          leverageRatio: 9.8,
          lcr: 225.0,
          nsfr: 158.0,
          quickLiquidity: 155.0,
          loanToDeposit: 55.0,
          roe: 12.8,
          roa: 2.2,
          nim: 9.5,
          costToIncome: 58.0,
          nplRatio: 4.5,
          coverageRatio: 125.0,
          writeOffRate: 3.8,
          creditQuality: 82.0,
          totalAssets: 52000.0,
          equity: 14000.0,
          totalDeposits: 38000.0,
          loanPortfolio: 20900.0,
          assetGrowth: 35.0,
          loanGrowth: 42.0,
          depositGrowth: 38.0,
        },
      },
      {
        name: "C6 Bank",
        slug: "c6",
        cnpj: "31872495",
        type: "digital",
        segment: "S3",
        metrics: {
          basilRatio: 18.2,
          tier1Ratio: 16.5,
          cet1Ratio: 16.2,
          leverageRatio: 9.2,
          lcr: 215.0,
          nsfr: 152.0,
          quickLiquidity: 165.0,
          loanToDeposit: 48.0,
          roe: 8.5,
          roa: 1.5,
          nim: 10.2,
          costToIncome: 65.0,
          nplRatio: 5.5,
          coverageRatio: 110.0,
          writeOffRate: 4.8,
          creditQuality: 78.0,
          totalAssets: 38000.0,
          equity: 9500.0,
          totalDeposits: 28000.0,
          loanPortfolio: 13440.0,
          assetGrowth: 45.0,
          loanGrowth: 52.0,
          depositGrowth: 48.0,
        },
      },
      {
        name: "Banco Original",
        slug: "original",
        cnpj: "92894922",
        type: "digital",
        segment: "S3",
        metrics: {
          basilRatio: 16.5,
          tier1Ratio: 14.8,
          cet1Ratio: 14.5,
          leverageRatio: 8.2,
          lcr: 195.0,
          nsfr: 142.0,
          quickLiquidity: 125.0,
          loanToDeposit: 52.0,
          roe: 10.5,
          roa: 1.8,
          nim: 8.8,
          costToIncome: 62.0,
          nplRatio: 4.8,
          coverageRatio: 118.0,
          writeOffRate: 4.2,
          creditQuality: 81.0,
          totalAssets: 28000.0,
          equity: 7200.0,
          totalDeposits: 22000.0,
          loanPortfolio: 11440.0,
          assetGrowth: 22.0,
          loanGrowth: 28.0,
          depositGrowth: 24.0,
        },
      },
      {
        name: "PagBank",
        slug: "pagbank",
        cnpj: "03012230",
        type: "digital",
        segment: "S3",
        metrics: {
          basilRatio: 20.5,
          tier1Ratio: 18.8,
          cet1Ratio: 18.5,
          leverageRatio: 10.5,
          lcr: 265.0,
          nsfr: 175.0,
          quickLiquidity: 195.0,
          loanToDeposit: 38.0,
          roe: 15.5,
          roa: 2.8,
          nim: 11.5,
          costToIncome: 48.0,
          nplRatio: 4.2,
          coverageRatio: 145.0,
          writeOffRate: 3.5,
          creditQuality: 83.0,
          totalAssets: 42000.0,
          equity: 12500.0,
          totalDeposits: 32000.0,
          loanPortfolio: 12160.0,
          assetGrowth: 28.0,
          loanGrowth: 35.0,
          depositGrowth: 30.0,
        },
      },
      {
        name: "Banco Next",
        slug: "next",
        cnpj: "07207996",
        type: "digital",
        segment: "S3",
        metrics: {
          basilRatio: 15.8,
          tier1Ratio: 14.2,
          cet1Ratio: 13.8,
          leverageRatio: 7.8,
          lcr: 185.0,
          nsfr: 138.0,
          quickLiquidity: 115.0,
          loanToDeposit: 55.0,
          roe: 9.2,
          roa: 1.4,
          nim: 9.2,
          costToIncome: 72.0,
          nplRatio: 5.8,
          coverageRatio: 105.0,
          writeOffRate: 5.2,
          creditQuality: 76.0,
          totalAssets: 18000.0,
          equity: 4200.0,
          totalDeposits: 15000.0,
          loanPortfolio: 8250.0,
          assetGrowth: 18.0,
          loanGrowth: 22.0,
          depositGrowth: 19.5,
        },
      },
      {
        name: "Neon",
        slug: "neon",
        cnpj: "21018182",
        type: "digital",
        segment: "S3",
        metrics: {
          basilRatio: 16.2,
          tier1Ratio: 14.5,
          cet1Ratio: 14.2,
          leverageRatio: 8.1,
          lcr: 192.0,
          nsfr: 140.0,
          quickLiquidity: 135.0,
          loanToDeposit: 50.0,
          roe: 7.8,
          roa: 1.2,
          nim: 10.5,
          costToIncome: 75.0,
          nplRatio: 6.2,
          coverageRatio: 98.0,
          writeOffRate: 5.5,
          creditQuality: 74.0,
          totalAssets: 15000.0,
          equity: 3800.0,
          totalDeposits: 12000.0,
          loanPortfolio: 6000.0,
          assetGrowth: 25.0,
          loanGrowth: 30.0,
          depositGrowth: 27.0,
        },
      },
      {
        name: "XP Investimentos",
        slug: "xp",
        cnpj: "02332886",
        type: "digital",
        segment: "S2",
        metrics: {
          basilRatio: 19.2,
          tier1Ratio: 17.5,
          cet1Ratio: 17.2,
          leverageRatio: 9.5,
          lcr: 255.0,
          nsfr: 168.0,
          quickLiquidity: 175.0,
          loanToDeposit: 30.0,
          roe: 18.5,
          roa: 2.5,
          nim: 6.5,
          costToIncome: 52.0,
          nplRatio: 1.5,
          coverageRatio: 320.0,
          writeOffRate: 1.2,
          creditQuality: 93.0,
          totalAssets: 185000.0,
          equity: 32000.0,
          totalDeposits: 125000.0,
          loanPortfolio: 37500.0,
          assetGrowth: 15.0,
          loanGrowth: 18.0,
          depositGrowth: 16.5,
        },
      },
    ];

    // ------------------------------------------------------------------ //
    //  Helpers para datas BCB (fim de trimestre)                         //
    // ------------------------------------------------------------------ //
    function lastBCBQuarterEnd(referenceDate: Date): Date {
      const m = referenceDate.getMonth(); // 0-based
      if (m >= 9) return new Date(referenceDate.getFullYear(), 11, 31);
      if (m >= 6) return new Date(referenceDate.getFullYear(), 8, 30);
      if (m >= 3) return new Date(referenceDate.getFullYear(), 5, 30);
      return new Date(referenceDate.getFullYear() - 1, 11, 31);
    }

    function addQuarters(date: Date, n: number): Date {
      const d = new Date(date);
      d.setMonth(d.getMonth() - n * 3);
      const m = d.getMonth();
      if (m === 11) d.setDate(31);
      else if (m === 8) d.setDate(30);
      else if (m === 5) d.setDate(30);
      else if (m === 2) d.setDate(31);
      return d;
    }

    const now = new Date();
    const latestQuarter = lastBCBQuarterEnd(now);
    const dates: Date[] = [];
    for (let i = 0; i < 6; i++) {
      dates.push(addQuarters(latestQuarter, i));
    }

    // ------------------------------------------------------------------ //
    //  Limpar dados anteriores                                            //
    // ------------------------------------------------------------------ //
    await prisma.bankScore.deleteMany();
    await prisma.bankSnapshot.deleteMany();
    await prisma.metricValue.deleteMany();
    await prisma.bank.deleteMany();

    // ------------------------------------------------------------------ //
    //  Re-criar bancos e snapshots                                        //
    // ------------------------------------------------------------------ //
    let banksCreated = 0;
    let snapshotsCreated = 0;

    for (const bankData of BANKS_REAL_DATA) {
      const bank = await prisma.bank.create({
        data: {
          name: bankData.name,
          slug: bankData.slug,
          cnpj: bankData.cnpj,
          type: bankData.type,
          country: "BR",
          segment: bankData.segment,
        },
      });

      for (let i = 0; i < dates.length; i++) {
        const date = dates[i];
        const variance = 1 - i * 0.02;

        await prisma.bankSnapshot.create({
          data: {
            bankId: bank.id,
            date: date,
            basilRatio: bankData.metrics.basilRatio * variance,
            tier1Ratio: bankData.metrics.tier1Ratio * variance,
            cet1Ratio: bankData.metrics.cet1Ratio * variance,
            leverageRatio: bankData.metrics.leverageRatio * variance,
            lcr: bankData.metrics.lcr * variance,
            nsfr: bankData.metrics.nsfr * variance,
            quickLiquidity: bankData.metrics.quickLiquidity * variance,
            loanToDeposit: bankData.metrics.loanToDeposit * (1 + i * 0.01),
            roe: bankData.metrics.roe * variance,
            roa: bankData.metrics.roa * variance,
            nim: bankData.metrics.nim * variance,
            costToIncome: bankData.metrics.costToIncome * (1 + i * 0.01),
            nplRatio: bankData.metrics.nplRatio * (1 + i * 0.015),
            coverageRatio: bankData.metrics.coverageRatio * variance,
            writeOffRate: bankData.metrics.writeOffRate * (1 + i * 0.01),
            creditQuality: bankData.metrics.creditQuality * variance,
            totalAssets: bankData.metrics.totalAssets * variance,
            equity: bankData.metrics.equity * variance,
            totalDeposits: bankData.metrics.totalDeposits * variance,
            loanPortfolio: bankData.metrics.loanPortfolio * variance,
            assetGrowth: bankData.metrics.assetGrowth,
            loanGrowth: bankData.metrics.loanGrowth,
            depositGrowth: bankData.metrics.depositGrowth,
          },
        });
        snapshotsCreated++;
      }

      banksCreated++;
    }

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: "Reseed concluído com sucesso",
      data: {
        banksCreated,
        snapshotsCreated,
        quartersPerBank: dates.length,
        latestQuarter: latestQuarter.toISOString().split("T")[0],
        duration: `${duration}ms`,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("[reseed] Erro:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erro durante o reseed",
        error: error instanceof Error ? error.message : String(error),
        duration: `${duration}ms`,
      },
      { status: 500 }
    );
  }
}
