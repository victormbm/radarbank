"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardBank, getBankVisual } from "@/lib/brazilian-banks";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Shield, Droplets, Target } from "lucide-react";

interface BankMetricsProps {
  bank: DashboardBank;
}

const getScoreStatus = (score: number) => {
  if (score >= 80) return { label: "Excelente", color: "text-green-600", bgColor: "bg-green-50", icon: CheckCircle2 };
  if (score >= 70) return { label: "Bom", color: "text-blue-600", bgColor: "bg-blue-50", icon: TrendingUp };
  if (score >= 60) return { label: "Atenção", color: "text-yellow-600", bgColor: "bg-yellow-50", icon: AlertCircle };
  return { label: "Crítico", color: "text-red-600", bgColor: "bg-red-50", icon: TrendingDown };
};

const getMetricStatus = (value: number, min: number, ideal: number) => {
  if (value >= ideal) return "excellent";
  if (value >= min) return "good";
  return "critical";
};

export function BankMetrics({ bank }: BankMetricsProps) {
  const visualBank = getBankVisual(bank);
  const scoreValue = bank.score ?? 50;
  const scoreStatus = getScoreStatus(scoreValue);
  const ScoreIcon = scoreStatus.icon;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Bank Header */}
      <Card className="border-2 overflow-hidden shadow-md border-slate-200">
        <div className={cn("h-2 sm:h-3 bg-gradient-to-r", visualBank?.color.gradient || "from-slate-600 to-slate-400")} />
        <CardHeader className="pb-4 sm:pb-6">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className={cn(
                "w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl lg:text-5xl",
                "bg-gradient-to-br shadow-lg",
                visualBank?.color.gradient || "from-slate-600 to-slate-400"
              )}>
                {visualBank?.icon || "🏦"}
              </div>
              <div>
                <CardTitle className="text-xl sm:text-2xl lg:text-3xl">{bank.name}</CardTitle>
                <CardDescription className="text-sm sm:text-base mt-1 sm:mt-2">
                  {visualBank?.description || 'Indicadores financeiros e reputacionais atualizados'}
                </CardDescription>
              </div>
            </div>
            <div className={cn(
              "px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium",
              bank.type === "digital" 
                ? "bg-purple-100 text-purple-700" 
                : "bg-slate-100 text-slate-700"
            )}>
              {bank.type === "digital" ? "Banco Digital" : "Banco Tradicional"}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Score Card */}
      <Card className={cn("border-2 shadow-md", scoreStatus.bgColor)}>
        <CardHeader className="pb-4 sm:pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className={cn("p-2.5 sm:p-3 rounded-xl", scoreStatus.bgColor)}>
                <ScoreIcon className={cn("h-5 w-5 sm:h-6 sm:w-6", scoreStatus.color)} />
              </div>
              <div>
                <CardDescription className="text-xs sm:text-sm">Saúde Geral do Banco</CardDescription>
                <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold">{scoreValue.toFixed(1)}</CardTitle>
              </div>
            </div>
            <div className={cn(
              "px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-base font-semibold",
              scoreStatus.bgColor,
              scoreStatus.color
            )}>
              {scoreStatus.label}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative pt-2">
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  "bg-gradient-to-r",
                  scoreValue >= 80 ? "from-green-500 to-green-400" :
                  scoreValue >= 70 ? "from-blue-500 to-blue-400" :
                  scoreValue >= 60 ? "from-yellow-500 to-yellow-400" :
                  "from-red-500 to-red-400"
                )}
                style={{ width: `${scoreValue}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-2">
              <span>0</span>
              <span>50</span>
              <span>100</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={Shield}
          label="Índice de Basileia"
          value={bank.basilRatio ?? null}
          unit="%"
          min={11}
          ideal={15}
          description="Mínimo: 11%"
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <MetricCard
          icon={Target}
          label="ROE"
          value={bank.roe ?? null}
          unit="%"
          min={10}
          ideal={18}
          description="Retorno sobre patrimônio"
          iconColor="text-green-600"
          iconBg="bg-green-50"
        />
        <MetricCard
          icon={Droplets}
          label="Liquidez"
          value={bank.quickLiquidity ?? null}
          unit="%"
          min={100}
          ideal={130}
          description="Índice de liquidez rápida"
          iconColor="text-cyan-600"
          iconBg="bg-cyan-50"
        />
        <MetricCard
          icon={AlertCircle}
          label="Inadimplência"
          value={bank.nplRatio ?? null}
          unit="%"
          min={5}
          ideal={3}
          description="NPL - menor é melhor"
          iconColor="text-orange-600"
          iconBg="bg-orange-50"
          inverse
        />
      </div>

      {/* Breakdown Cards */}
      <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-4">
        <BreakdownCard
          title="Capital"
          score={bank.capitalScore ?? 0}
          color="from-blue-500 to-blue-400"
        />
        <BreakdownCard
          title="Liquidez"
          score={bank.liquidityScore ?? 0}
          color="from-cyan-500 to-cyan-400"
        />
        <BreakdownCard
          title="Rentabilidade"
          score={bank.profitabilityScore ?? 0}
          color="from-green-500 to-green-400"
        />
        <BreakdownCard
          title="Crédito"
          score={bank.creditScore ?? 0}
          color="from-purple-500 to-purple-400"
        />
      </div>
    </div>
  );
}

interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  unit: string;
  min: number;
  ideal: number;
  description: string;
  iconColor: string;
  iconBg: string;
  inverse?: boolean;
}

function MetricCard({ icon: Icon, label, value, unit, min, ideal, description, iconColor, iconBg, inverse }: MetricCardProps) {
  if (value === null || value === undefined) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", iconBg)}>
              <Icon className={cn("h-5 w-5", iconColor)} />
            </div>
            <CardDescription className="text-xs">{label}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-slate-400">--</div>
            <p className="text-xs text-slate-500">Dado indisponível no snapshot atual</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const status = inverse 
    ? (value <= ideal ? "excellent" : value <= min ? "good" : "critical")
    : getMetricStatus(value, min, ideal);

  const statusColors = {
    excellent: "text-green-600 bg-green-50",
    good: "text-blue-600 bg-blue-50",
    critical: "text-red-600 bg-red-50"
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", iconBg)}>
            <Icon className={cn("h-5 w-5", iconColor)} />
          </div>
          <CardDescription className="text-xs">{label}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold">{value.toFixed(1)}</span>
            <span className="text-slate-500 text-sm">{unit}</span>
          </div>
          <p className="text-xs text-slate-500">{description}</p>
          <div className={cn(
            "inline-block px-2 py-1 rounded text-xs font-medium",
            statusColors[status]
          )}>
            {status === "excellent" ? "Excelente" : status === "good" ? "Adequado" : "Atenção"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface BreakdownCardProps {
  title: string;
  score: number;
  color: string;
}

function BreakdownCard({ title, score, color }: BreakdownCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardDescription className="text-xs">{title}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-2xl font-bold">{score.toFixed(0)}</div>
          <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full bg-gradient-to-r", color)}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
