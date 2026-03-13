/**
 * Exemplos de uso da API de reputação e cruzamento de dados
 * 
 * Esta página demonstra como usar a API para cruzar dados:
 * - Métricas financeiras (BCB)
 * - Dados de reputação (Reclame Aqui)
 * - Score combinado
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
        <h1 className="text-3xl font-bold">Análise Combinada de Reputação e Solidez</h1>
        <p className="text-gray-600">
          Cruzamento de dados financeiros (BCB) com reputação (Reclame Aqui)
        </p>
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
                      30% Financeiro + 70% Reputação
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

                {/* Dados de Reputação */}
                {bank.reputation && (
                  <div className="space-y-3 border-l pl-6">
                    <h4 className="font-semibold text-gray-900">Reputação (Reclame Aqui)</h4>
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Score:</span>
                        <span className={`font-semibold ${getScoreColor(bank.reputation.reputationScore * 10)}`}>
                          {bank.reputation.reputationScore.toFixed(1)}/10
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Classificação:</span>
                        <span className="font-semibold">
                          {getRatingStars(bank.reputation.averageRating)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Resolução:</span>
                        <span className="font-semibold">
                          {bank.reputation.resolvedRate?.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Reclamações:</span>
                        <span className="font-semibold">
                          {bank.reputation.totalComplaints?.toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tempo resposta:</span>
                        <span className="font-semibold">
                          {bank.reputation.responseTime?.toFixed(1)}h
                        </span>
                      </div>
                    </div>

                    {/* Top Reclamações */}
                    {bank.reputation.topComplaints && bank.reputation.topComplaints.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Top Reclamações:</p>
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
                <th className="text-center py-3 px-4">Score Financeiro</th>
                <th className="text-center py-3 px-4">Reputação</th>
                <th className="text-center py-3 px-4 font-bold">Score Combinado</th>
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
                      {bank.reputationScore.toFixed(1)}/10
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
        <h4 className="font-semibold mb-2">Como Funciona?</h4>
        <ul className="text-sm space-y-1 text-gray-700">
          <li>
            🏦 <strong>Score Financeiro:</strong> Índice de Basileia dos dados do Banco Central (BCB)
          </li>
          <li>
            ⭐ <strong>Reputação:</strong> Score de reputação do Reclame Aqui (0-10)
          </li>
          <li>
            📊 <strong>Score Combinado:</strong> Fórmula ponderada = (Financeiro × 30%) + (Reputação × 70%)
          </li>
          <li>
            💡 <strong>Valor Agregado:</strong> Visão 360° do banco considerando solidez E satisfação do cliente
          </li>
        </ul>
      </Card>
    </div>
  );
}
