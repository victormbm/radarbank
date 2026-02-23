# 🚀 DEPLOY HOJE - Guia Rápido

## ✅ CHECKLIST PRÉ-DEPLOY

Sua aplicação JÁ TEM:
- ✅ Autenticação completa (JWT)
- ✅ Dados reais do Banco Central (14 bancos)
- ✅ Sistema de scoring funcionando
- ✅ Dashboard com métricas e tendências
- ✅ Rankings e comparações
- ✅ API completa

---

## 🎯 DEPLOY EM 30 MINUTOS

### **OPÇÃO 1: Vercel (RECOMENDADO - GRATUITO)** ⭐

#### Passo 1: Banco de Dados (5 min)
Escolha UMA opção:

**A) Neon.tech (PostgreSQL - GRATUITO)**
1. Acesse [neon.tech](https://neon.tech)
2. Crie conta (GitHub login)
3. Criar novo projeto: "radar-bank-prod"
4. Copie a connection string

**B) Supabase (PostgreSQL - GRATUITO)**
1. Acesse [supabase.com](https://supabase.com)
2. Criar projeto: "radar-bank"
3. Settings → Database → Connection String (modo Direct)

**C) Railway (PostgreSQL - $5/mês)**
1. Acesse [railway.app](https://railway.app)
2. New Project → PostgreSQL
3. Copie connection string

#### Passo 2: Vercel Deploy (10 min)

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel

# Responda:
# - Set up and deploy? Y
# - Which scope? (sua conta)
# - Link to existing project? N
# - Project name? radar-bank
# - Directory? ./
# - Override settings? N
```

#### Passo 3: Variáveis de Ambiente (5 min)

No painel Vercel (Settings → Environment Variables):

```env
DATABASE_URL=postgresql://...  (copie do Neon/Supabase)
JWT_SECRET=SUA_CHAVE_SUPER_SECRETA_AQUI_32_CARACTERES
NEXT_PUBLIC_APP_URL=https://seu-app.vercel.app
```

Para gerar JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

#### Passo 4: Banco de Dados em Produção (10 min)

```bash
# No terminal local, com DATABASE_URL de produção no .env:
npx prisma db push
npx tsx scripts/check-demo-user.ts
npm run dev  # testar localmente primeiro

# Depois, no Vercel, no Functions tab:
# 1. Acesse: https://seu-app.vercel.app/api/ingest/bcb
# 2. Aguarde carregar os dados (30-60s)
# 3. Acesse: https://seu-app.vercel.app/api/score/recompute (método POST)
```

#### Passo 5: Testar ✅

```
https://seu-app.vercel.app/login
Email: demo@bancosegurobr.com
Senha: demo123
```

---

### **OPÇÃO 2: Render (GRATUITO)** 

#### Passo 1: Criar Conta
1. [render.com](https://render.com)
2. Conectar GitHub
3. Criar repositório no GitHub (se não tiver)

#### Passo 2: Deploy
1. New → Web Service
2. Conectar repositório
3. Configurações:
   - Name: radar-bank
   - Environment: Node
   - Build: `npm install && npx prisma generate && npm run build`
   - Start: `npm start`
   - Plan: Free

#### Passo 3: PostgreSQL
1. New → PostgreSQL
2. Name: radar-bank-db
3. Plan: Free
4. Copiar Internal Database URL

#### Passo 4: Environment Variables
```env
DATABASE_URL=postgresql://... (do Render PostgreSQL)
JWT_SECRET=... (gerar como acima)
NEXT_PUBLIC_APP_URL=https://radar-bank.onrender.com
```

---

## 💰 MONETIZAÇÃO IMEDIATA

### **Fase 1: MVP Gratuito (Hoje - Semana 1)**

**Objetivo:** Validar e conseguir primeiros usuários

✅ **Fazer AGORA:**
1. Deploy (acima)
2. Criar página de landing simples
3. Postar no LinkedIn:
   ```
   🚀 Acabei de lançar o Banco Seguro BR: monitore a saúde 
   financeira de 14 bancos brasileiros em tempo real!
   
   ✅ Dados oficiais do Banco Central
   ✅ Sistema de scoring automático
   ✅ Análise de tendências
   
   Acesso gratuito: [seu-link]
   ```
4. Compartilhar em grupos de investidores
5. Postar no Reddit r/investimentos

**Meta:** 50-100 usuários em 7 dias

---

### **Fase 2: Primeiro Pagamento (Semana 2)**

**Adicionar Paywall Simples:**

#### Plano GRATUITO:
- ✅ Ver ranking dos bancos
- ✅ Scores atuais
- ❌ Sem histórico
- ❌ Sem tendências
- ❌ Sem exportação

#### Plano PRO - R$ 47/mês:
- ✅ Histórico completo
- ✅ Tendências
- ✅ Exportar dados
- ✅ Alertas

**Ferramentas de Pagamento:**
- [Stripe](https://stripe.com/br) - 4.99% + R$ 0.39
- [Mercado Pago](https://mercadopago.com.br) - 4.99%
- [Pagar.me](https://pagar.me) - Negociável

**Código do Paywall (Quick Win):**
```typescript
// lib/subscription.ts
export function hasProAccess(user: User) {
  return user.subscriptionStatus === 'active';
}

// Bloquear features em components
{hasProAccess(user) ? (
  <HistoryChart />
) : (
  <UpgradePrompt />
)}
```

---

### **Fase 3: Escalar (Semana 3-4)**

**Marketing:**
1. **Google Ads** (R$ 300/mês inicial)
   - Keywords: "análise banco", "segurança bancária"
   
2. **LinkedIn Ads** (R$ 500/mês)
   - Target: CFOs, Tesoureiros, Investidores
   
3. **Parcerias com corretoras**
   - Oferecer white-label
   - Comissão 20%

**Previsão Conservadora:**

| Mês | Usuários Free | Conversão 5% | Pro (R$47) | Revenue |
|-----|---------------|--------------|------------|---------|
| 1   | 100          | 5            | 5          | R$ 235  |
| 2   | 300          | 15           | 20         | R$ 940  |
| 3   | 700          | 35           | 55         | R$ 2.585|
| 4   | 1.500        | 75           | 130        | R$ 6.110|

**Com plano Empresarial (R$ 497/mês):**
- 1 cliente = 10 clientes Pro
- Meta: 3-5 clientes em 3 meses = R$ 1.500-2.500/mês EXTRA

---

## 🎯 AÇÃO IMEDIATA (PRÓXIMAS 2 HORAS)

### ✅ TODO List:

1. **[ ] Deploy (45 min)**
   - [ ] Criar conta Neon.tech
   - [ ] Copiar connection string
   - [ ] `vercel` deploy
   - [ ] Adicionar env vars
   - [ ] Rodar migrations
   - [ ] Carregar dados BCB
   - [ ] Testar login demo

2. **[ ] Landing Page Básica (30 min)**
   - [ ] Atualizar página inicial com CTA
   - [ ] Adicionar botão "Começar Grátis"
   - [ ] Adicionar screenshots

3. **[ ] Marketing Inicial (30 min)**
   - [ ] Post LinkedIn
   - [ ] Mensagem em 3 grupos WhatsApp
   - [ ] Post em fórum de investimentos

4. **[ ] Analytics (15 min)**
   - [ ] Criar conta Google Analytics
   - [ ] Adicionar tracking code
   - [ ] Criar meta de 50 signups

---

## 💡 DICA DE OURO

**NÃO ESPERE ESTAR PERFEITO!**

Você tem:
- ✅ Produto funcionando
- ✅ Dados reais
- ✅ Interface profissional
- ✅ Valor real para usuários

**LANCE AGORA e ajuste depois!**

Primeiros R$ 1.000 virão de:
1. 20 usuários Pro @ R$ 47/mês = R$ 940
2. 1 cliente Empresarial @ R$ 497/mês = R$ 497
3. **Total: R$ 1.437/mês** (alcançável em 30 dias)

---

## 🚨 COMANDOS FINAIS

```bash
# 1. Commit tudo
git add .
git commit -m "Ready for production deploy"
git push

# 2. Deploy Vercel
vercel --prod

# 3. Abrir no navegador
vercel open
```

---

## 📞 PRÓXIMOS PASSOS

**Hoje (23/02/2026):**
- ✅ Deploy online
- ✅ Post LinkedIn
- ✅ Primeiros cadastros

**Esta Semana:**
- Adicionar Stripe/Mercado Pago
- Criar plano Pro
- 50+ usuários grátis

**Próximas 2 Semanas:**
- Primeira venda
- Primeiros R$ 500/mês

**Mês 2-3:**
- R$ 2.000-5.000/mês
- Buscar cliente empresarial

---

## 🎉 VOCÊ ESTÁ PRONTO!

Sua aplicação é SÓLIDA. Dados REAIS. Interface PROFISSIONAL.

**É HORA DE LANÇAR! 🚀**

Qualquer dúvida, me chama que te ajudo em tempo real!
