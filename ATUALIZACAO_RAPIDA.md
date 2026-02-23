# 🚀 Guia Rápido - Sistema de Atualização Automática

## ⚡ Setup Rápido (5 minutos)

### 1. Testar Localmente

```bash
# Terminal 1: Rodar aplicação
npm run dev

# Terminal 2: Verificar status
npm run update:status

# Terminal 3: Testar atualização completa
npm run update:test
```

### 2. Deploy na Vercel

```bash
# Push do código
git add .
git commit -m "feat: sistema de atualização automática"
git push

# Deploy
vercel --prod
```

### 3. Configurar Variável de Ambiente

**Vercel Dashboard:**
```
Settings → Environment Variables → Add New

Name: CRON_SECRET
Value: [gerar com: openssl rand -base64 32]
Environment: Production
```

### 4. Testar CRON em Produção

```bash
# Verificar status
curl https://bancosegurobr.com.br/api/ingest/status

# Executar CRON manualmente (usar seu CRON_SECRET)
curl -X POST https://bancosegurobr.com.br/api/ingest/cron \
  -H "Authorization: Bearer SEU_CRON_SECRET_AQUI"
```

## 📊 Comandos Úteis

```bash
# Status da atualização
npm run update:status

# Teste completo (simula CRON)
npm run update:test

# Trigger manual do CRON (local)
npm run update:cron

# Ver logs do Vercel
vercel logs --follow
```

## 🎯 O Que Foi Implementado?

✅ **CRON Job Diário** - Roda às 2h AM automaticamente  
✅ **Detecção Inteligente** - Só atualiza se houver novos dados  
✅ **Mudanças Significativas** - Detecta variações >5% em scores  
✅ **Status Endpoint** - `/api/ingest/status` para monitoramento  
✅ **Logs Completos** - Rastreamento de todas operações  
✅ **Sistema de Tracking** - Metadados de cada atualização

## 📅 Frequência

- **BCB publica**: Trimestralmente (com ~45 dias de atraso)
- **Nosso CRON**: Diário às 2h AM
- **Lógica**: Verifica se há novos dados, se não há → skip

## 🔍 Mudanças Detectadas

**Automaticamente detecta:**
- Score geral: mudanças ≥ 5%
- Basileia: mudanças ≥ 10%
- NPL: mudanças ≥ 15% (aumentos são críticos!)
- ROE: mudanças ≥ 20%

**Níveis de severidade:**
- 🟢 Low: 5-10%
- 🟡 Medium: 10-20%
- 🟠 High: 20-30%
- 🔴 Critical: >30% ou aumento significativo de NPL

## 📈 Próximos Passos

**Fase 2 (1-2 semanas):**
- [ ] Email alerts para usuários
- [ ] Dashboard admin de atualizações
- [ ] Webhook para integrações

**Fase 3 (1 mês):**
- [ ] Push notifications
- [ ] Relatório semanal automático
- [ ] API pública de status

## 🐛 Troubleshooting

**CRON não roda?**
```bash
# Verificar se está no plano Pro
# Verificar vercel.json commitado
# Checar logs: vercel logs
```

**Erro 401?**
```bash
# CRON_SECRET configurado na Vercel?
# Header Authorization correto?
```

**Dados não atualizam?**
```bash
# BCB publicou novos dados?
# Checar: npm run update:status
```

## 📚 Documentação Completa

Ver [SISTEMA_ATUALIZACAO_AUTOMATICA.md](./SISTEMA_ATUALIZACAO_AUTOMATICA.md) para:
- Arquitetura detalhada
- Exemplos de resposta
- Configurações avançadas
- Monitoramento e métricas

## 💡 Dica de Ouro

**Primeira execução sempre ingere todos os dados!**  
Depois disso, o sistema detecta automaticamente quando BCB publica novos dados e atualiza apenas o necessário.

---

**Dúvidas?** Veja a documentação completa ou os logs do CRON.
