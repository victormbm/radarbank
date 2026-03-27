"use client";

import { useEffect, useRef, useState } from "react";
import { BankSelector } from "@/components/bank-selector";
import { BankMetrics } from "@/components/bank-metrics";
import { BanksOverview } from "@/components/banks-overview";
import { DashboardBank } from "@/lib/brazilian-banks";
import type { BankDetail } from "@/lib/types";
import { bankDetailResponseSchema } from "@/lib/validation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, TrendingUp, AlertTriangle, Info } from "lucide-react";

const DASHBOARD_REFRESH_MS = 5 * 60 * 1000;

type IngestStatus = {
  status: "no_data" | "fresh" | "current" | "stale" | "outdated";
  hasNewDataAvailable: boolean;
  message?: string;
  lastUpdate?: {
    date: string;
    dataReferenceDate: string;
    referenceQuarter: string;
    daysSinceUpdate: number;
  };
  metadata?: {
    checkFrequency?: string;
    publicationModel?: string;
  };
};

export function DashboardPageClient() {
  const [banks, setBanks] = useState<DashboardBank[]>([]);
  const [selectedBank, setSelectedBank] = useState<DashboardBank | null>(null);
  const [selectedBankDetail, setSelectedBankDetail] = useState<BankDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [ingestStatus, setIngestStatus] = useState<IngestStatus | null>(null);
  const bankDetailCacheRef = useRef<Map<string, { data: BankDetail; fetchedAt: number }>>(new Map());
  const activeDetailRequestRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const loadBanks = async () => {
      try {
        const response = await fetch(`/api/banks?t=${Date.now()}`, {
          cache: 'no-store',
        });
        if (!response.ok) throw new Error('Falha ao carregar bancos');
        const data = await response.json();
        const normalizedBanks = Array.isArray(data) ? data : [];
        setBanks(normalizedBanks);
        setSelectedBank((currentSelection) => {
          if (!currentSelection) {
            return currentSelection;
          }

          const updatedSelection = normalizedBanks.find((bank) => bank.id === currentSelection.id)
            || normalizedBanks.find((bank) => bank.slug === currentSelection.slug)
            || null;

          return updatedSelection;
        });
      } catch (error) {
        console.error('Erro ao carregar bancos:', error);
        setBanks([]);
      }
    };

    const loadStatus = async () => {
      try {
        const response = await fetch(`/api/ingest/status?t=${Date.now()}`, {
          cache: 'no-store',
        });
        if (!response.ok) throw new Error('Falha ao carregar status de atualização');
        const data: IngestStatus = await response.json();
        setIngestStatus(data);
      } catch (error) {
        console.error('Erro ao carregar status de atualização:', error);
        setIngestStatus(null);
      }
    };

    loadBanks();
    loadStatus();

    const intervalId = window.setInterval(() => {
      loadBanks();
      loadStatus();
    }, DASHBOARD_REFRESH_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!selectedBank) {
      activeDetailRequestRef.current?.abort();
      setSelectedBankDetail(null);
      setIsLoadingDetail(false);
      return;
    }

    const cacheKey = selectedBank.slug;

    const loadBankDetail = async () => {
      activeDetailRequestRef.current?.abort();
      const controller = new AbortController();
      activeDetailRequestRef.current = controller;

      try {
        setIsLoadingDetail(true);
        setSelectedBankDetail(null);
        const response = await fetch(`/api/banks/${cacheKey}?t=${Date.now()}`, {
          signal: controller.signal,
          cache: 'no-store',
        });
        if (!response.ok) throw new Error('Falha ao carregar detalhes do banco');
        const rawData = await response.json();
        const parseResult = bankDetailResponseSchema.safeParse(rawData);
        if (!parseResult.success) {
          console.error('Resposta invalida da API de banco:', parseResult.error.flatten());
          throw new Error('Estrutura de dados invalida recebida da API');
        }
        const data: BankDetail = parseResult.data;
        bankDetailCacheRef.current.set(cacheKey, {
          data,
          fetchedAt: Date.now(),
        });
        setSelectedBankDetail(data);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        console.error('Erro ao carregar detalhes do banco:', error);
        setSelectedBankDetail(null);
      } finally {
        if (activeDetailRequestRef.current === controller) {
          setIsLoadingDetail(false);
        }
      }
    };

    loadBankDetail();

    return () => {
      if (activeDetailRequestRef.current) {
        activeDetailRequestRef.current.abort();
      }
    };
  }, [selectedBank]);

  const handleSelectBank = (bank: DashboardBank) => {
    if (selectedBank?.id === bank.id) {
      return;
    }
    setSelectedBank(bank);
  };

  return (
    <div className="relative w-full min-h-screen p-4 sm:p-6 md:p-8 lg:p-12 bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] opacity-10" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8 sm:space-y-10 lg:space-y-12">
      <div className="relative py-4">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-orange-600/10 rounded-2xl blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 sm:p-2.5 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-lg">
              <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
              Indicadores Bancarios em Tempo Real
            </h1>
          </div>
          <p className="text-slate-300 text-base sm:text-lg ml-0 sm:ml-14 mt-2">
            Painel informativo com indicadores tecnicos dos principais bancos do Brasil
          </p>
          <div className="ml-0 sm:ml-14 mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500/15 to-teal-500/15 border border-emerald-400/40 rounded-full">
            <span className="text-emerald-300 text-sm sm:text-base font-semibold">Fonte oficial:</span>
            <span className="text-slate-200 text-sm sm:text-base">Dados tecnicos do Banco Central (IF.data)</span>
          </div>
        </div>
      </div>

      <Card className="border-cyan-200/80 bg-cyan-50/95 backdrop-blur-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Info className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-700" />
            <CardTitle className="text-sm sm:text-base">Sincronização de Dados</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-700">
            {ingestStatus?.message || 'Status de atualização indisponível no momento.'}
          </p>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            Checagem: {ingestStatus?.metadata?.checkFrequency || 'A cada 6 horas'} | Publicação: {ingestStatus?.metadata?.publicationModel || 'Trimestral'}
          </p>
        </CardContent>
      </Card>

      <Card className="border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50/90 via-teal-50/80 to-cyan-50/90 shadow-lg backdrop-blur-sm hover:shadow-xl transition-all">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex-shrink-0">
              <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg">
                <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                📊 Leitura Tecnica dos Indicadores
              </h3>
              <p className="text-slate-700 text-base sm:text-lg leading-relaxed mb-3">
                Visualizacao organizada de <strong className="text-emerald-700">dados oficiais do BCB</strong>:
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-600 text-lg">✓</span>
                  <div>
                    <p className="font-semibold text-slate-900">Dados Técnicos BCB</p>
                    <p className="text-sm text-slate-600">Basileia, ROE, NPL, Liquidez</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-600 text-lg">✓</span>
                  <div>
                    <p className="font-semibold text-slate-900">Fonte Única Oficial</p>
                    <p className="text-sm text-slate-600">Banco Central do Brasil (IF.data / dados abertos)</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-emerald-700 font-medium mt-4 bg-emerald-100/50 px-3 py-2 rounded-lg inline-block">
                Uso informativo: nao constitui recomendacao financeira, juridica ou regulatoria.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:gap-5 md:grid-cols-3 lg:gap-6">
        <Card className="border-blue-200/80 bg-blue-50/95 backdrop-blur-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3 sm:pb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              <CardTitle className="text-sm sm:text-base">Análise Completa</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700">
              <strong>Base principal BCB:</strong> Basileia, Liquidez, ROE e NPL<br />
              Origem sinalizada por indicador: BCB direto, derivado IFData ou complementar
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-200/80 bg-purple-50/95 backdrop-blur-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3 sm:pb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
              <CardTitle className="text-sm sm:text-base">Alertas Inteligentes</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700">
              Notificações quando métricas técnicas do BCB piorarem
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-200/80 bg-orange-50/95 backdrop-blur-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3 sm:pb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <Info className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
              <CardTitle className="text-sm sm:text-base">{banks.length} Bancos</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700">
              Instituicoes acompanhadas por indice tecnico BCB
            </p>
          </CardContent>
        </Card>
      </div>

      <BanksOverview banks={banks} isLoading={banks.length === 0} />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/30"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-slate-900/90 text-slate-200">
            Análise Individual
          </span>
        </div>
      </div>

      <BankSelector 
        banks={banks}
        onSelectBank={handleSelectBank} 
        selectedBank={selectedBank}
      />

      {selectedBank ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <BankMetrics bank={selectedBank} detail={selectedBankDetail} isLoadingDetail={isLoadingDetail} />
        </div>
      ) : (
        <Card className="border-dashed border-2 border-white/40 bg-white/95 shadow-md backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 sm:py-20 lg:py-24 px-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mb-4 sm:mb-6">
              <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-purple-600" />
            </div>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-slate-900 mb-2 sm:mb-3">
              Selecione um banco para começar
            </h3>
            <p className="text-sm sm:text-base text-slate-600 text-center max-w-md lg:max-w-lg">
              Escolha um banco acima para visualizar seus indicadores tecnicos,
              índices de Basileia, liquidez e muito mais.
            </p>
          </CardContent>
        </Card>
      )}

      {selectedBank && selectedBankDetail && (
        <Card className="border-white/30 bg-white/90 shadow-md backdrop-blur-sm">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-xs sm:text-sm flex items-center gap-2">
              <Info className="h-4 w-4 sm:h-5 sm:w-5" />
              Fonte dos Dados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Dados financeiros coletados e processados a partir das publicações oficiais do
              Banco Central do Brasil (BCB / IF.data), sem scraping e sem fontes terceiras.
              {selectedBankDetail.scores?.date && (
                <> Referência: {new Date(selectedBankDetail.scores.date).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}.</>
              )}
            </p>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}