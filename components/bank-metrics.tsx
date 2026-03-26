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
  healthy:  { label: "Faixa A", color: "text-green-600",  bgColor: "bg-green-50",  icon: CheckCircle2 },
  watch:    { label: "Faixa B", color: "text-yellow-600", bgColor: "bg-yellow-50", icon: AlertCircle },
  warning:  { label: "Faixa B", color: "text-yellow-600", bgColor: "bg-yellow-50", icon: AlertCircle },
  risk:     { label: "Faixa C", color: "text-orange-600", bgColor: "bg-orange-50", icon: AlertCircle },
  critical: { label: "Faixa D", color: "text-red-600",    bgColor: "bg-red-50",    icon: TrendingDown },
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
            <CardDescription className="text-xs sm:text-sm">Score de Solidez Regulatória (0 a 100)</CardDescription>
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
            <p className="text-xs text-slate-600 mb-1 sm:mb-2">
              {totalScore === null
                ? "Score composto indisponível — exibindo apenas indicadores auditados do BCB."
                : "Mede solidez regulatória com base em 4 dimensões do BCB: Capital (35%), Liquidez (25%), Rentabilidade (20%) e Crédito (20%). Não mede tamanho: bancos varejistas com grandes carteiras de crédito podem ter LCR e NPL mais pressionados, o que reduz o score mesmo sendo instituições sólidas."
              }
            </p>
            {/* Faixa legend */}
            <div className="flex flex-wrap gap-2 mb-3 sm:mb-4 text-xs">
              <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Faixa A: 80–100 — Excelente</span>
              <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">Faixa B: 65–79 — Adequado</span>
              <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">Faixa C: 50–64 — Atenção</span>
              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Faixa D: 0–49 — Risco</span>
            </div>
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
            description="Mínimo regulatório BCB: 11%"
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
            tooltip="Índice de Basileia III: razão entre o capital do banco e seus ativos ponderados pelo risco. O BCB exige mínimo de 11%. Acima de 15% é considerado excelente — significa que o banco tem folga de capital para absorver perdas inesperadas sem precisar de socorro externo."
          />
          <MetricCard
            icon={Target}
            label="ROE (Retorno sobre Patrimônio)"
            value={snapshot?.roe ?? null}
            unit="%"
            min={10}
            ideal={18}
            description="Lucro líquido ÷ Patrimônio"
            iconColor="text-green-600"
            iconBg="bg-green-50"
            tooltip="Return on Equity (ROE): quanto o banco gera de lucro para cada R$100 de patrimônio dos acionistas. Acima de 18% é excelente; abaixo de 10% indica ineficiência. Não confundir com tamanho — um banco pequeno pode ter ROE maior que um gigante."
          />
          <MetricCard
            icon={Droplets}
            label={snapshot?.lcr != null ? "Liquidez (LCR)" : "Liquidez Imediata"}
            value={snapshot?.lcr ?? snapshot?.quickLiquidity ?? null}
            unit="%"
            min={100}
            ideal={130}
            description={snapshot?.lcr != null ? "Ativos líquidos ÷ saídas em 30 dias" : "Disponíveis ÷ Depósitos à vista"}
            iconColor="text-cyan-600"
            iconBg="bg-cyan-50"
            tooltip={snapshot?.lcr != null
              ? "Liquidity Coverage Ratio (LCR): mede se o banco tem ativos líquidos suficientes para cobrir todas as saídas de caixa esperadas em 30 dias de estresse. O BCB exige mínimo de 100%. Bancos de investimento (XP, BTG) costumam ter LCR >250% pois emprestam pouco. Bancos varejistas com grandes carteiras de crédito tendem a ter LCR mais baixo — o que penaliza o score de liquidez."
              : "Liquidez Imediata: recursos disponíveis imediatamente dividido por depósitos à vista. Acima de 100% indica que o banco pode honrar todos os saques imediatos sem vender nenhum ativo."
            }
          />
          <MetricCard
            icon={AlertCircle}
            label="Inadimplência (NPL)"
            value={snapshot?.nplRatio ?? null}
            unit="%"
            min={5}
            ideal={3}
            description="Operações em atraso >90 dias — menor é melhor"
            iconColor="text-orange-600"
            iconBg="bg-orange-50"
            inverse
            tooltip="Non-Performing Loans (NPL): percentual da carteira de crédito com atraso superior a 90 dias. Abaixo de 3% é excelente; acima de 5% acende um alerta. Bancos com carteira de crédito massiva (varejistas) naturalmente têm NPL maior. Bancos sem crédito varejista (XP, BTG) têm NPL quase zero — o que eleva o score de crédito deles significativamente."
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
          <BreakdownCard
            title="Capital"
            weight="35% do score"
            description="Basileia, Tier 1, CET1 — capacidade de absorver perdas"
            score={scores?.capitalScore ?? null}
            color="from-blue-500 to-blue-400"
          />
          <BreakdownCard
            title="Liquidez"
            weight="25% do score"
            description="LCR, NSFR, disponibilidades — capacidade de honrar saques"
            score={scores?.liquidityScore ?? null}
            color="from-cyan-500 to-cyan-400"
          />
          <BreakdownCard
            title="Rentabilidade"
            weight="20% do score"
            description="ROE, ROA, custo/renda — eficiência operacional"
            score={scores?.profitabilityScore ?? null}
            color="from-green-500 to-green-400"
          />
          <BreakdownCard
            title="Crédito"
            weight="20% do score"
            description="NPL, cobertura, write-off — qualidade da carteira"
            score={scores?.creditScore ?? null}
            color="from-purple-500 to-purple-400"
          />
        </div>
      )}

      <Card className="border border-slate-200 bg-slate-50/80">
        <CardContent className="pt-4 sm:pt-5 space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <p className="font-semibold text-slate-700 text-sm">📖 Como interpretar estes dados</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="font-medium text-slate-700 mb-1">Indicadores reais (linha de cima)</p>
              <p>Basileia, ROE, Liquidez e Inadimplência são os valores brutos reportados ao BCB — exatamente como aparecem nos balanços oficiais. Use estes para comparações técnicas diretas entre bancos.</p>
            </div>
            <div>
              <p className="font-medium text-slate-700 mb-1">Pontuações 0–100 (linha de baixo)</p>
              <p>Cada dimensão é normalizada numa escala de 0 a 100 para facilitar comparação. Capital 97 não significa 97% — significa que o banco está no topo da escala para aquele indicador.</p>
            </div>
            <div>
              <p className="font-medium text-slate-700 mb-1">Por que grandes bancos pontuam menos?</p>
              <p>Itaú, Bradesco e Caixa têm carteiras de crédito de R$600–850 bilhões — o que naturalmente eleva o NPL e reduz a liquidez relativa. XP e BTG emprestam pouco, têm LCR acima de 250% e NPL abaixo de 2%, o que eleva o score deles. Isso é correto: o score mede <strong>resistência a choques</strong>, não importância econômica.</p>
            </div>
            <div>
              <p className="font-medium text-slate-700 mb-1">Faixas regulatórias</p>
              <ul className="space-y-0.5">
                <li><span className="font-medium text-green-700">Faixa A (80–100):</span> indicadores excelentes, capital e liquidez acima do mínimo</li>
                <li><span className="font-medium text-yellow-700">Faixa B (65–79):</span> dentro dos parâmetros regulatórios do BCB</li>
                <li><span className="font-medium text-orange-700">Faixa C (50–64):</span> abaixo do ideal, requer monitoramento</li>
                <li><span className="font-medium text-red-700">Faixa D (0–49):</span> indicadores preocupantes, alto risco regulatório</li>
              </ul>
            </div>
          </div>
          <p className="text-xs text-slate-400 pt-1 border-t border-slate-200">Fonte: Banco Central do Brasil (BCB/IFData). Dados atualizados trimestralmente.</p>
        </CardContent>
      </Card>
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
  weight: string;
  description: string;
  score: number | null;
  color: string;
}

function BreakdownCard({ title, weight, description, score, color }: BreakdownCardProps) {
  const hasScore = score !== null && score !== undefined;
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription className="text-xs font-semibold text-slate-700">{title}</CardDescription>
          <span className="text-xs text-slate-400 font-medium">{weight}</span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5 leading-snug">{description}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-2xl font-bold">
            {hasScore ? score!.toFixed(0) : "--"}
          </div>
          <p className="text-xs text-slate-400">Nota 0–100 (não é %)</p>
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
