"use client";

import Link from "next/link";
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
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    setTimeout(() => {
      const user = login(email, password);
      if (user) {
        router.push("/dashboard");
      } else {
        setError("Credenciais inválidas.");
      }
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden gradient-primary">
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="mb-8 animate-float">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/20 backdrop-blur-sm mb-6">
              <Activity className="h-10 w-10" />
            </div>
            <h1 className="text-5xl font-bold mb-4">Radar Bank</h1>
            <p className="text-xl text-white/90 leading-relaxed">
              Evite sustos de falência com monitoramento de Basileia, liquidez, rentabilidade e inadimplência.
            </p>
          </div>

          <div className="space-y-4 mt-12">
            {[{ icon: Zap, t: "Monitoramento em Tempo Real" }, { icon: Shield, t: "Alertas Preventivos" }, { icon: Sparkles, t: "Score de Saúde Bancária" }].map((item) => (
              <div key={item.t} className="flex items-start gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold mb-1">{item.t}</h3>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
        <div className="w-full max-w-md">
          <Card className="p-8 shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <div className="mb-6">
              <h2 className="text-3xl font-bold mb-2">Acessar plataforma</h2>
              <p className="text-muted-foreground">Entre para ver o dashboard de risco bancário</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-12" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" placeholder="Digite sua senha" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-12" />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <Button type="submit" className="h-12 w-full gradient-primary" disabled={isLoading}>
                {isLoading ? "Entrando..." : <span className="flex items-center gap-2">Entrar <ArrowRight className="h-5 w-5" /></span>}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Não tem conta? </span>
              <Link href="/register" className="font-semibold text-purple-600 hover:text-purple-700">Criar conta</Link>
            </div>

            <div className="mt-6 rounded-xl border border-purple-100 bg-purple-50 p-3 text-sm text-purple-900">
              Demo: <strong>demo@radarbank.com</strong> / <strong>demo123</strong>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
