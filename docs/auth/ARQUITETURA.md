# 🏭️ Arquitetura de Autenticação - Banco Seguro BR

**Data:** 23 de fevereiro de 2026  
**Status:** ✅ Em Implementação  
**Versão:** 2.0 (Database + JWT)

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Fluxo de Autenticação](#fluxo-de-autenticação)
3. [Arquitetura de Camadas](#arquitetura-de-camadas)
4. [Modelo de Dados](#modelo-de-dados)
5. [Segurança](#segurança)
6. [APIs](#apis)
7. [Fluxogramas](#fluxogramas)
8. [Migração do Sistema Antigo](#migração-do-sistema-antigo)

---

## 🎯 Visão Geral

### Objetivo
Implementar sistema de autenticação seguro, baseado em banco de dados, com criptografia de senhas e tokens JWT para sessões.

### Mudanças Principais

| Aspecto | Antes (v1.0) | Depois (v2.0) |
|---------|--------------|---------------|
| **Armazenamento** | localStorage (navegador) | PostgreSQL (servidor) |
| **Senhas** | Texto puro | Hash bcrypt (10 rounds) |
| **Sessão** | Objeto no localStorage | JWT HttpOnly Cookie |
| **Validação** | Client-side apenas | Server-side + Client-side |
| **Segurança** | ❌ Nenhuma | ✅ Produção-ready |

---

## 🔄 Fluxo de Autenticação

### 1. Registro de Usuário

```
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│   Cliente   │         │   API Route  │         │  PostgreSQL  │
│ (Register)  │         │  /api/auth/  │         │   Database   │
└──────┬──────┘         └──────┬───────┘         └──────┬───────┘
       │                       │                        │
       │ POST /api/auth/       │                        │
       │ register              │                        │
       ├──────────────────────>│                        │
       │ {email, password,     │                        │
       │  name}                │                        │
       │                       │                        │
       │                       │ 1. Validar dados       │
       │                       │ 2. Verificar email     │
       │                       ├───────────────────────>│
       │                       │   SELECT email         │
       │                       │                        │
       │                       │<───────────────────────┤
       │                       │   null (não existe)    │
       │                       │                        │
       │                       │ 3. Hash senha (bcrypt) │
       │                       │    10 rounds           │
       │                       │                        │
       │                       │ 4. Criar usuário       │
       │                       ├───────────────────────>│
       │                       │   INSERT INTO users    │
       │                       │                        │
       │                       │<───────────────────────┤
       │                       │   user (com hash)      │
       │                       │                        │
       │                       │ 5. Gerar JWT token     │
       │                       │    (userId + email)    │
       │                       │                        │
       │<──────────────────────┤                        │
       │ Set-Cookie: token     │                        │
       │ {success: true}       │                        │
       │                       │                        │
```

### 2. Login de Usuário

```
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│   Cliente   │         │   API Route  │         │  PostgreSQL  │
│   (Login)   │         │  /api/auth/  │         │   Database   │
└──────┬──────┘         └──────┬───────┘         └──────┬───────┘
       │                       │                        │
       │ POST /api/auth/login  │                        │
       ├──────────────────────>│                        │
       │ {email, password}     │                        │
       │                       │                        │
       │                       │ 1. Buscar usuário      │
       │                       ├───────────────────────>│
       │                       │   SELECT * WHERE email │
       │                       │                        │
       │                       │<───────────────────────┤
       │                       │   user {password: hash}│
       │                       │                        │
       │                       │ 2. Comparar senha      │
       │                       │    bcrypt.compare()    │
       │                       │    password vs hash    │
       │                       │                        │
       │                       │ 3. Se válido:          │
       │                       │    Gerar JWT token     │
       │                       │                        │
       │<──────────────────────┤                        │
       │ Set-Cookie: token     │                        │
       │ {user: {id, name,     │                        │
       │  email}}              │                        │
       │                       │                        │
```

### 3. Acesso a Rota Protegida

```
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│   Cliente   │         │  Middleware  │         │  API Route   │
│             │         │   (auth)     │         │  /api/banks  │
└──────┬──────┘         └──────┬───────┘         └──────┬───────┘
       │                       │                        │
       │ GET /api/banks        │                        │
       ├──────────────────────>│                        │
       │ Cookie: token=JWT...  │                        │
       │                       │                        │
       │                       │ 1. Verificar cookie    │
       │                       │ 2. Validar JWT         │
       │                       │ 3. Decodificar payload │
       │                       │                        │
       │                       │ Se válido:             │
       │                       ├───────────────────────>│
       │                       │   request.user = {...} │
       │                       │                        │
       │                       │<───────────────────────┤
       │<──────────────────────┤   Response data        │
       │   {banks: [...]}      │                        │
       │                       │                        │
       │                       │ Se inválido:           │
       │<──────────────────────┤                        │
       │   401 Unauthorized    │                        │
       │                       │                        │
```

---

## 🏛️ Arquitetura de Camadas

```
┌─────────────────────────────────────────────────────────────┐
│                     CAMADA DE APRESENTAÇÃO                  │
│  (React Server Components + Client Components)             │
│                                                             │
│  • app/login/page.tsx         - Página de login            │
│  • app/register/page.tsx      - Página de registro         │
│  • app/(protected)/layout.tsx - Layout com auth check      │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      CAMADA DE API                          │
│  (Next.js API Routes)                                       │
│                                                             │
│  • app/api/auth/register/route.ts  - POST registro         │
│  • app/api/auth/login/route.ts     - POST login            │
│  • app/api/auth/logout/route.ts    - POST logout           │
│  • app/api/auth/session/route.ts   - GET usuário atual     │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   CAMADA DE SERVIÇO                         │
│  (Business Logic)                                           │
│                                                             │
│  • lib/auth-db.ts              - Lógica de autenticação    │
│  • lib/jwt.ts                  - Geração/validação tokens  │
│  • lib/password.ts             - Hash/comparação senhas    │
│  • lib/validation.ts           - Validações (já existe)    │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   CAMADA DE DADOS                           │
│  (Prisma ORM)                                               │
│                                                             │
│  • lib/db.ts                   - Conexão Prisma            │
│  • prisma/schema.prisma        - Modelo User               │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   BANCO DE DADOS                            │
│  (PostgreSQL)                                               │
│                                                             │
│  Tabela: users                                              │
│  - id (UUID)                                                │
│  - email (UNIQUE)                                           │
│  - name                                                     │
│  - password (HASH bcrypt)                                   │
│  - avatar                                                   │
│  - createdAt, updatedAt                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Modelo de Dados

### Schema Prisma

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String   // Hash bcrypt, nunca texto puro
  avatar    String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
  @@index([email])
}
```

### Explicação dos Campos

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | String (CUID) | ✅ | Identificador único (gerado automaticamente) |
| `email` | String | ✅ | Email único para login |
| `name` | String | ✅ | Nome completo do usuário |
| `password` | String | ✅ | Hash bcrypt da senha (NUNCA texto puro) |
| `avatar` | String | ❌ | URL do avatar (DiceBear API) |
| `createdAt` | DateTime | ✅ | Data de criação (automática) |
| `updatedAt` | DateTime | ✅ | Data de última atualização (automática) |

### Índices

- **UNIQUE** em `email` - Garante que não haverá emails duplicados
- **INDEX** em `email` - Otimiza queries de busca por email (login)

### Exemplo de Registro no Banco

```json
{
  "id": "clxyz123abc456def789",
  "email": "joao@exemplo.com",
  "name": "João Silva",
  "password": "$2b$10$N9qo8uLOickgx2ZMRZoMye.fKS5Y/6iQqCxW6WdG0QKJjmPo4nf1G",
  "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=joao@exemplo.com",
  "createdAt": "2026-02-23T10:30:00.000Z",
  "updatedAt": "2026-02-23T10:30:00.000Z"
}
```

**Nota:** O campo `password` contém o hash bcrypt, que é IRREVERSÍVEL.

---

## 🔒 Segurança

### 1. Criptografia de Senhas (bcrypt)

```typescript
import bcrypt from 'bcryptjs';

// Hash da senha (ao registrar)
const hashedPassword = await bcrypt.hash(password, 10);
// Resultado: $2b$10$N9qo8uLOickgx2ZMRZoMye.fKS5Y/6iQqCxW6WdG0QKJjmPo4nf1G

// Comparar senha (ao fazer login)
const isValid = await bcrypt.compare(plainPassword, hashedPassword);
```

**Por que bcrypt?**
- ✅ Algoritmo de hash de senha mais seguro
- ✅ Salt automático (previne rainbow tables)
- ✅ Custo configurável (10 rounds = ~100ms)
- ✅ Resistente a ataques de força bruta
- ✅ Padrão da indústria

### 2. Tokens JWT (JSON Web Tokens)

```typescript
// Estrutura do Token
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "userId": "clxyz123abc456def789",
    "email": "joao@exemplo.com",
    "iat": 1708686600,  // Issued At
    "exp": 1711278600   // Expiration (30 dias)
  },
  "signature": "..."
}
```

**Configurações de Segurança:**
- ✅ HttpOnly Cookie (inacessível via JavaScript)
- ✅ Secure flag (apenas HTTPS em produção)
- ✅ SameSite=Strict (proteção CSRF)
- ✅ Expiração de 30 dias
- ✅ Secret forte (variável de ambiente)

### 3. Validações

**Email:**
- Regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Normalização: lowercase + trim
- Verificação de duplicidade no banco

**Senha:**
- Mínimo 6 caracteres
- Sem limite máximo (bcrypt aceita até 72 bytes)
- Validação no cliente E servidor

**Nome:**
- Mínimo 2 caracteres
- Apenas letras, espaços, hífens, apóstrofos
- Trim automático

### 4. Proteção Contra Ataques

| Ataque | Proteção |
|--------|----------|
| **SQL Injection** | ✅ Prisma ORM (prepared statements) |
| **XSS** | ✅ React escape automático + CSP |
| **CSRF** | ✅ SameSite cookies |
| **Brute Force** | ✅ bcrypt slow hashing (futuro: rate limiting) |
| **Rainbow Tables** | ✅ bcrypt salt automático |
| **Session Hijacking** | ✅ HttpOnly + Secure cookies |
| **Man-in-the-Middle** | ✅ HTTPS obrigatório em produção |

---

## 🔌 APIs

### POST /api/auth/register

**Request:**
```typescript
POST /api/auth/register
Content-Type: application/json

{
  "name": "João Silva",
  "email": "joao@exemplo.com",
  "password": "senha123"
}
```

**Response (Sucesso - 201):**
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

**Response (Erro - 400):**
```typescript
{
  "success": false,
  "error": "Este email já está cadastrado"
}
```

---

### POST /api/auth/login

**Request:**
```typescript
POST /api/auth/login
Content-Type: application/json

{
  "email": "joao@exemplo.com",
  "password": "senha123"
}
```

**Response (Sucesso - 200):**
```typescript
Set-Cookie: token=eyJhbGc...; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000

{
  "success": true,
  "user": {
    "id": "clxyz123abc456def789",
    "name": "João Silva",
    "email": "joao@exemplo.com",
    "avatar": "https://..."
  }
}
```

**Response (Erro - 401):**
```typescript
{
  "success": false,
  "error": "Email ou senha inválidos"
}
```

---

### POST /api/auth/logout

**Request:**
```typescript
POST /api/auth/logout
Cookie: token=eyJhbGc...
```

**Response (200):**
```typescript
Set-Cookie: token=; Max-Age=0

{
  "success": true
}
```

---

### GET /api/auth/session

**Request:**
```typescript
GET /api/auth/session
Cookie: token=eyJhbGc...
```

**Response (Autenticado - 200):**
```typescript
{
  "authenticated": true,
  "user": {
    "id": "clxyz123abc456def789",
    "name": "João Silva",
    "email": "joao@exemplo.com",
    "avatar": "https://..."
  }
}
```

**Response (Não autenticado - 401):**
```typescript
{
  "authenticated": false
}
```

---

## 📊 Fluxogramas

### Registro de Usuário

```
START
  │
  ▼
┌─────────────────┐
│ Usuário preenche│
│ formulário      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Validar inputs  │
│ (client-side)   │
└────────┬────────┘
         │
         ▼
    ┌────────┐
    │ Válido?│
    └───┬────┘
        │
    ┌───┴───┐
    │  Não  │──> Mostrar erro
    └───────┘
        │
      ✅ Sim
        │
        ▼
┌─────────────────┐
│ POST /api/auth/ │
│ register        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Validar no      │
│ servidor        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Email já existe?│
└────────┬────────┘
         │
    ┌────┴────┐
    │   Sim   │──> 400 "Email já cadastrado"
    └─────────┘
         │
       ❌ Não
         │
         ▼
┌─────────────────┐
│ Hash senha com  │
│ bcrypt (10x)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Criar usuário   │
│ no PostgreSQL   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Gerar JWT token │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Set HttpOnly    │
│ Cookie          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Redirect para   │
│ /dashboard      │
└─────────────────┘
         │
         ▼
       END
```

### Login de Usuário

```
START
  │
  ▼
┌─────────────────┐
│ Usuário insere  │
│ email e senha   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ POST /api/auth/ │
│ login           │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Buscar user por │
│ email no DB     │
└────────┬────────┘
         │
         ▼
    ┌────────┐
    │ Existe?│
    └───┬────┘
        │
    ┌───┴───┐
    │  Não  │──> 401 "Email ou senha inválidos"
    └───────┘
        │
      ✅ Sim
        │
        ▼
┌─────────────────┐
│ bcrypt.compare( │
│   senha_input,  │
│   hash_db)      │
└────────┬────────┘
         │
         ▼
    ┌────────┐
    │ Válida?│
    └───┬────┘
        │
    ┌───┴───┐
    │  Não  │──> 401 "Email ou senha inválidos"
    └───────┘
        │
      ✅ Sim
        │
        ▼
┌─────────────────┐
│ Gerar JWT token │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Set HttpOnly    │
│ Cookie          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Return user     │
│ (sem password)  │
└────────┬────────┘
         │
         ▼
       END
```

---

## 🔄 Migração do Sistema Antigo

### Estratégia de Migração

**Não há dados para migrar!** 

O sistema antigo usava `localStorage`, que armazena dados localmente no navegador de cada usuário. Estes dados não podem ser migrados para o servidor.

**Consequência:**
- Usuários precisarão criar nova conta
- Dados antigos serão perdidos automaticamente (apenas ficam no navegador)

### Plano de Transição

1. ✅ **Implementar novo sistema** (database + JWT)
2. ✅ **Testar completamente** (registro, login, logout)
3. ✅ **Deploy em produção**
4. ✅ **Remover código antigo** (lib/auth.ts)
5. ✅ **Adicionar aviso** na tela de login: "Novo sistema! Crie sua conta novamente."

### Compatibilidade

**Backward compatibility:** ❌ Não aplicável

Usuários antigos (se existirem) precisarão:
1. Acessar `/register`
2. Criar nova conta
3. Fazer login com nova credencial

---

## 📁 Estrutura de Arquivos

```
c:/Dev/Radar-Bank/
│
├── docs/auth/                    # 📚 Documentação de autenticação
│   ├── ARQUITETURA.md            # Este arquivo
│   ├── SEGURANCA.md              # Detalhes de segurança
│   ├── API.md                    # Documentação completa das APIs
│   └── MIGRACAO.md               # Guia de migração
│
├── prisma/
│   └── schema.prisma             # ✏️ Modelo User adicionado
│
├── lib/
│   ├── auth-db.ts                # 🆕 Nova lógica de autenticação
│   ├── jwt.ts                    # 🆕 Funções de JWT
│   ├── password.ts               # 🆕 Hash e comparação de senhas
│   ├── auth.ts                   # 🗑️ Antigo (será removido)
│   └── db.ts                     # ✅ Conexão Prisma existente
│
├── app/api/auth/
│   ├── register/route.ts         # 🆕 POST /api/auth/register
│   ├── login/route.ts            # 🆕 POST /api/auth/login
│   ├── logout/route.ts           # 🆕 POST /api/auth/logout
│   └── session/route.ts          # 🆕 GET /api/auth/session
│
├── app/(protected)/
│   └── layout.tsx                # ✏️ Atualizado para usar novo auth
│
├── app/login/
│   └── page.tsx                  # ✏️ Atualizado para usar API
│
└── app/register/
    └── page.tsx                  # ✏️ Atualizado para usar API
```

**Legenda:**
- 🆕 Arquivo novo
- ✏️ Arquivo modificado
- ✅ Arquivo existente (sem mudanças)
- 🗑️ Arquivo a ser removido

---

## ✅ Checklist de Implementação

### Fase 1: Setup
- [ ] Criar documentação (docs/auth/)
- [ ] Adicionar modelo User ao schema.prisma
- [ ] Instalar dependências (bcryptjs, jose)
- [ ] Criar migration do Prisma

### Fase 2: Implementação Core
- [ ] Criar lib/password.ts (hash e compare)
- [ ] Criar lib/jwt.ts (sign e verify)
- [ ] Criar lib/auth-db.ts (register e login)

### Fase 3: APIs
- [ ] POST /api/auth/register
- [ ] POST /api/auth/login
- [ ] POST /api/auth/logout
- [ ] GET /api/auth/session

### Fase 4: Frontend
- [ ] Atualizar app/register/page.tsx
- [ ] Atualizar app/login/page.tsx
- [ ] Atualizar app/(protected)/layout.tsx

### Fase 5: Testes
- [ ] Testar registro de novo usuário
- [ ] Testar login com credenciais corretas
- [ ] Testar login com credenciais incorretas
- [ ] Testar acesso a rotas protegidas
- [ ] Testar logout

### Fase 6: Limpeza
- [ ] Remover lib/auth.ts antigo
- [ ] Remover referências ao localStorage
- [ ] Atualizar documentação

---

## 🚀 Próximos Passos

Após implementação básica:

1. **Rate Limiting** - Prevenir brute force em login
2. **Email Verification** - Confirmar email após registro
3. **Password Reset** - Recuperação de senha via email
4. **2FA** - Autenticação de dois fatores
5. **Session Management** - Listar e revogar sessões ativas
6. **Audit Log** - Registrar logins e eventos importantes

---

**Arquiteto:** GitHub Copilot (Claude Sonnet 4.5)  
**Data de Criação:** 23 de fevereiro de 2026  
**Última Atualização:** 23 de fevereiro de 2026
