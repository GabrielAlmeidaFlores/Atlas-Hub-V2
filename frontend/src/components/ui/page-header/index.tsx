import type { ReactNode } from "react";

interface PageHeaderProps {
  readonly title: string;
  readonly description?: string;
  readonly action?: ReactNode;
  readonly breadcrumb?: ReactNode;
}

export function PageHeader({ title, description, action, breadcrumb }: PageHeaderProps): ReactNode {
  return (
    <div className="page-header">
      <div className="page-rail flex flex-wrap items-center justify-between gap-4 py-5 sm:flex-nowrap">
        <div className="min-w-0 flex-1 space-y-1">
          {breadcrumb !== undefined && <div>{breadcrumb}</div>}
          <h1 className="page-title truncate">{title}</h1>
          {description !== undefined && (
            <p className="page-subtitle hidden sm:block">{description}</p>
          )}
        </div>
        {action !== undefined && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
