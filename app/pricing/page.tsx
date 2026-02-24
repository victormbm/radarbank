import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function PricingPage() {
  const plans = [
    {
      name: "Gratuito",
      price: "R$ 0",
      period: "/7 dias",
      description: "Monitore seu banco principal",
      popular: false,
      features: [
        "Escolha 1 banco para monitorar",
        "Score de saúde atualizado",
        "Ver ranking de todos os bancos",
        "Visão geral do mercado",
        "Dados do mês atual",
      ],
      limitations: [
        "Sem alertas automáticos",
        "Sem histórico",
      ],
      cta: "Começar Grátis",
      href: "/register",
    },
    {
      name: "Básico",
      price: "R$ 19,90",
      period: "/mês",
      description: "Monitore seus 3 bancos principais",
      popular: true,
      features: [
        "Monitore até 3 bancos",
        "🏆 Score BCB + Reputação Reclame Aqui",
        "Alertas por EMAIL automáticos",
        "Histórico de 6 meses",
        "Notificação de quedas no score",
        "Comparação entre seus bancos",
        "25+ métricas detalhadas",
        "Exportação em PDF",
        "Suporte por email",
      ],
      limitations: [],
      cta: "Assinar Agora",
      href: "/register?plan=basico",
    },
    {
      name: "Premium",
      price: "R$ 39,90",
      period: "/mês",
      description: "Monitoramento completo + WhatsApp",
      popular: false,
      features: [
        "Bancos ilimitados",
        "🏆 Análise Dupla: BCB + Reclame Aqui",
        "📊 Top 3 Categorias de Reclamações",
        "Alertas por WhatsApp",
        "Alertas por Email",
        "Histórico de 24 meses",
        "Alertas personalizados",
        "Relatórios semanais",
        "Exportação CSV + PDF",
        "Análise de tendências",
      ],
      limitations: [],
      cta: "Assinar Premium",
      href: "/register?plan=premium",
    },
    {
      name: "Pro",
      price: "R$ 79,90",
      period: "/mês",
      description: "Para investidores profissionais",
      popular: false,
      features: [
        "Tudo do Premium",
        "API REST (acesso programático)",
        "Dados em tempo real",
        "Webhooks customizados",
        "Histórico completo (5 anos)",
        "Análises preditivas",
        "Suporte prioritário",
        "Integração com planilhas",
      ],
      limitations: [],
      cta: "Assinar Pro",
      href: "/register?plan=pro",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-gradient-to-r from-emerald-600 to-teal-600">
            🏆 Exclusivo no Brasil
          </Badge>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Proteja seu Dinheiro
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Receba alertas quando seu banco estiver em risco. A partir de R$ 19,90/mês.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 flex-wrap">
            <div className="text-sm text-gray-600">
              ✅ Cancele quando quiser
            </div>
            <div className="text-sm text-gray-600">
              ✅ 7 dias grátis do plano Gratuito
            </div>
          </div>
        </div>

        {/* Differentiator Section */}
        <div className="max-w-4xl mx-auto mb-16">
          <Card className="border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 shadow-2xl">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-slate-900 mb-3">
                  🎯 Por que Somos Diferentes?
                </h2>
                <p className="text-lg text-slate-700">
                  Nenhum outro serviço no Brasil faz isso:
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white/80 rounded-xl p-6 border border-emerald-200">
                  <div className="text-4xl mb-3">🏛️</div>
                  <h3 className="font-bold text-lg text-slate-900 mb-2">Dados Técnicos BCB</h3>
                  <p className="text-slate-600 text-sm mb-3">
                    Basileia, ROE, NPL, Liquidez - métricas prudenciais oficiais
                  </p>
                  <div className="text-xs text-emerald-700 font-semibold">60% do Score Final</div>
                </div>
                
                <div className="bg-white/80 rounded-xl p-6 border border-teal-200">
                  <div className="text-4xl mb-3">⭐</div>
                  <h3 className="font-bold text-lg text-slate-900 mb-2">Reputação Real</h3>
                  <p className="text-slate-600 text-sm mb-3">
                    45.000+ avaliações do Reclame Aqui de clientes reais
                  </p>
                  <div className="text-xs text-teal-700 font-semibold">25% do Score Final</div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl p-6 text-center">
                <p className="text-lg font-semibold mb-2">
                  💡 O Que Isso Significa Para Você?
                </p>
                <p className="text-emerald-50">
                  Você descobre se seu banco é <strong>tecnicamente sólido</strong> (BCB) <strong>E</strong> se você será <strong>bem atendido</strong> (Reclame Aqui).
                  Bancos tradicionais só mostram marketing. BCB só mostra números. Nós mostramos a verdade completa.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col ${
                plan.popular
                  ? "border-purple-500 border-2 shadow-xl shadow-purple-200"
                  : "border-gray-200"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                    Mais Popular
                  </Badge>
                </div>
              )}

              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {plan.price}
                  </span>
                  <span className="text-gray-500">{plan.period}</span>
                </div>
              </CardHeader>

              <CardContent className="flex-grow flex flex-col justify-between">
                <div>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start">
                        <span className="text-green-600 mr-2">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                    {plan.limitations.map((limitation, index) => (
                      <li key={index} className="text-sm text-gray-400 flex items-start">
                        <span className="text-gray-400 mr-2">✕</span>
                        <span>{limitation}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  className={`w-full ${
                    plan.popular
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      : ""
                  }`}
                  variant={plan.popular ? "default" : "outline"}
                  asChild
                >
                  <a href={plan.href}>{plan.cta}</a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-24 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Perguntas Frequentes
          </h2>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Como funciona o período gratuito?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Você tem 7 dias grátis para usar o plano Gratuito (1 banco monitorado). 
                  Após os 7 dias, você precisa assinar um plano pago para continuar usando.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Como funcionam os alertas?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Você recebe notificações automáticas quando o score do seu banco cai, 
                  quando há mudanças nos indicadores de risco ou quando detectamos 
                  problemas de liquidez. No plano Premium, alertas vão direto pro WhatsApp!
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  De onde vêm os dados?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Consolidamos dados públicos do Banco Central do Brasil, balanços 
                  patrimoniais e demonstrativos financeiros dos bancos.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Posso cancelar a qualquer momento?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Sim! Não há multa ou burocracia. Cancele quando quiser e mantenha acesso 
                  até o fim do período pago.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-24 text-center">
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">
            <CardHeader>
              <CardTitle className="text-3xl">
                Pronto para Começar?
              </CardTitle>
              <CardDescription className="text-purple-100 text-lg">
                Proteja seu dinheiro com monitoramento inteligente de bancos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 justify-center flex-wrap">
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-white text-purple-600 hover:bg-gray-100"
                  asChild
                >
                  <a href="/register">Começar Grátis</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
