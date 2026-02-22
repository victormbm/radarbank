"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { register } from "@/lib/auth";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");

    const response = register({ name, email, password });
    setMessage(response.message);

    setTimeout(() => {
      if (response.ok) {
        router.push("/login");
      }
      setIsLoading(false);
    }, 400);
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

          {message && <p className="text-sm text-purple-700">{message}</p>}

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
