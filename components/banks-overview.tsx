"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardBank, getBankVisual } from "@/lib/brazilian-banks";
import { TrendingUp, CircleHelp, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface BanksOverviewProps {
  banks: DashboardBank[];
  isLoading?: boolean;
}

export function BanksOverview({ banks, isLoading = false }: BanksOverviewProps) {
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  useEffect(() => {
    if (!isInfoOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsInfoOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isInfoOpen]);

  if (isLoading) {
    return (
      <Card className="bg-white/95 border-white/30 backdrop-blur-sm shadow-md">
        <CardContent className="py-10 text-center text-slate-600">Carregando dados dos bancos...</CardContent>
      </Card>
    );
  }

  const scores = banks.map(b => b.bcbSafetyScore).filter((score): score is number => typeof score === 'number');
  const scoreBands = buildDynamicScoreBands(scores);

  const topBanks = banks
    .filter(bank => typeof bank.bcbSafetyScore === 'number')
    .map(bank => ({ bank, score: bank.bcbSafetyScore as number }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return (
    <div className="space-y-6 sm:space-y-8">
      <Card className="bg-white/95 border-white/30 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg">
            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            Top 5 por Indice Tecnico BCB
            <button
              type="button"
              onClick={() => setIsInfoOpen(true)}
              aria-label="Entender como o Top 5 funciona"
              className="group relative ml-1 inline-flex items-center justify-center rounded-full"
            >
              <span className="absolute inset-0 rounded-full bg-gradient-to-r from-fuchsia-500 via-rose-500 to-orange-500 blur-[5px] opacity-60 group-hover:opacity-90 transition-opacity" />
              <span className="relative inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 via-rose-500 to-orange-500 text-white shadow-lg group-hover:scale-105 transition-transform">
                <CircleHelp className="h-4 w-4 sm:h-5 sm:w-5" />
              </span>
            </button>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Indicador composto interno para monitoramento, com base principal em dados oficiais do BCB/IFData
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
                          {`Faixa relativa ${classifyScoreBand(item.score, scoreBands)}`}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            ))}
            <p className="text-xs text-slate-500 pt-1">
              Ranking relativo entre bancos monitorados neste painel e no periodo de referencia atual; nao representa rating oficial do Banco Central.
            </p>
          </div>
        </CardContent>
      </Card>

      {isInfoOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Informacoes sobre o Top 5"
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setIsInfoOpen(false)}
            aria-label="Fechar popup"
          />

          <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-fuchsia-300/35 blur-3xl" />
              <div className="absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-cyan-300/30 blur-3xl" />
            </div>

            <div className="relative border-b border-slate-100 px-5 py-4 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-white">
                    Guia do ranking
                  </p>
                  <h3 className="mt-2 text-lg sm:text-xl font-bold text-slate-900">
                    Top 5 por Indice Tecnico BCB
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsInfoOpen(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
                  aria-label="Fechar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="relative max-h-[78vh] overflow-y-auto px-5 py-5 sm:px-6 sm:py-6 space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                <p className="text-sm text-slate-700 leading-relaxed">
                  Este ranking mostra os 5 bancos com maior <strong>Indice Tecnico BCB</strong> dentro da base monitorada no periodo atual.
                  Ele foi feito para facilitar leitura tecnica e comparacao, sem substituir documentos oficiais.
                </p>
              </div>

              <section className="space-y-2">
                <h4 className="text-sm sm:text-base font-semibold text-slate-900">1) De onde vem os dados</h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  A base principal vem do BCB/IFData. O sistema agrega os indicadores de cada banco e monta um conjunto tecnico
                  padronizado para comparacao no mesmo periodo de referencia.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm sm:text-base font-semibold text-slate-900">2) Como o Top 5 e montado</h4>
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <ol className="list-decimal pl-4 space-y-1.5 text-xs sm:text-sm text-slate-700">
                    <li>Seleciona apenas bancos com score numerico valido.</li>
                    <li>Ordena do maior para o menor score.</li>
                    <li>Mostra somente os 5 primeiros.</li>
                    <li>Exibe o valor com 1 casa decimal (exemplo: 74.3).</li>
                  </ol>
                </div>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm sm:text-base font-semibold text-slate-900">3) O que significa o valor (0 a 100)</h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  O numero e uma <strong>pontuacao tecnica interna</strong> para comparacao relativa.
                  Nao e percentual contabil, nao e probabilidade de quebra e nao e rating oficial.
                </p>
                <div className="grid gap-2 sm:grid-cols-2 text-xs sm:text-sm">
                  <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-blue-800">
                    Quanto maior o score, melhor a posicao relativa na amostra.
                  </div>
                  <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-amber-800">
                    O score pode variar quando entram novos dados ou novos bancos na amostra.
                  </div>
                </div>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm sm:text-base font-semibold text-slate-900">4) Como as faixas A, B, C e D sao definidas</h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  As faixas sao <strong>relativas ao conjunto atual</strong> e usam quartis estatisticos da propria amostra:
                </p>
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700">
                    <li><strong>Faixa A:</strong> score no quartil superior (topo da amostra).</li>
                    <li><strong>Faixa B:</strong> entre mediana e quartil superior.</li>
                    <li><strong>Faixa C:</strong> entre quartil inferior e mediana.</li>
                    <li><strong>Faixa D:</strong> quartil inferior da amostra.</li>
                  </ul>
                </div>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm sm:text-base font-semibold text-slate-900">5) Leitura simples para perfis diferentes</h4>
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 space-y-2 text-xs sm:text-sm text-slate-700">
                  <p><strong>Leitura rapida:</strong> veja quem esta no Top 5 e em qual faixa relativa.</p>
                  <p><strong>Leitura tecnica:</strong> compare score, faixa e periodo de referencia para avaliar tendencia.</p>
                  <p><strong>Leitura de risco:</strong> use junto com indicadores individuais e documentos oficiais.</p>
                </div>
              </section>

              <p className="text-[11px] text-slate-500 border-t border-slate-200 pt-3 leading-relaxed">
                Aviso importante: este painel e informativo e metodologico. Nao substitui publicacoes oficiais do Banco Central,
                demonstracoes financeiras, parecer juridico, regulatorio, de credito ou recomendacao de investimento.
              </p>
            </div>
          </div>
        </div>
      )}

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
