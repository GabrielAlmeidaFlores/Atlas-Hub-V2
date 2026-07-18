import type { ReactNode } from "react";

interface PageHeaderProps {
  readonly title: string;
  readonly description?: string;
  readonly action?: ReactNode;
  readonly breadcrumb?: ReactNode;
}

export function PageHeader({ title, description, action, breadcrumb }: PageHeaderProps): ReactNode {
  return (
    <div className="sticky top-0 z-10 border-b border-border bg-card">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:flex-nowrap sm:px-6 lg:px-8">
        <div className="min-w-0 flex-1">
          {breadcrumb !== undefined && <div className="mb-0.5">{breadcrumb}</div>}
          <h1 className="page-title truncate">{title}</h1>
          {description !== undefined && (
            <p className="page-subtitle mt-0.5 hidden sm:block">{description}</p>
          )}
        </div>
        {action !== undefined && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
