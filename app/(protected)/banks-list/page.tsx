import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BanksTable } from "@/components/banks-table";
import { mockBanks } from "@/lib/mock-data";

async function getBanksWithScores() {
  return mockBanks;
}

function LoadingSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Visão Geral dos Bancos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

async function BanksList() {
  const banks = await getBanksWithScores();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visão Geral dos Bancos</CardTitle>
      </CardHeader>
      <CardContent>
        {banks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum banco encontrado.
          </div>
        ) : (
          <BanksTable banks={banks} />
        )}
      </CardContent>
    </Card>
  );
}

export default function BanksListPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
          Bancos
        </h2>
        <p className="text-slate-600">
          Monitore scores de saúde de todos os bancos rastreados
        </p>
      </div>
      <Suspense fallback={<LoadingSkeleton />}>
        <BanksList />
      </Suspense>
    </div>
  );
}
