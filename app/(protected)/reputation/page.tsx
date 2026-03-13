/**
 * Página: Análise de Reclamações + Saúde Financeira
 *
 * Fontes de dados:
 * - Métricas financeiras: BCB IFData (dados abertos)
 * - Reclamações: BCB Ranking Oficial de Reclamações (dados abertos, LAI)
 *   https://dadosabertos.bcb.gov.br/dataset/reclamacoes-recebidas-pelo-banco-central
 *
 * NÃO usa scraping do Reclame Aqui.
 */

'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface BankData {
  id: string;
  name: string;
  slug: string;
  type: string;
  financialMetrics: {
    basilRatio: number;
    roe: number;
    nplRatio: number;
    totalAssets: number;
    date: string;
  } | null;
  reputation: {
    reputationScore: number;
    resolvedRate: number;
    averageRating: number;
    totalComplaints: number;
    responseTime: number;
    sentimentScore: number;
    topComplaints: string[];
    lastUpdate: string;
  } | null;
  combinedScore: number;
  analysis: string;
}

interface RankingData {
  rank: number;
  name: string;
  slug: string;
  basilRatio: number;
  reputationScore: number;
  combinedScore: number;
}

export default function ReputationPage() {
  const [banks, setBanks] = useState<BankData[]>([]);
  const [ranking, setRanking] = useState<RankingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'comparison' | 'ranking'>('comparison');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);

      // Buscar lista de bancos com dados combinados
      const banksRes = await fetch('/api/reputation/banks');
      const banksData = await banksRes.json();
      setBanks(banksData.banks);

      // Buscar ranking
      const rankingRes = await fetch('/api/reputation/banks?action=ranking');
      const rankingData = await rankingRes.json();
      setRanking(rankingData.ranking);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-900';
    if (score >= 60) return 'bg-yellow-100 text-yellow-900';
    return 'bg-red-100 text-red-900';
  };

  const getRatingStars = (rating: number) => {
    return '⭐'.repeat(Math.round(rating));
  };

  if (loading) {
    return <div className="text-center py-10">Carregando dados...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Análise de Reclamações + Solidez Financeira</h1>
        <p className="text-gray-600">
          Dados oficiais do Banco Central do Brasil — atualizados trimestralmente
        </p>
        <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 text-xs px-3 py-1 rounded-full">
          <span>✅</span>
          <span>Fonte: BCB dados abertos (Lei de Acesso à Informação) — uso 100% legal</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('comparison')}
          className={`px-4 py-2 font-semibold ${
            activeTab === 'comparison'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600'
          }`}
        >
          Comparação Detalhada
        </button>
        <button
          onClick={() => setActiveTab('ranking')}
          className={`px-4 py-2 font-semibold ${
            activeTab === 'ranking'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600'
          }`}
        >
          Ranking
        </button>
      </div>

      {/* Comparison Tab */}
      {activeTab === 'comparison' && (
        <div className="space-y-4">
          {banks.map(bank => (
            <Card key={bank.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Informações Básicas */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold">{bank.name}</h3>
                    <Badge variant="outline" className="mt-2">
                      {bank.type}
                    </Badge>
                  </div>

                  {/* Score Combinado */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                    <p className="text-sm font-semibold text-gray-700">Score Combinado</p>
                    <p className={`text-4xl font-bold ${getScoreColor(bank.combinedScore)}`}>
                      {bank.combinedScore.toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      60% Saúde Financeira + 40% Índice Reclamações
                    </p>
                  </div>
                </div>

                {/* Dados Financeiros (BCB) */}
                {bank.financialMetrics && (
                  <div className="space-y-3 border-l pl-6">
                    <h4 className="font-semibold text-gray-900">Saúde Financeira</h4>
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Basileia:</span>
                        <span className="font-semibold">
                          {bank.financialMetrics.basilRatio?.toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">ROE:</span>
                        <span className="font-semibold">
                          {bank.financialMetrics.roe?.toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">NPL (Inadimplência):</span>
                        <span className="font-semibold">
                          {bank.financialMetrics.nplRatio?.toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ativos:</span>
                        <span className="font-semibold">
                          R$ {(bank.financialMetrics.totalAssets / 1000).toFixed(0)}B
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Dados de Reclamações (BCB Oficial) */}
                {bank.reputation && (
                  <div className="space-y-3 border-l pl-6">
                    <h4 className="font-semibold text-gray-900">Reclamações (BCB Oficial)</h4>
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Índice BCB:</span>
                        <span className={`font-semibold ${getScoreColor(bank.reputation.reputationScore * 10)}`}>
                          {bank.reputation.reputationScore.toFixed(1)}/10
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">% Não procedentes:</span>
                        <span className="font-semibold">
                          {bank.reputation.resolvedRate?.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total respondidas:</span>
                        <span className="font-semibold">
                          {bank.reputation.totalComplaints?.toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>

                    {/* Top categorias se disponíveis */}
                    {bank.reputation.topComplaints && bank.reputation.topComplaints.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Principais problemas:</p>
                        <div className="flex flex-wrap gap-2">
                          {bank.reputation.topComplaints.map((complaint, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {complaint}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Análise Qualitativa */}
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm">{bank.analysis}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Ranking Tab */}
      {activeTab === 'ranking' && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Posição</th>
                <th className="text-left py-3 px-4">Banco</th>
                <th className="text-center py-3 px-4">Saúde Financeira</th>
                <th className="text-center py-3 px-4">Reclamações BCB</th>
                <th className="text-center py-3 px-4 font-bold">Score Final</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map(bank => (
                <tr
                  key={bank.slug}
                  className={`border-b hover:bg-gray-50 ${
                    bank.rank <= 3 ? 'bg-yellow-50' : ''
                  }`}
                >
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                      bank.rank === 1 ? 'bg-yellow-400 text-gray-900' :
                      bank.rank === 2 ? 'bg-gray-300 text-gray-900' :
                      bank.rank === 3 ? 'bg-orange-300 text-gray-900' :
                      'bg-gray-100 text-gray-900'
                    }`}>
                      {bank.rank === 1 ? '🥇' : bank.rank === 2 ? '🥈' : bank.rank === 3 ? '🥉' : bank.rank}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-semibold">{bank.name}</td>
                  <td className="py-4 px-4 text-center">
                    <span className="bg-blue-100 text-blue-900 px-3 py-1 rounded-full text-sm font-semibold">
                      {bank.basilRatio.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="bg-purple-100 text-purple-900 px-3 py-1 rounded-full text-sm font-semibold">
                      {bank.reputationScore.toFixed(1)}/10 BCB
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      getScoreColor(bank.combinedScore)
                    }`}>
                      {bank.combinedScore.toFixed(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Legenda */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <h4 className="font-semibold mb-2">Como Calculamos?</h4>
        <ul className="text-sm space-y-1 text-gray-700">
          <li>
            🏦 <strong>Saúde Financeira (60%):</strong> Índice de Basileia e métricas BCB IFData
          </li>
          <li>
            📋 <strong>Reclamações BCB (40%):</strong> Ranking oficial de reclamações do Banco Central — dados públicos trimestrais
          </li>
          <li>
            📊 <strong>Score Final:</strong> Fórmula = (Saúde Financeira × 60%) + (Índice Reclamações × 40%)
          </li>
          <li>
            🏛️ <strong>Fonte:</strong> <a href="https://dadosabertos.bcb.gov.br" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">dadosabertos.bcb.gov.br</a> — uso comercial permitido (Lei de Acesso à Informação)
          </li>
        </ul>
      </Card>

      {/* Seção de Afiliados / Abertura de Contas */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">💳 Abra sua Conta nos Bancos Mais Bem Avaliados</h2>
        <p className="text-sm text-gray-600 mb-4">
          Contas digitais gratuitas nos bancos com melhor desempenho no nosso ranking
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              name: 'Nubank',
              slug: 'nubank',
              tagline: 'Conta digital sem tarifas',
              cta: 'Abrir conta grátis',
              url: 'https://nubank.com.br/abrir-conta',
              color: 'from-purple-500 to-purple-700',
            },
            {
              name: 'Banco Inter',
              slug: 'inter',
              tagline: 'Conta completa + cashback',
              cta: 'Abrir conta grátis',
              url: 'https://inter.co/conta-digital',
              color: 'from-orange-500 to-orange-700',
            },
            {
              name: 'C6 Bank',
              slug: 'c6',
              tagline: 'Cartão sem anuidade + CDB',
              cta: 'Abrir conta grátis',
              url: 'https://c6bank.com.br',
              color: 'from-gray-700 to-gray-900',
            },
            {
              name: 'PagBank',
              slug: 'pagbank',
              tagline: 'Conta com rendimento automático',
              cta: 'Abrir conta grátis',
              url: 'https://pagbank.com.br',
              color: 'from-yellow-500 to-yellow-700',
            },
            {
              name: 'Neon',
              slug: 'neon',
              tagline: 'Conta sem taxa e sem burocracia',
              cta: 'Abrir conta grátis',
              url: 'https://neon.com.br',
              color: 'from-blue-400 to-blue-600',
            },
            {
              name: 'BTG Pactual',
              slug: 'btg',
              tagline: 'O maior banco de investimentos do Brasil',
              cta: 'Conhecer BTG+',
              url: 'https://btgpactual.com',
              color: 'from-blue-800 to-blue-900',
            },
          ].map(bank => (
            <a
              key={bank.slug}
              href={bank.url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className={`bg-gradient-to-br ${bank.color} text-white rounded-xl p-5 flex flex-col gap-3 hover:opacity-90 transition-opacity shadow-md`}
            >
              <div>
                <p className="font-bold text-lg">{bank.name}</p>
                <p className="text-sm opacity-90">{bank.tagline}</p>
              </div>
              <span className="mt-auto inline-block bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-2 rounded-lg text-center">
                {bank.cta} →
              </span>
            </a>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">
          * Links de parceiros. A Radar Bank pode receber comissão ao indicar abertura de contas.
          Os dados de ranking são independentes dos acordos comerciais.
        </p>
      </div>
    </div>
  );
}
