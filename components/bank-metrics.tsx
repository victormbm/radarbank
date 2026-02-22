"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrazilianBank } from "@/lib/brazilian-banks";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Shield, Droplets, Target } from "lucide-react";

interface BankMetricsProps {
  bank: BrazilianBank;
}

// Mock data - será substituído pelo backend depois
const getMockMetrics = (bankId: string) => {
  const metrics = {
    '1': { basel: 18.5, roe: 22.0, liquidity: 145, npl: 2.8, score: 85.5 },
    '2': { basel: 16.2, roe: 18.5, liquidity: 128, npl: 3.2, score: 78.3 },
    '3': { basel: 15.8, roe: 15.2, liquidity: 135, npl: 3.8, score: 72.8 },
    '4': { basel: 16.5, roe: 17.8, liquidity: 130, npl: 3.5, score: 75.6 },
    '5': { basel: 15.2, roe: 14.8, liquidity: 125, npl: 4.2, score: 70.5 },
    '6': { basel: 16.8, roe: 16.5, liquidity: 132, npl: 3.6, score: 74.2 },
    '7': { basel: 14.2, roe: 12.5, liquidity: 115, npl: 4.8, score: 68.2 },
    '8': { basel: 17.5, roe: 19.2, liquidity: 138, npl: 2.9, score: 81.4 },
    '9': { basel: 18.2, roe: 24.5, liquidity: 142, npl: 2.5, score: 88.5 },
    '10': { basel: 15.8, roe: 16.2, liquidity: 122, npl: 3.9, score: 73.8 },
    '11': { basel: 17.2, roe: 20.5, liquidity: 140, npl: 2.7, score: 83.2 },
    '12': { basel: 16.8, roe: 18.8, liquidity: 136, npl: 3.1, score: 79.5 },
    '13': { basel: 15.5, roe: 15.8, liquidity: 127, npl: 3.7, score: 72.2 },
    '14': { basel: 14.8, roe: 13.2, liquidity: 118, npl: 4.5, score: 69.5 },
  };
  return metrics[bankId as keyof typeof metrics] || { basel: 15.0, roe: 15.0, liquidity: 120, npl: 4.0, score: 70.0 };
};

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
  const metrics = getMockMetrics(bank.id);
  const scoreStatus = getScoreStatus(metrics.score);
  const ScoreIcon = scoreStatus.icon;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Bank Header */}
      <Card className={cn("border-2 overflow-hidden shadow-md", `border-${bank.color.primary}`)}>
        <div className={cn("h-2 sm:h-3 bg-gradient-to-r", bank.color.gradient)} />
        <CardHeader className="pb-4 sm:pb-6">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className={cn(
                "w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl lg:text-5xl",
                "bg-gradient-to-br shadow-lg",
                bank.color.gradient
              )}>
                {bank.icon}
              </div>
              <div>
                <CardTitle className="text-xl sm:text-2xl lg:text-3xl">{bank.displayName}</CardTitle>
                <CardDescription className="text-sm sm:text-base mt-1 sm:mt-2">
                  {bank.description}
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
                <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold">{metrics.score.toFixed(1)}</CardTitle>
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
                  metrics.score >= 80 ? "from-green-500 to-green-400" :
                  metrics.score >= 70 ? "from-blue-500 to-blue-400" :
                  metrics.score >= 60 ? "from-yellow-500 to-yellow-400" :
                  "from-red-500 to-red-400"
                )}
                style={{ width: `${metrics.score}%` }}
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
          value={metrics.basel}
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
          value={metrics.roe}
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
          value={metrics.liquidity}
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
          value={metrics.npl}
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
          score={88}
          color="from-blue-500 to-blue-400"
        />
        <BreakdownCard
          title="Liquidez"
          score={90}
          color="from-cyan-500 to-cyan-400"
        />
        <BreakdownCard
          title="Rentabilidade"
          score={85}
          color="from-green-500 to-green-400"
        />
        <BreakdownCard
          title="Crédito"
          score={78}
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
