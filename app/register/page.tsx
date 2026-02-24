"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HeartPulse, ArrowRight, Shield, Sparkles } from "lucide-react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: email.split('@')[0], email, password }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage("Conta criada com sucesso! Redirecionando...");
        setIsError(false);
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 1000);
      } else {
        setMessage(data.error || "Erro ao criar conta");
        setIsError(true);
      }
    } catch {
      setMessage("Erro ao conectar com o servidor");
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setIsLoading(true);
    setMessage("");
    setIsError(false);
    
    try {
      const result = await signIn(provider, {
        callbackUrl: '/dashboard',
        redirect: true,
      }) as unknown as { error?: string };

      if (result?.error) {
        if (result.error === 'Configuration') {
          setMessage(`${provider === 'google' ? 'Google' : 'Facebook'} OAuth não configurado ainda. Por enquanto, use email/senha ou configure as credenciais OAuth (veja docs/OAUTH_SETUP.md)`);
        } else {
          setMessage(`Erro ao fazer login com ${provider === 'google' ? 'Google' : 'Facebook'}`);
        }
        setIsError(true);
        setIsLoading(false);
      }
    } catch {
      setMessage("Erro ao conectar com o servidor");
      setIsError(true);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 relative overflow-hidden">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse [animation-delay:1s]"></div>
        <div className="absolute top-1/2 right-0 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl animate-pulse [animation-delay:2s]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] opacity-10"></div>
      </div>

      {/* Content */}
      <div className="flex items-center justify-center w-full p-6 sm:p-8 relative z-10">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 shadow-lg shadow-purple-500/50 relative">
              <HeartPulse className="h-7 w-7 text-white" />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 blur-md opacity-50 animate-pulse"></div>
            </div>
            <div className="text-left">
              <span className="text-2xl font-bold text-white block">Banco Seguro BR</span>
              <span className="text-xs text-purple-300">Monitor de Saúde Bancária</span>
            </div>
          </div>

          {/* Main Card */}
          <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-6 sm:p-8 shadow-2xl">
            <div className="mb-6 text-center">
              <h1 className="text-3xl font-bold text-white mb-2">Comece seu teste grátis</h1>
              <p className="text-slate-300 text-sm">7 dias para testar todos os recursos e proteger seu patrimônio</p>
            </div>

            {/* Social Login Buttons */}
            <div className="space-y-3 mb-6">
              <Button
                type="button"
                onClick={() => handleSocialLogin('google')}
                disabled={isLoading}
                className="w-full h-12 bg-white hover:bg-gray-50 text-gray-900 font-semibold border-0 shadow-lg transition-all hover:scale-[1.02]"
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuar com Google
              </Button>
              
              <Button
                type="button"
                onClick={() => handleSocialLogin('facebook')}
                disabled={isLoading}
                className="w-full h-12 bg-[#1877F2] hover:bg-[#166FE5] text-white font-semibold border-0 shadow-lg transition-all hover:scale-[1.02]"
              >
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Continuar com Facebook
              </Button>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-slate-900/50 text-slate-400 rounded-full backdrop-blur-sm">
                  ou cadastre-se com e-mail
                </span>
              </div>
            </div>

            {/* Email Form */}
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white font-medium text-sm">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 bg-white/10 border-white/20 focus:border-purple-400 focus:ring-purple-400/50 text-white placeholder:text-slate-400 backdrop-blur-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white font-medium text-sm">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-12 bg-white/10 border-white/20 focus:border-purple-400 focus:ring-purple-400/50 text-white placeholder:text-slate-400 backdrop-blur-sm"
                />
              </div>

              {message && (
                <div className={`rounded-lg p-3 flex items-start gap-2 animate-in slide-in-from-top-2 ${
                  isError 
                    ? 'bg-red-500/10 border border-red-500/30 backdrop-blur-sm' 
                    : 'bg-green-500/10 border border-green-500/30 backdrop-blur-sm'
                }`}>
                  <p className={`text-sm ${isError ? 'text-red-200' : 'text-green-200'}`}>{message}</p>
                </div>
              )}

              <Button
                disabled={isLoading}
                type="submit"
                className="h-12 w-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 shadow-lg shadow-purple-500/50 font-semibold transition-all hover:shadow-purple-500/70 hover:scale-[1.02] border-0"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Criando conta...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Começar teste grátis
                    <ArrowRight className="h-5 w-5" />
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <span className="text-sm text-slate-300">Já possui conta? </span>
              <Link href="/login" className="text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors">
                Fazer login
              </Link>
            </div>

            {/* Trial Info */}
            <div className="mt-6 rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-500/20 border border-purple-500/30">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-purple-200 mb-1.5">
                    7 dias grátis para testar
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Experimente todos os recursos sem compromisso
                  </p>
                </div>
              </div>
            </div>

            {/* Privacy */}
            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-400">
              <Shield className="h-3.5 w-3.5 text-green-400" />
              <span>Seus dados estão seguros e criptografados</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
