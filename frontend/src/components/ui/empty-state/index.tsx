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
    <div className="empty-state animate-in px-6">
      <div className="mb-4 flex h-10 w-10 items-center justify-center bg-navy-50">
        <Icon className="h-5 w-5 text-navy" />
      </div>
      <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">{title}</h3>
      {description !== undefined && (
        <p className="mt-2 max-w-sm text-xs text-muted-foreground">{description}</p>
      )}
      {action !== undefined && <div className="mt-5">{action}</div>}
    </div>
  );
}
