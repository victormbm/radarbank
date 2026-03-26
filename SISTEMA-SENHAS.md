# 🔐 Sistema de Senhas - Banco Seguro BR

## 📍 LOCALIZAÇÃO

**Arquivo:** `lib/auth.ts` (linhas 1-118)

---

## 🏗️ ARQUITETURA ATUAL

### ⚠️ **ATENÇÃO: Sistema de desenvolvimento APENAS!**

As senhas estão armazenadas em **TEXTO PURO** no `localStorage` do navegador.

```
❌ NÃO usar em produção!
❌ Senhas SEM criptografia
❌ Senhas SEM hash
❌ Dados no navegador (não no servidor)
```

---

## 💾 ONDE FICAM AS SENHAS?

### LocalStorage do Navegador

**Chave:** `rb_users`

**Formato:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "João Silva",
    "email": "joao@exemplo.com",
    "password": "minhaSenha123",  ⚠️ TEXTO PURO!
    "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=joao@exemplo.com"
  },
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "name": "Maria Santos",
    "email": "maria@exemplo.com",
    "password": "outraSenha456",  ⚠️ TEXTO PURO!
    "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=maria@exemplo.com"
  }
]
```

---

## 👤 USUÁRIO DEMO (Hardcoded)

No código `lib/auth.ts` linha 84:

```typescript
const isDemoLogin =
  normalizedEmail === "demo@bancosegurobr.com" && password === "demo123";
```

**Credenciais:**
- 📧 Email: `demo@bancosegurobr.com`
- 🔑 Senha: `demo123`

Este usuário **NÃO** fica no localStorage, está fixo no código!

---

## 🔍 COMO VER AS SENHAS CADASTRADAS?

### Método 1: Console do Navegador

1. Abra o DevTools (F12) no navegador
2. Vá para a aba **Console**
3. Digite:

```javascript
// Ver todos os usuários cadastrados
JSON.parse(localStorage.getItem('rb_users'))

// Ver de forma bonita
console.table(JSON.parse(localStorage.getItem('rb_users')))

// Ver só emails e senhas
JSON.parse(localStorage.getItem('rb_users')).map(u => ({
  email: u.email, 
  senha: u.password
}))
```

### Método 2: Application Tab

1. Abra DevTools (F12)
2. Vá para aba **Application**
3. Expanda **Local Storage** → `http://localhost:3000`
4. Clique em `rb_users`
5. Veja todos os usuários no formato JSON

---

## 📋 CÓDIGO COMPLETO DO SISTEMA

### Interface do Usuário

```typescript
export interface User {
  id: string;
  name: string;
  email: string;
  password: string;  // ⚠️ TEXTO PURO
  avatar?: string;
}
```

### Constantes

```typescript
const USERS_KEY = "rb_users";           // Chave no localStorage
const CURRENT_USER_KEY = "user";        // Usuário logado
```

### Funções Principais

#### 1. getUsers() - Buscar todos os usuários

```typescript
function getUsers(): User[] {
  if (typeof window === "undefined") return [];

  const usersRaw = localStorage.getItem(USERS_KEY);
  if (!usersRaw) return [];

  try {
    return JSON.parse(usersRaw) as User[];
  } catch {
    return [];
  }
}
```

#### 2. register() - Cadastrar novo usuário

```typescript
export function register({ name, email, password }: RegisterInput): {
  ok: boolean;
  message: string;
} {
  // Validações básicas
  if (!name || !email || !password) {
    return { ok: false, message: "Preencha todos os campos." };
  }

  const users = getUsers();
  const normalizedEmail = email.trim().toLowerCase();

  // Verificar se já existe
  const alreadyExists = users.some((user) => user.email === normalizedEmail);
  if (alreadyExists) {
    return { ok: false, message: "Este e-mail já está cadastrado." };
  }

  // Criar novo usuário
  const newUser: User = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: normalizedEmail,
    password,  // ⚠️ Salva senha em TEXTO PURO
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${normalizedEmail}`,
  };

  // Salvar no localStorage
  saveUsers([...users, newUser]);

  return { ok: true, message: "Cadastro realizado com sucesso." };
}
```

#### 3. login() - Fazer login

```typescript
export function login(email: string, password: string): Omit<User, "password"> | null {
  const users = getUsers();
  const normalizedEmail = email.trim().toLowerCase();

  // Buscar usuário com email E senha iguais
  const existingUser = users.find(
    (user) => user.email === normalizedEmail && user.password === password
  );

  if (existingUser) {
    const safeUser = sanitizeUser(existingUser);  // Remove password
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));
    return safeUser;
  }

  // Verificar se é usuário DEMO hardcoded
  const isDemoLogin =
    normalizedEmail === "demo@bancosegurobr.com" && password === "demo123";

  if (isDemoLogin) {
    const demoUser = {
      id: "demo",
      name: "Demo",
      email: normalizedEmail,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${normalizedEmail}`,
    };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(demoUser));
    return demoUser;
  }

  return null;  // Login falhou
}
```

#### 4. Outras funções

```typescript
// Logout
export function logout(): void {
  localStorage.removeItem(CURRENT_USER_KEY);
}

// Pegar usuário logado
export function getCurrentUser(): Omit<User, "password"> | null {
  if (typeof window === "undefined") return null;
  const userStr = localStorage.getItem(CURRENT_USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

// Verificar se está autenticado
export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}
```

---

## 🚨 PROBLEMAS DE SEGURANÇA

### ❌ O que está ERRADO neste sistema:

1. **Senhas em texto puro**
   - Qualquer pessoa pode ver as senhas no DevTools
   - Não há criptografia nem hash

2. **Armazenamento no cliente**
   - Dados no navegador, não no servidor
   - Fácil de manipular via JavaScript

3. **Sem validação de força de senha**
   - Aceita qualquer senha (até "123")

4. **Sem proteção contra ataques**
   - Sem rate limiting
   - Sem proteção CSRF
   - Sem tokens de sessão seguros

5. **Sem backend**
   - Tudo acontece no navegador
   - Zero segurança real

---

## ✅ COMO TORNAR SEGURO PARA PRODUÇÃO

### Opção 1: NextAuth.js (Recomendado)

```bash
npm install next-auth
```

**Benefícios:**
- ✅ Autenticação OAuth (Google, GitHub, etc.)
- ✅ Senhas com hash bcrypt
- ✅ Sessões seguras
- ✅ Proteção CSRF integrada
- ✅ TypeScript support

### Opção 2: Clerk (Mais fácil)

```bash
npm install @clerk/nextjs
```

**Benefícios:**
- ✅ UI pronta
- ✅ Gerenciamento de usuários
- ✅ MFA (autenticação de 2 fatores)
- ✅ Free tier generoso
- ✅ Zero configuração

### Opção 3: Supabase Auth

```bash
npm install @supabase/supabase-js
```

**Benefícios:**
- ✅ Backend completo
- ✅ PostgreSQL incluído
- ✅ Row Level Security
- ✅ OAuth providers
- ✅ Free tier

---

## 📊 EXEMPLO: Migrar para NextAuth

### 1. Instalar
```bash
npm install next-auth bcryptjs
npm install -D @types/bcryptjs
```

### 2. Criar `app/api/auth/[...nextauth]/route.ts`

```typescript
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
});

export { handler as GET, handler as POST };
```

### 3. Adicionar modelo User no Prisma

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
}
```

### 4. Função para criar usuário com senha segura

```typescript
import bcrypt from "bcryptjs";

export async function createUser(email: string, password: string, name: string) {
  // Hash da senha com bcrypt (10 rounds)
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,  // ✅ Hash, não texto puro!
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
    }
  });
  
  return user;
}
```

---

## 🎯 RESUMO

| Item | Estado Atual | Recomendação |
|------|--------------|--------------|
| **Armazenamento** | localStorage | PostgreSQL via Prisma |
| **Senha** | Texto puro | Hash bcrypt |
| **Autenticação** | Client-side | NextAuth.js server-side |
| **Segurança** | ❌ Nenhuma | ✅ JWT + HTTPS |
| **Produção** | ❌ NÃO usar | ✅ Migrar primeiro |

---

## 📞 COMANDOS ÚTEIS

### Ver senhas no console do navegador:
```javascript
// Abrir DevTools (F12) e colar no console
const users = JSON.parse(localStorage.getItem('rb_users') || '[]');
console.table(users.map(u => ({ email: u.email, senha: u.password })));
```

### Limpar todos os usuários:
```javascript
localStorage.removeItem('rb_users');
```

### Criar usuário fake para teste:
```javascript
const fakeUser = {
  id: crypto.randomUUID(),
  name: "Teste",
  email: "teste@teste.com",
  password: "123456",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=teste"
};

const users = JSON.parse(localStorage.getItem('rb_users') || '[]');
localStorage.setItem('rb_users', JSON.stringify([...users, fakeUser]));
```

---

**Criado em:** 23 de fevereiro de 2026  
**Status:** ⚠️ Sistema de DEV - NÃO usar em produção  
**Próximo passo:** Migrar para NextAuth.js ou Clerk antes de deploy
