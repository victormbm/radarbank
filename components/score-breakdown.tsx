import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ScoreBreakdown {
  capital: number;
  liquidity: number;
  profitability: number;
  credit: number;
}

interface ScoreBreakdownProps {
  breakdown: ScoreBreakdown;
}

export function ScoreBreakdown({ breakdown }: ScoreBreakdownProps) {
  const items = [
    { label: "Capital", value: breakdown.capital, weight: "35%" },
    { label: "Liquidez", value: breakdown.liquidity, weight: "25%" },
    { label: "Rentabilidade", value: breakdown.profitability, weight: "15%" },
    { label: "Crédito", value: breakdown.credit, weight: "0% (futuro)" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalhamento do Score</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{item.label}</span>
                <span className="text-sm text-muted-foreground">
                  Peso: {item.weight}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${item.value}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-12 text-right">
                  {item.value.toFixed(0)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
