/**
 * Sistema de Rastreamento de Atualizações
 * Monitora última atualização e detecta mudanças significativas
 */

import { PrismaClient } from '@prisma/client';
import { bcbAPI } from '@/server/bcb-api-service';

const prisma = new PrismaClient();

export interface UpdateMetadata {
  lastUpdateDate: Date;
  dataReferenceDate: string; // Ex: "2025-Q4" ou "2025-12-31"
  banksUpdated: number;
  scoresComputed: number;
  significantChanges: SignificantChange[];
}

export interface SignificantChange {
  bankId: string;
  bankName: string;
  metric: 'score' | 'basileia' | 'roe' | 'npl';
  oldValue: number;
  newValue: number;
  changePercent: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Salva metadados da última atualização
 */
export async function saveUpdateMetadata(metadata: UpdateMetadata) {
  // Salvar em uma tabela de logs ou cache
  // Por enquanto, vamos usar console.log e retornar
  console.log('✅ Atualização concluída:', {
    data: metadata.lastUpdateDate,
    bancos: metadata.banksUpdated,
    scores: metadata.scoresComputed,
    mudancas: metadata.significantChanges.length,
  });
  
  return metadata;
}

/**
 * Busca última atualização registrada
 */
export async function getLastUpdateMetadata(): Promise<UpdateMetadata | null> {
  try {
    // Buscar o snapshot mais recente limitado a data-base oficial atualmente disponivel.
    const officialLatestDate = new Date(bcbAPI.getLatestAvailableQuarter().date);
    let latestSnapshot = await prisma.bankSnapshot.findFirst({
      where: {
        date: {
          lte: officialLatestDate,
        },
      },
      orderBy: { date: 'desc' },
      include: { bank: true },
    });

    // Fallback para bases antigas que ainda nao foram normalizadas.
    if (!latestSnapshot) {
      latestSnapshot = await prisma.bankSnapshot.findFirst({
        orderBy: { date: 'desc' },
        include: { bank: true },
      });
    }

    if (!latestSnapshot) return null;

    // Contar quantos bancos foram atualizados nessa data
    const banksUpdated = await prisma.bankSnapshot.count({
      where: { date: latestSnapshot.date },
    });

    // Contar scores dessa mesma data
    const scoresComputed = await prisma.bankScore.count({
      where: { date: latestSnapshot.date },
    });

    return {
      lastUpdateDate: latestSnapshot.date,
      dataReferenceDate: latestSnapshot.date.toISOString(),
      banksUpdated,
      scoresComputed,
      significantChanges: [],
    };
  } catch (error) {
    console.error('Erro ao buscar última atualização:', error);
    return null;
  }
}

/**
 * Detecta mudanças significativas entre dois períodos
 */
export async function detectSignificantChanges(
  referenceDate1: string,
  referenceDate2: string
): Promise<SignificantChange[]> {
  const changes: SignificantChange[] = [];

  try {
    const date1 = new Date(referenceDate1);
    const date2 = new Date(referenceDate2);

    // Buscar scores dos dois períodos
    const scores1 = await prisma.bankScore.findMany({
      where: { date: date1 },
      include: { bank: true },
    });

    const scores2 = await prisma.bankScore.findMany({
      where: { date: date2 },
      include: { bank: true },
    });

    // Comparar scores
    for (const score1 of scores1) {
      const score2 = scores2.find((s) => s.bankId === score1.bankId);
      if (!score2) continue;

      // Mudança no score geral
      const scoreDiff = score2.totalScore - score1.totalScore;
      const scoreChangePercent = (scoreDiff / score1.totalScore) * 100;

      if (Math.abs(scoreChangePercent) >= 5) {
        // Mudança >= 5%
        changes.push({
          bankId: score1.bankId,
          bankName: score1.bank.name,
          metric: 'score',
          oldValue: score1.totalScore,
          newValue: score2.totalScore,
          changePercent: scoreChangePercent,
          severity: getSeverity(Math.abs(scoreChangePercent)),
        });
      }
    }

    // Buscar snapshots para comparar métricas específicas
    const snapshots1 = await prisma.bankSnapshot.findMany({
      where: { date: date1 },
      include: { bank: true },
    });

    const snapshots2 = await prisma.bankSnapshot.findMany({
      where: { date: date2 },
      include: { bank: true },
    });

    for (const snap1 of snapshots1) {
      const snap2 = snapshots2.find((s) => s.bankId === snap1.bankId);
      if (!snap2) continue;

      // Basileia
      if (snap1.basilRatio && snap2.basilRatio) {
        const diff = ((snap2.basilRatio - snap1.basilRatio) / snap1.basilRatio) * 100;
        if (Math.abs(diff) >= 10) {
          changes.push({
            bankId: snap1.bankId,
            bankName: snap1.bank.name,
            metric: 'basileia',
            oldValue: snap1.basilRatio,
            newValue: snap2.basilRatio,
            changePercent: diff,
            severity: getSeverity(Math.abs(diff)),
          });
        }
      }

      // NPL - aumentos são críticos
      if (snap1.nplRatio && snap2.nplRatio) {
        const diff = ((snap2.nplRatio - snap1.nplRatio) / snap1.nplRatio) * 100;
        if (Math.abs(diff) >= 15) {
          changes.push({
            bankId: snap1.bankId,
            bankName: snap1.bank.name,
            metric: 'npl',
            oldValue: snap1.nplRatio,
            newValue: snap2.nplRatio,
            changePercent: diff,
            severity: diff > 0 ? 'critical' : 'medium', // Aumento é pior
          });
        }
      }
    }
  } catch (error) {
    console.error('Erro ao detectar mudanças:', error);
  }

  return changes;
}

/**
 * Determina severidade baseada na mudança percentual
 */
function getSeverity(changePercent: number): 'low' | 'medium' | 'high' | 'critical' {
  if (changePercent >= 30) return 'critical';
  if (changePercent >= 20) return 'high';
  if (changePercent >= 10) return 'medium';
  return 'low';
}

/**
 * Verifica se há novos dados disponíveis
 * Compara data de referência mais recente local vs BCB
 */
export async function checkForNewData(): Promise<{
  hasNewData: boolean;
  localLatestDate: string | null;
  officialLatestDate: string | null;
  message: string;
}> {
  try {
    const lastUpdate = await getLastUpdateMetadata();
    const latestQuarter = bcbAPI.getLatestAvailableQuarter();
    const officialLatestDate = latestQuarter.date;
    const officialLatestTs = new Date(officialLatestDate).getTime();
    
    if (!lastUpdate) {
      return {
        hasNewData: true,
        localLatestDate: null,
        officialLatestDate,
        message: `Nenhum dado local encontrado. Primeira ingestão necessária (base oficial: ${officialLatestDate}).`,
      };
    }

    const localLatestDate = new Date(lastUpdate.dataReferenceDate)
      .toISOString()
      .split('T')[0];
    const localLatestTs = new Date(localLatestDate).getTime();

    if (Number.isNaN(localLatestTs)) {
      return {
        hasNewData: true,
        localLatestDate: null,
        officialLatestDate,
        message: `Data local inválida. Recomendado forçar ingestão para base oficial ${officialLatestDate}.`,
      };
    }

    if (localLatestTs < officialLatestTs) {
      return {
        hasNewData: true,
        localLatestDate,
        officialLatestDate,
        message: `Nova base oficial detectada (${officialLatestDate}). Última local: ${localLatestDate}.`,
      };
    }

    return {
      hasNewData: false,
      localLatestDate,
      officialLatestDate,
      message: `Dados atualizados na última base oficial (${officialLatestDate}).`,
    };
  } catch (error) {
    console.error('Erro ao verificar novos dados:', error);
    return {
      hasNewData: false,
      localLatestDate: null,
      officialLatestDate: null,
      message: 'Erro ao verificar novos dados',
    };
  }
}
