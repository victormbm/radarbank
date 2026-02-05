"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockAlerts, type Alert } from "@/lib/alerts-data";
import { formatDateTime } from "@/lib/utils";
import { Bell, CheckCircle2, AlertTriangle, TrendingDown, TrendingUp, AlertCircle } from "lucide-react";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const filteredAlerts = filter === "unread" ? alerts.filter((a) => !a.isRead) : alerts;
  const unreadCount = alerts.filter((a) => !a.isRead).length;

  const markAsRead = (id: string) => {
    setAlerts(alerts.map((a) => (a.id === id ? { ...a, isRead: true } : a)));
  };

  const markAllAsRead = () => {
    setAlerts(alerts.map((a) => ({ ...a, isRead: true })));
  };

  const getSeverityColor = (severity: Alert["severity"]) => {
    switch (severity) {
      case "critical":
        return "critical";
      case "high":
        return "destructive";
      case "medium":
        return "warning";
      case "low":
        return "secondary";
      default:
        return "default";
    }
  };

  const getAlertIcon = (type: Alert["type"]) => {
    switch (type) {
      case "score_drop":
        return TrendingDown;
      case "score_increase":
        return TrendingUp;
      case "metric_warning":
        return AlertTriangle;
      case "metric_critical":
        return AlertCircle;
      default:
        return Bell;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Alertas
            </h1>
            {unreadCount > 0 && (
              <div className="flex h-8 w-8 items-center justify-center rounded-full gradient-primary text-white text-sm font-bold shadow-lg shadow-purple-500/30 animate-pulse">
                {unreadCount}
              </div>
            )}
          </div>
          <p className="text-slate-600">
            Monitore mudanças importantes e notificações em tempo real
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={markAllAsRead}
              className="border-2 border-purple-200 hover:bg-purple-50 hover:border-purple-300 transition-all"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Marcar todos como lidos
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
          className={filter === "all" ? "gradient-primary shadow-lg shadow-purple-500/30" : "border-2"}
        >
          Todos ({alerts.length})
        </Button>
        <Button
          variant={filter === "unread" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("unread")}
          className={filter === "unread" ? "gradient-primary shadow-lg shadow-purple-500/30" : "border-2"}
        >
          Não lidos ({unreadCount})
        </Button>
      </div>

      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-lg font-medium">Nenhum alerta encontrado</p>
              <p className="text-sm text-muted-foreground">
                {filter === "unread"
                  ? "Todos os alertas foram lidos"
                  : "Você está em dia!"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAlerts.map((alert) => {
            const Icon = getAlertIcon(alert.type);
            return (
              <Card
                key={alert.id}
                className={`card-hover transition-all ${
                  alert.isRead 
                    ? "opacity-60 bg-white/50" 
                    : "border-l-4 border-l-purple-500 bg-white shadow-lg"
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 rounded-lg p-2 ${
                          alert.severity === "critical"
                            ? "bg-red-100 text-red-600"
                            : alert.severity === "high"
                            ? "bg-orange-100 text-orange-600"
                            : alert.severity === "medium"
                            ? "bg-yellow-100 text-yellow-600"
                            : "bg-blue-100 text-blue-600"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-lg">{alert.title}</CardTitle>
                          {!alert.isRead && (
                            <div className="h-2 w-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <CardDescription className="text-base">
                          {alert.description}
                        </CardDescription>
                        <div className="mt-2 flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {alert.bankName}
                          </Badge>
                          <Badge variant={getSeverityColor(alert.severity)} className="text-xs">
                            {{
                              critical: "CRÍTICO",
                              high: "ALTO",
                              medium: "MÉDIO",
                              low: "BAIXO"
                            }[alert.severity]}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(alert.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                    {!alert.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(alert.id)}
                      >
                        Marcar como lido
                      </Button>
                    )}
                  </div>
                </CardHeader>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
