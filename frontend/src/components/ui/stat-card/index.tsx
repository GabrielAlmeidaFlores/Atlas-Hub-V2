import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  readonly label: string;
  readonly value: string | number;
  readonly icon: LucideIcon;
  readonly iconBg?: string;
  readonly iconColor?: string;
  readonly trend?: { value: number; label: string };
  readonly sublabel?: string;
}

export function StatCard({
  label, value, icon: Icon,
  iconBg = "bg-navy-50", iconColor = "text-navy",
  sublabel,
}: StatCardProps): ReactNode {
  return (
    <div className="stat-card animate-in">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-slate-500 sm:text-sm">{label}</p>
          <p className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:mt-1.5 sm:text-2xl">{value}</p>
          {sublabel !== undefined && (
            <p className="mt-0.5 truncate text-xs text-slate-400">{sublabel}</p>
          )}
        </div>
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10", iconBg)}>
          <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5", iconColor)} />
        </div>
      </div>
    </div>
  );
}
