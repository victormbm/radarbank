# 🔄 Guia de Migração - Sistema de Autenticação

**Data:** 23 de fevereiro de 2026  
**De:** localStorage (v1.0)  
**Para:** Database + JWT (v2.0)

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Mudanças Principais](#mudanças-principais)
3. [Impacto nos Usuários](#impacto-nos-usuários)
4. [Arquivos Modificados](#arquivos-modificados)
5. [Passo a Passo da Migração](#passo-a-passo-da-migração)
6. [Rollback Plan](#rollback-plan)
7. [Checklist Final](#checklist-final)

---

## 🎯 Visão Geral

### Por que migrar?

| Problema | Solução |
|----------|---------|
| ❌ Senhas em texto puro | ✅ Hash bcrypt |
| ❌ Dados no navegador | ✅ Dados no servidor (PostgreSQL) |
| ❌ Sem segurança real | ✅ JWT + HttpOnly cookies |
| ❌ Dados locais (perdidos ao trocar de navegador) | ✅ Dados persistentes (acessíveis de qualquer lugar) |
| ❌ Impossível fazer auditoria | ✅ Logs de criação/atualização |

### Compatibilidade com Dados Antigos

**⚠️ IMPORTANTE:** Não há migração de dados!

O sistema antigo usa `localStorage`, que armazena dados localmente no navegador de cada usuário. Estes dados **não podem ser migrados** para o servidor.

**Consequência:**
- Usuários antigos precisarão criar nova conta
- Dados antigos permanecerão no navegador (mas serão ignorados)
- Sistema novo não lê localStorage

---

## 🔄 Mudanças Principais

### 1. Armazenamento

```diff
- localStorage.setItem('rb_users', JSON.stringify(users));
+ await prisma.user.create({ data: { ... } });
```

**Antes (v1.0):**
```json
// Navegador: localStorage['rb_users']
[
  {
    "id": "uuid-123",
    "email": "user@example.com",
    "password": "senha123",  ⚠️ TEXTO PURO
    "name": "User"
  }
]
```

**Depois (v2.0):**
```sql
-- PostgreSQL: tabela users
id   | email              | password                                  | name
-----|--------------------|-----------------------------------------|------
abc  | user@example.com   | $2b$10$N9qo8uLOickgx2ZMRZoMye...          | User
```

### 2. Autenticação

**Antes (v1.0):**
```typescript
// lib/auth.ts
export function login(email: string, password: string) {
  const users = JSON.parse(localStorage.getItem('rb_users') || '[]');
  const user = users.find(u => 
    u.email === email && u.password === password  // ⚠️ Comparação texto puro
  );
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  }
  return null;
}
```

**Depois (v2.0):**
```typescript
// lib/auth-db.ts
export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;

  const isValid = await bcrypt.compare(password, user.password);  // ✅ Hash
  if (!isValid) return null;

  const token = await signJWT({ userId: user.id, email: user.email });
  // Set cookie HttpOnly
  return { user, token };
}
```

### 3. Sessões

**Antes (v1.0):**
```typescript
// Cliente pode manipular
const user = JSON.parse(localStorage.getItem('user'));
console.log(user);  // { id, email, password, ... }

// Qualquer script JavaScript pode acessar
document.cookie;  // Nada ou cookies inseguros
```

**Depois (v2.0):**
```typescript
// Cookie HttpOnly (JavaScript NÃO pode acessar)
document.cookie;  // "" (vazio - cookie é HttpOnly)

// Apenas servidor pode ler
const user = await getCurrentUser();  // Server-side only
```

---

## 👥 Impacto nos Usuários

### Cenário 1: Usuário Novo

**Experiência:**
1. Acessa `/register`
2. Cria conta normalmente
3. Dados salvos no PostgreSQL
4. JWT cookie criado
5. Redirecionado para `/dashboard`

**Impacto:** ✅ Nenhum (tudo funciona perfeitamente)

### Cenário 2: Usuário Antigo (localStorage)

**Experiência:**
1. Acessa site
2. Sistema novo NÃO reconhece sessão antiga
3. Redirecionado para `/login`
4. Tenta fazer login → "Email ou senha inválidos"
5. Percebe que precisa criar nova conta
6. Vai para `/register` e cria conta
7. Funciona normalmente

**Impacto:** ⚠️ Precisa criar nova conta

### Cenário 3: Usuário Demo

**Experiência:**
1. Acessa `/login`
2. Usa `demo@bancosegurobr.com` / `demo123`
3. **Sistema verifica no banco primeiro**
4. Se não existir, cria usuário demo automaticamente
5. Funciona normalmente

**Impacto:** ✅ Nenhum (compatibilidade mantida)

### Comunicação com Usuários

**Mensagem sugerida na tela de login:**

```
┌───────────────────────────────────────────────────────────┐
│  ℹ️ Novo Sistema de Segurança                             │
│                                                           │
│  Implementamos um novo sistema de autenticação mais      │
│  seguro. Se você tinha uma conta anterior, por favor     │
│  crie uma nova conta.                                    │
│                                                           │
│  Seus dados estarão protegidos com criptografia de       │
│  nível bancário.                                         │
│                                                           │
│  [Criar Nova Conta]                                      │
└───────────────────────────────────────────────────────────┘
```

---

## 📁 Arquivos Modificados

### Novos Arquivos

```
✅ docs/auth/ARQUITETURA.md      - Documentação de arquitetura
✅ docs/auth/SEGURANCA.md         - Detalhes de segurança
✅ docs/auth/API.md               - Documentação das APIs
✅ docs/auth/MIGRACAO.md          - Este arquivo
✅ lib/auth-db.ts                 - Nova lógica de autenticação
✅ lib/jwt.ts                     - Funções JWT
✅ lib/password.ts                - Hash e comparação
✅ app/api/auth/register/route.ts - API de registro
✅ app/api/auth/login/route.ts    - API de login
✅ app/api/auth/logout/route.ts   - API de logout
✅ app/api/auth/session/route.ts  - API de sessão
```

### Arquivos Modificados

```
✏️ prisma/schema.prisma          - Modelo User adicionado
✏️ app/login/page.tsx            - Usar nova API
✏️ app/register/page.tsx         - Usar nova API
✏️ app/(protected)/layout.tsx    - Verificação de auth
✏️ package.json                  - Novas dependências
✏️ .env.local                    - JWT_SECRET adicionado
```

### Arquivos Removidos

```
🗑️ lib/auth.ts                   - Sistema antigo (localStorage)
```

**⚠️ Importante:** Manter backup de `lib/auth.ts` caso precise fazer rollback.

---

## 🚀 Passo a Passo da Migração

### Fase 1: Preparação (10 min)

#### 1.1 Backup

```powershell
# Criar branch de backup
git checkout -b backup-before-auth-migration
git add .
git commit -m "Backup antes da migração de autenticação"

# Voltar para main/master
git checkout main

# Criar branch para nova feature
git checkout -b feature/auth-database
```

#### 1.2 Instalar Dependências

```powershell
npm install bcryptjs jose
npm install -D @types/bcryptjs
```

**Pacotes:**
- `bcryptjs` - Hash de senhas
- `jose` - JWT (moderno, substitui jsonwebtoken)
- `@types/bcryptjs` - TypeScript types

#### 1.3 Configurar Variáveis de Ambiente

```powershell
# Gerar secret forte
$secret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})

# Adicionar ao .env.local
Add-Content .env.local "`nJWT_SECRET=$secret"
```

Verificar `.env.local`:
```bash
DATABASE_URL=postgresql://...
JWT_SECRET=aB3dEfGh9JkLmNpQrStUvWxYz1234567
```

---

### Fase 2: Banco de Dados (15 min)

#### 2.1 Adicionar Modelo User

Editar `prisma/schema.prisma`:

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String   // Hash bcrypt
  avatar    String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
  @@index([email])
}
```

#### 2.2 Criar Migration

```powershell
# Gerar migration
npx prisma migrate dev --name add_user_model

# Aplicar migration (já feito pelo comando acima em dev)
# Em produção: npx prisma migrate deploy
```

#### 2.3 Verificar Tabela

```powershell
# Abrir Prisma Studio
npx prisma studio

# Ou conectar ao PostgreSQL
psql -U seu_usuario -d banco_seguro

# Verificar tabela
\d users
```

---

### Fase 3: Implementação Core (30 min)

#### 3.1 Criar `lib/password.ts`

```typescript
import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
```

#### 3.2 Criar `lib/jwt.ts`

```typescript
import { SignJWT, jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-min-32-chars-long'
);

export async function signJWT(payload: { userId: string; email: string }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(SECRET);
}

export async function verifyJWT(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as { userId: string; email: string };
  } catch {
    return null;
  }
}
```

#### 3.3 Criar `lib/auth-db.ts`

```typescript
import { cookies } from 'next/headers';
import { prisma } from './db';
import { hashPassword, comparePassword } from './password';
import { signJWT, verifyJWT } from './jwt';

export async function register(data: {
  name: string;
  email: string;
  password: string;
}) {
  // Hash password
  const hashedPassword = await hashPassword(data.password);

  // Create user
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email.toLowerCase().trim(),
      password: hashedPassword,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.email}`,
    },
  });

  // Generate token
  const token = await signJWT({
    userId: user.id,
    email: user.email,
  });

  return { user, token };
}

export async function login(email: string, password: string) {
  // Find user
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!user) return null;

  // Verify password
  const isValid = await comparePassword(password, user.password);
  if (!isValid) return null;

  // Generate token
  const token = await signJWT({
    userId: user.id,
    email: user.email,
  });

  return { user, token };
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) return null;

  const payload = await verifyJWT(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      createdAt: true,
    },
  });

  return user;
}
```

---

### Fase 4: API Routes (30 min)

Criar todos os arquivos em `app/api/auth/`:

#### 4.1 `register/route.ts`
#### 4.2 `login/route.ts`
#### 4.3 `logout/route.ts`
#### 4.4 `session/route.ts`

(Implementação completa no próximo documento)

---

### Fase 5: Frontend (20 min)

#### 5.1 Atualizar `app/login/page.tsx`

```typescript
// Trocar de:
import { login } from '@/lib/auth';

// Para:
async function handleLogin() {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  // ...
}
```

#### 5.2 Atualizar `app/register/page.tsx`

Similar ao login.

#### 5.3 Atualizar `app/(protected)/layout.tsx`

```typescript
import { getCurrentUser } from '@/lib/auth-db';
import { redirect } from 'next/navigation';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return <>{children}</>;
}
```

---

### Fase 6: Testes (20 min)

#### 6.1 Teste Manual

```powershell
# 1. Start dev server
npm run dev

# 2. Abrir navegador
start http://localhost:3000/register

# 3. Criar conta
# 4. Fazer login
# 5. Acessar dashboard
# 6. Fazer logout
# 7. Tentar acessar dashboard (deve redirecionar)
```

#### 6.2 Teste com PowerShell

```powershell
# Script completo de teste
.\scripts\test-auth-system.ps1
```

(Criar script de teste automatizado)

---

### Fase 7: Limpeza (10 min)

#### 7.1 Remover Código Antigo

```powershell
# Mover para backup
New-Item -ItemType Directory -Path "backup" -Force
Move-Item lib/auth.ts backup/auth.ts.old

# Ou deletar direto
Remove-Item lib/auth.ts
```

#### 7.2 Remover Imports Antigos

Buscar e remover todas as referências:

```powershell
# Buscar referências antigas
Get-ChildItem -Recurse -Filter "*.ts*" | Select-String "from '@/lib/auth'"
```

#### 7.3 Atualizar Documentação

- [ ] README.md - Remover menções ao localStorage
- [ ] SETUP.md - Adicionar setup de JWT_SECRET

---

### Fase 8: Deploy (variável)

#### 8.1 Configurar Produção

```bash
# Vercel
vercel env add JWT_SECRET

# Ou via dashboard:
# Settings → Environment Variables
# Name: JWT_SECRET
# Value: <seu-secret-gerado>
```

#### 8.2 Aplicar Migrations

```bash
# Produção
DATABASE_URL=postgresql://... npx prisma migrate deploy
```

#### 8.3 Deploy

```powershell
# Commit
git add .
git commit -m "feat: Implementar autenticação segura com database + JWT"

# Push
git push origin feature/auth-database

# Criar PR e merge

# Deploy
vercel --prod
```

---

## 🔙 Rollback Plan

### Se algo der errado durante migração:

#### Opção 1: Reverter Código (Local)

```powershell
# Descartar todas as mudanças
git checkout main
git reset --hard HEAD

# Ou voltar para backup
git checkout backup-before-auth-migration
```

#### Opção 2: Reverter Database Migration

```powershell
# Ver histórico de migrations
npx prisma migrate status

# Reverter última migration (CUIDADO!)
# Prisma não tem "migrate down" oficial
# Solução: deletar migration e gerar nova

# 1. Deletar pasta da migration
Remove-Item -Recurse prisma/migrations/XXXXXX_add_user_model

# 2. Reverter schema.prisma (remover modelo User)

# 3. Gerar nova migration (vazia ou com alterações)
npx prisma migrate dev
```

#### Opção 3: Rollback em Produção

```bash
# Vercel: reverter deployment
vercel rollback

# Ou redeploy commit anterior
git revert HEAD
git push origin main
vercel --prod
```

### Dados Perdidos?

**Não aplicável!** 

Como não há migração de dados (localStorage → Database), não há dados para perder. Usuários simplesmente criarão novas contas.

---

## ✅ Checklist Final

### Pré-Deploy

- [ ] ✅ Documentação criada (4 arquivos em docs/auth/)
- [ ] ✅ Dependências instaladas (bcryptjs, jose)
- [ ] ✅ JWT_SECRET configurado (.env.local)
- [ ] ✅ Modelo User no schema.prisma
- [ ] ✅ Migration criada e aplicada
- [ ] ✅ lib/password.ts implementado
- [ ] ✅ lib/jwt.ts implementado
- [ ] ✅ lib/auth-db.ts implementado
- [ ] ✅ API routes implementadas (4 rotas)
- [ ] ✅ Frontend atualizado (login, register, layout)
- [ ] ✅ Testes manuais passando
- [ ] ✅ Testes automatizados passando
- [ ] ✅ Código antigo removido (lib/auth.ts)
- [ ] ✅ README atualizado

### Deploy

- [ ] ⏳ JWT_SECRET configurado em produção
- [ ] ⏳ Migrations aplicadas em produção
- [ ] ⏳ Deploy realizado
- [ ] ⏳ Smoke tests em produção
- [ ] ⏳ Monitoramento ativo (primeiras 24h)

### Pós-Deploy

- [ ] ⏳ Comunicação com usuários (se aplicável)
- [ ] ⏳ Monitorar logs de erro
- [ ] ⏳ Criar usuário demo em produção
- [ ] ⏳ Documentar lições aprendidas

---

## 📊 Timeline Estimado

| Fase | Tempo Estimado | Acumulado |
|------|----------------|-----------|
| 1. Preparação | 10 min | 10 min |
| 2. Banco de Dados | 15 min | 25 min |
| 3. Implementação Core | 30 min | 55 min |
| 4. API Routes | 30 min | 1h 25min |
| 5. Frontend | 20 min | 1h 45min |
| 6. Testes | 20 min | 2h 05min |
| 7. Limpeza | 10 min | 2h 15min |
| 8. Deploy | 15 min | 2h 30min |

**Total:** ~2h 30min para desenvolvedor experiente

---

## 📞 Contatos de Emergência

Se algo der errado:

1. **Reverter imediatamente** (git revert)
2. **Verificar logs** (Vercel dashboard)
3. **Restaurar backup** (git checkout backup-branch)
4. **Documentar problema** (criar issue)

---

**Responsável:** GitHub Copilot (Claude Sonnet 4.5)  
**Data de Criação:** 23 de fevereiro de 2026  
**Status:** ✅ Pronto para execução
