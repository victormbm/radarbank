import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendIndicator } from "@/components/trend-indicator";
import { 
  TrendingUp, 
  AlertTriangle, 
  Shield,
  Activity,
} from "lucide-react";

interface Bank {
  score: number | null;
  status: string;
  basilRatio?: number | null;
  nplRatio?: number | null;
  roe?: number | null;
  scoreTrend?: number | null;
  basileaTrend?: number | null;
}

interface StatsOverviewProps {
  banks: Bank[];
}

export function StatsOverview({ banks }: StatsOverviewProps) {
  // Calcular estatísticas
  const totalBanks = banks.length;
  const healthyBanks = banks.filter(b => b.status === 'healthy').length;
  const warningBanks = banks.filter(b => b.status === 'warning').length;
  const criticalBanks = banks.filter(b => b.status === 'critical').length;

  const avgScore = banks.reduce((sum, b) => sum + (b.score || 0), 0) / banks.length;
  const avgBasilea = banks
    .filter(b => b.basilRatio)
    .reduce((sum, b) => sum + b.basilRatio!, 0) / banks.filter(b => b.basilRatio).length;
  const avgNPL = banks
    .filter(b => b.nplRatio)
    .reduce((sum, b) => sum + b.nplRatio!, 0) / banks.filter(b => b.nplRatio).length;
  const avgROE = banks
    .filter(b => b.roe)
    .reduce((sum, b) => sum + b.roe!, 0) / banks.filter(b => b.roe).length;

  // Calcular tendências gerais
  const banksWithScoreTrend = banks.filter(b => b.scoreTrend !== null && b.scoreTrend !== undefined);
  const avgScoreTrend = banksWithScoreTrend.length > 0
    ? banksWithScoreTrend.reduce((sum, b) => sum + (b.scoreTrend || 0), 0) / banksWithScoreTrend.length
    : null;

  const banksWithBasileaTrend = banks.filter(b => b.basileaTrend !== null && b.basileaTrend !== undefined);
  const avgBasileaTrend = banksWithBasileaTrend.length > 0
    ? banksWithBasileaTrend.reduce((sum, b) => sum + (b.basileaTrend || 0), 0) / banksWithBasileaTrend.length
    : null;

  const stats = [
    {
      title: "Score Médio do Sistema",
      value: avgScore.toFixed(1),
      icon: Activity,
      trend: avgScoreTrend,
      description: `${healthyBanks} bancos saudáveis`,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Basileia Médio",
      value: `${avgBasilea.toFixed(1)}%`,
      icon: Shield,
      trend: avgBasileaTrend,
      description: "Capital / Ativos Ponderados",
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "NPL Médio",
      value: `${avgNPL.toFixed(1)}%`,
      icon: AlertTriangle,
      trend: null,
      description: "Inadimplência > 90 dias",
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "ROE Médio",
      value: `${avgROE.toFixed(1)}%`,
      icon: TrendingUp,
      trend: null,
      description: "Retorno sobre Patrimônio",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`${stat.bgColor} p-2 rounded-lg`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-bold">{stat.value}</div>
                  {stat.trend !== null && stat.trend !== undefined && (
                    <TrendIndicator value={stat.trend} size="md" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Distribuição por Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm">Saudáveis</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{healthyBanks}</span>
                <span className="text-xs text-muted-foreground">
                  ({((healthyBanks / totalBanks) * 100).toFixed(0)}%)
                </span>
              </div>
            </div>
            
            {warningBanks > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-sm">Atenção</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{warningBanks}</span>
                  <span className="text-xs text-muted-foreground">
                    ({((warningBanks / totalBanks) * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>
            )}
            
            {criticalBanks > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm">Crítico</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{criticalBanks}</span>
                  <span className="text-xs text-muted-foreground">
                    ({((criticalBanks / totalBanks) * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
