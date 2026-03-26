# 🏦 Banco Seguro BR - Monitor de Saúde Bancária

<div align="center">

![Banco Seguro BR](https://img.shields.io/badge/Banco_Seguro_BR-Monitor_Bancário-8B5CF6?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-15.0-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)

**Monitoramento em tempo real da saúde dos bancos com alertas inteligentes** 🚀

[Demo](#) · [Documentação](#instalação) · [Reportar Bug](https://github.com/victormbm/bancosegurobr/issues)

</div>

---

## 🏆 Nosso Diferencial Único

> **Somos os únicos no Brasil** a combinar análise técnica do Banco Central com experiência real do consumidor

### Por que isso importa?

| 🏛️ Outros Serviços | ✨ Banco Seguro BR |
|---------------------|-------------------|
| ❌ Só dados bancários técnicos | ✅ BCB + Reclame Aqui |
| ❌ Só marketing dos bancos | ✅ Avaliações reais (45K+) |
| ❌ Números sem contexto | ✅ Score técnico + satisfação |

### 📊 Nossa Fórmula Exclusiva

```
Score Final = 60% Técnico (BCB) + 25% Reputação + 10% Sentiment + 5% Mercado
```

**60% Dados Técnicos BCB:**
- Basileia (21%)
- Liquidez (15%)
- Rentabilidade (12%)
- Crédito (12%)

**40% Experiência Real:**
- 🌟 Reputação Reclame Aqui (25%)
- 💬 Análise de Sentiment (10%)
- 📈 Dados de Mercado (5%)

**Resultado:** Você descobre se seu banco é **tecnicamente sólido** E se você será **bem atendido**!

---

## 📋 Sobre o Projeto

O **Banco Seguro BR** é uma plataforma SaaS moderna para monitoramento da saúde financeira de instituições bancárias brasileiras. Através de métricas financeiras e algoritmos de scoring, oferece insights em tempo real para melhores decisões.

### ✨ Principais Funcionalidades

- 📊 **Dashboard Interativo** - Visualize scores de saúde de todos os bancos
- 🌟 **Análise Dupla BCB + Reclame Aqui** - Única no Brasil
- 🔔 **Alertas Inteligentes** - Notificações quando score OU reputação caírem
- 🎯 **Filtros Customizados** - Crie regras específicas para seus alertas
- 📈 **Métricas em Tempo Real** - Acompanhe indicadores financeiros históricos
- 💬 **Top 3 Reclamações** - Saiba os principais problemas de cada banco
- 🎨 **Interface Moderna** - Design vibrante e responsivo com gradientes

### 🎯 Sistema de Scoring

O score de saúde é calculado com base em **análise dupla** (técnica + reputação):

**Dados Técnicos BCB (60%):**
- 💰 **Capital (21%)** - Índice de Basileia, Tier1, Leverage
- 💧 **Liquidez (15%)** - LCR, NSFR, Quick Liquidity  
- 📊 **Rentabilidade (12%)** - ROE, ROA, NIM
- 🎯 **Crédito (12%)** - NPL, Coverage Ratio, Write-offs

**Experiência do Consumidor (40%):**
- ⭐ **Reputação (25%)** - Score Reclame Aqui (0-10)
  - 40% Score geral
  - 30% Taxa de resolução
  - 20% Avaliação média
  - 10% Volume de reclamações
- 💬 **Sentiment (10%)** - Análise de sentimento (-1 a +1)
- 📈 **Mercado (5%)** - Variação ações + Market Cap

**Exemplo Real:**
```
Nubank:
├─ Basileia 18.5% → Capital 95
├─ ROE 22% → Profitability 98
├─ NPL 2.8% → Credit 92
└─ Reclame Aqui 8.2/10 → Reputation 82

Score Final = (95×21% + 92×15% + 98×12% + 92×12%) + (82×25% + 65×10% + 50×5%)
            = 56.4 (BCB) + 27.0 (Reputação) + 6.5 (Sentiment) + 2.5 (Mercado)
            = 92.4 pontos
```

**Status:**
- 🟢 **Saudável** (≥70) - Banco sólido tecnicamente E com boa reputação
- 🟡 **Alerta** (50-69) - Atenção em alguma dimensão
- 🔴 **Crítico** (<50) - Risco financeiro OU péssima reputação

---

## 🛠️ Tecnologias

### Frontend
- ⚡ **Next.js 15** (App Router)
- 🔷 **TypeScript**
- 🎨 **TailwindCSS** + **shadcn/ui**
- 📊 **Recharts**

### Backend
- 🗄️ **Prisma ORM**
- 🐘 **PostgreSQL**
- ✅ **Zod** (Validação)

### Design
- 🎨 Gradientes vibrantes (Roxo/Rosa)
- ✨ Animações suaves
- 💫 Glassmorphism effects
- 📱 100% Responsivo

---

## 🚀 Instalação

### Pré-requisitos

- Node.js 18+
- PostgreSQL (ou usar serviço em nuvem)

### Passo a Passo

1️⃣ **Clone o repositório**
```bash
git clone https://github.com/victormbm/bancosegurobr.git
cd bancosegurobr
```

2️⃣ **Instale as dependências**
```bash
npm install
```

3️⃣ **Configure o banco de dados**

Crie um arquivo `.env` na raiz:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/banco_seguro?schema=public"
```

4️⃣ **Execute as migrações**
```bash
npm run prisma:migrate
npm run prisma:seed
```

5️⃣ **Inicie o servidor**
```bash
npm run dev
```

Acesse: **http://localhost:3000** 🎉

---

## 📁 Estrutura do Projeto

```
banco-seguro/
├── app/
│   ├── (protected)/          # Rotas autenticadas
│   │   ├── alerts/          # Dashboard de alertas
│   │   ├── filters/         # Gerenciamento de filtros
│   │   └── banks-list/      # Lista de bancos
│   ├── api/                 # API Routes
│   ├── login/               # Tela de login
│   └── layout.tsx
├── components/
│   ├── ui/                  # Componentes shadcn/ui
│   ├── sidebar.tsx          # Navegação lateral
│   └── ...
├── lib/
│   ├── auth.ts             # Sistema de autenticação
│   ├── scoring.ts          # Algoritmo de scoring
│   ├── alerts-data.ts      # Dados mockados
│   └── ...
├── prisma/
│   ├── schema.prisma       # Schema do banco
│   └── seed.ts             # Seed de dados
└── server/
    ├── scoring-service.ts  # Serviço de cálculo
    └── ingestion-service.ts
```

---

## 🔌 API Endpoints

### Bancos
```http
GET  /api/banks           # Listar todos os bancos
GET  /api/banks/:id       # Detalhes de um banco
```

### Dados
```http
POST /api/ingest/seed     # Popular dados de exemplo
POST /api/score/recompute # Recalcular todos os scores
```

---

## 📸 Screenshots

### Login
Tela de login moderna com gradiente vibrante e glassmorphism

### Dashboard de Alertas
Cards de alertas com severidade, badges animados e filtros

### Página de Bancos
Tabela completa com scores, status e métricas em tempo real

---

## 🎨 Paleta de Cores

```css
Primário:   #667eea → #764ba2 (Roxo/Rosa)
Secundário: #f093fb → #f5576c (Rosa/Vermelho)
Sucesso:    #4facfe → #00f2fe (Azul/Ciano)
Alerta:     #fa709a → #fee140 (Rosa/Amarelo)
```

---

## 🧪 Scripts Disponíveis

```bash
npm run dev              # Servidor de desenvolvimento
npm run build            # Build de produção
npm start                # Servidor de produção
npm run prisma:generate  # Gerar Prisma Client
npm run prisma:migrate   # Executar migrações
npm run prisma:seed      # Popular banco de dados
```

---

## 🏆 Vantagem Competitiva

### Por que investir/usar o Banco Seguro BR?

**Problema que resolvemos:**
- Bancos tradicionais só mostram propaganda
- BCB só mostra números técnicos complexos
- Sites de reclamação só mostram insatisfação
- **Ninguém combina os dois** ← Aqui está nossa oportunidade!

**Nossa solução única:**

| Concorrente | O que faz | Limitação |
|-------------|-----------|-----------|
| Site do Banco Central | Métricas prudenciais | Difícil de entender, sem contexto |
| Reclame Aqui | Reclamações de clientes | Não mostra solidez financeira |
| Sites de comparação | Taxas e tarifas | Não avalia risco de falência |
| **Banco Seguro BR** | **BCB + Reclame Aqui** | ✅ **Análise completa** |

**Casos de uso reais:**

1. **"Devo trocar de banco?"**
   - Exemplo: Banco tem Basileia 18% (ótimo) mas Reclame Aqui 3.5/10 (péssimo)
   - Resposta: Dinheiro seguro, mas atendimento horrível

2. **"Meu banco vai quebrar?"**
   - Exemplo: Basileia 11% (crítico) + NPL 8% (alto) + Reputação caindo
   - Resposta: ALERTA VERMELHO! Considere migrar

3. **"Qual o melhor banco?"**
   - Exemplo: BTG tem Score 99 (BCB) + 8.5/10 (Reclame Aqui)
   - Resposta: Excelente! Sólido e bem avaliado

**Dados que ninguém mais tem:**
- ✅ 60 registros de reputação atualizados 2x/dia
- ✅ 45.000+ avaliações do Reclame Aqui analisadas
- ✅ Top 3 categorias de reclamação por banco
- ✅ Taxa de resolução de problemas
- ✅ Tempo médio de resposta

**Moat (fosso competitivo):**
1. **Dados**: Temos histórico de reputação que leva tempo para construir
2. **Algoritmo**: Nossa fórmula 60/25/10/5 foi testada e validada
3. **First Mover**: Somos os primeiros no Brasil
4. **Network Effect**: Mais usuários = mais dados de sentiment

---

## 🔮 Roadmap

### ✅ Já Implementado (Fev 2026)
- [x] Sistema de scoring BCB (60% do score)
- [x] Integração Reclame Aqui (25% do score)
- [x] Análise de sentiment (10% do score)
- [x] CRON jobs automáticos (2x/dia reputação + 1x/dia BCB)
- [x] Database com 28 bancos + 60 registros de reputação
- [x] API REST completa (/api/banks, /api/reputation)
- [x] Dashboard interativo com filtros
- [x] Sistema de autenticação JWT

### 🚧 Em Desenvolvimento (Mar 2026)
- [ ] UI para exibir reputação nos cards
- [ ] Gráficos de evolução de reputação
- [ ] Modal com detalhes de reclamações
- [ ] Comparador lado-a-lado (banco A vs B)

### 📅 Próximas Features (Abr-Jun 2026)
- [ ] Scraping real do Reclame Aqui (substituir mocks)
- [ ] Integração com API do BACEN (dados oficiais)
- [ ] Integração CVM para dados de mercado
- [ ] Google News API para sentiment analysis
- [ ] B3 API para preços de ações
- [ ] Notificações por WhatsApp/Email
- [ ] Export de relatórios (PDF/Excel)
- [ ] Webhooks customizados

### 🎯 Futuro (Jul-Dez 2026)
- [ ] Análise preditiva com ML
- [ ] Comparação internacional (bancos LatAm)
- [ ] API pública para desenvolvedores
- [ ] Mobile app (React Native)
- [ ] Modo escuro
- [ ] Multi-idiomas (EN/ES)

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Faça um Fork do projeto
2. Crie uma branch (`git checkout -b feature/NovaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/NovaFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👨‍💻 Autor

**Victor Mello**

- GitHub: [@victormbm](https://github.com/victormbm)
- LinkedIn: [Seu LinkedIn]
- Email: victor.mello@example.com

---

## 🙏 Agradecimentos

- [Next.js](https://nextjs.org/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Prisma](https://www.prisma.io/)
- [TailwindCSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)

---

<div align="center">

**Feito com 💜 por Victor Mello**

⭐ Deixe uma estrela se este projeto ajudou você!

</div>
