"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { login } from "@/lib/auth";
import { Activity, ArrowRight, Sparkles, Shield, Zap } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      const user = login(email, password);
      if (user) {
        router.push("/alerts");
      }
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden gradient-primary">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzBoLTZ2LTZoNnYtNmg2djZoNnY2aC02djZoLTZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
        
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="mb-8 animate-float">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/20 backdrop-blur-sm mb-6">
              <Activity className="h-10 w-10" />
            </div>
            <h1 className="text-5xl font-bold mb-4">Radar Bank</h1>
            <p className="text-xl text-white/90 leading-relaxed">
              Monitoramento em tempo real da saúde dos bancos com alertas inteligentes para melhores decisões
            </p>
          </div>

          <div className="space-y-4 mt-12">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Monitoramento em Tempo Real</h3>
                <p className="text-sm text-white/80">Acompanhe scores de saúde e métricas bancárias instantaneamente</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Alertas Inteligentes</h3>
                <p className="text-sm text-white/80">Filtros personalizados para notificações críticas</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Analytics Avançados</h3>
                <p className="text-sm text-white/80">Insights profundos com métricas abrangentes</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-glow">
              <Activity className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gradient">Radar Bank</h1>
          </div>

          <Card className="p-8 shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <div className="mb-6">
              <h2 className="text-3xl font-bold mb-2">Bem-vindo de volta</h2>
              <p className="text-muted-foreground">Entre para acessar seu dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 text-base border-2 focus:border-purple-500 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-semibold">Senha</Label>
                  <a href="#" className="text-sm font-medium text-purple-600 hover:text-purple-700">
                    Esqueceu a senha?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 text-base border-2 focus:border-purple-500 transition-colors"
                />
              </div>

              <Button 
                type="submit" 
                className="h-12 w-full text-base font-semibold gradient-primary hover:opacity-90 transition-opacity shadow-lg" 
                disabled={isLoading}
              >
                {isLoading ? (
                  "Entrando..."
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Entrar
                    <ArrowRight className="h-5 w-5" />
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Não tem uma conta? </span>
              <a href="#" className="font-semibold text-purple-600 hover:text-purple-700">
                Criar conta
              </a>
            </div>

            <div className="mt-6 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-purple-900 mb-1">Acesso Demo</p>
                  <p className="text-purple-700">Use qualquer e-mail e senha para explorar</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
