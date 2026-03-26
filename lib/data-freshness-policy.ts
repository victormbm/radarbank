/**
 * Política operacional para atualização de dados em produção.
 *
 * BCB IFData é trimestral, então o sistema deve checar frequentemente,
 * mas só ingerir quando existir nova data-base oficial.
 */

export const DATA_POLICY = {
  source: "Banco Central do Brasil - IF.data API",
  publicationModel: "Trimestral (com atraso operacional do provedor)",
  checkIntervalHours: 6,
  auditIntervalHours: 24,
  apiCacheMinutes: 10,
  uiRefreshMinutes: 5,
} as const;

export type DataStatus = "fresh" | "current" | "stale" | "outdated";

export function evaluateDataStatus(daysSinceReference: number): DataStatus {
  // Faixas mais aderentes ao ciclo trimestral do IFData.
  if (daysSinceReference <= 30) return "fresh";
  if (daysSinceReference <= 120) return "current";
  if (daysSinceReference <= 180) return "stale";
  return "outdated";
}

export function getUpdateRoutineSummary() {
  return {
    checkRoutine: `Checagem a cada ${DATA_POLICY.checkIntervalHours} horas`,
    ingestRoutine: "Ingestão apenas quando houver nova data-base oficial",
    recomputeRoutine: "Recompute imediato após ingestão bem-sucedida",
    auditRoutine: `Auditoria automática a cada ${DATA_POLICY.auditIntervalHours} horas e após ingestão`,
  };
}
