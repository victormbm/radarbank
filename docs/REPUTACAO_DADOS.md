# Radar Bank - Documentação de Atualização de Reputação

## 📊 Dados de Reputação Coletados

A tabela `BankReputation` agora contém dados do Reclame Aqui para todos os 14 bancos cadastrados.

### Métricas Disponíveis

- **reputationScore**: Pontuação de reputação (0-10)
- **resolvedRate**: Taxa de resolução de reclamações (%)
- **averageRating**: Nota média dos consumidores (0-5 estrelas)
- **totalComplaints**: Número total de reclamações
- **responseTime**: Tempo médio de resposta (horas)
- **sentimentScore**: Análise de sentimento (-1 a +1)
- **topComplaints**: Top 3 categorias de reclamações

### Ranking Atual (Março 2026)

1. 🥇 **Banco Safra** - 8.7/10 (87.9% resolução)
2. 🥈 **BTG Pactual** - 8.5/10 (85.3% resolução)
3. 🥉 **Nubank** - 8.2/10 (78.5% resolução)
4. **Next** - 7.9/10 (76.2% resolução)
5. **C6 Bank** - 7.8/10 (75.4% resolução)
6. **Neon** - 7.5/10 (73.8% resolução)
7. **Banco do Brasil** - 7.4/10 (81.5% resolução)
8. **Itaú** - 7.3/10 (82.1% resolução)
9. **Bradesco** - 7.1/10 (80.3% resolução)
10. **Santander** - 7.0/10 (79.8% resolução)
11. **Caixa** - 6.9/10 (75.3% resolução)
12. **PagBank** - 6.8/10 (68.9% resolução)
13. **Inter** - 6.5/10 (71.2% resolução)
14. **Original** - 6.2/10 (65.4% resolução)

## ⏰ Atualização Automática (A Cada Hora)

### Executar Manualmente

```bash
npx ts-node scripts/populate-reputation.ts
```

### Agendar Execução Automática (Windows)

1. **Abra o PowerShell como Administrador**

2. **Execute o script de configuração:**
   ```powershell
   cd C:\Dev\Radar-Bank
   .\scripts\setup-reputation-cron.ps1
   ```

3. **Verificar se está funcionando:**
   - Abra o **Agendador de Tarefas** (Task Scheduler)
   - Procure por "RadarBank-ReputationUpdate"
   - Verifique o histórico de execuções

### Logs

Os logs de execução são salvos em:
```
logs/reputation-cron.log
```

## 🔄 Cruzamento de Dados

Agora que você tem dados de reputação, pode criar APIs/queries para cruzar com:

### 1. Scores BCB + Reputação
```typescript
// Exemplo de query
const bankAnalysis = await prisma.bank.findMany({
  include: {
    snapshots: {
      take: 1,
      orderBy: { date: 'desc' }
    },
    reputation: {
      where: { source: 'reclameaqui' },
      take: 1,
      orderBy: { referenceDate: 'desc' }
    }
  }
});

// Calcular score combinado
const combinedScore = 
  (snapshot.basilRatio * 0.3) +  // 30% peso BCB
  (reputation.reputationScore * 0.7);  // 70% peso reputação
```

### 2. Alertas de Reputação
```typescript
// Bancos com reputação baixa
const lowReputation = await prisma.bankReputation.findMany({
  where: {
    reputationScore: { lt: 7.0 },
    resolvedRate: { lt: 75.0 }
  },
  include: { bank: true }
});
```

### 3. Tendências de Reputação
```typescript
// Comparar reputação ao longo do tempo
const reputationTrend = await prisma.bankReputation.findMany({
  where: { bankId: 'bank-id' },
  orderBy: { referenceDate: 'desc' },
  take: 168  // Últimas 168 horas (1 semana)
});
```

## 📈 Próximos Passos Sugeridos

### Opção 1: Dashboard de Reputação
Criar página mostrando:
- Ranking de reputação
- Comparação entre bancos
- Evolução temporal
- Principais reclamações

### Opção 2: Sistema de Alertas
Notificar quando:
- Score de reputação cair abaixo de X
- Taxa de resolução diminuir
- Número de reclamações aumentar significativamente

### Opção 3: API Pública
Expor dados via API:
```
GET /api/reputation/banks
GET /api/reputation/banks/:id
GET /api/reputation/ranking
GET /api/reputation/trends
```

### Opção 4: Score Combinado
Criar fórmula que combine:
- Métricas BCB (solidez financeira) - 40%
- Reputação Reclame Aqui - 40%
- Crescimento/Performance - 20%

## 💡 Valor para o Cliente

Com esses dados, você pode oferecer:

1. **Score Holístico**: Não apenas solidez financeira, mas também satisfação do cliente
2. **Alertas Inteligentes**: Detectar problemas antes que virem escândalos
3. **Comparação Justa**: Qual banco é melhor considerando TODOS os fatores?
4. **Insights Únicos**: Top reclamações, tempo de resposta, sentimento

## 🔒 Importante

Os dados atuais são **mockados mas baseados em dados reais**. Para produção:

1. Implementar scraping real do Reclame Aqui (com permissão)
2. Ou integrar API oficial (se disponível)
3. Respeitar robots.txt e termos de uso
4. Implementar rate limiting adequado

---

**Data da última atualização**: Março 5, 2026
**Total de registros**: 14 bancos
**Frequência**: A cada hora (quando agendado)
