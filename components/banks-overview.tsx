"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardBank, getBankVisual } from "@/lib/brazilian-banks";
import { TrendingUp, Building2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface BanksOverviewProps {
  banks: DashboardBank[];
  isLoading?: boolean;
}

export function BanksOverview({ banks, isLoading = false }: BanksOverviewProps) {
  if (isLoading) {
    return (
      <Card className="bg-white/95 border-white/30 backdrop-blur-sm shadow-md">
        <CardContent className="py-10 text-center text-slate-600">Carregando dados dos bancos...</CardContent>
      </Card>
    );
  }

  const totalBanks = banks.length;
  const digitalBanks = banks.filter(b => b.type === 'digital').length;
  const traditionalBanks = banks.filter(b => b.type === 'traditional').length;

  const scores = banks.map(b => b.bcbSafetyScore).filter((score): score is number => typeof score === 'number');
  const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const scoreBands = buildDynamicScoreBands(scores);
  const excellentBanks = scores.filter(s => classifyScoreBand(s, scoreBands) === 'A').length;
  const goodBanks = scores.filter(s => classifyScoreBand(s, scoreBands) === 'B').length;
  const attentionBanks = scores.filter(s => classifyScoreBand(s, scoreBands) === 'C').length;
  const criticalBanks = scores.filter(s => classifyScoreBand(s, scoreBands) === 'D').length;

  const topBanks = banks
    .filter(bank => typeof bank.bcbSafetyScore === 'number')
    .map(bank => ({ bank, score: bank.bcbSafetyScore as number }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total de Bancos"
          value={totalBanks}
          icon={Building2}
          color="blue"
          description={`${digitalBanks} digitais, ${traditionalBanks} tradicionais`}
        />
        <StatCard
          label="Score Médio BCB"
          value={avgScore.toFixed(1)}
          icon={TrendingUp}
          color="green"
          description="Media do indice tecnico (0-100)"
        />
        <StatCard
          label="Faixa A"
          value={excellentBanks}
          icon={TrendingUp}
          color="green"
          description={`Top 25% da amostra BCB atual (>= ${scoreBands.aMin.toFixed(1)})`}
        />
        <StatCard
          label="Faixa C e D"
          value={attentionBanks + criticalBanks}
          icon={AlertCircle}
          color="orange"
          description={`${attentionBanks} na faixa C, ${criticalBanks} na faixa D (percentis BCB)`}
        />
      </div>

      <Card className="bg-white/95 border-white/30 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg">
            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            Top 5 por Indice Tecnico BCB
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Baseado apenas em dados técnicos oficiais do Banco Central (API BCB)
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="space-y-3 sm:space-y-4">
            {topBanks.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-600">
                Sem dados técnicos suficientes do BCB para calcular o ranking no momento.
              </div>
            )}
            {topBanks.map((item, index) => (
              <div
                key={item.bank.id}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors"
              >
                {(() => {
                  const visualBank = getBankVisual(item.bank);
                  return (
                    <>
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                        {index + 1}
                      </div>
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center text-xl",
                        "bg-gradient-to-br",
                        visualBank?.color.gradient || "from-slate-600 to-slate-400"
                      )}>
                        {visualBank?.icon || "🏦"}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{item.bank.name}</h4>
                        <p className="text-xs text-slate-500">
                          {item.bank.type === 'digital' ? 'Digital' : 'Tradicional'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold">{item.score.toFixed(1)}</div>
                        <div className={cn(
                          "text-xs font-medium",
                          classifyScoreBand(item.score, scoreBands) === 'A'
                            ? "text-green-600"
                            : classifyScoreBand(item.score, scoreBands) === 'B'
                              ? "text-blue-600"
                              : classifyScoreBand(item.score, scoreBands) === 'C'
                                ? "text-amber-600"
                                : "text-red-600"
                        )}>
                          {`Faixa ${classifyScoreBand(item.score, scoreBands)}`}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
        <Card className="bg-white/95 border-white/30 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-4 sm:pb-5">
            <CardTitle className="text-sm sm:text-base">Distribuição por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 sm:space-y-5">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Bancos Digitais</span>
                  <span className="text-sm text-slate-600">{digitalBanks} ({((digitalBanks/totalBanks)*100).toFixed(0)}%)</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-purple-400"
                    style={{ width: `${(digitalBanks/totalBanks)*100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Bancos Tradicionais</span>
                  <span className="text-sm text-slate-600">{traditionalBanks} ({((traditionalBanks/totalBanks)*100).toFixed(0)}%)</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
                    style={{ width: `${(traditionalBanks/totalBanks)*100}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/95 border-white/30 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-4 sm:pb-5">
            <CardTitle className="text-sm sm:text-base">Distribuicao por Faixa Tecnica</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              <HealthBar label={`Faixa A (>= ${scoreBands.aMin.toFixed(1)})`} count={excellentBanks} color="from-green-500 to-green-400" total={Math.max(totalBanks, 1)} />
              <HealthBar label={`Faixa B (${scoreBands.bMin.toFixed(1)} a ${Math.max(scoreBands.aMin - 0.1, scoreBands.bMin).toFixed(1)})`} count={goodBanks} color="from-blue-500 to-blue-400" total={Math.max(totalBanks, 1)} />
              <HealthBar label={`Faixa C (${scoreBands.cMin.toFixed(1)} a ${Math.max(scoreBands.bMin - 0.1, scoreBands.cMin).toFixed(1)})`} count={attentionBanks} color="from-yellow-500 to-yellow-400" total={Math.max(totalBanks, 1)} />
              <HealthBar label={`Faixa D (< ${scoreBands.cMin.toFixed(1)})`} count={criticalBanks} color="from-red-500 to-red-400" total={Math.max(totalBanks, 1)} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

type DynamicBands = {
  aMin: number;
  bMin: number;
  cMin: number;
};

function percentile(sortedAscending: number[], p: number): number {
  if (sortedAscending.length === 0) return 0;
  const index = (sortedAscending.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sortedAscending[lower];
  const weight = index - lower;
  return sortedAscending[lower] * (1 - weight) + sortedAscending[upper] * weight;
}

function buildDynamicScoreBands(scores: number[]): DynamicBands {
  if (scores.length === 0) {
    return { aMin: 80, bMin: 70, cMin: 60 };
  }

  const sorted = [...scores].sort((a, b) => a - b);
  const cMin = percentile(sorted, 0.25);
  const bMin = percentile(sorted, 0.5);
  const aMin = percentile(sorted, 0.75);

  return {
    aMin: Number(aMin.toFixed(2)),
    bMin: Number(bMin.toFixed(2)),
    cMin: Number(cMin.toFixed(2)),
  };
}

function classifyScoreBand(score: number, bands: DynamicBands): 'A' | 'B' | 'C' | 'D' {
  if (score >= bands.aMin) return 'A';
  if (score >= bands.bMin) return 'B';
  if (score >= bands.cMin) return 'C';
  return 'D';
}

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'orange' | 'purple';
  description?: string;
  trend?: string;
}

function StatCard({ label, value, icon: Icon, color, description, trend }: StatCardProps) {
  const colorClasses = {
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-200' },
    green: { bg: 'bg-green-50', icon: 'text-green-600', border: 'border-green-200' },
    orange: { bg: 'bg-orange-50', icon: 'text-orange-600', border: 'border-orange-200' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-200' }
  };

  const colors = colorClasses[color];

  return (
    <Card className={cn("border-2 bg-white/95 border-white/30 backdrop-blur-sm", colors.border)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardDescription className="text-xs font-medium">{label}</CardDescription>
          <div className={cn("p-2 rounded-lg", colors.bg)}>
            <Icon className={cn("h-4 w-4", colors.icon)} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{value}</span>
          {trend && (
            <span className="text-sm text-green-600 font-medium">{trend}</span>
          )}
        </div>
        {description && (
          <p className="text-xs text-slate-500 mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface HealthBarProps {
  label: string;
  count: number;
  color: string;
  total: number;
}

function HealthBar({ label, count, color, total }: HealthBarProps) {
  const percentage = (count / total) * 100;

  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-slate-600">{count}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={cn("h-full bg-gradient-to-r", color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
