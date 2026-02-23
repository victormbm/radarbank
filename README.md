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

## 📋 Sobre o Projeto

O **Banco Seguro BR** é uma plataforma SaaS moderna para monitoramento da saúde financeira de instituições bancárias brasileiras. Através de métricas financeiras e algoritmos de scoring, oferece insights em tempo real para melhores decisões.

### ✨ Principais Funcionalidades

- 📊 **Dashboard Interativo** - Visualize scores de saúde de todos os bancos
- 🔔 **Alertas Inteligentes** - Notificações personalizadas sobre mudanças críticas
- 🎯 **Filtros Customizados** - Crie regras específicas para seus alertas
- 📈 **Métricas em Tempo Real** - Acompanhe indicadores financeiros históricos
- 🎨 **Interface Moderna** - Design vibrante e responsivo com gradientes

### 🎯 Sistema de Scoring

O score de saúde é calculado com base em:

- 💰 **Capital (35%)** - Índice de Basileia
- 💧 **Liquidez (25%)** - Índice de Liquidez Rápida  
- 📊 **Rentabilidade (15%)** - ROE (Retorno sobre Patrimônio)
- 🎯 **Crédito (0%)** - Implementação futura (NPL)

**Status:**
- 🟢 **Saudável** (≥70) 
- 🟡 **Alerta** (50-69)
- 🔴 **Crítico** (<50)

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

## 🔮 Roadmap

- [ ] Integração com API do BACEN (Banco Central)
- [ ] Integração com CVM (Comissão de Valores Mobiliários)
- [ ] Notificações por email/SMS/push
- [ ] Export de relatórios (PDF/Excel)
- [ ] Dashboard analytics avançado
- [ ] Autenticação OAuth (Google/GitHub)
- [ ] Modo escuro
- [ ] Multi-idiomas (PT/EN/ES)
- [ ] API pública com rate limiting
- [ ] Webhooks para alertas

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
