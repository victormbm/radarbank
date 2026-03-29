# 📢 Configuração de Anúncios Google AdSense

## Resumo da Implementação

Adicionei **3 slots de anúncio discretos e elegantes** ao Banco Seguro BR:

1. **Topo do Dashboard** (320x90px horizontal)
   - Posição: Acima da análise geral
   - Frequência: Sempre visível

2. **Sidebar Lateral** (300x600px vertical)
   - Posição: À direita dos detalhes do banco (apenas em desktop)
   - Frequência: Quando banco é selecionado
   - Estilo: Sticky (segue o scroll)

3. **Rodapé** (728x90px horizontal)
   - Posição: Embaixo dos detalhes do banco
   - Frequência: Quando banco é selecionado

## Como Ativar

### Passo 1: Criar Conta Google AdSense

1. Acesse [https://adsense.google.com](https://adsense.google.com)
2. Clique em "Começar" e faça login com sua conta Google
3. Complete o cadastro com dados bancários
4. Aguarde aprovação (1-3 dias)

### Passo 2: Obter Slot IDs

1. No painel AdSense, vá em **Anúncios → Oportunidades de ganho**
2. Crie 3 formatos:
   - Um ad horizontal responsivo (320x90) → Copie o **Slot ID**
   - Um ad vertical (300x600) → Copie o **Slot ID**
   - Um ad horizontal (728x90) → Copie o **Slot ID**

3. Copie também seu **ID de Publisher** (ca-pub-...)

### Passo 3: Configurar Variáveis de Ambiente

Abra `.env.local` e preencha:

```env
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXXXX

NEXT_PUBLIC_ADSENSE_SLOT_DASHBOARD_TOP=1234567890
NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR=0987654321
NEXT_PUBLIC_ADSENSE_SLOT_FOOTER=1122334455
```

### Passo 4: Reiniciar dev server

```bash
npm run dev
```

## Estratégia Não-agressiva

✅ **O que foi feito:**
- Apenas 3 slots estratégicos (não mais)
- Sem pop-ups ou overlays
- Sem áudio automático
- Sem vídeos auto-play
- Sidebar desaparece em mobile (respeita UX)
- Slots com baixa opacidade/styling sutil

❌ **O que foi evitado:**
- Não há publicidade antes do conteúdo principal
- Não há multiple ads "sticky" que cobrem conteúdo
- Não há botões falsos mimicando ações reais
- Não há redirecionamento involuntário

## Monitoramento

Após ativar, aguarde 24h para ver anúncios aparecerem reais (às vezes AdSense leva tempo).

**No painel AdSense:**
- Visualizações de página
- CTR (Click-through rate)
- Ganho estimado
- Relatórios detalhados

## Receita Estimada

Com o volume de tráfego inicial:
- 100 visitantes/dia → ~$1-3/dia
- 1000 visitantes/dia → $10-30/dia
- Conversão típica: 0.5-2% dos visitantes clicam

*Nota: Valores variam muito conforme nicho (Fintech tem CPM alto)*

## Alternativas se AdSense rejeitar

1. **Propeller Ads** - Mais fácil de aprovar
2. **BidVertiser** - Flexível
3. **Direct sales** - Contatar bancos para patrocínio
4. **Afiliação** - Links de abertura de conta com comissão

## Próximos Passos Recomendados

1. Ativar Google Analytics para medir tráfego
2. Adicionar conversão de email (newsletter)
3. A/B testar posições de ads (após tráfego estabelecido)
4. Considerar vender sponsored slots para fintechs

---

**Arquivo de configuração:** `.env.local`
**Componentes:** `/components/ad-*.tsx`
**Integração:** `/app/dashboard/dashboard-page-client.tsx`
