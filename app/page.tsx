"use client";

import Link from "next/link";
import { TrendingUp, Activity, Shield, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import dynamic from "next/dynamic";

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });



// Dados de exemplo: evolução de Basileia, Liquidez e Rentabilidade de bancos que fecharam (fictício)
const chartData = {
  years: ['2019', '2020', '2021', '2022', '2023', '2024', '2025'],
  basileia: {
    name: 'Basileia (%)',
    color: '#60a5fa',
    data: [13.2, 12.8, 12.1, 11.0, 10.2, 8.5, 5.1],
  },
  liquidez: {
    name: 'Liquidez (%)',
    color: '#34d399',
    data: [8.2, 7.9, 7.5, 7.0, 6.5, 5.2, 3.8],
  },
  rentabilidade: {
    name: 'Rentabilidade (%)',
    color: '#f9a8d4',
    data: [4.1, 3.7, 3.2, 2.8, 2.1, 1.2, -0.5],
  },
};

function getCombinedChartOption() {
  return {
    title: {
      text: 'Evolução dos Indicadores Bancários',
      left: 'center',
      top: 10,
      textStyle: { color: '#fff', fontWeight: 700, fontSize: 18, textShadowColor: '#000', textShadowBlur: 8 },
    },
    tooltip: { trigger: 'axis' },
    legend: {
      data: [chartData.basileia.name, chartData.liquidez.name, chartData.rentabilidade.name],
      top: 40,
      textStyle: { color: '#fff', fontWeight: 600, fontSize: 13 },
      icon: 'circle',
    },
    grid: { left: 20, right: 20, top: 80, bottom: 30, containLabel: true },
    xAxis: {
      type: 'category',
      data: chartData.years,
      axisLine: { lineStyle: { color: '#888' } },
      axisLabel: { color: '#bbb', fontWeight: 500 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#222' } },
      axisLabel: { color: '#bbb' },
    },
    series: [
      {
        name: chartData.basileia.name,
        data: chartData.basileia.data,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 10,
        lineStyle: { color: chartData.basileia.color, width: 4, shadowColor: chartData.basileia.color, shadowBlur: 12 },
        itemStyle: { color: chartData.basileia.color, borderColor: '#fff', borderWidth: 2 },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [ { offset: 0, color: chartData.basileia.color + '99' }, { offset: 1, color: 'transparent' } ] } },
        emphasis: { focus: 'series' },
      },
      {
        name: chartData.liquidez.name,
        data: chartData.liquidez.data,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 10,
        lineStyle: { color: chartData.liquidez.color, width: 4, shadowColor: chartData.liquidez.color, shadowBlur: 12 },
        itemStyle: { color: chartData.liquidez.color, borderColor: '#fff', borderWidth: 2 },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [ { offset: 0, color: chartData.liquidez.color + '99' }, { offset: 1, color: 'transparent' } ] } },
        emphasis: { focus: 'series' },
      },
      {
        name: chartData.rentabilidade.name,
        data: chartData.rentabilidade.data,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 10,
        lineStyle: { color: chartData.rentabilidade.color, width: 4, shadowColor: chartData.rentabilidade.color, shadowBlur: 12 },
        itemStyle: { color: chartData.rentabilidade.color, borderColor: '#fff', borderWidth: 2 },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [ { offset: 0, color: chartData.rentabilidade.color + '99' }, { offset: 1, color: 'transparent' } ] } },
        emphasis: { focus: 'series' },
      },
    ],
    backgroundColor: 'transparent',
  };
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0f0f1e] text-white relative overflow-hidden">
      {/* Banner de alerta sobre falências */}
      <div className="w-full bg-gradient-to-r from-red-700 via-purple-700 to-blue-700 text-white py-3 px-4 text-center font-bold text-lg shadow-lg animate-pulse mb-2">
        🚨 Atenção: Mais de 10 bancos faliram nos últimos anos sem aviso! Proteja-se e monitore seu banco em tempo real.
      </div>
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/3 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/3 w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-slate-800/50 backdrop-blur-sm bg-slate-900/30">
        <div className="max-w-[1400px] mx-auto px-3 py-4 lg:px-12 xl:px-16">
          <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-3">
            {/* Logo à esquerda */}
            <div className="flex justify-center sm:justify-start">
              <Logo size={96} showText={false} className="w-[100px] sm:w-[400px] sm:size-[128px] sm:showText" />
            </div>
            {/* Título centralizado */}
            <div className="flex flex-col items-center justify-center">
              <span className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent block text-center">Banco Seguro BR</span>
              <span className="text-xs lg:text-sm text-slate-400 mt-0.5 text-center">Monitor de Saúde Bancária</span>
            </div>
            {/* Botões à direita */}
            <div className="flex justify-center sm:justify-end items-center gap-2 sm:gap-4 mt-2 sm:mt-0">
              <Link href="/login" className="text-sm text-slate-300 hover:text-white transition-colors font-medium">
                Login
              </Link>
              <Link href="/register">
                <Button className="h-9 sm:h-10 px-4 sm:px-6 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold text-sm rounded-lg shadow-lg shadow-purple-600/30 transition-all hover:shadow-purple-600/50 border-0">
                  Começar agora
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 px-3 py-6 sm:px-6 lg:px-12 xl:px-16 max-w-[1400px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-8 xl:gap-20 items-center lg:items-start text-center lg:text-left">
          {/* Left Column - Hero */}
          <div className="space-y-6 lg:space-y-10 w-full lg:w-1/2">
            <div>
              {/* Alert Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-700/40 border border-red-500/30 backdrop-blur-sm mb-6 animate-pulse">
                <Shield className="h-4 w-4 text-red-400" />
                <span className="text-sm font-medium text-red-300">Falências bancárias acontecem sem aviso!</span>
              </div>

              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-relaxed mb-6 text-center lg:text-left">
                <span className="block text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-relaxed text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-purple-400 to-blue-400 mb-6" style={{paddingBottom: '0.3em', overflow: 'visible', display: 'block'}}>Seu dinheiro seguro?</span>
                <span className="block text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600 leading-relaxed">Descubra antes de ser tarde!</span>
              </h1>
              <p className="text-lg lg:text-xl text-slate-300 leading-relaxed font-semibold">
                Monitoramos <span className="text-white">falências, riscos e saúde bancária</span> com tecnologia avançada.<br className="sm:hidden" />
                Termos difíceis como &quot;Basileia&quot;, &quot;Liquidez&quot; e &quot;Rentabilidade&quot; são explicados de forma simples para você.
              </p>
              <div className="mt-4 text-sm text-slate-400">
                <span className="font-bold text-purple-300">Facilitamos:</span> <span className="text-white">Basileia</span> = Segurança do banco | <span className="text-white">Liquidez</span> = Facilidade para pagar contas | <span className="text-white">Rentabilidade</span> = Banco lucrando ou não
              </div>
            </div>
          </div>

          {/* Right Column - Gráfico pré-falência com linha neon e degradê */}
          <div className="w-full lg:w-1/2 flex flex-col items-center">
            <div className="bg-gradient-to-br from-purple-900/70 via-blue-800/40 to-purple-900/80 border border-purple-500/40 rounded-3xl p-5 flex flex-col items-center shadow-2xl w-full">
              <ReactECharts
                option={{
                  backgroundColor: 'transparent',
                  grid: {
                    left: '5%',
                    right: '5%',
                    bottom: '10%',
                    top: '15%',
                    containLabel: true
                  },
                  tooltip: {
                    trigger: 'axis',
                    backgroundColor: '#1a1a2e',
                    borderColor: '#7000ff',
                    textStyle: { color: '#fff' }
                  },
                  xAxis: {
                    type: 'category',
                    boundaryGap: false,
                    data: ['Dia 1', 'Dia 2', 'Dia 3', 'Dia 4', 'Dia 5', 'Dia 6', 'Dia 7', 'Dia 8', 'Dia 9', 'Dia 10'],
                    axisLine: { lineStyle: { color: '#444' } },
                    axisLabel: { color: '#888' }
                  },
                  yAxis: {
                    type: 'value',
                    splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.05)' } },
                    axisLabel: { formatter: '{value}%', color: '#888' }
                  },
                  series: [
                    {
                      name: 'Saúde Financeira',
                      type: 'line',
                      smooth: true,
                      symbol: 'circle',
                      symbolSize: 8,
                      lineStyle: {
                        color: '#ff3131',
                        width: 4,
                        shadowBlur: 15,
                        shadowColor: '#ff3131',
                        shadowOffsetY: 5
                      },
                      itemStyle: {
                        color: '#ff3131',
                        borderColor: '#fff',
                        borderWidth: 2
                      },
                      areaStyle: {
                        color: {
                          type: 'linear',
                          x: 0,
                          y: 0,
                          x2: 0,
                          y2: 1,
                          colorStops: [
                            { offset: 0, color: 'rgba(255, 49, 49, 0.4)' },
                            { offset: 1, color: 'rgba(255, 49, 49, 0)' }
                          ]
                        }
                      },
                      data: [98, 95, 97, 99, 98, 60, 40, 25, 15, 2],
                      markPoint: {
                        data: [
                          {
                            coord: [5, 60],
                            value: 'Possível problema detectado!',
                            symbol: 'pin',
                            symbolSize: 70,
                            itemStyle: { color: '#ffb300' },
                            label: {
                              color: '#fff',
                              fontWeight: 'bold',
                              fontSize: 13,
                              formatter: 'Alerta: Possível problema!\nVocê seria notificado.'
                            }
                          }
                        ]
                      }
                    }
                  ]
                }}
                style={{ height: 340, width: '100%' }}
              />
              <div className="text-xs text-slate-400 text-center mt-2">A linha vermelha demonstra a queda abrupta da saúde financeira do banco, detectada pelo Banco Seguro BR antes do colapso.</div>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-purple-900/30 backdrop-blur-md border border-purple-700/40 rounded-2xl p-5 hover:bg-purple-900/40 hover:border-purple-600/50 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600/30">
                <TrendingUp className="h-4.5 w-4.5 text-purple-400" />
              </div>
              <span className="text-sm font-semibold text-purple-200">Demais Garantias</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">Cobertura adicional</p>
          </div>
          <div className="bg-purple-900/30 backdrop-blur-md border border-purple-700/40 rounded-2xl p-5 hover:bg-purple-900/40 hover:border-purple-600/50 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600/30">
                <Activity className="h-4.5 w-4.5 text-purple-400" />
              </div>
              <span className="text-sm font-semibold text-purple-200">Risco Normal</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">Score saudável</p>
          </div>
          <div className="bg-purple-900/30 backdrop-blur-md border border-purple-700/40 rounded-2xl p-5 hover:bg-purple-900/40 hover:border-purple-600/50 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600/30">
                <Shield className="h-4.5 w-4.5 text-purple-400" />
              </div>
              <span className="text-sm font-semibold text-purple-200">Monitoramento 24/7</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">Alertas em tempo real</p>
          </div>
          <div className="bg-purple-900/30 backdrop-blur-md border border-purple-700/40 rounded-2xl p-5 hover:bg-purple-900/40 hover:border-purple-600/50 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600/30">
                <Bell className="h-4.5 w-4.5 text-purple-400" />
              </div>
              <span className="text-sm font-semibold text-purple-200">Relatórios 24/7</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">Análise completa</p>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex items-center justify-center gap-8 pt-8 opacity-40">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Shield className="h-4 w-4" />
            <span className="font-medium">BACEN</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Shield className="h-4 w-4" />
            <span className="font-medium">Serasa Experian</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Shield className="h-4 w-4" />
            <span className="font-medium">Outros</span>
          </div>
        </div>
      </main>
    </div>
  );
}
