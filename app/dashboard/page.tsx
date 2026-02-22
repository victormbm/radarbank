"use client";

import { type ReactNode, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockBanks, mockBankDetails } from "@/lib/mock-data";
import { BankStatusBadge } from "@/components/bank-status-badge";
import { Building2, ShieldCheck, TriangleAlert, WalletCards } from "lucide-react";

const BASEL_MIN = 11;

const brazilTopBanks = [
  "Itaú Unibanco",
  "Bradesco",
  "Banco do Brasil",
  "Caixa Econômica Federal",
  "Santander Brasil",
  "Nubank",
  "Inter",
  "C6 Bank",
  "BTG Pactual",
  "Safra",
];

export default function DashboardPage() {
  const [selectedBankNames, setSelectedBankNames] = useState<string[]>([
    "Itaú Unibanco",
    "Banco do Brasil",
    "Nubank",
    "Inter",
    "Bradesco",
  ]);

  const banksInFocus = useMemo(() => {
    if (selectedBankNames.length === 0) {
      return mockBanks;
    }

    return mockBanks.filter((bank) => selectedBankNames.includes(bank.name));
  }, [selectedBankNames]);

  const dashboardMetrics = useMemo(() => {
    const averageScore =
      banksInFocus.reduce((acc, bank) => acc + bank.score, 0) /
      (banksInFocus.length || 1);

    const criticalBanks = banksInFocus.filter((bank) => bank.score < 50).length;
    const warningBanks = banksInFocus.filter(
      (bank) => bank.score >= 50 && bank.score < 70
    ).length;

    const banksIdsInFocus = new Set(banksInFocus.map((bank) => bank.id));

    const baselBelowMinimum = Object.entries(mockBankDetails)
      .filter(([id]) => banksIdsInFocus.has(id))
      .flatMap(([, details]) => details.metrics)
      .filter((metric) => metric.metric.key === "basel_ratio")
      .filter((metric) => metric.value < BASEL_MIN).length;

    return {
      averageScore,
      criticalBanks,
      warningBanks,
      baselBelowMinimum,
    };
  }, [banksInFocus]);

  const toggleBankSelection = (bankName: string) => {
    setSelectedBankNames((current) => {
      if (current.includes(bankName)) {
        return current.filter((name) => name !== bankName);
      }

      return [...current, bankName];
    });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-purple-100 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 p-6 text-white shadow-xl">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Radar Bank • Dashboard Executivo</h1>
            <p className="mt-2 max-w-2xl text-sm text-purple-100">
              Interface moderna para antecipar risco bancário com foco em capital (Basileia), liquidez,
              rentabilidade e sinais preventivos.
            </p>
          </div>
          <Badge className="bg-white/20 text-white hover:bg-white/20">Front-end preparado para plugar backend</Badge>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl"><Building2 className="h-5 w-5" />Bancos em foco (Brasil)</CardTitle>
          <CardDescription>
            Selecione os principais bancos atendendo o Brasil para personalizar seu radar.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {brazilTopBanks.map((bankName) => {
            const isSelected = selectedBankNames.includes(bankName);

            return (
              <Button
                key={bankName}
                variant={isSelected ? "default" : "outline"}
                className={isSelected ? "gradient-primary" : ""}
                onClick={() => toggleBankSelection(bankName)}
              >
                {bankName}
              </Button>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Score médio" value={dashboardMetrics.averageScore.toFixed(1)} icon={<ShieldCheck className="h-4 w-4" />} />
        <MetricCard label="Bancos críticos" value={String(dashboardMetrics.criticalBanks)} icon={<TriangleAlert className="h-4 w-4" />} />
        <MetricCard label="Bancos em alerta" value={String(dashboardMetrics.warningBanks)} icon={<TriangleAlert className="h-4 w-4" />} />
        <MetricCard label="Basileia < 11%" value={String(dashboardMetrics.baselBelowMinimum)} icon={<WalletCards className="h-4 w-4" />} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Saúde dos bancos selecionados</CardTitle>
          <CardDescription>
            Visão simplificada para operação diária. Clique nos bancos acima para ajustar o escopo.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {banksInFocus.map((bank) => (
            <div key={bank.id} className="rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{bank.name}</p>
                  <p className="text-xs text-slate-500">
                    {bank.type === "digital" ? "Digital" : "Tradicional"} • {bank.country}
                  </p>
                </div>
                <BankStatusBadge score={bank.score} />
              </div>
              <div className="mt-4">
                <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                  <span>Score de saúde</span>
                  <span>{bank.score.toFixed(1)}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                    style={{ width: `${Math.min(100, bank.score)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
          {banksInFocus.length === 0 && (
            <p className="text-sm text-slate-500">Nenhum banco selecionado. Escolha ao menos um banco para começar.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <Card className="border-purple-100">
      <CardHeader className="pb-2">
        <CardDescription className="flex items-center gap-2 text-slate-600">
          {icon}
          {label}
        </CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
