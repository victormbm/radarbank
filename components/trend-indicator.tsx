import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendIndicatorProps {
  value: number | null | undefined;
  inverse?: boolean; // Para métricas onde menor é melhor (ex: NPL)
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function TrendIndicator({ 
  value, 
  inverse = false, 
  showValue = true,
  size = 'sm'
}: TrendIndicatorProps) {
  if (value === null || value === undefined) {
    return null;
  }

  const isPositive = inverse ? value < 0 : value > 0;
  const isNegative = inverse ? value > 0 : value < 0;
  const isNeutral = value === 0;

  const iconSize = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }[size];

  const textSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }[size];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium",
        textSize,
        isPositive && "text-green-600",
        isNegative && "text-red-600",
        isNeutral && "text-gray-500"
      )}
    >
      {isPositive && <ArrowUp className={iconSize} />}
      {isNegative && <ArrowDown className={iconSize} />}
      {isNeutral && <Minus className={iconSize} />}
      {showValue && (
        <span>
          {value > 0 ? '+' : ''}{value.toFixed(1)}
        </span>
      )}
    </span>
  );
}
