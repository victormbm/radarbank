# Radar Bank - Dashboard de Saúde Bancária

Sistema moderno de monitoramento de saúde financeira dos principais bancos brasileiros.

## 🎨 O Que Foi Criado

### Nova Interface do Dashboard

O dashboard foi completamente redesenhado com foco em:

- **UX Moderna**: Interface limpa e intuitiva com gradientes e animações suaves
- **Seletor Visual de Bancos**: Grid interativo com os 14 principais bancos do Brasil
- **Métricas Detalhadas**: Visualização completa de indicadores financeiros
- **Responsividade Total**: Funciona perfeitamente em mobile, tablet e desktop

### Componentes Criados

#### 1. **lib/brazilian-banks.ts**
Base de dados dos principais bancos brasileiros incluindo:
- Nubank
- Itaú Unibanco
- Banco do Brasil
- Bradesco
- Caixa Econômica Federal
- Santander
- Banco Inter
- C6 Bank
- BTG Pactual
- PagBank
- Banco Safra
- Banco Original
- Banco Next
- Neon

Cada banco tem:
- Cores e gradientes próprios
- Ícone representativo
- Classificação (digital/tradicional)
- Descrição

#### 2. **components/bank-selector.tsx**
Componente de seleção de bancos com:
- Busca em tempo real
- Filtros por tipo (todos, digitais, tradicionais)
- Grid responsivo
- Animações de hover e seleção
- Estado visual do banco selecionado

#### 3. **components/bank-metrics.tsx**
Métricas detalhadas do banco incluindo:
- Score geral de saúde (0-100)
- Índice de Basileia
- ROE (Return on Equity)
- Índice de Liquidez
- Taxa de Inadimplência (NPL)
- Breakdown por categoria (Capital, Liquidez, Rentabilidade, Crédito)
- Indicadores visuais de status

#### 4. **components/banks-overview.tsx**
Visão geral do sistema com:
- Estatísticas agregadas
- Top 5 bancos mais saudáveis
- Distribuição por tipo (digital vs tradicional)
- Distribuição de saúde (excelente, bom, atenção, crítico)
- Gráficos de progresso

#### 5. **app/dashboard/page.tsx** (redesenhado)
Nova página do dashboard com:
- Header com branding visual
- Cards informativos
- Visão geral do sistema
- Seletor de bancos
- Métricas detalhadas do banco selecionado
- Estado vazio elegante quando nenhum banco está selecionado

## 🎯 Funcionalidades

### Visão Geral
- **14 bancos monitorados** (7 digitais, 7 tradicionais)
- **Score médio do sistema**
- **Contadores de bancos** por categoria de saúde
- **Ranking dos top 5** bancos

### Análise Individual
1. Selecione um banco no grid interativo
2. Veja métricas detalhadas em tempo real:
   - Saúde Geral (score 0-100)
   - Índice de Basileia (mínimo 11%)
   - ROE - Retorno sobre Patrimônio
   - Liquidez Rápida
   - Taxa de Inadimplência
3. Breakdown detalhado por categoria

### Design System

**Cores por Status:**
- 🟢 Verde (80-100): Excelente
- 🔵 Azul (70-79): Bom
- 🟡 Amarelo (60-69): Atenção
- 🔴 Vermelho (<60): Crítico

**Tipografia:**
- Inter (fonte sans-serif moderna)
- Hierarquia clara com tamanhos de 3xl a xs

**Animações:**
- Fade in/out suaves
- Slide in from bottom
- Hover effects
- Scale animations

## 🚀 Como Rodar

### Pré-requisitos
- Node.js 18+
- npm ou yarn

### Instalação

```bash
# Instalar dependências
npm install

# Rodar em modo de desenvolvimento
npm run dev
```

Acesse: `http://localhost:3000`

### Build para Produção

```bash
# Build
npm run build

# Rodar produção
npm start
```

## 📦 Stack Tecnológica

- **Framework**: Next.js 15 (App Router)
- **Linguagem**: TypeScript
- **Styling**: Tailwind CSS
- **Componentes**: Radix UI
- **Ícones**: Lucide React
- **Animações**: Tailwind Animate

## 🔮 Próximos Passos (Backend)

Este é um protótipo de frontend com dados mockados. Para a versão completa:

### Arquitetura Backend
1. **API Gateway**
   - Autenticação/Autorização
   - Rate limiting
   - Caching

2. **Serviços**
   - **Data Collector**: Coleta dados do Banco Central e fontes oficiais
   - **Score Engine**: Calcula score de saúde baseado em múltiplos indicadores
   - **Alert Engine**: Sistema de alertas inteligentes
   - **Audit Trail**: Log de todas as operações

3. **Banco de Dados**
   - PostgreSQL (dados relacionais)
   - Redis (cache)
   - TimescaleDB (séries temporais)

4. **Fontes de Dados**
   - API do Banco Central (BACEN)
   - Sistema de Informações de Crédito (SCR)
   - Demonstrativos financeiros
   - IF.data (BACEN)

### Integração
- APIs RESTful
- WebSockets para atualizações em tempo real
- GraphQL (opcional)

### Métricas Adicionais
- Índice de Liquidez de Curto Prazo (ILC)
- Índice de Adequação de Capital (IAC)
- Índice de Imobilização
- Índice de Eficiência
- Índice de Cobertura de Provisões

## 📝 Notas do Arquiteto

### Decisões de Design

1. **Component-First**: Componentes reutilizáveis e isolados
2. **Type Safety**: TypeScript em todo o código
3. **Accessibility**: Uso de Radix UI para garantir a11y
4. **Performance**: Lazy loading e otimizações de renderização
5. **Mobile-First**: Design responsivo desde o início

### Padrões Utilizados

- **Composição**: Componentes pequenos e combináveis
- **Single Responsibility**: Cada componente tem uma responsabilidade clara
- **DRY**: Lógica compartilhada em hooks e utilities
- **Separation of Concerns**: UI separada da lógica de negócio

### Escalabilidade

O código está preparado para:
- Adicionar novos bancos facilmente
- Integrar com APIs reais
- Expandir métricas
- Adicionar relatórios e dashboards customizados
- Sistema de permissões e multi-tenancy

---

**Desenvolvido com ❤️ para transformar dados financeiros em insights acionáveis**
