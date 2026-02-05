"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { mockFilters, type AlertFilter } from "@/lib/alerts-data";
import { formatDate } from "@/lib/utils";
import { Plus, Mail, Bell as BellIcon, Smartphone, Edit, Trash2 } from "lucide-react";

export default function FiltersPage() {
  const [filters, setFilters] = useState<AlertFilter[]>(mockFilters);
  const [isCreating, setIsCreating] = useState(false);

  const toggleFilter = (id: string) => {
    setFilters(
      filters.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f))
    );
  };

  const deleteFilter = (id: string) => {
    setFilters(filters.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Filtros de Alerta
          </h1>
          <p className="text-slate-600">
            Crie filtros personalizados para gerenciar suas notificações
          </p>
        </div>
        <Button 
          onClick={() => setIsCreating(true)}
          className="gradient-primary shadow-lg shadow-purple-500/30 hover:opacity-90 transition-opacity"
        >
          <Plus className="mr-2 h-4 w-4" />
          Criar Filtro
        </Button>
      </div>

      {isCreating && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Criar Novo Filtro</CardTitle>
            <CardDescription>
              Configure condições e preferências de notificação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-blue-50 p-4 text-center text-sm text-blue-900">
              <p className="font-medium">Formulário de criação em breve</p>
              <p className="mt-1 text-xs">Incluirá seleção de bancos, níveis de severidade e configurações de notificação</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setIsCreating(false)}
              >
                Fechar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {filters.map((filter) => (
          <Card key={filter.id} className={`card-hover ${filter.enabled ? "bg-white shadow-lg" : "opacity-60 bg-white/50"}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-lg">{filter.name}</CardTitle>
                    <Badge variant={filter.enabled ? "success" : "secondary"}>
                      {filter.enabled ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <CardDescription>{filter.description}</CardDescription>
                </div>
                <Switch
                  checked={filter.enabled}
                  onCheckedChange={() => toggleFilter(filter.id)}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Condições</p>
                <div className="flex flex-wrap gap-2">
                  {filter.conditions.severity && (
                    <Badge variant="outline">
                      Severidade: {filter.conditions.severity.join(", ")}
                    </Badge>
                  )}
                  {filter.conditions.banks && (
                    <Badge variant="outline">
                      {filter.conditions.banks.length} bancos
                    </Badge>
                  )}
                  {filter.conditions.types && (
                    <Badge variant="outline">
                      {filter.conditions.types.length} tipos
                    </Badge>
                  )}
                  {filter.conditions.scoreThreshold && (
                    <Badge variant="outline">
                      Limite: {filter.conditions.scoreThreshold}
                    </Badge>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Notificações</p>
                <div className="flex flex-wrap gap-3">
                  {filter.notifications.email && (
                    <div className="flex items-center gap-1.5 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>Email</span>
                    </div>
                  )}
                  {filter.notifications.push && (
                    <div className="flex items-center gap-1.5 text-sm">
                      <BellIcon className="h-4 w-4 text-muted-foreground" />
                      <span>Push</span>
                    </div>
                  )}
                  {filter.notifications.sms && (
                    <div className="flex items-center gap-1.5 text-sm">
                      <Smartphone className="h-4 w-4 text-muted-foreground" />
                      <span>SMS</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-xs text-muted-foreground">
                  Criado em {formatDate(filter.createdAt)}
                </span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteFilter(filter.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filters.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-4 mb-4">
              <BellIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium">Nenhum filtro ainda</p>
            <p className="text-sm text-muted-foreground mb-4">
              Crie seu primeiro filtro de alerta para começar
            </p>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Filtro
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
