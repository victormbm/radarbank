/**
 * Componente: Badge de Reputação
 * 
 * Exibe o score de reputação do Reclame Aqui de forma visual
 */

import { cn } from "@/lib/utils";

interface ReputationBadgeProps {
  score: number; // 0-10
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function ReputationBadge({ 
  score, 
  className, 
  showLabel = true,
  size = "md" 
}: ReputationBadgeProps) {
  
  // Determinar cor baseada no score
  const getColor = (score: number) => {
    if (score >= 8.0) return {
      bg: "bg-emerald-500",
      text: "text-emerald-700",
      border: "border-emerald-300",
      bgLight: "bg-emerald-50",
      label: "Excelente"
    };
    if (score >= 7.0) return {
      bg: "bg-green-500",
      text: "text-green-700",
      border: "border-green-300",
      bgLight: "bg-green-50",
      label: "Bom"
    };
    if (score >= 6.0) return {
      bg: "bg-yellow-500",
      text: "text-yellow-700",
      border: "border-yellow-300",
      bgLight: "bg-yellow-50",
      label: "Regular"
    };
    if (score >= 5.0) return {
      bg: "bg-orange-500",
      text: "text-orange-700",
      border: "border-orange-300",
      bgLight: "bg-orange-50",
      label: "Fraco"
    };
    return {
      bg: "bg-red-500",
      text: "text-red-700",
      border: "border-red-300",
      bgLight: "bg-red-50",
      label: "Crítico"
    };
  };

  const colors = getColor(score);
  
  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2"
  };

  return (
    <div className={cn(
      "inline-flex items-center gap-2 rounded-full border-2 font-semibold",
      colors.border,
      colors.bgLight,
      sizeClasses[size],
      className
    )}>
      <div className={cn("flex items-center gap-1.5")}>
        <div className="flex items-center gap-0.5">
          {[...Array(5)].map((_, i) => {
            const filled = score >= (i + 1) * 2;
            const half = score >= (i * 2 + 1) && score < (i + 1) * 2;
            
            return (
              <svg
                key={i}
                className={cn(
                  "w-4 h-4",
                  filled ? colors.bg.replace("bg-", "text-") : "text-gray-300"
                )}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                {half ? (
                  <defs>
                    <linearGradient id={`half-${i}`}>
                      <stop offset="50%" stopColor="currentColor" />
                      <stop offset="50%" stopColor="#d1d5db" />
                    </linearGradient>
                  </defs>
                ) : null}
                <path
                  fill={half ? `url(#half-${i})` : "currentColor"}
                  d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                />
              </svg>
            );
          })}
        </div>
        <span className={colors.text}>
          {score.toFixed(1)}
        </span>
      </div>
      {showLabel && (
        <>
          <span className="text-gray-400">•</span>
          <span className={colors.text}>{colors.label}</span>
        </>
      )}
    </div>
  );
}

interface ReputationCardProps {
  reputationScore: number; // 0-10
  resolvedRate?: number; // 0-100%
  averageRating?: number; // 0-5
  totalComplaints?: number;
  topComplaints?: string[];
  className?: string;
}

export function ReputationCard({
  reputationScore,
  resolvedRate,
  averageRating,
  totalComplaints,
  topComplaints,
  className
}: ReputationCardProps) {
  return (
    <div className={cn(
      "rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6",
      className
    )}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">
          Reputação (Reclame Aqui)
        </h3>
        <div className="text-2xl">⭐</div>
      </div>

      {/* Score Principal */}
      <div className="mb-6">
        <ReputationBadge score={reputationScore} size="lg" />
      </div>

      {/* Métricas Detalhadas */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {resolvedRate !== undefined && (
          <div>
            <p className="text-xs text-slate-600 mb-1">Taxa de Resolução</p>
            <p className="text-2xl font-bold text-emerald-700">
              {resolvedRate.toFixed(1)}%
            </p>
          </div>
        )}
        
        {averageRating !== undefined && (
          <div>
            <p className="text-xs text-slate-600 mb-1">Avaliação Média</p>
            <p className="text-2xl font-bold text-emerald-700">
              {averageRating.toFixed(1)}/5
            </p>
          </div>
        )}

        {totalComplaints !== undefined && (
          <div className="col-span-2">
            <p className="text-xs text-slate-600 mb-1">Total de Reclamações</p>
            <p className="text-xl font-semibold text-slate-700">
              {totalComplaints.toLocaleString('pt-BR')}
            </p>
          </div>
        )}
      </div>

      {/* Top Reclamações */}
      {topComplaints && topComplaints.length > 0 && (
        <div>
          <p className="text-xs text-slate-600 mb-2 font-medium">
            Principais Reclamações:
          </p>
          <div className="flex flex-wrap gap-2">
            {topComplaints.slice(0, 3).map((complaint, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200"
              >
                {index + 1}. {complaint}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Badge Exclusivo */}
      <div className="mt-6 pt-4 border-t border-emerald-200">
        <div className="flex items-center gap-2 text-xs text-emerald-700 font-medium">
          <span className="text-base">🏆</span>
          <span>Exclusivo Banco Seguro BR</span>
        </div>
      </div>
    </div>
  );
}
