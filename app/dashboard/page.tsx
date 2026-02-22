"use client";

import { useState } from "react";
import { BankSelector } from "@/components/bank-selector";
import { BankMetrics } from "@/components/bank-metrics";
import { BanksOverview } from "@/components/banks-overview";
import { BrazilianBank } from "@/lib/brazilian-banks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, TrendingUp, AlertTriangle, Info } from "lucide-react";

export default function DashboardPage() {
  const [selectedBank, setSelectedBank] = useState<BrazilianBank | null>(null);

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 md:p-8 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-8 sm:space-y-10 lg:space-y-12">
      {/* Header Section */}
      <div className="relative py-4">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-orange-600/10 rounded-2xl blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 sm:p-2.5 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-lg">
              <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
              Radar Bank
            </h1>
          </div>
          <p className="text-slate-600 text-base sm:text-lg ml-0 sm:ml-14 mt-2">
            Monitor de Saúde Bancária - Análise em tempo real dos principais bancos do Brasil
          </p>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 sm:gap-5 md:grid-cols-3 lg:gap-6">
        <Card className="border-blue-200 bg-blue-50/50 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3 sm:pb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              <CardTitle className="text-sm sm:text-base">Métricas Monitoradas</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Basileia, Liquidez, ROE e Inadimplência em tempo real
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/50 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3 sm:pb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
              <CardTitle className="text-sm sm:text-base">Sistema de Alertas</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Antecipação de risco sistêmico e alertas inteligentes
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/50 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3 sm:pb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <Info className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
              <CardTitle className="text-sm sm:text-base">14 Bancos Ativos</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Principais instituições financeiras do mercado brasileiro
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Overview Section */}
      <div className="space-y-5 sm:space-y-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full bg-purple-600" />
          <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-slate-900">Visão Geral do Sistema</h2>
        </div>
        <BanksOverview />
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-gradient-to-br from-slate-50 via-purple-50/20 to-pink-50/20 text-slate-500">
            Análise Individual
          </span>
        </div>
      </div>

      {/* Bank Selector */}
      <BankSelector 
        onSelectBank={setSelectedBank} 
        selectedBank={selectedBank}
      />

      {/* Bank Metrics - Only show when a bank is selected */}
      {selectedBank ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <BankMetrics bank={selectedBank} />
        </div>
      ) : (
        <Card className="border-dashed border-2 border-slate-200 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 sm:py-20 lg:py-24 px-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mb-4 sm:mb-6">
              <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-purple-600" />
            </div>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-slate-900 mb-2 sm:mb-3">
              Selecione um banco para começar
            </h3>
            <p className="text-sm sm:text-base text-slate-500 text-center max-w-md lg:max-w-lg">
              Escolha um banco acima para visualizar suas métricas de saúde financeira,
              índices de Basileia, liquidez e muito mais.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Architecture Note */}
      {selectedBank && (
        <Card className="border-slate-200 bg-slate-50/50 shadow-sm">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-xs sm:text-sm flex items-center gap-2">
              <Info className="h-4 w-4 sm:h-5 sm:w-5" />
              Nota Técnica
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Os dados exibidos atualmente são simulados para fins de prototipação do frontend.
              Na próxima fase, integraremos com APIs do Banco Central e fontes oficiais para
              dados reais em tempo real.
            </p>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}
