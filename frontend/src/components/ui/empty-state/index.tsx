import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  readonly icon: LucideIcon;
  readonly title: string;
  readonly description?: string;
  readonly action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps): ReactNode {
  return (
    <div className="empty-state animate-in py-12 sm:py-16">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-50">
        <Icon className="h-6 w-6 text-navy" />
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {description !== undefined && (
        <p className="mt-1.5 max-w-xs text-sm text-slate-500">{description}</p>
      )}
      {action !== undefined && <div className="mt-5">{action}</div>}
    </div>
  );
}
