"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Activity, ArrowRight, Shield, Lock, Eye, EyeOff, AlertTriangle, TrendingDown, HeartPulse, Stethoscope, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(data.error || "Erro ao fazer login");
      }
    } catch (err) {
      setError("Erro ao conectar com o servidor");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Panel - Health Focused */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] opacity-20"></div>
        
        {/* Pulse Animation */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        
        <div className="relative z-10 flex flex-col justify-between px-16 py-16 text-white w-full">
          {/* Logo and Title */}
          <div>
            <div className="flex items-center gap-3 mb-12">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 shadow-lg shadow-purple-500/50 animate-pulse">
                <HeartPulse className="h-6 w-6" />
              </div>
              <span className="text-2xl font-bold">Banco Seguro BR : Monitor de Saúde Bancária</span>
            </div>
            
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/30 mb-6">
              <AlertTriangle className="h-4 w-4 text-purple-400" />
              <span className="text-xs font-medium text-purple-300">Bancos quebram sem aviso prévio</span>
            </div>
            
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Não seja pego<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                de surpresa
              </span>
            </h1>
            
            <p className="text-xl text-slate-300 leading-relaxed max-w-md mb-9">
              Monitore a <strong className="text-white">saúde do seu banco</strong> em tempo real. 
              Detecte indicadores de quebra antes que seja tarde.
            </p>
          </div>

          {/* Health Indicators */}
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30">
                  <Stethoscope className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Checkup Completo</h3>
                  <p className="text-sm text-slate-400">Basileia, liquidez, rentabilidade e inadimplência</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 border border-cyan-500/30">
                  <AlertCircle className="h-6 w-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Diagnóstico Antecipado</h3>
                  <p className="text-sm text-slate-400">Alertas antes dos sintomas graves aparecerem</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30">
                  <HeartPulse className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Monitoramento 24/7</h3>
                  <p className="text-sm text-slate-400">Sinais vitais em tempo real, sempre ativo</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 shadow-lg shadow-purple-500/30">
              <HeartPulse className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-900">Banco Seguro BR</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2 text-slate-900">Proteja seu patrimônio</h2>
            <p className="text-slate-600">Monitore a saúde financeira do seu banco em tempo real e evite ser pego de surpresa</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-medium">E-mail</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="seu@email.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                className="h-12 border-slate-300 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-700 font-medium">Senha</Label>
                <Link href="#" className="text-xs text-purple-600 hover:text-purple-700 font-medium">
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  className="h-12 pr-12 border-slate-300 focus:border-purple-500 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 flex items-start gap-2">
                <Lock className="h-5 w-5 text-red-600 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <Button 
              type="submit" 
              className="h-12 w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg shadow-purple-500/30 font-medium transition-all hover:shadow-purple-500/50" 
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Autenticando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <HeartPulse className="h-5 w-5" />
                  Acessar dashboard
                  <ArrowRight className="h-5 w-5" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <span className="text-sm text-slate-600">Não tem uma conta? </span>
            <Link href="/register" className="text-sm font-semibold text-purple-600 hover:text-purple-700">
              Criar conta gratuita
            </Link>
          </div>

          {/* Demo Info - Health Themed */}
          <div className="mt-8 rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100 border border-purple-200">
                <Activity className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-purple-900 mb-1.5">🏥 Teste o checkup bancário</p>
                <p className="text-xs text-purple-700 leading-relaxed mb-2">
                  Use a conta demo para ver como monitoramos a saúde do seu banco
                </p>
                <div className="bg-white/60 rounded-lg px-3 py-2 border border-purple-100">
                  <p className="text-xs font-mono text-slate-700">
                    <strong className="text-purple-700">demo@bancosegurobr.com</strong> • <strong className="text-purple-700">demo123</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Trust Badge */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
            <Shield className="h-3.5 w-3.5 text-green-600" />
            <span>Dados criptografados e protegidos</span>
          </div>
        </div>
      </div>
    </div>
  );
}
