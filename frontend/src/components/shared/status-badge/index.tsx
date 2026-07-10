import type { StatusProjeto } from "@/types";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<StatusProjeto, { label: string; dot: string; bg: string; text: string }> = {
  RASCUNHO:          { label: "Rascunho",          dot: "bg-gray-400",     bg: "bg-gray-100",    text: "text-gray-600" },
  SUBMETIDO:         { label: "Submetido",          dot: "bg-blue-500",     bg: "bg-blue-50",     text: "text-blue-700" },
  EM_ANALISE:        { label: "Em Análise",         dot: "bg-amber-500",    bg: "bg-amber-50",    text: "text-amber-700" },
  AJUSTE_SOLICITADO: { label: "Ajuste Solicitado",  dot: "bg-orange-500",   bg: "bg-orange-50",   text: "text-orange-700" },
  REPROVADO:         { label: "Reprovado",          dot: "bg-red-500",      bg: "bg-red-50",      text: "text-red-700" },
  APROVADO:          { label: "Aprovado",           dot: "bg-green-500",    bg: "bg-green-50",    text: "text-green-700" },
  OFERTA_CRIADA:     { label: "Oferta Publicada",   dot: "bg-emerald-500",  bg: "bg-emerald-50",  text: "text-emerald-700" },
};

interface StatusBadgeProps {
  readonly status: StatusProjeto;
  readonly size?: "sm" | "md";
  readonly showDot?: boolean;
}

export function StatusBadge({ status, size = "sm", showDot = true }: StatusBadgeProps): React.ReactNode {
  const c = STATUS_CONFIG[status];
  return (
    <span className={cn(
      "badge",
      c.bg,
      c.text,
      size === "md" && "px-3 py-1 text-sm",
    )}>
      {showDot && <span className={cn("badge-dot", c.dot)} />}
      {c.label}
    </span>
  );
}
