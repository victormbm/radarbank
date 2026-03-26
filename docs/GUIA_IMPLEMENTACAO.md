# Guia de Implementação - Sistema de Coleta de Dados Bancários

## ✅ O que foi criado

### 1. Schema do Banco de Dados (Prisma)
**Arquivo:** `prisma/schema.prisma`

Novos modelos:
- **BankSnapshot**: Armazena snapshot completo de todas as métricas de um banco
- **DataIngestionLog**: Log de execuções de ingestão
- **Bank**: Expandido com CNPJ e segment
- **Metric**: Expandido com category e description

### 2. Configuração de Métricas
**Arquivo:** `lib/metrics-config.ts`

- 25+ métricas configuradas com:
  - Ranges (min, max, ideal, critical)
  - Pesos para cálculo de score
  - Categorias (capital, liquidity, profitability, credit, size, growth)
  
### 3. Serviço de Coleta do BCB
**Arquivo:** `server/bcb-data-service.ts`

- Estrutura para buscar dados do Banco Central
- Mapeamento de CNPJs dos principais bancos
- Dados mock estruturados para desenvolvimento

### 4. Serviço de Ingestão
**Arquivo:** `server/data-ingestion-service.ts`

- Coleta dados do BCB
- Processa e salva no banco
- Cria snapshots e valores de métricas
- Logging completo

### 5. APIs REST
**Arquivos:** 
- `app/api/ingest/run/route.ts` - Executar ingestão
- `app/api/ingest/init/route.ts` - Inicializar métricas

### 6. Sistema de Scoring v2
**Arquivo:** `lib/scoring-v2.ts`

- Cálculo de score com 25+ métricas
- Detecção de alertas automática
- Breakdown por categoria

### 7. Documentação
**Arquivo:** `docs/METRICAS.md`

- Lista completa de métricas
- Fontes de dados
- Periodicidade sugerida

---

## 🚀 Próximos Passos

### FASE 1: Setup Inicial (AGORA)

#### 1.1 Rodar Migração do Prisma
```bash
npx prisma generate
npx prisma db push
```

#### 1.2 Inicializar Métricas
```bash
# Via API
curl -X POST http://localhost:3000/api/ingest/init
```

Ou via código:
```typescript
import { dataIngestionService } from "@/server/data-ingestion-service";
await dataIngestionService.initializeMetrics();
```

#### 1.3 Primeira Ingestão (dados mock)
```bash
curl -X POST http://localhost:3000/api/ingest/run
```

---

### FASE 2: Integração com Dados Reais

#### 2.1 Pesquisar APIs do BCB
1. Acessar: https://www3.bcb.gov.br/ifdata/
2. Documentar endpoints disponíveis:
   - Índices de Basileia
   - Balanços patrimoniais
   - Demonstrativos de resultado
   - Indicadores de risco

3. **Exemplo de Endpoint Real:**
```
https://olinda.bcb.gov.br/olinda/servico/IFDATA/versao/v1/odata/BalanceteConsolidado?
$filter=Data eq '2024-12-31' and CNPJ_IF eq '18236120'&
$format=json
```

#### 2.2 Atualizar `bcb-data-service.ts`
Substituir funções mock por chamadas reais:

```typescript
async fetchBasileiaData(referenceDate?: string): Promise<BCBBankData[]> {
  const url = `https://olinda.bcb.gov.br/olinda/servico/...`;
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
  });
  
  const data = await response.json();
  return this.transformBCBResponse(data);
}
```

#### 2.3 Implementar Rate Limiting
```typescript
import pLimit from 'p-limit';

const limit = pLimit(2); // Máximo 2 requisições simultâneas

Promise.all(banks.map(bank => 
  limit(() => this.fetchBankData(bank))
));
```

---

### FASE 3: Automação

#### 3.1 Criar Cron Job
**Opção A: Vercel Cron (se deployar na Vercel)**

Criar `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/ingest/run",
    "schedule": "0 2 25 * *"
  }]
}
```

**Opção B: Node-cron (rodando local/servidor)**

Criar `server/cron.ts`:
```typescript
import cron from 'node-cron';
import { dataIngestionService } from './data-ingestion-service';

// Executar todo dia 25 às 2h da manhã
cron.schedule('0 2 25 * *', async () => {
  console.log('[CRON] Iniciando ingestão automática...');
  await dataIngestionService.runFullIngestion();
});
```

#### 3.2 Periodicidade Sugerida

| Tipo de Dado | Frequência | Razão |
|--------------|------------|-------|
| Basileia, Liquidez | Mensal (dia 25) | BCB publica ~dia 20-25 |
| ROE, ROA | Trimestral | ITRs publicados trimestralmente |
| Inadimplência | Mensal (dia 25) | BCB publica mensalmente |
| Ativos, Patrimônio | Mensal (dia 25) | Balanços mensais |

---

### FASE 4: Dashboard

#### 4.1 Criar Página de Admin
**Arquivo:** `app/(protected)/admin/ingestion/page.tsx`

```typescript
'use client';

export default function IngestionAdminPage() {
  const [loading, setLoading] = useState(false);
  
  const runIngestion = async () => {
    setLoading(true);
    const res = await fetch('/api/ingest/run', { method: 'POST' });
    const data = await res.json();
    console.log(data);
    setLoading(false);
  };
  
  return (
    <div>
      <h1>Ingestão de Dados</h1>
      <button onClick={runIngestion} disabled={loading}>
        Executar Ingestão Manual
      </button>
      {/* Mostrar logs, status, etc */}
    </div>
  );
}
```

#### 4.2 Atualizar Dashboard Principal
Usar o novo sistema de scoring:

```typescript
import { computeDetailedScore } from '@/lib/scoring-v2';

const snapshot = await prisma.bankSnapshot.findFirst({
  where: { bankId: bank.id },
  orderBy: { date: 'desc' },
});

const score = computeDetailedScore(snapshot);

// score.totalScore
// score.breakdown
// score.alerts
// score.metricScores
```

---

### FASE 5: Otimizações

#### 5.1 Cache de Dados
```typescript
import { cache } from 'react';

export const getBankData = cache(async (bankId: string) => {
  return prisma.bank.findUnique({ where: { id: bankId }});
});
```

#### 5.2 Incremental Updates
Apenas atualizar bancos que tiveram dados novos

#### 5.3 Notificações
Enviar email/slack quando score crítico for detectado

---

## 📊 Estrutura de Dados

### Snapshot de um Banco
```typescript
{
  bankId: "xxx",
  date: "2026-01-31",
  
  // Capital
  basilRatio: 17.2,
  tier1Ratio: 14.5,
  cet1Ratio: 12.0,
  leverageRatio: 8.5,
  
  // Liquidez
  lcr: 145.0,
  nsfr: 125.0,
  quickLiquidity: 168.5,
  loanToDeposit: 85.0,
  
  // Rentabilidade
  roe: 22.5,
  roa: 2.1,
  nim: 8.5,
  costToIncome: 45.0,
  
  // Crédito
  nplRatio: 4.8,
  coverageRatio: 120.0,
  writeOffRate: 2.5,
  
  // Tamanho (milhões)
  totalAssets: 185000,
  equity: 28500,
  totalDeposits: 120000,
  loanPortfolio: 95000,
  
  // Crescimento YoY (%)
  assetGrowth: 15.5,
  loanGrowth: 12.0,
  depositGrowth: 18.0,
}
```

---

## 🔍 Testando

### 1. Testar Ingestão Mock
```bash
curl -X POST http://localhost:3000/api/ingest/run
```

### 2. Ver Logs
```bash
curl http://localhost:3000/api/ingest/run
```

### 3. Verificar Banco de Dados
```bash
npx prisma studio
```

---

## ⚠️ Importantes

### Dados Reais do BCB
1. **Autenticação**: Verificar se BCB requer API key
2. **Rate Limits**: Respeitar limites de requisição
3. **Formato dos dados**: Pode variar, ajustar parser
4. **Disponibilidade**: Dados podem atrasar alguns dias

### Regulamentação
- Basileia mínimo: 10.5%
- Tier 1 mínimo: 8.0%
- LCR mínimo: 100%
- NSFR mínimo: 100%

### Periodicidade
- **Mensal**: Basileia, Liquidez, Inadimplência
- **Trimestral**: Lucratividade (ROE, ROA)
- **Anual**: Alguns índices complementares

---

## 📞 Suporte

### Fontes Oficiais
- BCB IF.data: https://www3.bcb.gov.br/ifdata/
- CVM: https://www.gov.br/cvm/
- API BCB: https://dadosabertos.bcb.gov.br/

### Documentação Técnica
- Basileia III: https://www.bcb.gov.br/estabilidadefinanceira/basileia
- Resolução CMN: Consultar normas específicas
