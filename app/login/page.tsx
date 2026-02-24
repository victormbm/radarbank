"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Activity, ArrowRight, Shield, Lock, Eye, EyeOff, AlertTriangle, TrendingDown, HeartPulse, Stethoscope, AlertCircle, Sparkles, TrendingUp, BarChart3 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleOAuthSignIn = async (provider: 'google' | 'facebook') => {
    setIsLoading(true);
    setError("");
    
    try {
      const result = await signIn(provider, {
        callbackUrl: '/dashboard',
        redirect: true,
      }) as unknown as { error?: string };

      if (result?.error) {
        if (result.error === 'Configuration') {
          setError(`${provider === 'google' ? 'Google' : 'Facebook'} OAuth não configurado. Configure as credenciais no arquivo .env (veja docs/OAUTH_SETUP.md)`);
        } else {
          setError(`Erro ao fazer login com ${provider === 'google' ? 'Google' : 'Facebook'}`);
        }
        setIsLoading(false);
      }
    } catch (err) {
      setError("Erro ao conectar com o servidor");
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email ou senha incorretos");
      } else if (result?.ok) {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("Erro ao conectar com o servidor");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 relative overflow-hidden">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient Orbs */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse [animation-delay:1s]"></div>
        <div className="absolute top-1/2 right-0 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl animate-pulse [animation-delay:2s]"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] opacity-10"></div>
        
        {/* Particles - Fixed positions for SSR compatibility */}
        <div className="absolute w-1 h-1 bg-white rounded-full opacity-20 animate-pulse top-[10%] left-[15%]"></div>
        <div className="absolute w-1 h-1 bg-white rounded-full opacity-20 animate-pulse top-[25%] left-[85%] [animation-delay:0.5s]"></div>
        <div className="absolute w-1 h-1 bg-white rounded-full opacity-20 animate-pulse top-[40%] left-[25%] [animation-delay:1s]"></div>
        <div className="absolute w-1 h-1 bg-white rounded-full opacity-20 animate-pulse top-[60%] left-[75%] [animation-delay:1.5s]"></div>
        <div className="absolute w-1 h-1 bg-white rounded-full opacity-20 animate-pulse top-[80%] left-[45%] [animation-delay:2s]"></div>
        <div className="absolute w-1 h-1 bg-white rounded-full opacity-20 animate-pulse top-[15%] left-[60%] [animation-delay:2.5s]"></div>
        <div className="absolute w-1 h-1 bg-white rounded-full opacity-20 animate-pulse top-[35%] left-[40%] [animation-delay:0.8s]"></div>
        <div className="absolute w-1 h-1 bg-white rounded-full opacity-20 animate-pulse top-[55%] left-[90%] [animation-delay:1.2s]"></div>
        <div className="absolute w-1 h-1 bg-white rounded-full opacity-20 animate-pulse top-[70%] left-[20%] [animation-delay:1.8s]"></div>
        <div className="absolute w-1 h-1 bg-white rounded-full opacity-20 animate-pulse top-[90%] left-[65%] [animation-delay:2.3s]"></div>
        
        {/* Cyber Lines */}
        <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
        <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-pink-500/50 to-transparent"></div>
      </div>

      {/* Left Panel - Modern Stats Preview */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="relative z-10 flex flex-col justify-between px-12 xl:px-16 py-12 xl:py-16 text-white w-full">
          {/* Logo and Title */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 shadow-lg shadow-purple-500/50 relative">
                <HeartPulse className="h-7 w-7" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 blur-md opacity-50 animate-pulse"></div>
              </div>
              <div>
                <div className="text-xl xl:text-2xl font-bold">Banco Seguro BR: Monitor de Saúde Bancária</div>
                <div className="text-xs text-purple-300">Não espere para descobrir se seu banco vai mal quando ele quebrar.</div>
              </div>
            </div>
            
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/30 backdrop-blur-sm">
              <AlertTriangle className="h-3.5 w-3.5 text-purple-400" />
              <span className="text-xs font-medium text-purple-300">Bancos quebram sem aviso prévio</span>
            </div>
            
            <div>
              <h1 className="text-4xl xl:text-5xl font-bold mb-4 leading-tight">
                Não seja pego<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 animate-pulse">
                  de surpresa
                </span>
              </h1>
              
              <p className="text-lg xl:text-xl text-slate-300 leading-relaxed max-w-md">
                Monitore a <strong className="text-white">saúde do seu banco</strong> em tempo real. 
                Detecte indicadores de quebra antes que seja tarde.
              </p>
            </div>
          </div>

          {/* Modern Feature Cards with Glassmorphism */}
          <div className="space-y-3">
            {/* Competitive Advantage Card - Destaque Principal */}
            <div className="rounded-xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 backdrop-blur-md p-5 hover:border-emerald-500/50 transition-all group">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/30 group-hover:scale-110 transition-transform">
                  <Shield className="h-6 w-6 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Sparkles className="h-4 w-4 text-emerald-400 animate-pulse" />
                    <h3 className="text-sm font-bold text-emerald-300 uppercase tracking-wide">Exclusivo no Brasil</h3>
                  </div>
                  <p className="text-sm text-white font-medium mb-1">Análise Completa de Saúde Bancária</p>
                  <p className="text-xs text-slate-400">Dados do Banco Central + Experiência de Clientes</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2.5 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                  <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
                    <BarChart3 className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">BCB</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wide">Dados oficiais</div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                  <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30">
                    <Activity className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">45K+</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wide">Avaliações</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Cards */}
            <div className="p-4 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-purple-500/30 transition-all group">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 group-hover:scale-110 transition-transform">
                  <Stethoscope className="h-5 w-5 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1 text-sm">Checkup Completo</h3>
                  <p className="text-xs text-slate-400">Basileia, liquidez, rentabilidade e inadimplência</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-cyan-500/30 transition-all group">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 border border-cyan-500/30 group-hover:scale-110 transition-transform">
                  <AlertCircle className="h-5 w-5 text-cyan-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1 text-sm">Alertas Preventivos</h3>
                  <p className="text-xs text-slate-400">Seja notificado antes de problemas graves aparecerem</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-pink-500/30 transition-all group">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500/20 to-pink-600/20 border border-pink-500/30 group-hover:scale-110 transition-transform">
                  <HeartPulse className="h-5 w-5 text-pink-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1 text-sm">Monitoramento 24/7</h3>
                  <p className="text-xs text-slate-400">Acompanhamento contínuo da saúde do seu banco</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form with Glassmorphism */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-8 lg:p-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 shadow-lg shadow-purple-500/50 relative">
              <HeartPulse className="h-6 w-6 text-white" />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 blur-md opacity-50 animate-pulse"></div>
            </div>
            <div className="text-left">
              <span className="text-xl font-bold text-white block">Banco Seguro BR</span>
              <span className="text-xs text-purple-300">Monitor de Saúde Bancária</span>
            </div>
          </div>

          {/* Mobile Competitive Advantage - Compact */}
          <div className="lg:hidden mb-6 rounded-xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 backdrop-blur-md p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-emerald-400 animate-pulse" />
              <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wide">Exclusivo no Brasil</h3>
            </div>
            <p className="text-sm text-white font-medium mb-3">Análise Completa: BCB + Experiência de Clientes</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/5 border border-white/10">
                <div className="p-1.5 rounded-md bg-purple-500/20 border border-purple-500/30">
                  <BarChart3 className="h-4 w-4 text-purple-400 shrink-0" />
                </div>
                <div className="text-xs text-white font-semibold">Dados BCB</div>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/5 border border-white/10">
                <div className="p-1.5 rounded-md bg-cyan-500/20 border border-cyan-500/30">
                  <Activity className="h-4 w-4 text-cyan-400 shrink-0" />
                </div>
                <div className="text-xs text-white font-semibold">45K+ Avaliações</div>
              </div>
            </div>
          </div>

          {/* Glassmorphism Card */}
          <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-6 sm:p-8 shadow-2xl">
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-white">Proteja seu patrimônio</h2>
              <p className="text-slate-300 text-sm sm:text-base">Monitore a saúde financeira do seu banco em tempo real e evite ser pego de surpresa</p>
            </div>

            {/* OAuth Buttons */}
            <div className="space-y-3 mb-6">
              <Button
                type="button"
                onClick={() => handleOAuthSignIn('google')}
                disabled={isLoading}
                className="h-11 sm:h-12 w-full bg-white hover:bg-gray-100 text-gray-900 font-semibold shadow-lg transition-all hover:scale-[1.02] border-0 flex items-center justify-center gap-3"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuar com Google
              </Button>

              <Button
                type="button"
                onClick={() => handleOAuthSignIn('facebook')}
                disabled={isLoading}
                className="h-11 sm:h-12 w-full bg-[#1877F2] hover:bg-[#166FE5] text-white font-semibold shadow-lg transition-all hover:scale-[1.02] border-0 flex items-center justify-center gap-3"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Continuar com Facebook
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-transparent px-3 text-slate-400 backdrop-blur-sm">ou cadastre-se com e-mail</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white font-medium text-sm">E-mail</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="demo@radarbank.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  className="h-11 sm:h-12 bg-white/10 border-white/20 focus:border-purple-400 focus:ring-purple-400/50 text-white placeholder:text-slate-400 backdrop-blur-sm"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-white font-medium text-sm">Senha</Label>
                  <Link href="#" className="text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors">
                    Esqueceu a senha?
                  </Link>
                </div>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    className="h-11 sm:h-12 pr-12 bg-white/10 border-white/20 focus:border-purple-400 focus:ring-purple-400/50 text-white placeholder:text-slate-400 backdrop-blur-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/30 backdrop-blur-sm p-3 flex items-start gap-2 animate-in slide-in-from-top-2">
                  <Lock className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              )}

              <Button 
                type="submit" 
                className="h-11 sm:h-12 w-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 shadow-lg shadow-purple-500/50 font-semibold transition-all hover:shadow-purple-500/70 hover:scale-[1.02] border-0" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Autenticando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Acessar Dashboard
                    <ArrowRight className="h-5 w-5" />
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <span className="text-sm text-slate-300">Não tem uma conta? </span>
              <Link href="/register" className="text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors">
                Criar conta gratuita
              </Link>
            </div>

            {/* Demo Info with Modern Design */}
            <div className="mt-6 rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm p-4 hover:border-purple-500/50 transition-all">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-500/20 border border-purple-500/30">
                  <Activity className="h-4 w-4 text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-purple-200 mb-1.5 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Teste o checkup bancário
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed mb-2.5">
                    Use a conta demo para ver como monitoramos a saúde do seu banco
                  </p>
                  <div className="bg-white/10 rounded-lg px-3 py-2 border border-white/20 backdrop-blur-sm">
                    <p className="text-xs font-mono text-white">
                      <strong className="text-purple-300">demo@bancosegurobr.com</strong> • <strong className="text-purple-300">demo123</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Trust Badge */}
            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-400">
              <Shield className="h-3.5 w-3.5 text-green-400" />
              <span>Dados criptografados e protegidos</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
