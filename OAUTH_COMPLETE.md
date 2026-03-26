# 🚀 Passos Finais - Ativar OAuth

A integração OAuth foi implementada! Antes de testar, você precisa executar estes comandos:

## ⚠️ IMPORTANTE: Execute estes passos em ordem

### 1. Parar o servidor de desenvolvimento

Se o servidor Next.js está rodando, **PARE-O** (Ctrl+C no terminal).

Isso é necessário porque o Prisma precisa atualizar arquivos que podem estar em uso.

### 2. Gerar o Prisma Client atualizado

```bash
npx prisma generate
```

Este comando irá:
- Gerar os tipos TypeScript para os novos modelos (Account, Session, etc.)
- Atualizar o Prisma Client com os métodos necessários
- Corrigir os erros de TypeScript que você está vendo

### 3. Aplicar as alterações no banco de dados

Escolha UMA das opções abaixo:

**Opção A - Desenvolvimento (recomendado):**
```bash
npx prisma db push
```
Aplica as mudanças diretamente no banco sem criar arquivo de migração.

**Opção B - Produção (criar migração):**
```bash
npx prisma migrate dev --name add-oauth-support
```
Cria um arquivo de migração que pode ser usado em produção.

### 4. Configurar variáveis de ambiente

Copie o arquivo `.env.example` criado e preencha com suas credenciais:

```bash
# Se não tem .env ainda
cp .env.example .env
```

Edite o arquivo `.env` e adicione:

```env
# NextAuth Secret (gere um segredo aleatório)
NEXTAUTH_SECRET="sua-chave-secreta-aqui"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (obtenha em https://console.cloud.google.com)
GOOGLE_CLIENT_ID="seu-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="seu-client-secret"

# Facebook OAuth (obtenha em https://developers.facebook.com)
FACEBOOK_CLIENT_ID="seu-app-id"
FACEBOOK_CLIENT_SECRET="seu-app-secret"
```

**Para gerar NEXTAUTH_SECRET:**
```powershell
# PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

### 5. Iniciar o servidor

```bash
npm run dev
```

### 6. Testar a integração

Acesse: http://localhost:3000/login

Você verá os botões:
- **Continuar com Google** ✅
- **Continuar com Facebook** ✅
- **Login com Email/Senha** ✅

## 📚 Próximos Passos

### Configurar Google OAuth

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um projeto
3. Configure OAuth consent screen
4. Crie credenciais OAuth 2.0
5. Adicione a redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copie Client ID e Secret para o `.env`

**Documentação completa:** [docs/OAUTH_SETUP.md](docs/OAUTH_SETUP.md)

### Configurar Facebook OAuth

1. Acesse [Facebook Developers](https://developers.facebook.com/)
2. Crie um app
3. Adicione o produto "Facebook Login"
4. Configure redirect URI: `http://localhost:3000/api/auth/callback/facebook`
5. Copie App ID e Secret para o `.env`

**Documentação completa:** [docs/OAUTH_SETUP.md](docs/OAUTH_SETUP.md)

## ✅ O que foi implementado

### Arquivos Criados/Modificados:

1. **lib/auth.config.ts** - Configuração do NextAuth com Google, Facebook e Credentials
2. **app/api/auth/[...nextauth]/route.ts** - Route handler do NextAuth
3. **app/providers.tsx** - SessionProvider wrapper
4. **app/layout.tsx** - Adicionado AuthProvider
5. **app/login/page.tsx** - Botões OAuth adicionados
6. **app/register/page.tsx** - Botões OAuth adicionados
7. **prisma/schema.prisma** - Modelos Account, Session, VerificationToken
8. **.env.example** - Template de configuração
9. **docs/OAUTH_SETUP.md** - Guia completo de configuração

### Funcionalidades:

✅ Login com Google
✅ Login com Facebook  
✅ Login com Email/Senha (mantido)
✅ Vinculação automática de contas (mesmo email)
✅ Sessões persistentes com JWT
✅ Proteção de rotas
✅ Suporte a múltiplos provedores OAuth por usuário

## 🐛 Troubleshooting

### Erro: "Property 'account' does not exist on type 'PrismaClient'"

Execute: `npx prisma generate`

Isso acontece porque o TypeScript ainda não conhece os novos modelos.

### Erro: "Table 'accounts' doesn't exist"

Execute: `npx prisma db push`

O banco precisa ser atualizado com as novas tabelas.

### OAuth não funciona em localhost

Certifique-se que as redirect URIs estão configuradas corretamente:
- Google: `http://localhost:3000/api/auth/callback/google`
- Facebook: `http://localhost:3000/api/auth/callback/facebook`

## 🎉 Pronto!

Depois de seguir estes passos, sua aplicação terá autenticação completa com Google e Facebook OAuth!

Para mais detalhes, consulte: **docs/OAUTH_SETUP.md**
