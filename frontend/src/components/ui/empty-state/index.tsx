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
    <div className="empty-state animate-in gap-6 px-8">
      <div className="flex h-14 w-14 items-center justify-center rounded-[8px] bg-navy-50">
        <Icon className="h-7 w-7 text-navy" />
      </div>
      <h3 className="text-sm font-semibold tracking-normal text-foreground">{title}</h3>
      {description !== undefined && (
        <p className="max-w-sm text-xs text-muted-foreground">{description}</p>
      )}
      {action !== undefined && <div>{action}</div>}
    </div>
  );
}
