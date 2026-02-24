/**
 * Componente de Status de Atualização
 * 
 * Exibe informações sobre última atualização dos dados bancários
 * Útil para transparência com o usuário
 */

'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface UpdateStatus {
  status: 'fresh' | 'current' | 'stale' | 'outdated' | 'loading' | 'error';
  lastUpdate?: {
    date: string;
    dataReferenceDate: string;
    referenceQuarter: string;
    daysSinceUpdate: number;
    banksUpdated?: number;
    scoresComputed?: number;
  };
  nextExpectedUpdate?: {
    estimatedDate: string;
    quarter: string;
    daysUntilExpected: number;
  };
}

export function UpdateStatusBadge() {
  const [status, setStatus] = useState<UpdateStatus>({ status: 'loading' });

  useEffect(() => {
    fetchUpdateStatus();
  }, []);

  const fetchUpdateStatus = async () => {
    try {
      const response = await fetch('/api/ingest/status');
      const data = await response.json();

      if (data.success) {
        setStatus({
          status: data.status,
          lastUpdate: data.lastUpdate,
          nextExpectedUpdate: data.nextExpectedUpdate,
        });
      } else {
        setStatus({ status: 'error' });
      }
    } catch (error) {
      console.error('Erro ao buscar status:', error);
      setStatus({ status: 'error' });
    }
  };

  const getStatusColor = () => {
    switch (status.status) {
      case 'fresh':
      case 'current':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'stale':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'outdated':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'error':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getStatusIcon = () => {
    switch (status.status) {
      case 'fresh':
      case 'current':
        return <CheckCircle className="h-4 w-4" />;
      case 'stale':
        return <Clock className="h-4 w-4" />;
      case 'outdated':
        return <AlertCircle className="h-4 w-4" />;
      case 'loading':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusText = () => {
    if (status.status === 'loading') return 'Verificando...';
    if (status.status === 'error') return 'Erro ao verificar';
    if (!status.lastUpdate) return 'Sem dados';

    const { referenceQuarter, daysSinceUpdate } = status.lastUpdate;

    if (daysSinceUpdate < 7) {
      return `Atualizado recentemente (${referenceQuarter})`;
    } else if (daysSinceUpdate < 45) {
      return `Dados de ${referenceQuarter}`;
    } else if (daysSinceUpdate < 120) {
      return `Aguardando próxima publicação BCB`;
    } else {
      return `Dados com ${daysSinceUpdate} dias`;
    }
  };

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${getStatusColor()}`}
      title={
        status.lastUpdate
          ? `Última atualização: ${new Date(status.lastUpdate.date).toLocaleDateString('pt-BR')}`
          : 'Status desconhecido'
      }
    >
      {getStatusIcon()}
      <span>{getStatusText()}</span>
    </div>
  );
}

/**
 * Componente detalhado de status (para página de configurações/admin)
 */
export function UpdateStatusCard() {
  const [status, setStatus] = useState<UpdateStatus>({ status: 'loading' });
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchUpdateStatus();
  }, []);

  const fetchUpdateStatus = async () => {
    try {
      const response = await fetch('/api/ingest/status');
      const data = await response.json();

      if (data.success) {
        setStatus({
          status: data.status,
          lastUpdate: data.lastUpdate,
          nextExpectedUpdate: data.nextExpectedUpdate,
        });
      } else {
        setStatus({ status: 'error' });
      }
    } catch (error) {
      console.error('Erro ao buscar status:', error);
      setStatus({ status: 'error' });
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchUpdateStatus();
    setIsRefreshing(false);
  };

  if (status.status === 'loading') {
    return (
      <div className="rounded-xl border bg-white p-6">
        <div className="flex items-center gap-2 text-slate-600">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Carregando status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Status de Atualização</h3>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          title="Atualizar status"
        >
          <RefreshCw className={`h-4 w-4 text-slate-600 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {status.lastUpdate && (
        <div className="space-y-4">
          {/* Última Atualização */}
          <div>
            <div className="text-sm font-medium text-slate-500 mb-2">Última Atualização</div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium text-slate-900">
                  {new Date(status.lastUpdate.date).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
                <div className="text-sm text-slate-500">
                  Referência: {status.lastUpdate.referenceQuarter}
                </div>
              </div>
            </div>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <div className="text-sm text-slate-500">Bancos Monitorados</div>
              <div className="text-2xl font-bold text-slate-900">
                {status.lastUpdate.banksUpdated || 14}
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-500">Última Checagem</div>
              <div className="text-2xl font-bold text-slate-900">
                {status.lastUpdate.daysSinceUpdate}
                <span className="text-base font-normal text-slate-500 ml-1">dias atrás</span>
              </div>
            </div>
          </div>

          {/* Próxima Atualização */}
          {status.nextExpectedUpdate && (
            <div className="pt-4 border-t">
              <div className="text-sm font-medium text-slate-500 mb-2">Próxima Atualização BCB</div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium text-slate-900">
                    {new Date(status.nextExpectedUpdate.estimatedDate).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                  <div className="text-sm text-slate-500">
                    {status.nextExpectedUpdate.quarter} •{' '}
                    {status.nextExpectedUpdate.daysUntilExpected > 0
                      ? `em ${status.nextExpectedUpdate.daysUntilExpected} dias`
                      : 'disponível agora'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="pt-4 border-t">
            <div className="text-xs text-slate-500 space-y-1">
              <div>📅 Frequência BCB: Trimestral (~45 dias após fim do trimestre)</div>
              <div>🔄 Verificação: Diária às 2h AM</div>
              <div>🏦 Fonte: Banco Central do Brasil (IF.data)</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
