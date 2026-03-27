import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BankStatusBadge } from "@/components/bank-status-badge";
import { ScoreBreakdown } from "@/components/score-breakdown";
import { formatDateTime } from "@/lib/utils";
import type { BankDetail } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getBankDetails(id: string) {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");

  if (!host) {
    return null;
  }

  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const response = await fetch(`${protocol}://${host}/api/banks/${id}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as BankDetail;

  if (!data?.bank) {
    return null;
  }

  return {
    bank: data.bank,
    score: data.scores?.totalScore ?? null,
    breakdown: data.scores
      ? {
          capital: data.scores.capitalScore ?? 0,
          liquidity: data.scores.liquidityScore ?? 0,
          profitability: data.scores.profitabilityScore ?? 0,
          credit: data.scores.creditScore ?? 0,
        }
      : null,
    lastScoreDate: data.scores?.date ?? null,
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

  const { bank, score, breakdown, lastScoreDate } = data;

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
              <div className="text-5xl font-bold">{typeof score === "number" ? score.toFixed(1) : "N/A"}</div>
              <div className="flex items-center gap-2">
                {typeof score === "number" ? <BankStatusBadge score={score} /> : null}
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
