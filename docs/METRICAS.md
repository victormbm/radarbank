# Métricas Bancárias - Banco Seguro BR

## 1. CAPITAL (Basileia)
- **Basel Ratio** - Índice de Basileia (≥ 10.5%)
- **Tier 1 Capital Ratio** - Capital Principal (≥ 8.0%)
- **Common Equity Tier 1** - CET1 (≥ 4.5%)
- **Leverage Ratio** - Alavancagem (≥ 3%)

## 2. LIQUIDEZ
- **LCR** - Liquidity Coverage Ratio (≥ 100%)
- **NSFR** - Net Stable Funding Ratio (≥ 100%)
- **Quick Liquidity** - Liquidez Imediata
- **Loan to Deposit Ratio** - Relação Empréstimos/Depósitos

## 3. RENTABILIDADE
- **ROE** - Return on Equity (Retorno sobre Patrimônio)
- **ROA** - Return on Assets (Retorno sobre Ativos)
- **NIM** - Net Interest Margin (Margem Líquida de Juros)
- **Cost to Income** - Eficiência Operacional

## 4. QUALIDADE DE CRÉDITO
- **NPL Ratio** - Non-Performing Loans (Inadimplência)
- **Coverage Ratio** - Taxa de Cobertura de Provisões
- **Write-off Rate** - Taxa de Baixa de Créditos
- **Credit Quality Index** - Índice de Qualidade de Crédito

## 5. TAMANHO & ESTRUTURA
- **Total Assets** - Ativos Totais
- **Equity** - Patrimônio Líquido
- **Total Deposits** - Depósitos Totais
- **Loan Portfolio** - Carteira de Crédito

## 6. CRESCIMENTO
- **Asset Growth** - Crescimento de Ativos (YoY)
- **Loan Growth** - Crescimento de Empréstimos (YoY)
- **Deposit Growth** - Crescimento de Depósitos (YoY)

## Periodicidade de Coleta

| Métrica | Disponibilidade | Frequência Sugerida |
|---------|-----------------|---------------------|
| Basileia | Mensal (BCB) | Mensal (dia 20-25) |
| Liquidez (LCR/NSFR) | Mensal (BCB) | Mensal (dia 20-25) |
| ROE/ROA | Trimestral (ITR) | Trimestral |
| Inadimplência | Mensal (BCB) | Mensal |
| Ativos/Patrimônio | Mensal (BCB) | Mensal |

## Fontes de Dados

### Banco Central (Primária)
- Portal: https://www3.bcb.gov.br/ifdata/
- API: https://olinda.bcb.gov.br/olinda/servico/
- Datasets: Informações financeiras por instituição

### CVM (Complementar)
- Dados de balanços (para bancos listados)
- ITRs e DFPs trimestrais

### Site dos Bancos
- Releases de resultados
- Relatórios de Basileia (IR)
- Relatórios de Gestão de Riscos
