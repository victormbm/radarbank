# 📚 Guia Prático: Usando a API de Reputação

## 🎯 Endpoints Disponíveis

### 1. Listar Todos os Bancos com Dados Combinados
```
GET /api/reputation/banks
```

**Resposta:**
```json
{
  "success": true,
  "total": 14,
  "date": "2026-03-05T19:15:00Z",
  "banks": [
    {
      "id": "bank-123",
      "name": "Nubank",
      "slug": "nubank",
      "type": "digital",
      "financialMetrics": {
        "basilRatio": 17.2,
        "roe": 24.5,
        "nplRatio": 5.2,
        "totalAssets": 95000,
        "quickLiquidity": 180.0,
        "date": "2026-03-01T00:00:00Z"
      },
      "reputation": {
        "reputationScore": 8.2,
        "resolvedRate": 78.5,
        "averageRating": 4.1,
        "totalComplaints": 45230,
        "responseTime": 3.2,
        "sentimentScore": 0.65,
        "topComplaints": ["App lento", "Bloqueio de cartão", "Atendimento"],
        "lastUpdate": "2026-03-05T19:15:00Z"
      },
      "combinedScore": 78.5,
      "analysis": "✅ Excelente reputação (Score >= 8) | ✅ Ótimo atendimento ao cliente (Resolução >= 80%)"
    }
  ]
}
```

---

### 2. Obter Ranking Ordenado por Score Combinado
```
GET /api/reputation/banks?action=ranking
```

**Resposta:**
```json
{
  "success": true,
  "date": "2026-03-05T19:15:00Z",
  "ranking": [
    {
      "rank": 1,
      "name": "Banco Safra",
      "slug": "safra",
      "basilRatio": 18.9,
      "reputationScore": 8.7,
      "combinedScore": 84.3
    },
    {
      "rank": 2,
      "name": "BTG Pactual",
      "slug": "btg",
      "basilRatio": 19.2,
      "reputationScore": 8.5,
      "combinedScore": 82.1
    }
  ]
}
```

---

### 3. Detalhes Completos de Um Banco
```
GET /api/reputation/banks?bankId=bank-123
```

**Resposta:**
```json
{
  "success": true,
  "bank": {
    "id": "bank-123",
    "name": "Nubank",
    "slug": "nubank",
    "type": "digital",
    "segment": "S3",
    
    "financialHistory": [
      {
        "date": "2026-03-01T00:00:00Z",
        "basilRatio": 17.2,
        "roe": 24.5,
        "nplRatio": 5.2,
        "totalAssets": 95000,
        "quickLiquidity": 180.0,
        "costToIncome": 42.0
      }
    ],
    
    "reputationHistory": [
      {
        "date": "2026-03-05T19:15:00Z",
        "reputationScore": 8.2,
        "resolvedRate": 78.5,
        "averageRating": 4.1,
        "totalComplaints": 45230,
        "responseTime": 3.2,
        "sentimentScore": 0.65
      }
    ],
    
    "stats": {
      "avgReputationScore": "8.2",
      "avgBailiaRatio": "17.20",
      "avgROE": "24.50",
      "trendReputationUp": true
    }
  }
}
```

---

### 4. Comparar 2 ou Mais Bancos
```
GET /api/reputation/banks?action=compare&compare=bank1&compare=bank2
```

**Resposta:**
```json
{
  "success": true,
  "comparison": [
    {
      "name": "Nubank",
      "slug": "nubank",
      "basilRatio": 17.2,
      "roe": 24.5,
      "nplRatio": 5.2,
      "reputationScore": 8.2,
      "resolvedRate": 78.5,
      "averageRating": 4.1,
      "combinedScore": 78.5
    },
    {
      "name": "Itaú Unibanco",
      "slug": "itau",
      "basilRatio": 18.5,
      "roe": 21.2,
      "nplRatio": 2.8,
      "reputationScore": 7.3,
      "resolvedRate": 82.1,
      "averageRating": 3.7,
      "combinedScore": 72.1
    }
  ]
}
```

---

## 💻 Exemplos de Código

### JavaScript/TypeScript

#### Buscar ranking de bancos
```typescript
async function getRanking() {
  const response = await fetch('/api/reputation/banks?action=ranking');
  const data = await response.json();
  
  data.ranking.forEach(bank => {
    console.log(`${bank.rank}º lugar: ${bank.name} (${bank.combinedScore}/100)`);
  });
}
```

#### Comparar dois bancos
```typescript
async function compareBanks(slug1: string, slug2: string) {
  const response = await fetch(
    `/api/reputation/banks?action=compare&compare=${slug1}&compare=${slug2}`
  );
  const { comparison } = await response.json();
  
  const bankA = comparison[0];
  const bankB = comparison[1];
  
  console.log(`${bankA.name}: Score ${bankA.combinedScore}`);
  console.log(`${bankB.name}: Score ${bankB.combinedScore}`);
  console.log(`Diferença: ${Math.abs(bankA.combinedScore - bankB.combinedScore)}`);
}
```

#### Filtrar bancos por critério
```typescript
async function findQualityBanks() {
  const response = await fetch('/api/reputation/banks');
  const { banks } = await response.json();
  
  // Bancos com reputação > 7.5 E Basileia > 17
  const qualityBanks = banks.filter(
    b => b.reputation?.reputationScore > 7.5 && 
         b.financialMetrics?.basilRatio > 17
  );
  
  return qualityBanks;
}
```

### Python

```python
import requests
import json

# Obter ranking
response = requests.get('http://localhost:3000/api/reputation/banks?action=ranking')
ranking = response.json()['ranking']

# Mostrar top 5
for bank in ranking[:5]:
    print(f"🏆 {bank['rank']}º - {bank['name']}: {bank['combinedScore']}/100")

# Comparar bancos
compare_url = 'http://localhost:3000/api/reputation/banks?action=compare&compare=nubank&compare=itau'
comparison = requests.get(compare_url).json()['comparison']

for bank in comparison:
    print(f"{bank['name']}: Reputação {bank['reputationScore']}, Basileia {bank['basilRatio']}%")
```

### cURL (Linha de Comando)

```bash
# Listar todos os bancos
curl http://localhost:3000/api/reputation/banks \
  -H "Accept: application/json" | jq .

# Obter ranking
curl "http://localhost:3000/api/reputation/banks?action=ranking" | jq '.ranking'

# Comparar bancos
curl "http://localhost:3000/api/reputation/banks?action=compare&compare=nubank&compare=safra" \
  | jq '.comparison | .[] | {name, combinedScore}'

# Detalhes de um banco
curl "http://localhost:3000/api/reputation/banks?bankId=<bank-id>" | jq .
```

---

## 🎨 Exemplos de UI/UX

### Mostrar Card de Banco

```typescript
interface BankCard {
  name: string;
  reputationScore: number;
  resolvedRate: number;
  basilRatio: number;
  combinedScore: number;
}

function BankCard({ bank }: { bank: BankCard }) {
  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-bold">{bank.name}</h3>
      
      {/* Barras de progresso */}
      <div className="mt-4 space-y-2">
        <div>
          <label>Reputação</label>
          <progress value={bank.reputationScore} max="10" />
          <span>{bank.reputationScore}/10</span>
        </div>
        
        <div>
          <label>Resolução</label>
          <progress value={bank.resolvedRate} max="100" />
          <span>{bank.resolvedRate}%</span>
        </div>
        
        <div>
          <label>Basileia</label>
          <progress value={bank.basilRatio} max="20" />
          <span>{bank.basilRatio}%</span>
        </div>
      </div>
      
      {/* Score combinado em destaque */}
      <div className="mt-6 text-center bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded p-4">
        <p className="text-3xl font-bold">{bank.combinedScore}/100</p>
        <p className="text-sm">Score Combinado</p>
      </div>
    </div>
  );
}
```

### Tabela de Ranking

```html
<table>
  <thead>
    <tr>
      <th>Posição</th>
      <th>Banco</th>
      <th>Reputação</th>
      <th>Basileia</th>
      <th>Score Combinado</th>
    </tr>
  </thead>
  <tbody id="ranking-body">
    <!-- Preenchido via JavaScript -->
  </tbody>
</table>

<script>
async function loadRanking() {
  const response = await fetch('/api/reputation/banks?action=ranking');
  const { ranking } = await response.json();
  
  const tbody = document.getElementById('ranking-body');
  ranking.forEach(bank => {
    const row = `
      <tr>
        <td>${bank.rank}</td>
        <td>${bank.name}</td>
        <td>${bank.reputationScore}/10</td>
        <td>${bank.basilRatio}%</td>
        <td><strong>${bank.combinedScore}</strong></td>
      </tr>
    `;
    tbody.innerHTML += row;
  });
}

loadRanking();
</script>
```

---

## 🔐 Segurança

### Adicionar Autenticação (Recomendado para Produção)

```typescript
// middleware.ts
import { auth } from '@/lib/auth';

export default auth((req) => {
  if (req.nextUrl.pathname.startsWith('/api/reputation')) {
    // Validar autenticação
    if (!req.auth) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Validar plano (depois implementar)
    if (req.auth.user.plan === 'free') {
      // Limitar a 1 banco por dia
    }
  }
});
```

---

## 📊 Casos de Uso

### Case 1: Investidor Busca Banco Seguro
```
1. Acessa http://seu-site.com/reputation
2. Vê ranking com filtro de reputação >= 8.0
3. Clica em "Nubank" para ver histórico
4. Vê que reputação está melhorando (📈)
5. Clica "Investir" com confiança
```

### Case 2: Cliente Quer Comparar Bancos
```
1. Digita "Nubank vs Safra"
2. API retorna comparação lado a lado
3. Cliente vê que Safra tem melhor atendimento (resolução 87.9%)
4. Cliente muda para Safra
5. Você ganha uma recomendação ✅
```

### Case 3: Monitorar Crises Bancárias
```
1. Seu sistema faz chamada a cada hora
2. Se score cair > 10 pontos, gera alerta
3. Você notifica seus clientes premium
4. Eles conseguem se proteger antes da crise pública
5. Seu serviço prova seu valor imediatamente
```

---

## ⚡ Rate Limiting (Implementar)

```typescript
// Adicionar rate limiting na API
const rateLimit = {
  free: 100,      // 100 req/dia
  premium: 10000, // 10k req/dia
  enterprise: Infinity
};
```

---

## 📈 Métricas Para Monitorar

```typescript
// Adicionar eventos de telemetria
analytics.track('reputation_api_called', {
  endpoint: '/api/reputation/banks',
  action: 'ranking',
  userId: user.id,
  plan: user.plan,
  timestamp: new Date()
});
```

---

**Próximo passo:** Integrar essa API ao seu dashboard de vendas e começar a cobrar! 💰

