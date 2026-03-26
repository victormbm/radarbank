# 🎯 ESTRATÉGIA DE COLETA DE DADOS - BANCO SEGURO BR

## 📊 DESCOBERTAS DA PESQUISA

### Fontes Oficiais Identificadas (Artigo Agência Brasil)

1. **Banco Central - Encontre uma instituição**
   - URL: https://www.bcb.gov.br/meubc/encontreinstituicao
   - Verificação de autorização de bancos

2. **Central de Demonstrações Financeiras (CDSFN)**
   - Acesso via site "Encontre uma Instituição"
   - Demonstrativos financeiros oficiais

3. **Banco Data** (https://bancodata.com.br/)
   - Dados financeiros organizados visualmente
   - Sistema de cores (verde/laranja/vermelho)
   - **PROBLEMA**: Provavelmente pago ou com limites

4. **Sites de RI (Relações com Investidores)**
   - Cada banco tem página própria
   - Informações públicas obrigatórias
   - **PROBLEMA**: Precisa scraping de múltiplos sites

---

## ✅ SOLUÇÃO ESCOLHIDA: API GRATUITA DO BANCO CENTRAL

### 🎁 IFData API - Dados Abertos BCB

**URL Base:** https://dadosabertos.bcb.gov.br/dataset/ifdata---dados-selecionados-de-instituies-financeiras

#### ✅ VANTAGENS
- ✅ **100% GRATUITO** (Open Data Commons License)
- ✅ **DADOS OFICIAIS** do Banco Central
- ✅ **API REST** bem documentada (Swagger)
- ✅ **FORMATO JSON** nativo
- ✅ **SEM AUTENTICAÇÃO** necessária
- ✅ **SEM RATE LIMIT** para uso razoável
- ✅ **HISTÓRICO COMPLETO** desde março/2000
- ✅ **TODAS AS INSTITUIÇÕES** autorizadas pelo BC

#### ⚠️ LIMITAÇÕES
- ⏰ Atualização **TRIMESTRAL** (não em tempo real)
- 📅 Disponível após **60 dias** (mar/jun/set) ou **90 dias** (dez)
- 📊 Apenas instituições em **operação normal**

---

## 📋 MÉTRICAS DISPONÍVEIS NA API IFData

Segundo o artigo da Agência Brasil, os principais indicadores são:

### 💰 Capital e Solvência
- **Índice de Basileia** (mín: 11%, ideal: >15%)
- **Índice de Imobilização** (quanto do capital está "preso")
- **Patrimônio Líquido**
- **Capital Tier 1 e CET1**

### 💧 Liquidez
- **Liquidez de Curto Prazo (LCR)**
- **Total de Depósitos**
- **Disponibilidades**

### 📈 Rentabilidade
- **Lucro Líquido Recorrente**
- **ROE (Return on Equity)**
- **ROA (Return on Assets)**

### ⚠️ Risco de Crédito
- **Inadimplência (NPL >90 dias)** (ideal: <3%, alerta: >5%)
- **Cobertura de Provisões**
- **Carteira de Crédito Total**
- **Taxa de Write-Off**

### 📊 Crescimento
- **Crescimento de Ativos**
- **Crescimento de Empréstimos**
- **Crescimento de Depósitos**

---

## 🏗️ ARQUITETURA DE COLETA PROPOSTA

### 🔄 Fluxo Automatizado (Custo: R$ 0)

```
┌──────────────────────────────────────────────────┐
│ 1. CRON JOB (Vercel/Railway gratuito)           │
│    - Executar a cada 3 meses                    │
│    - Dias 5, 25 jun, 25 set, 30 mar             │
└──────────────────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────┐
│ 2. API Route: /api/ingest/bcb                   │
│    - GET request para IFData API                │
│    - Endpoint: Instituições + Relatórios        │
│    - Formato: JSON                              │
└──────────────────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────┐
│ 3. Processar Dados                              │
│    - Extrair métricas por CNPJ                  │
│    - Normalizar valores                         │
│    - Validar integridade                        │
└──────────────────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────┐
│ 4. Salvar no PostgreSQL                         │
│    - Criar BankSnapshot                         │
│    - Calcular BankScore                         │
│    - Popular MetricValues                       │
└──────────────────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────┐
│ 5. Detectar Alertas                             │
│    - Comparar snapshot atual vs anterior        │
│    - Queda de scores >10 pontos                 │
│    - Métricas críticas (Basileia, NPL, LCR)     │
└──────────────────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────┐
│ 6. Enviar Notificações                          │
│    - Email (SendGrid gratuito: 100/dia)         │
│    - WhatsApp (Twilio: ~R$ 0,03/msg)            │
│    - Apenas para usuários afetados              │
└──────────────────────────────────────────────────┘
```

---

## 💰 ANÁLISE DE CUSTOS

### Opção 1: DADOS EM TEMPO REAL (NÃO RECOMENDADO)
- **Banco Data Premium**: ~R$ 1.000-5.000/mês (estimativa)
- **Scraping de RIs**: Custoso em infraestrutura e manutenção
- **Custo total**: ~R$ 3.000-7.000/mês
- **Problema**: Overkill para B2C (clientes não precisam de dados diários)

### ✅ Opção 2: API GRATUITA BCB (RECOMENDADO)
- **IFData API**: R$ 0 (gratuito)
- **Processamento**: Incluído no free tier Vercel/Railway
- **Storage**: PostgreSQL gratuito até 1GB (Supabase/Neon)
- **Custo total**: **R$ 0/mês**
- **Vantagem**: Dados oficiais, confiáveis, zero custo

### Opção 3: HÍBRIDA (FUTURO - PLANO PRO)
- **Base gratuita**: API BCB trimestral
- **Complemento pago**: Data feed premium para clientes PRO
- **Custo**: Cobrar R$ 79,90/mês e pagar R$ 20-50/mês por feed
- **Margem**: R$ 30-60/cliente PRO

---

## 🎯 ESTRATÉGIA DE DADOS POR PLANO

### 📱 Plano GRATUITO (7 dias)
- Dados do **último trimestre disponível**
- Atualização manual: "Dados atualizados em: dez/2025"
- 1 banco monitorado

### 💳 Plano BÁSICO (R$ 19,90)
- Dados do **último trimestre**
- **Histórico de 6 meses** (2 snapshots)
- Email quando novos dados do BC chegam
- 3 bancos monitorados

### 🌟 Plano PREMIUM (R$ 39,90)
- Dados do **último trimestre**
- **Histórico de 24 meses** (8 snapshots)
- WhatsApp + Email quando dados chegam
- **ALERTA IMEDIATO** se métricas críticas detectadas
- Bancos ilimitados

### 🚀 Plano PRO (R$ 79,90)
- Tudo do Premium
- **API REST** para acesso programático
- **Webhooks** quando novos dados chegam
- **Histórico completo** (5 anos = 20 snapshots)
- Possível upgrade futuro: dados em tempo real

---

## 📅 CALENDÁRIO DE ATUALIZAÇÕES

### Datas de Coleta Automática

| Data-base | Disponível em | Nosso CRON     | Notificações enviadas |
|-----------|---------------|----------------|----------------------|
| Mar/2026  | 25 maio       | 26 maio, 00:00 | 26 maio, 06:00       |
| Jun/2026  | 25 ago        | 26 ago, 00:00  | 26 ago, 06:00        |
| Set/2026  | 25 nov        | 26 nov, 00:00  | 26 nov, 06:00        |
| Dez/2025  | 30 mar        | 31 mar, 00:00  | 31 mar, 06:00        |

### Comunicação ao Cliente
> "✅ Novos dados oficiais do Banco Central disponíveis!  
> 📊 Dados de junho/2026 já estão no seu painel.  
> 🔍 Confira se houve mudanças no score dos seus bancos."

---

## 🚨 CASOS REAIS MENCIONADOS NO ARTIGO

### Will Bank (Liquidado em 2026)
- Índice de Basileia: **-5,3%** (negativo!)
- Índice de Imobilização: **-1,9%** (negativo!)
- Lucro Líquido: R$ 55,5 bilhões (números irreais)
- **NOSSO ALERTA**: Score crítico (<30), status: CRITICAL

### Banco Master (Liquidado)
- Oferecia CDB a **140% do CDI** (recomendado: máx 115%)
- Rating agências: Alto (mas dados enganosos)
- **NOSSO ALERTA**: Rentabilidade fora do padrão detectada

---

## 🛠️ IMPLEMENTAÇÃO TÉCNICA

### Endpoint da API BCB

```typescript
// GET Lista de Instituições
const INSTITUTIONS_URL = 
  'https://olinda.bcb.gov.br/olinda/servico/IFData/versao/v1/odata/Instituicoes';

// GET Relatórios de uma instituição específica
const REPORTS_URL = 
  'https://olinda.bcb.gov.br/olinda/servico/IFData/versao/v1/odata/Relatorios';

// Filtro por CNPJ e Data-base
const url = `${REPORTS_URL}?$filter=CNPJ eq '60746948000112' and DataBase eq '2025-12-31'&$format=json`;
```

### Exemplo de Response (simplificado)

```json
{
  "value": [
    {
      "CNPJ": "60746948000112",
      "NomeInstituicao": "BANCO BRADESCO S.A.",
      "DataBase": "2025-12-31",
      "IndiceBasileia": 16.5,
      "PatrimonioLiquido": 125000000000,
      "LucroLiquido": 25000000000,
      "Inadimplencia90Dias": 3.2,
      "IndiceImobilizacao": 8.5,
      "LCR": 145.2
    }
  ]
}
```

### Implementação no Server

```typescript
// server/bcb-api-service.ts
export class BCBAPIService {
  
  async fetchLatestData(): Promise<BCBBankData[]> {
    // 1. Buscar lista de instituições autorizadas
    const institutions = await this.fetchInstitutions();
    
    // 2. Para cada banco no nosso BANK_CNPJ_MAP
    const promises = CNPJ_LIST.map(cnpj => 
      this.fetchReports(cnpj, latestQuarter)
    );
    
    // 3. Consolidar dados
    const data = await Promise.all(promises);
    
    return data.map(this.transformToOurFormat);
  }
  
  private async fetchReports(cnpj: string, date: string) {
    const url = `${REPORTS_URL}?$filter=CNPJ eq '${cnpj}' and DataBase eq '${date}'&$format=json`;
    const response = await fetch(url);
    return response.json();
  }
}
```

---

## ✅ VANTAGENS DA NOSSA ESTRATÉGIA

### Para o Negócio
1. **CUSTO ZERO** de dados = margem maior
2. **Dados oficiais** = credibilidade máxima
3. **Sem vendor lock-in** = independência
4. **Escalável** = mesma API serve 10 ou 10.000 usuários

### Para o Cliente
1. **Confiabilidade**: Dados do Banco Central (fonte primária)
2. **Transparência**: "Dados atualizados trimestralmente pelo BC"
3. **Expectativa correta**: Cliente sabe que não é tempo real
4. **Mesmo padrão dos bancos**: Todos trabalham com trimestres

### Para Marketing
1. **Credibilidade**: "Dados oficiais do Banco Central do Brasil"
2. **Gratuito**: "Acesso gratuito aos mesmos dados que bancos usam"
3. **Transparente**: "Atualizado a cada trimestre, como exigido pelo BC"
4. **Educacional**: "Aprenda a ler os mesmos indicadores que investidores profissionais"

---

## 🎬 PRÓXIMOS PASSOS (HOJE - 3 horas)

### 1. Implementar API BCB Service (60 min)
```bash
# criar server/bcb-api-service.ts
# Testar chamada real à API
# Mapear response para BCBBankData
```

### 2. Criar Endpoint de Ingestão (40 min)
```bash
# criar app/api/ingest/bcb/route.ts
# Conectar com BCBAPIService
# Salvar no banco via Prisma
```

### 3. Testar Fluxo Completo (30 min)
```bash
# Executar ingestão manual
# Verificar dados no PostgreSQL
# Confirmar scores calculados
```

### 4. Configurar CRON Job (30 min)
```bash
# Vercel Cron ou GitHub Actions
# Agendar para próximas datas
# Testar execução automática
```

### 5. Atualizar Documentação (20 min)
```bash
# Atualizar ESTRATEGIA-B2C.md
# Adicionar seção "Fontes de Dados"
# Criar FAQ: "Com que frequência os dados são atualizados?"
```

---

## 💡 INSIGHTS DO ARTIGO

### Sinais de Alerta (Para Implementar)

1. **Queda contínua do Índice de Basileia**
   - Implementar: Comparar últimos 3 trimestres
   - Alerta se: Basileia caiu >2 pontos em 2 trimestres consecutivos

2. **Prejuízos recorrentes**
   - Implementar: Flag se Lucro Líquido negativo por 2+ trimestres
   - Severity: CRITICAL

3. **Inadimplência crescente**
   - Implementar: Alerta se NPL >5% ou cresceu >1 ponto
   - Severity: WARNING se 3-5%, CRITICAL se >5%

4. **Índice de Imobilização alto**
   - Implementar: Flag se >20% (capital "preso")
   - Severity: WARNING

5. **Liquidez baixa**
   - Implementar: Alerta se LCR <100%
   - Severity: CRITICAL se <80%, WARNING se <100%

### FAQ para Adicionar na Pricing Page

**P: De onde vêm os dados?**
R: Utilizamos dados oficiais do Banco Central do Brasil, disponibilizados publicamente através da API IFData. São os mesmos dados que bancos e investidores profissionais usam.

**P: Com que frequência os dados são atualizados?**
R: Os dados são atualizados trimestralmente (março, junho, setembro, dezembro), seguindo o cronograma oficial de divulgação do Banco Central. Você recebe uma notificação sempre que novos dados estão disponíveis.

**P: Por que não é em tempo real?**
R: Os balanços bancários oficiais são divulgados trimestralmente por regulação do BC. Dados diários ou semanais são preliminares e não refletem a saúde real da instituição. Nosso foco é em análises de médio/longo prazo baseadas em dados auditados.

**P: Como vocês garantem a qualidade dos dados?**
R: Não fazemos nenhuma alteração nos dados oficiais do Banco Central. Apenas aplicamos algoritmos de scoring para facilitar a interpretação, mas todos os valores brutos estão disponíveis para você conferir.

---

## 🎯 CONCLUSÃO

### ✅ ESTRATÉGIA FINAL: API GRATUITA DO BANCO CENTRAL

**Decisão**: Usar exclusivamente a **IFData API do BCB** como fonte de dados.

**Justificativa**:
1. ✅ **Custo zero** = margem máxima = preços competitivos
2. ✅ **Dados oficiais** = credibilidade e confiança
3. ✅ **Trimestral suficiente** = clientes B2C não precisam de tempo real
4. ✅ **Fácil implementação** = API REST padrão
5. ✅ **Escalável** = mesma infraestrutura para 10 ou 100.000 usuários

**Próxima ação**: Implementar `bcb-api-service.ts` e testar primeira ingestão real.

---

**Criado em**: 23 de fevereiro de 2026  
**Status**: ✅ Estratégia aprovada para implementação  
**Investimento necessário**: R$ 0 (zero custos de dados)  
**Tempo de implementação**: 3 horas  
**ROI**: Infinito (custo zero, receita R$ 19,90+/cliente)
