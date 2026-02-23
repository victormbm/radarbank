"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const [name, setName] = useState("");
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
        body: JSON.stringify({ name, email, password }),
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
    } catch (err) {
      setMessage("Erro ao conectar com o servidor");
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 p-6">
      <Card className="w-full max-w-lg p-8 shadow-xl border-0 bg-white/90">
        <h1 className="text-3xl font-bold">Criar conta</h1>
        <p className="text-muted-foreground mt-2">Cadastre-se para configurar alertas preventivos de risco bancário.</p>

        <form className="space-y-4 mt-6" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>

          {message && (
            <p className={`text-sm ${isError ? 'text-red-600' : 'text-green-600'}`}>
              {message}
            </p>
          )}

          <Button disabled={isLoading} type="submit" className="w-full gradient-primary">
            {isLoading ? "Criando..." : "Cadastrar"}
          </Button>
        </form>

        <p className="text-sm mt-6 text-center text-muted-foreground">
          Já possui conta? <Link href="/login" className="text-purple-600 font-semibold">Fazer login</Link>
        </p>
      </Card>
    </div>
  );
}
