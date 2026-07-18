export const BADGE_BASE =
  "inline-flex items-center gap-1.5 border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider";

export const BADGE_DEFAULT = "bg-muted text-muted-foreground border-border";
export const BADGE_SUCCESS = "badge-aprovado";
export const BADGE_WARNING = "badge-analise";
export const BADGE_DANGER = "badge-reprovado";
export const BADGE_INFO = "badge-submetido";

export const STATUS_ICON_BG = {
  muted: "bg-muted text-muted-foreground",
  info: "bg-status-info-subtle text-status-info",
  warning: "bg-status-warning-subtle text-status-warning",
  danger: "bg-status-danger-subtle text-status-danger",
  success: "bg-status-success-subtle text-status-success",
  navy: "bg-navy-50 text-navy",
} as const;
