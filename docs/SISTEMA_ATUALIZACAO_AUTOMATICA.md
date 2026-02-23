# 🔄 Sistema de Atualização Automática - Banco Seguro BR

## 📅 Visão Geral

Sistema de CRON job que atualiza automaticamente os dados bancários do BCB diariamente, mantendo a plataforma sempre com as informações mais recentes disponíveis.

## 🎯 Objetivos

1. **Máxima Disponibilidade**: Detectar novos dados BCB assim que publicados
2. **Eficiência**: Ingerir apenas dados incrementais (delta)
3. **Inteligência**: Detectar mudanças significativas e alertar usuários
4. **Transparência**: Mostrar status de atualização para usuários

## ⚙️ Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                   Vercel CRON                           │
│              (Executa diariamente às 2h AM)             │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│           /api/ingest/cron (Route Handler)              │
│  1. Valida autenticação (CRON_SECRET)                   │
│  2. Verifica se há novos dados                          │
│  3. Ingere dados incrementais do BCB                    │
│  4. Recomputa scores                                    │
│  5. Detecta mudanças significativas                     │
│  6. Salva metadados                                     │
│  7. (Futuro) Dispara alertas                            │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│              lib/update-tracker.ts                      │
│  - Rastreia última atualização                          │
│  - Detecta mudanças significativas                      │
│  - Calcula próxima atualização esperada                 │
└─────────────────────────────────────────────────────────┘
```

## 📂 Arquivos Criados

### 1. `/app/api/ingest/cron/route.ts`
Endpoint principal do CRON job.

**Funcionalidades:**
- ✅ Valida autenticação (CRON_SECRET)
- ✅ Verifica se há novos dados disponíveis
- ✅ Ingere dados do BCB
- ✅ Recomputa scores
- ✅ Detecta mudanças significativas (>5% score, >10% basileia, >15% NPL)
- ✅ Logs detalhados
- ⏳ Preparado para alertas futuros

**Timeout:** 5 minutos (maxDuration: 300)

### 2. `/app/api/ingest/status/route.ts`
Endpoint de monitoramento.

**Retorna:**
- Última atualização
- Data de referência dos dados
- Próxima atualização esperada
- Status dos dados (fresh/current/stale/outdated)
- Se há novos dados disponíveis

### 3. `/lib/update-tracker.ts`
Sistema de rastreamento.

**Funções:**
- `getLastUpdateMetadata()` - Busca última atualização
- `checkForNewData()` - Verifica se há novos dados BCB
- `detectSignificantChanges()` - Compara dois períodos
- `saveUpdateMetadata()` - Salva metadados

### 4. `/vercel.json`
Configuração do Vercel CRON.

```json
{
  "crons": [
    {
      "path": "/api/ingest/cron",
      "schedule": "0 2 * * *"  // 2h AM todos os dias
    }
  ]
}
```

## 🚀 Deploy e Configuração

### 1. Configurar Variável de Ambiente

No painel da Vercel:
```
Settings → Environment Variables → Add

Key: CRON_SECRET
Value: [gerar senha forte - ex: openssl rand -base64 32]
```

### 2. Deploy

```bash
git add .
git commit -m "feat: sistema de atualização automática"
git push
vercel --prod
```

### 3. Verificar CRON

No painel Vercel:
```
Deployments → Seu projeto → Cron Jobs
```

## 📊 Frequência e Calendário

### Frequência BCB
- **Publicação**: Trimestral
- **Atraso**: ~45 dias após fim do trimestre
- **Trimestres**:
  - Q1 (Jan-Mar): Publicado ~15 Abril
  - Q2 (Abr-Jun): Publicado ~15 Julho
  - Q3 (Jul-Set): Publicado ~15 Outubro
  - Q4 (Out-Dez): Publicado ~15 Janeiro

### Nossa Frequência
- **Check**: Diário às 2h AM (horário de Brasília)
- **Ingestão**: Apenas quando há novos dados
- **Cache**: 24h para dados não alterados

### Por que Diário?
✅ Detectar novos dados imediatamente  
✅ Custo zero (API BCB gratuita)  
✅ Skip inteligente se não houver dados novos  
✅ Usuários percebem "tempo real"

## 🔍 Detecção de Mudanças Significativas

### Critérios

**Score Geral:**
- Mudança ≥ 5%: Alerta
- Mudança ≥ 10%: Alto
- Mudança ≥ 20%: Crítico

**Basileia:**
- Mudança ≥ 10%: Alerta

**NPL (Inadimplência):**
- Mudança ≥ 15%: Alerta
- **Aumento é crítico** (indicador de risco)

**ROE:**
- Mudança ≥ 20%: Alerta

### Severidade

```typescript
type Severity = 'low' | 'medium' | 'high' | 'critical';

low:      5-10% de mudança
medium:   10-20% de mudança
high:     20-30% de mudança
critical: >30% de mudança OU aumento NPL
```

## 🧪 Testes

### Teste Manual (Local)

```bash
# Testar endpoint de status
curl http://localhost:3000/api/ingest/status

# Testar CRON (precisa do secret)
curl -X POST http://localhost:3000/api/ingest/cron \
  -H "Authorization: Bearer dev-secret-change-in-production"
```

### Teste em Produção

```bash
# Status
curl https://bancosegurobr.com.br/api/ingest/status

# CRON (usar secret de produção)
curl -X POST https://bancosegurobr.com.br/api/ingest/cron \
  -H "Authorization: Bearer [SEU_CRON_SECRET]"
```

## 📈 Monitoramento

### Dashboard Vercel
```
Vercel → Seu projeto → Analytics → Cron Jobs
```

**Métricas:**
- Execuções bem-sucedidas
- Tempo de execução
- Erros

### Logs

```bash
# Ver logs em tempo real
vercel logs --follow

# Filtrar por CRON
vercel logs --follow | grep CRON
```

### Endpoint de Status

```bash
# JSON completo
curl https://bancosegurobr.com.br/api/ingest/status | jq

# Apenas status
curl -s https://bancosegurobr.com.br/api/ingest/status | jq '.status'
```

## 🔔 Alertas (Futuro)

### Fase 2: Email Alerts

```typescript
// Quando mudança significativa detectada:
if (significantChanges.length > 0) {
  await sendEmailAlert({
    to: user.email,
    subject: '⚠️ Mudança Significativa Detectada',
    changes: significantChanges
  });
}
```

### Fase 3: Webhook Alerts

```typescript
// Notificar integrações
await fetch(user.webhookUrl, {
  method: 'POST',
  body: JSON.stringify({
    event: 'significant_change',
    changes: significantChanges
  })
});
```

## 📊 Resposta de Exemplo

### `/api/ingest/status`

```json
{
  "success": true,
  "status": "current",
  "lastUpdate": {
    "date": "2026-02-20T05:00:00.000Z",
    "dataReferenceDate": "2025-12-31",
    "referenceQuarter": "Q4 2025",
    "banksUpdated": 14,
    "scoresComputed": 14,
    "daysSinceUpdate": 3
  },
  "nextExpectedUpdate": {
    "estimatedDate": "2026-04-15T00:00:00.000Z",
    "quarter": "Q1 2026",
    "daysUntilExpected": 52,
    "isOverdue": false
  },
  "hasNewDataAvailable": false,
  "message": "Dados atualizados. Última ref: 2025-12-31"
}
```

### `/api/ingest/cron` (Sucesso com mudanças)

```json
{
  "success": true,
  "action": "updated",
  "data": {
    "previousReferenceDate": "2025-09-30",
    "newReferenceDate": "2025-12-31",
    "banksProcessed": 14,
    "snapshotsCreated": 14,
    "scoresComputed": 14,
    "significantChanges": {
      "count": 3,
      "critical": 1,
      "high": 2,
      "details": [
        {
          "bankId": "banco-inter",
          "bankName": "Banco Inter",
          "metric": "npl",
          "oldValue": 4.5,
          "newValue": 5.8,
          "changePercent": 28.9,
          "severity": "critical"
        }
      ]
    },
    "executionTimeMs": 45230
  }
}
```

## 🎯 Próximos Passos

### Imediato (Pós-Deploy)
- [ ] Configurar `CRON_SECRET` na Vercel
- [ ] Testar primeiro CRON manual
- [ ] Verificar logs

### Curto Prazo (1-2 semanas)
- [ ] Email alerts para mudanças críticas
- [ ] Dashboard admin com histórico de atualizações
- [ ] Métricas de execução do CRON

### Médio Prazo (1 mês)
- [ ] Webhook alerts para integrações
- [ ] API pública de status
- [ ] Sistema de retry inteligente

### Longo Prazo
- [ ] Machine learning para predição de mudanças
- [ ] Push notifications (PWA)
- [ ] Relatório semanal automatizado

## 💡 Dicas

1. **Primeira execução sempre ingere tudo** (não há dados anteriores para comparar)
2. **CRON não roda em development** (apenas em produção Vercel)
3. **Teste manual** com `curl` antes de confiar no CRON
4. **Monitore custos** (Vercel CRON é grátis no Pro plan)
5. **Logs são seus amigos** - use search `[CRON]` para filtrar

## 🐛 Troubleshooting

### CRON não executa
✅ Verificar se está no plano Pro da Vercel  
✅ Verificar `vercel.json` está commitado  
✅ Checar logs: `vercel logs`

### Erro 401 Unauthorized
✅ `CRON_SECRET` configurado?  
✅ Header `Authorization: Bearer` correto?

### Timeout (>5min)
✅ Reduzir quantidade de bancos  
✅ Otimizar queries Prisma  
✅ Adicionar índices no banco

### Dados não atualizam
✅ Verificar `hasNewDataAvailable` no status  
✅ Checar se BCB publicou novos dados  
✅ Logs do CRON para erros

## 📚 Recursos

- [Vercel CRON Docs](https://vercel.com/docs/cron-jobs)
- [BCB IF.data](https://www3.bcb.gov.br/ifdata/)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
