"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardBank, getBankVisual } from "@/lib/brazilian-banks";
import type { BankDetail } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Shield,
  Droplets,
  Target,
  Loader2,
} from "lucide-react";

// ─── Status helpers ────────────────────────────────────────────────────────────

/**
 * Map API status string → display label + styling.
 * Handles legacy ("warning") and new ("watch", "risk") values.
 */
const STATUS_DISPLAY: Record<
  string,
  { label: string; color: string; bgColor: string; icon: typeof CheckCircle2 }
> = {
  healthy:  { label: "Excelente", color: "text-green-600",  bgColor: "bg-green-50",  icon: CheckCircle2 },
  watch:    { label: "Atenção",   color: "text-yellow-600", bgColor: "bg-yellow-50", icon: AlertCircle },
  warning:  { label: "Atenção",   color: "text-yellow-600", bgColor: "bg-yellow-50", icon: AlertCircle },
  risk:     { label: "Risco",     color: "text-orange-600", bgColor: "bg-orange-50", icon: AlertCircle },
  critical: { label: "Crítico",   color: "text-red-600",    bgColor: "bg-red-50",    icon: TrendingDown },
};

const DEFAULT_STATUS = {
  label: "Sem dados",
  color: "text-slate-500",
  bgColor: "bg-slate-50",
  icon: AlertCircle as typeof CheckCircle2,
};

const getStatusDisplay = (status?: string | null, score?: number | null) => {
  if (status && STATUS_DISPLAY[status]) return STATUS_DISPLAY[status];
  if (score !== null && score !== undefined) {
    if (score >= 80) return STATUS_DISPLAY.healthy;
    if (score >= 65) return STATUS_DISPLAY.watch;
    if (score >= 50) return STATUS_DISPLAY.risk;
    return STATUS_DISPLAY.critical;
  }
  return DEFAULT_STATUS;
};

// ─── Component props ─────────────────────────────────────────────────────────

interface BankMetricsProps {
  bank: DashboardBank;
  detail: BankDetail | null;
  isLoadingDetail?: boolean;
}

export function BankMetrics({ bank, detail, isLoadingDetail = false }: BankMetricsProps) {
  const visualBank = getBankVisual(bank);

  const scores   = detail?.scores   ?? null;
  const snapshot = detail?.snapshot ?? null;

  const totalScore    = scores?.totalScore ?? null;
  const statusDisplay = getStatusDisplay(scores?.status, totalScore);
  const StatusIcon    = statusDisplay.icon;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ── Bank Header ── */}
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
                  {visualBank?.description || "Indicadores financeiros e reputacionais"}
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

      {/* ── Health Score Card ── */}
      {isLoadingDetail ? (
        <ScoreSkeleton />
      ) : (
        <Card className={cn("border-2 shadow-md", statusDisplay.bgColor)}>
          <CardHeader className="pb-4 sm:pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className={cn("p-2.5 sm:p-3 rounded-xl", statusDisplay.bgColor)}>
                  <StatusIcon className={cn("h-5 w-5 sm:h-6 sm:w-6", statusDisplay.color)} />
                </div>
                <div>
                  <CardDescription className="text-xs sm:text-sm">Saúde Geral do Banco</CardDescription>
                  <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold">
                    {totalScore !== null ? totalScore.toFixed(1) : "--"}
                  </CardTitle>
                </div>
              </div>
              <div className={cn(
                "px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-base font-semibold",
                statusDisplay.bgColor,
                statusDisplay.color
              )}>
                {statusDisplay.label}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative pt-2">
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500 bg-gradient-to-r",
                    scores?.status === "healthy"                              ? "from-green-500 to-green-400"   :
                    scores?.status === "watch" || scores?.status === "warning"? "from-yellow-500 to-yellow-400" :
                    scores?.status === "risk"                                 ? "from-orange-500 to-orange-400" :
                    scores?.status === "critical"                             ? "from-red-500 to-red-400"       :
                    "from-slate-300 to-slate-200"
                  )}
                  style={{ width: totalScore !== null ? `${Math.min(totalScore, 100)}%` : "0%" }}
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
      )}

      {/* ── Key Metrics Grid ── */}
      {isLoadingDetail ? (
        <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <MetricSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            icon={Shield}
            label="Índice de Basileia"
            value={snapshot?.basilRatio ?? null}
            unit="%"
            min={11}
            ideal={15}
            description="Mínimo regulatório: 11%"
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
            tooltip="Quanto maior, mais protegido está o banco. Indica se ele tem capital suficiente para absorver perdas. O mínimo exigido pelo Banco Central é 11%. Acima de 15% é considerado saudável."
          />
          <MetricCard
            icon={Target}
            label="ROE"
            value={snapshot?.roe ?? null}
            unit="%"
            min={10}
            ideal={18}
            description="Retorno sobre patrimônio"
            iconColor="text-green-600"
            iconBg="bg-green-50"
            tooltip="Mede o lucro que o banco gera para cada real investido pelos seus donos (acionistas). Quanto maior, mais eficiente e lucrativo é o banco. Acima de 18% é excelente."
          />
          <MetricCard
            icon={Droplets}
            label="Liquidez (LCR)"
            value={snapshot?.lcr ?? snapshot?.quickLiquidity ?? null}
            unit="%"
            min={100}
            ideal={130}
            description="Liquidity Coverage Ratio"
            iconColor="text-cyan-600"
            iconBg="bg-cyan-50"
            tooltip="Mostra se o banco tem dinheiro suficiente para honrar todos os seus compromissos a curto prazo em uma crise de 30 dias. O mínimo é 100%. Quanto maior, mais seguro é o banco."
          />
          <MetricCard
            icon={AlertCircle}
            label="Inadimplência"
            value={snapshot?.nplRatio ?? null}
            unit="%"
            min={5}
            ideal={3}
            description="NPL — menor é melhor"
            iconColor="text-orange-600"
            iconBg="bg-orange-50"
            inverse
            tooltip="Percentual de clientes que estão atrasados nos pagamentos há mais de 90 dias. Quanto menor, melhor — significa que o banco faz boas análises de crédito e tem clientes que pagam em dia."
          />
        </div>
      )}

      {/* ── Score Breakdown ── */}
      {isLoadingDetail ? (
        <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <MetricSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-4">
          <BreakdownCard title="Capital"       score={scores?.capitalScore       ?? null} color="from-blue-500 to-blue-400" />
          <BreakdownCard title="Liquidez"      score={scores?.liquidityScore     ?? null} color="from-cyan-500 to-cyan-400" />
          <BreakdownCard title="Rentabilidade" score={scores?.profitabilityScore ?? null} color="from-green-500 to-green-400" />
          <BreakdownCard title="Crédito"       score={scores?.creditScore        ?? null} color="from-purple-500 to-purple-400" />
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

/** Tooltip that appears above the icon on hover — no extra dependencies */
function IconTooltip({ children, text }: { children: React.ReactNode; text: string }) {
  return (
    <div className="relative group/tip inline-flex">
      {children}
      <div
        role="tooltip"
        className={
          "pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 " +
          "w-56 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-xl " +
          "text-xs text-slate-600 leading-relaxed " +
          "opacity-0 scale-95 group-hover/tip:opacity-100 group-hover/tip:scale-100 " +
          "transition-all duration-150 ease-out"
        }
      >
        {text}
        {/* Arrow */}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white -mt-px" />
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-200 mt-0" />
      </div>
    </div>
  );
}

interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  value: number | null;
  unit: string;
  min: number;
  ideal: number;
  description: string;
  iconColor: string;
  iconBg: string;
  inverse?: boolean;
  tooltip: string;
}

function MetricCard({ icon: Icon, label, value, unit, min, ideal, description, iconColor, iconBg, inverse, tooltip }: MetricCardProps) {
  const hasValue = value !== null && value !== undefined;

  const status: "excellent" | "good" | "critical" | "unknown" = !hasValue
    ? "unknown"
    : inverse
      ? (value! <= ideal ? "excellent" : value! <= min ? "good" : "critical")
      : (value! >= ideal ? "excellent" : value! >= min ? "good"  : "critical");

  const statusColors = {
    excellent: "text-green-600 bg-green-50",
    good:      "text-blue-600 bg-blue-50",
    critical:  "text-red-600 bg-red-50",
    unknown:   "text-slate-400 bg-slate-50",
  } as const;

  const statusLabels = {
    excellent: "Excelente",
    good:      "Adequado",
    critical:  "Atenção",
    unknown:   "Sem dados",
  } as const;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <IconTooltip text={tooltip}>
            <div className={cn("p-2 rounded-lg cursor-help", iconBg)}>
              <Icon className={cn("h-5 w-5", iconColor)} />
            </div>
          </IconTooltip>
          <CardDescription className="text-xs">{label}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {hasValue ? (
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">{value!.toFixed(1)}</span>
              <span className="text-slate-500 text-sm">{unit}</span>
            </div>
          ) : (
            <div className="text-2xl font-bold text-slate-400">--</div>
          )}
          <p className="text-xs text-slate-500">{description}</p>
          <div className={cn("inline-block px-2 py-1 rounded text-xs font-medium", statusColors[status])}>
            {statusLabels[status]}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface BreakdownCardProps {
  title: string;
  score: number | null;
  color: string;
}

function BreakdownCard({ title, score, color }: BreakdownCardProps) {
  const hasScore = score !== null && score !== undefined;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardDescription className="text-xs">{title}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-2xl font-bold">
            {hasScore ? score!.toFixed(0) : "--"}
          </div>
          <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full bg-gradient-to-r", hasScore ? color : "from-slate-200 to-slate-200")}
              style={{ width: hasScore ? `${Math.min(score!, 100)}%` : "0%" }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Skeleton loaders ──────────────────────────────────────────────────────────

function ScoreSkeleton() {
  return (
    <Card className="border-2 shadow-md bg-slate-50">
      <CardContent className="flex items-center justify-center py-12 gap-3 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Carregando indicadores…</span>
      </CardContent>
    </Card>
  );
}

function MetricSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-100 animate-pulse" />
          <div className="h-3 w-24 rounded bg-slate-100 animate-pulse" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="h-8 w-20 rounded bg-slate-100 animate-pulse" />
          <div className="h-3 w-32 rounded bg-slate-100 animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}
