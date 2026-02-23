import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BanksTable } from "@/components/banks-table";
import { StatsOverview } from "@/components/stats-overview";

async function getBanksWithScores() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/banks`, {
      cache: 'no-store', // Sempre buscar dados frescos
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch banks');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching banks:', error);
    return [];
  }
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-4 bg-muted animate-pulse rounded w-24" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted animate-pulse rounded w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
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
    </div>
  );
}

async function BanksList() {
  const banks = await getBanksWithScores();

  return (
    <>
      {banks.length > 0 && <StatsOverview banks={banks} />}
      
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
    </>
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
