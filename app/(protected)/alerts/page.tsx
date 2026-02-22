"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mockAlerts, type Alert } from "@/lib/alerts-data";
import { formatDateTime } from "@/lib/utils";
import { Plus } from "lucide-react";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [bankName, setBankName] = useState("");
  const [threshold, setThreshold] = useState("60");

  const unreadCount = useMemo(
    () => alerts.filter((alert) => !alert.isRead).length,
    [alerts]
  );

  const markAsRead = (id: string) => {
    setAlerts((current) =>
      current.map((a) => (a.id === id ? { ...a, isRead: true } : a))
    );
  };

  const addAlertRule = () => {
    if (!bankName || !threshold) return;

    const thresholdValue = Number(threshold);
    const newAlert: Alert = {
      id: crypto.randomUUID(),
      bankId: "custom",
      bankName,
      type: "metric_warning",
      severity: thresholdValue < 50 ? "high" : "medium",
      title: `Regra criada para ${bankName}`,
      description: `Avisar quando o score ficar abaixo de ${thresholdValue}.`,
      timestamp: new Date(),
      isRead: false,
    };

    setAlerts((current) => [newAlert, ...current]);
    setBankName("");
    setThreshold("60");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Alertas Preventivos
          </h1>
          <p className="text-slate-600 mt-2">
            Crie e acompanhe avisos para reduzir risco de surpresas no sistema bancário.
          </p>
        </div>
        <Badge variant="secondary">Não lidos: {unreadCount}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Nova Regra
          </CardTitle>
          <CardDescription>
            Defina um limite de score por banco para receber alertas preventivos.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[1fr_180px_auto]">
          <div>
            <Label htmlFor="bank">Banco</Label>
            <Input
              id="bank"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="Ex.: Banco XPTO"
            />
          </div>
          <div>
            <Label htmlFor="threshold">Score limite</Label>
            <Input
              id="threshold"
              type="number"
              min={0}
              max={100}
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
            />
          </div>
          <Button className="self-end gradient-primary" onClick={addAlertRule}>
            Salvar regra
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {alerts.map((alert) => (
          <Card
            key={alert.id}
            className={alert.isRead ? "opacity-60" : "border-l-4 border-l-purple-500"}
          >
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{alert.title}</p>
                  <p className="text-sm text-muted-foreground">{alert.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDateTime(alert.timestamp)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      alert.severity === "critical"
                        ? "critical"
                        : alert.severity === "high"
                          ? "destructive"
                          : "warning"
                    }
                  >
                    {alert.severity}
                  </Badge>
                  {!alert.isRead && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markAsRead(alert.id)}
                    >
                      Marcar lido
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
