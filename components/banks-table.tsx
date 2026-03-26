import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BankStatusBadge } from "@/components/bank-status-badge";
import { TrendIndicator } from "@/components/trend-indicator";
import { Badge } from "@/components/ui/badge";

interface Bank {
  id: string;
  name: string;
  slug: string;
  cnpj?: string | null;
  type: string;
  country: string;
  segment?: string | null;
  status: string;
  score: number | null;
  scoreTrend?: number | null;
  basilRatio?: number | null;
  basileaTrend?: number | null;
  roe?: number | null;
  roeTrend?: number | null;
  roa?: number | null;
  quickLiquidity?: number | null;
  nplRatio?: number | null;
  nplTrend?: number | null;
  totalAssets?: number | null;
  equity?: number | null;
  updatedAt: Date | string;
  lastDataUpdate?: Date | string;
  ranking?: number | null;
  totalBanks?: number;
  segmentAverage?: {
    avgBasilea: number;
    avgRoe: number;
    avgNpl: number;
    avgScore: number;
  } | null;
}

interface BanksTableProps {
  banks: Bank[];
}

export function BanksTable({ banks }: BanksTableProps) {
  // Função auxiliar para formatar valores grandes
  const formatLargeNumber = (value: number | null | undefined) => {
    if (!value) return '-';
    if (value >= 1_000_000_000_000) {
      return `R$ ${(value / 1_000_000_000_000).toFixed(2)}T`;
    }
    if (value >= 1_000_000_000) {
      return `R$ ${(value / 1_000_000_000).toFixed(2)}B`;
    }
    if (value >= 1_000_000) {
      return `R$ ${(value / 1_000_000).toFixed(2)}M`;
    }
    return `R$ ${value.toFixed(2)}`;
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'digital': 'Digital',
      'traditional': 'Tradicional',
      'commercial': 'Comercial',
      'investment': 'Investimento',
    };
    return types[type] || type;
  };

  const getRankingBadge = (rank: number | null | undefined, total: number | undefined) => {
    if (!rank || !total) return null;
    
    // Top 3
    if (rank <= 3) {
      return <Badge className="bg-yellow-500">#{rank}</Badge>;
    }
    // Top 10
    if (rank <= 10) {
      return <Badge variant="secondary">#{rank}</Badge>;
    }
    // Demais
    return <Badge variant="outline">#{rank}</Badge>;
  };

  const compareWithAverage = (value: number | null | undefined, avg: number | undefined, inverse = false) => {
    if (!value || !avg) return null;
    
    const diff = value - avg;
    const isGood = inverse ? diff < 0 : diff > 0;
    
    return (
      <span className={`text-xs ${isGood ? 'text-green-600' : 'text-gray-500'}`}>
        {isGood ? '↑' : '↓'} vs média
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Rank</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Segmento</TableHead>
              <TableHead className="text-right">Score</TableHead>
              <TableHead className="text-right">Basileia</TableHead>
              <TableHead className="text-right">ROE</TableHead>
              <TableHead className="text-right">NPL</TableHead>
              <TableHead className="text-right">Ativos</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {banks.map((bank) => (
              <TableRow key={bank.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">
                  {getRankingBadge(bank.ranking, bank.totalBanks)}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/banks/${bank.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {bank.name}
                  </Link>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {getTypeLabel(bank.type)}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-xs font-medium bg-slate-100 px-2 py-1 rounded">
                    {bank.segment || '-'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {bank.score !== null ? (
                      <>
                        <span className="font-semibold">{bank.score}</span>
                        <TrendIndicator value={bank.scoreTrend} size="sm" />
                      </>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-end gap-2">
                      {bank.basilRatio ? (
                        <>
                          <span className="font-medium">{bank.basilRatio.toFixed(1)}%</span>
                          <TrendIndicator value={bank.basileaTrend} size="sm" />
                        </>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                    {compareWithAverage(bank.basilRatio, bank.segmentAverage?.avgBasilea)}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-end gap-2">
                      {bank.roe ? (
                        <>
                          <span className="font-medium">{bank.roe.toFixed(1)}%</span>
                          <TrendIndicator value={bank.roeTrend} size="sm" />
                        </>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                    {compareWithAverage(bank.roe, bank.segmentAverage?.avgRoe)}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-end gap-2">
                      {bank.nplRatio ? (
                        <>
                          <span className="font-medium">{bank.nplRatio.toFixed(1)}%</span>
                          <TrendIndicator value={bank.nplTrend} inverse size="sm" />
                        </>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                    {compareWithAverage(bank.nplRatio, bank.segmentAverage?.avgNpl, true)}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-sm font-medium">
                    {formatLargeNumber(bank.totalAssets)}
                  </span>
                </TableCell>
                <TableCell>
                  <BankStatusBadge score={bank.score || 0} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-between text-sm text-muted-foreground px-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="text-green-600">↑</span> Melhora
          </span>
          <span className="flex items-center gap-1">
            <span className="text-red-600">↓</span> Piora
          </span>
          <span className="flex items-center gap-1">
            <span className="text-gray-500">↑ vs média</span> Acima da média do segmento
          </span>
        </div>
        <div>
          Total: {banks.length} bancos
        </div>
      </div>
    </div>
  );
}
