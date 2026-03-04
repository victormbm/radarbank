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

  const scores = banks.map(b => b.score).filter((score): score is number => typeof score === 'number');
  const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const excellentBanks = scores.filter(s => s >= 80).length;
  const goodBanks = scores.filter(s => s >= 70 && s < 80).length;
  const attentionBanks = scores.filter(s => s >= 60 && s < 70).length;
  const criticalBanks = scores.filter(s => s < 60).length;

  const trendValues = banks.map(b => b.scoreTrend).filter((trend): trend is number => typeof trend === 'number');
  const avgTrend = trendValues.length > 0
    ? trendValues.reduce((a, b) => a + b, 0) / trendValues.length
    : null;

  const topBanks = banks
    .filter(bank => typeof bank.score === 'number')
    .map(bank => ({ bank, score: bank.score as number }))
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
          label="Score Médio"
          value={avgScore.toFixed(1)}
          icon={TrendingUp}
          color="green"
          description="Média geral de saúde"
          trend={avgTrend !== null ? `${avgTrend >= 0 ? '+' : ''}${avgTrend.toFixed(1)}` : undefined}
        />
        <StatCard
          label="Excelentes"
          value={excellentBanks}
          icon={TrendingUp}
          color="green"
          description="Score ≥ 80"
        />
        <StatCard
          label="Atenção/Críticos"
          value={attentionBanks + criticalBanks}
          icon={AlertCircle}
          color="orange"
          description={`${attentionBanks} atenção, ${criticalBanks} críticos`}
        />
      </div>

      <Card className="bg-white/95 border-white/30 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg">
            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            Top 5 Bancos Mais Saudáveis
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Baseado no score geral de saúde financeira
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="space-y-3 sm:space-y-4">
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
                          item.score >= 80 ? "text-green-600" : "text-blue-600"
                        )}>
                          {item.score >= 80 ? "Excelente" : "Bom"}
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
            <CardTitle className="text-sm sm:text-base">Distribuição de Saúde</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              <HealthBar label="Excelente" count={excellentBanks} color="from-green-500 to-green-400" total={Math.max(totalBanks, 1)} />
              <HealthBar label="Bom" count={goodBanks} color="from-blue-500 to-blue-400" total={Math.max(totalBanks, 1)} />
              <HealthBar label="Atenção" count={attentionBanks} color="from-yellow-500 to-yellow-400" total={Math.max(totalBanks, 1)} />
              {criticalBanks > 0 && (
                <HealthBar label="Crítico" count={criticalBanks} color="from-red-500 to-red-400" total={Math.max(totalBanks, 1)} />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
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
