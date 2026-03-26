# 🔌 API de Autenticação - Documentação Completa

**Data:** 23 de fevereiro de 2026  
**Versão:** 2.0  
**Base URL:** `https://bancosegurobr.com.br/api/auth` (produção)  
**Dev URL:** `http://localhost:3000/api/auth`

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [POST /api/auth/register](#post-apiauthregister)
3. [POST /api/auth/login](#post-apiauthlogin)
4. [POST /api/auth/logout](#post-apiauthlogout)
5. [GET /api/auth/session](#get-apiauthsession)
6. [Exemplos de Código](#exemplos-de-código)
7. [Códigos de Erro](#códigos-de-erro)

---

## 🎯 Visão Geral

### Autenticação

Todas as rotas (exceto register e login) requerem token JWT válido no cookie `token`.

```
Cookie: token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Response Format

Todas as respostas seguem este formato:

```typescript
// Sucesso
{
  "success": true,
  "data": { ... }
}

// Erro
{
  "success": false,
  "error": "Mensagem de erro"
}
```

---

## 📝 POST /api/auth/register

Registra um novo usuário no sistema.

### Endpoint
```
POST /api/auth/register
```

### Request Body

```typescript
{
  "name": string,      // Nome completo (2-100 caracteres)
  "email": string,     // Email válido (único)
  "password": string   // Senha (6-72 caracteres)
}
```

### Validações

| Campo | Regras |
|-------|--------|
| `name` | Obrigatório, 2-100 chars, apenas letras/espaços/hífens |
| `email` | Obrigatório, formato válido, único no banco |
| `password` | Obrigatório, 6-72 caracteres |

### Response (Sucesso - 201)

```typescript
Set-Cookie: token=eyJhbGc...; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000

{
  "success": true,
  "user": {
    "id": "clxyz123abc456def789",
    "name": "João Silva",
    "email": "joao@exemplo.com",
    "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=joao@exemplo.com",
    "createdAt": "2026-02-23T10:30:00.000Z"
  }
}
```

### Response (Erro - 400)

**Email já cadastrado:**
```json
{
  "success": false,
  "error": "Este email já está cadastrado"
}
```

**Validação falhou:**
```json
{
  "success": false,
  "error": "Email inválido"
}
```

```json
{
  "success": false,
  "error": "Senha deve ter no mínimo 6 caracteres"
}
```

```json
{
  "success": false,
  "error": "Nome é obrigatório"
}
```

### Exemplo de Request

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@exemplo.com",
    "password": "senha123"
  }'
```

### Fluxo Interno

1. Validar campos (nome, email, senha)
2. Verificar se email já existe no banco
3. Hash da senha com bcrypt (10 rounds)
4. Criar usuário no PostgreSQL
5. Gerar JWT token (30 dias de validade)
6. Set cookie HttpOnly com token
7. Retornar usuário (sem senha)

---

## 🔐 POST /api/auth/login

Autentica um usuário existente.

### Endpoint
```
POST /api/auth/login
```

### Request Body

```typescript
{
  "email": string,     // Email cadastrado
  "password": string   // Senha em texto puro
}
```

### Response (Sucesso - 200)

```typescript
Set-Cookie: token=eyJhbGc...; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000

{
  "success": true,
  "user": {
    "id": "clxyz123abc456def789",
    "name": "João Silva",
    "email": "joao@exemplo.com",
    "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=joao@exemplo.com"
  }
}
```

### Response (Erro - 401)

```json
{
  "success": false,
  "error": "Email ou senha inválidos"
}
```

**Nota:** Mesmo erro para email não encontrado OU senha incorreta (segurança).

### Response (Erro - 400)

```json
{
  "success": false,
  "error": "Preencha todos os campos"
}
```

### Exemplo de Request

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@exemplo.com",
    "password": "senha123"
  }'
```

### Fluxo Interno

1. Validar campos (email, senha não vazios)
2. Buscar usuário por email no banco
3. Se não encontrado → retornar erro genérico
4. Comparar senha com bcrypt.compare()
5. Se inválida → retornar erro genérico
6. Gerar JWT token (30 dias)
7. Set cookie HttpOnly
8. Retornar usuário (sem senha)

---

## 🚪 POST /api/auth/logout

Encerra a sessão do usuário.

### Endpoint
```
POST /api/auth/logout
```

### Request Body

Nenhum (usa cookie do usuário autenticado).

### Response (Sucesso - 200)

```typescript
Set-Cookie: token=; Max-Age=0

{
  "success": true
}
```

### Exemplo de Request

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Cookie: token=eyJhbGc..."
```

### Fluxo Interno

1. Remover cookie `token` (Max-Age=0)
2. Retornar sucesso

**Nota:** Não há validação do token. Mesmo que inválido, cookie é removido.

---

## 👤 GET /api/auth/session

Retorna o usuário atualmente autenticado.

### Endpoint
```
GET /api/auth/session
```

### Request Headers

```
Cookie: token=eyJhbGc...
```

### Response (Autenticado - 200)

```json
{
  "authenticated": true,
  "user": {
    "id": "clxyz123abc456def789",
    "name": "João Silva",
    "email": "joao@exemplo.com",
    "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=joao@exemplo.com"
  }
}
```

### Response (Não Autenticado - 401)

```json
{
  "authenticated": false
}
```

### Exemplo de Request

```bash
curl -X GET http://localhost:3000/api/auth/session \
  -H "Cookie: token=eyJhbGc..."
```

### Fluxo Interno

1. Ler cookie `token`
2. Se não existir → retornar não autenticado
3. Validar JWT token
4. Se inválido/expirado → retornar não autenticado
5. Buscar usuário no banco pelo ID do token
6. Se não encontrado → retornar não autenticado
7. Retornar usuário (sem senha)

---

## 💻 Exemplos de Código

### React Client Component

```typescript
'use client';

import { useState } from 'react';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        // Redirecionar para dashboard
        window.location.href = '/dashboard';
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Erro ao fazer login');
    }
  }

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Senha"
      />
      {error && <p className="error">{error}</p>}
      <button type="submit">Entrar</button>
    </form>
  );
}
```

### React Server Component

```typescript
// app/(protected)/dashboard/page.tsx
import { getCurrentUser } from '@/lib/auth-db';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div>
      <h1>Bem-vindo, {user.name}!</h1>
      <p>Email: {user.email}</p>
    </div>
  );
}
```

### API Route Protegida

```typescript
// app/api/banks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-db';

export async function GET(request: NextRequest) {
  // Verificar autenticação
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Não autenticado' },
      { status: 401 }
    );
  }

  // Usuário autenticado, prosseguir
  const banks = await prisma.bank.findMany();

  return NextResponse.json({ banks });
}
```

### PowerShell (Teste)

```powershell
# Registrar usuário
$body = @{
  name = "João Silva"
  email = "joao@teste.com"
  password = "senha123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body `
  -SessionVariable session

# Login (reutilizar sessão para cookies)
$loginBody = @{
  email = "joao@teste.com"
  password = "senha123"
} | ConvertTo-Json

$response = Invoke-RestMethod `
  -Uri "http://localhost:3000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body $loginBody `
  -WebSession $session

Write-Host "Usuário logado: $($response.user.name)"

# Verificar sessão
$sessionCheck = Invoke-RestMethod `
  -Uri "http://localhost:3000/api/auth/session" `
  -Method GET `
  -WebSession $session

Write-Host "Autenticado: $($sessionCheck.authenticated)"

# Logout
Invoke-RestMethod `
  -Uri "http://localhost:3000/api/auth/logout" `
  -Method POST `
  -WebSession $session
```

---

## ⚠️ Códigos de Erro

### HTTP Status Codes

| Código | Descrição | Quando usar |
|--------|-----------|-------------|
| 200 | OK | Login/logout/session bem-sucedidos |
| 201 | Created | Registro bem-sucedido |
| 400 | Bad Request | Validação falhou, dados inválidos |
| 401 | Unauthorized | Credenciais inválidas, token expirado |
| 409 | Conflict | Email já cadastrado |
| 500 | Internal Server Error | Erro no servidor |

### Mensagens de Erro Comuns

| Mensagem | Causa | Solução |
|----------|-------|---------|
| `Email ou senha inválidos` | Credenciais incorretas no login | Verificar email/senha |
| `Este email já está cadastrado` | Tentar registrar email duplicado | Fazer login ou usar outro email |
| `Email inválido` | Formato de email incorreto | Corrigir formato (ex: user@domain.com) |
| `Senha deve ter no mínimo 6 caracteres` | Senha muito curta | Usar senha com 6+ caracteres |
| `Nome é obrigatório` | Campo nome vazio | Preencher nome |
| `Preencha todos os campos` | Campos obrigatórios vazios | Preencher todos os campos |
| `Não autenticado` | Token ausente/inválido | Fazer login novamente |

---

## 🔄 Fluxo Completo de Autenticação

```
┌──────────────────────────────────────────────────────────────┐
│                    1. NOVO USUÁRIO                           │
└──────────────────────────────────────────────────────────────┘

Cliente                    API                    Database
   │                        │                        │
   ├─ POST /register ──────>│                        │
   │  {name, email, pwd}    │                        │
   │                        ├─ Validar dados        │
   │                        ├─ Check email ────────>│
   │                        │                        │
   │                        │<──── null ─────────────┤
   │                        ├─ Hash password        │
   │                        ├─ Create user ────────>│
   │                        │                        │
   │                        │<──── user ─────────────┤
   │                        ├─ Generate JWT         │
   │<── Set-Cookie token ───┤                        │
   │    {user}              │                        │
   │                        │                        │
   ├─ Redirect /dashboard   │                        │
   │                        │                        │

┌──────────────────────────────────────────────────────────────┐
│                  2. ACESSAR DASHBOARD                        │
└──────────────────────────────────────────────────────────────┘

Cliente                    API                    Database
   │                        │                        │
   ├─ GET /dashboard ──────>│                        │
   │  Cookie: token         │                        │
   │                        ├─ Verify JWT           │
   │                        ├─ Extract userId       │
   │                        ├─ Find user ──────────>│
   │                        │                        │
   │                        │<──── user ─────────────┤
   │<──── Dashboard HTML ───┤                        │
   │  Welcome, João!        │                        │
   │                        │                        │

┌──────────────────────────────────────────────────────────────┐
│                     3. LOGOUT                                │
└──────────────────────────────────────────────────────────────┘

Cliente                    API
   │                        │
   ├─ POST /logout ────────>│
   │  Cookie: token         │
   │                        ├─ Clear cookie
   │<── Set-Cookie token=───┤
   │    (Max-Age=0)         │
   │                        │
   ├─ Redirect /login       │
   │                        │

┌──────────────────────────────────────────────────────────────┐
│                  4. LOGIN EXISTENTE                          │
└──────────────────────────────────────────────────────────────┘

Cliente                    API                    Database
   │                        │                        │
   ├─ POST /login ─────────>│                        │
   │  {email, password}     │                        │
   │                        ├─ Find user ──────────>│
   │                        │                        │
   │                        │<──── user + hash ──────┤
   │                        ├─ Compare password     │
   │                        │   bcrypt.compare()    │
   │                        ├─ Generate JWT         │
   │<── Set-Cookie token ───┤                        │
   │    {user}              │                        │
   │                        │                        │
```

---

## 🧪 Testando a API

### Setup Inicial

```bash
# 1. Garantir que dev server está rodando
npm run dev

# 2. Abrir outro terminal para testes
```

### Teste 1: Registrar Novo Usuário

```powershell
$register = @{
  name = "Maria Silva"
  email = "maria@teste.com"
  password = "senha123"
} | ConvertTo-Json

$response = Invoke-RestMethod `
  -Uri "http://localhost:3000/api/auth/register" `
  -Method POST `
  -ContentType "application/json" `
  -Body $register `
  -SessionVariable session

# Verificar resposta
$response.user.name  # "Maria Silva"
$response.user.email # "maria@teste.com"
```

### Teste 2: Login

```powershell
$login = @{
  email = "maria@teste.com"
  password = "senha123"
} | ConvertTo-Json

$response = Invoke-RestMethod `
  -Uri "http://localhost:3000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body $login `
  -WebSession $session

# Cookie é automaticamente salvo na $session
```

### Teste 3: Verificar Sessão

```powershell
$sessionData = Invoke-RestMethod `
  -Uri "http://localhost:3000/api/auth/session" `
  -Method GET `
  -WebSession $session

$sessionData.authenticated  # true
$sessionData.user.name      # "Maria Silva"
```

### Teste 4: Logout

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:3000/api/auth/logout" `
  -Method POST `
  -WebSession $session

# Verificar que sessão foi invalidada
$check = Invoke-RestMethod `
  -Uri "http://localhost:3000/api/auth/session" `
  -Method GET `
  -WebSession $session

$check.authenticated  # false
```

---

**Última atualização:** 23 de fevereiro de 2026  
**Próxima versão:** Rate limiting + Email verification
