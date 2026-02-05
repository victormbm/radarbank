export interface Alert {
  id: string;
  bankName: string;
  bankId: string;
  type: "score_drop" | "score_increase" | "metric_warning" | "metric_critical";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  metric?: string;
  oldValue?: number;
  newValue?: number;
  timestamp: Date;
  isRead: boolean;
}

export interface AlertFilter {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: {
    banks?: string[];
    severity?: string[];
    types?: string[];
    scoreThreshold?: number;
    metricKeys?: string[];
  };
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  createdAt: Date;
}

export const mockAlerts: Alert[] = [
  {
    id: "1",
    bankName: "Nubank",
    bankId: "1",
    type: "score_drop",
    severity: "high",
    title: "Queda no Score Detectada",
    description: "Score de saúde do banco caiu de 88.5 para 85.5 nas últimas 24 horas",
    oldValue: 88.5,
    newValue: 85.5,
    timestamp: new Date("2024-02-05T10:30:00"),
    isRead: false,
  },
  {
    id: "2",
    bankName: "Inter",
    bankId: "4",
    type: "metric_warning",
    severity: "medium",
    title: "Alerta de Índice de Liquidez",
    description: "Índice de liquidez rápida caiu abaixo do limite (125%)",
    metric: "quick_liquidity",
    newValue: 125.0,
    timestamp: new Date("2024-02-05T09:15:00"),
    isRead: false,
  },
  {
    id: "3",
    bankName: "C6 Bank",
    bankId: "6",
    type: "score_increase",
    severity: "low",
    title: "Melhoria no Score",
    description: "Score de saúde do banco melhorou de 79.2 para 81.4",
    oldValue: 79.2,
    newValue: 81.4,
    timestamp: new Date("2024-02-05T08:00:00"),
    isRead: true,
  },
  {
    id: "4",
    bankName: "Bradesco",
    bankId: "5",
    type: "metric_critical",
    severity: "critical",
    title: "Índice NPL Crítico",
    description: "Índice de empréstimos inadimplentes excedeu limite crítico (5%)",
    metric: "npl_ratio",
    newValue: 5.2,
    timestamp: new Date("2024-02-04T16:45:00"),
    isRead: false,
  },
  {
    id: "5",
    bankName: "Itaú Unibanco",
    bankId: "2",
    type: "metric_warning",
    severity: "medium",
    title: "ROE Abaixo do Esperado",
    description: "Retorno sobre patrimônio caiu para 18.5%, abaixo da meta de 20%",
    metric: "roe",
    newValue: 18.5,
    timestamp: new Date("2024-02-04T14:20:00"),
    isRead: true,
  },
  {
    id: "6",
    bankName: "Banco do Brasil",
    bankId: "3",
    type: "score_drop",
    severity: "medium",
    title: "Pequena Queda no Score",
    description: "Score de saúde diminuiu de 74.1 para 72.8",
    oldValue: 74.1,
    newValue: 72.8,
    timestamp: new Date("2024-02-04T11:30:00"),
    isRead: true,
  },
];

export const mockFilters: AlertFilter[] = [
  {
    id: "1",
    name: "Apenas Alertas Críticos",
    description: "Seja notificado apenas para alertas de severidade crítica",
    enabled: true,
    conditions: {
      severity: ["crítico"],
    },
    notifications: {
      email: true,
      push: true,
      sms: false,
    },
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    name: "Monitor de Bancos Digitais",
    description: "Acompanhe todos os alertas de bancos digitais",
    enabled: true,
    conditions: {
      banks: ["1", "4", "6"],
      severity: ["alto", "crítico"],
    },
    notifications: {
      email: true,
      push: false,
      sms: false,
    },
    createdAt: new Date("2024-01-20"),
  },
  {
    id: "3",
    name: "Mudanças de Score",
    description: "Monitore mudanças significativas de score (>5 pontos)",
    enabled: false,
    conditions: {
      types: ["score_drop", "score_increase"],
      scoreThreshold: 5,
    },
    notifications: {
      email: false,
      push: true,
      sms: false,
    },
    createdAt: new Date("2024-02-01"),
  },
];
