import type { StatusProjeto } from "@/types";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<StatusProjeto, { label: string; className: string }> = {
  RASCUNHO: { label: "Rascunho", className: "badge-rascunho" },
  SUBMETIDO: { label: "Submetido", className: "badge-submetido" },
  EM_ANALISE: { label: "Em Análise", className: "badge-analise" },
  AJUSTE_SOLICITADO: { label: "Ajuste Solicitado", className: "badge-ajuste" },
  REPROVADO: { label: "Reprovado", className: "badge-reprovado" },
  APROVADO: { label: "Aprovado", className: "badge-aprovado" },
  OFERTA_CRIADA: { label: "Oferta Publicada", className: "badge-publicada" },
};

interface StatusBadgeProps {
  readonly status: StatusProjeto;
  readonly size?: "sm" | "md";
  readonly showDot?: boolean;
}

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps): React.ReactNode {
  const c = STATUS_CONFIG[status];
  return (
    <span className={cn("badge border", c.className, size === "md" && "px-3 py-1 text-xs")}>
      {c.label}
    </span>
  );
}
