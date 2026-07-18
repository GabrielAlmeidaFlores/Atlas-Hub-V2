import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Accent = "navy" | "success" | "warning" | "danger" | "info" | "neutral";

interface StatCardProps {
  readonly label: string;
  readonly value: string | number;
  readonly icon?: LucideIcon;
  readonly iconBg?: string;
  readonly iconColor?: string;
  readonly accent?: Accent;
  readonly trend?: { value: number; label: string };
  readonly sublabel?: string;
  readonly className?: string;
}

const ACCENT: Record<Accent, string> = {
  navy: "border-l-navy",
  success: "border-l-status-success",
  warning: "border-l-status-warning",
  danger: "border-l-status-danger",
  info: "border-l-status-info",
  neutral: "border-l-border",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = "neutral",
  sublabel,
  className,
}: StatCardProps): ReactNode {
  return (
    <div className={cn("flex flex-col gap-2 border border-border border-l-4 bg-card p-4", ACCENT[accent], className)}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-bold uppercase leading-tight tracking-widest text-muted-foreground">{label}</span>
        {Icon !== undefined && <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />}
      </div>
      <span className="text-2xl font-bold leading-none tracking-tight text-foreground">{value}</span>
      {sublabel !== undefined && (
        <span className="text-[11px] leading-tight text-muted-foreground">{sublabel}</span>
      )}
    </div>
  );
}
