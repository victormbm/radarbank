import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mockBanks, mockBankDetails } from "@/lib/mock-data";

const BASEL_MIN = 11;

export default function DashboardPage() {
  const criticalBanks = mockBanks.filter((bank) => bank.score < 50).length;
  const warningBanks = mockBanks.filter(
    (bank) => bank.score >= 50 && bank.score < 70
  ).length;

  const baselMetrics = Object.values(mockBankDetails)
    .flatMap((detail) => detail.metrics)
    .filter((metric) => metric.metric.key === "basel_ratio");

  const baselBelowMin = baselMetrics.filter(
    (metric) => metric.value < BASEL_MIN
  ).length;

  const averageScore =
    mockBanks.reduce((acc, bank) => acc + bank.score, 0) / mockBanks.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Dashboard de Saúde Bancária
        </h1>
        <p className="text-slate-600 mt-2">
          Visão executiva para antecipar risco sistêmico com foco em Basileia,
          liquidez, ROE e inadimplência.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Score médio" value={averageScore.toFixed(1)} />
        <MetricCard label="Bancos críticos" value={String(criticalBanks)} />
        <MetricCard label="Bancos em alerta" value={String(warningBanks)} />
        <MetricCard label="Basileia < 11%" value={String(baselBelowMin)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximos passos de arquitetura</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-700">
          <p>1. Separar coleta de dados, motor de score e motor de alertas.</p>
          <p>2. Criar trilha de auditoria para cada alerta gerado.</p>
          <p>3. Introduzir limiares por perfil de banco (digital/tradicional).</p>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
