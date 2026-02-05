import { Badge } from "@/components/ui/badge";
import { getStatusFromScore } from "@/lib/scoring";

interface BankStatusBadgeProps {
  score: number;
}

export function BankStatusBadge({ score }: BankStatusBadgeProps) {
  const status = getStatusFromScore(score);

  const variantMap = {
    healthy: "success" as const,
    warning: "warning" as const,
    critical: "critical" as const,
  };

  const labelMap = {
    healthy: "Saudável",
    warning: "Alerta",
    critical: "Crítico",
  };

  return (
    <Badge variant={variantMap[status]}>
      {labelMap[status]}
    </Badge>
  );
}
