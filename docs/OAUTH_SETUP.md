# Configuração OAuth - Google e Facebook

Este documento explica como configurar a autenticação OAuth com Google e Facebook no Banco Seguro BR.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Configurar Google OAuth](#configurar-google-oauth)
3. [Configurar Facebook OAuth](#configurar-facebook-oauth)
4. [Variáveis de Ambiente](#variáveis-de-ambiente)
5. [Migração do Banco de Dados](#migração-do-banco-de-dados)
6. [Testando a Integração](#testando-a-integração)

## 🔍 Visão Geral

O sistema agora suporta três métodos de autenticação:

- **Email/Senha Tradicional**: Login com credenciais armazenadas no banco
- **Google OAuth**: Login com conta Google
- **Facebook OAuth**: Login com conta Facebook

A implementação usa **NextAuth.js v5** com **Prisma Adapter** para gerenciar sessões e contas OAuth.

## 🔧 Configurar Google OAuth

### Passo 1: Criar Projeto no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. No menu lateral, vá em **APIs & Services > Credentials**

### Passo 2: Configurar OAuth Consent Screen

1. Clique em **OAuth consent screen**
2. Escolha **External** e clique em **Create**
3. Preencha:
   - **App name**: Banco Seguro BR
   - **User support email**: seu@email.com
   - **Developer contact**: seu@email.com
4. Clique em **Save and Continue** nas próximas telas

### Passo 3: Criar Credenciais OAuth

1. Vá em **Credentials > Create Credentials > OAuth client ID**
2. Escolha **Web application**
3. Preencha:
   - **Name**: Banco Seguro BR Web
   - **Authorized JavaScript origins**: 
     ```
     http://localhost:3000
     https://seu-dominio.com (produção)
     ```
   - **Authorized redirect URIs**:
     ```
     http://localhost:3000/api/auth/callback/google
     https://seu-dominio.com/api/auth/callback/google (produção)
     ```
4. Clique em **Create**
5. Copie o **Client ID** e **Client Secret**

### Passo 4: Adicionar ao .env

```env
GOOGLE_CLIENT_ID="seu-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="seu-client-secret"
```

## 📘 Configurar Facebook OAuth

### Passo 1: Criar App no Facebook Developers

1. Acesse [Facebook Developers](https://developers.facebook.com/)
2. Clique em **My Apps > Create App**
3. Escolha **Consumer** como tipo de app
4. Preencha:
   - **App Name**: Banco Seguro BR
   - **App Contact Email**: seu@email.com
5. Clique em **Create App**

### Passo 2: Adicionar Produto Facebook Login

1. No dashboard do app, clique em **Add Product**
2. Encontre **Facebook Login** e clique em **Set Up**
3. Escolha **Web** como plataforma
4. Preencha a **Site URL**:
   ```
   http://localhost:3000 (desenvolvimento)
   https://seu-dominio.com (produção)
   ```

### Passo 3: Configurar OAuth Redirect URIs

1. No menu lateral, vá em **Facebook Login > Settings**
2. Em **Valid OAuth Redirect URIs**, adicione:
   ```
   http://localhost:3000/api/auth/callback/facebook
   https://seu-dominio.com/api/auth/callback/facebook
   ```
3. Clique em **Save Changes**

### Passo 4: Obter Credenciais

1. No menu lateral, vá em **Settings > Basic**
2. Copie o **App ID** e **App Secret**

### Passo 5: Adicionar ao .env

```env
FACEBOOK_CLIENT_ID="seu-app-id"
FACEBOOK_CLIENT_SECRET="seu-app-secret"
```

## 🔐 Variáveis de Ambiente

Crie ou atualize seu arquivo `.env` com todas as variáveis necessárias:

```env
# Banco de Dados
DATABASE_URL="postgresql://user:password@localhost:5432/bancoseguro"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="gere-uma-chave-secreta-aleatoria"

# Google OAuth
GOOGLE_CLIENT_ID="seu-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="seu-google-client-secret"

# Facebook OAuth
FACEBOOK_CLIENT_ID="seu-facebook-app-id"
FACEBOOK_CLIENT_SECRET="seu-facebook-app-secret"
```

### Gerar NEXTAUTH_SECRET

Execute no terminal:

```bash
# Windows PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})

# Linux/Mac
openssl rand -base64 32
```

## 💾 Migração do Banco de Dados

### Passo 1: Parar o servidor de desenvolvimento (se estiver rodando)

```bash
# Pressione Ctrl+C no terminal onde o dev server está rodando
```

### Passo 2: Gerar o Prisma Client

```bash
npx prisma generate
```

### Passo 3: Criar e aplicar a migração

```bash
# Criar migração
npx prisma migrate dev --name add-oauth-support

# Ou fazer push direto (desenvolvimento)
npx prisma db push
```

### Passo 4: Verificar as tabelas criadas

As novas tabelas que serão criadas:
- `accounts` - Contas OAuth vinculadas aos usuários
- `sessions` - Sessões ativas
- `verification_tokens` - Tokens de verificação (para magic links futuros)

O modelo `User` foi atualizado para:
- Adicionar campos `emailVerified`
- Tornar `password` opcional (para usuários OAuth)
- Adicionar relações com `accounts` e `sessions`

## 🧪 Testando a Integração

### Desenvolvimento Local

1. Inicie o servidor:
   ```bash
   npm run dev
   ```

2. Acesse `http://localhost:3000/login`

3. Teste os botões:
   - **Continuar com Google** - Deve redirecionar para login do Google
   - **Continuar com Facebook** - Deve redirecionar para login do Facebook
   - **Email/Senha** - Ainda funciona normalmente

### Fluxo de Login OAuth

1. Usuário clica em "Continuar com Google/Facebook"
2. É redirecionado para página de autorização
3. Após autorizar, volta para `/dashboard`
4. Sessão é criada automaticamente
5. Conta OAuth é vinculada ao usuário

### Vinculação de Contas

Se um usuário já existe com o mesmo email:
- A conta OAuth é **vinculada** ao usuário existente
- O usuário pode fazer login com qualquer método (email/senha ou OAuth)
- Múltiplas contas OAuth podem ser vinculadas ao mesmo usuário

### Primeiro Login OAuth

Se é o primeiro login com OAuth:
- Um novo usuário é criado automaticamente
- `name` e `email` vêm do provedor OAuth
- `password` fica `null` (usuário só pode fazer login via OAuth)

## 🔍 Verificar Dados no Banco

```sql
-- Verificar usuários criados
SELECT id, name, email, "emailVerified", "createdAt" FROM users;

-- Verificar contas OAuth vinculadas
SELECT 
  u.name, 
  u.email, 
  a.provider, 
  a."providerAccountId"
FROM users u
LEFT JOIN accounts a ON a."userId" = u.id;

-- Verificar sessões ativas
SELECT 
  u.name,
  u.email,
  s."sessionToken",
  s.expires
FROM sessions s
JOIN users u ON s."userId" = u.id;
```

## 🚀 Deploy em Produção

### Atualizar variáveis de ambiente

```env
NEXTAUTH_URL="https://seu-dominio.com"
NEXTAUTH_SECRET="gere-nova-chave-para-producao"
```

### Atualizar callbacks no Google/Facebook

Adicione as URLs de produção:
- Google: `https://seu-dominio.com/api/auth/callback/google`
- Facebook: `https://seu-dominio.com/api/auth/callback/facebook`

### Aplicar migração no banco de produção

```bash
npx prisma migrate deploy
```

## 📚 Recursos Adicionais

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)
- [Facebook Login Setup](https://developers.facebook.com/docs/facebook-login/)
- [Prisma Adapter](https://authjs.dev/reference/adapter/prisma)

## ⚠️ Troubleshooting

### "Error: redirect_uri_mismatch"
- Certifique-se que a URI de callback está exatamente igual no console do provedor
- Não esqueça do protocolo (`http://` ou `https://`)

### "Error: Invalid client_id"
- Verifique se copiou corretamente as credenciais para `.env`
- Certifique-se que não há espaços extras

### "Error: User with email already exists"
- Isso não deve acontecer; o sistema vincula contas automaticamente
- Se ocorrer, verifique o callback `signIn` em `lib/auth.config.ts`

### Sessão não persiste
- Verifique se `NEXTAUTH_SECRET` está definido
- Certifique-se que cookies estão habilitados no navegador

## 🎉 Pronto!

Agora seu sistema tem autenticação completa com:
✅ Login tradicional com email/senha
✅ Login social com Google
✅ Login social com Facebook
✅ Sessões persistentes
✅ Vinculação automática de contas
