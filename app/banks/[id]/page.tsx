import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BankStatusBadge } from "@/components/bank-status-badge";
import { ScoreBreakdown } from "@/components/score-breakdown";
import { MetricsChart } from "@/components/metrics-chart";
import { mockBanks, mockBankDetails } from "@/lib/mock-data";
import { formatDateTime } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getBankDetails(id: string) {
  const bank = mockBanks.find((b) => b.id === id);

  if (!bank) {
    return null;
  }

  const details = mockBankDetails[id as keyof typeof mockBankDetails];

  return {
    bank,
    score: bank.score,
    breakdown: details?.breakdown ?? null,
    lastScoreDate: bank.lastScoreDate,
    metrics: details?.metrics ?? [],
  };
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 bg-muted animate-pulse rounded w-1/3" />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="h-64 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded" />
      </div>
      <div className="h-96 bg-muted animate-pulse rounded" />
    </div>
  );
}

async function BankDetailsContent({ id }: { id: string }) {
  const data = await getBankDetails(id);

  if (!data) {
    notFound();
  }

  const { bank, score, breakdown, lastScoreDate, metrics } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{bank.name}</h2>
          <p className="text-muted-foreground">
            Banco {bank.type === "digital" ? "Digital" : "Tradicional"} • {bank.country}
          </p>
        </div>
        <Link href="/banks-list">
          <Button variant="outline">Voltar aos Bancos</Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Score Geral de Saúde</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-5xl font-bold">{score.toFixed(1)}</div>
              <div className="flex items-center gap-2">
                <BankStatusBadge score={score} />
              </div>
              {lastScoreDate && (
                <p className="text-sm text-muted-foreground">
                  Última atualização: {formatDateTime(lastScoreDate)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {breakdown && <ScoreBreakdown breakdown={breakdown} />}
      </div>

      {metrics.length > 0 && <MetricsChart metrics={metrics} />}
    </div>
  );
}

export default async function BankDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <BankDetailsContent id={id} />
    </Suspense>
  );
}
