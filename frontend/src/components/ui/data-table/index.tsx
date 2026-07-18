import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DataTableColumn {
  label: string;
  align?: "left" | "center" | "right";
  className?: string;
}

interface DataTableProps {
  columns: DataTableColumn[];
  children: ReactNode;
  total?: number;
  emptyMessage?: string;
  pagination?: ReactNode;
  minWidth?: number;
  className?: string;
}

function alignClass(align: "left" | "center" | "right" | undefined): string {
  if (align === "center") return "text-center";
  if (align === "right") return "text-right";
  return "text-left";
}

export function DataTable({
  columns,
  children,
  total,
  emptyMessage = "Nenhum registro.",
  pagination,
  minWidth = 600,
  className,
}: DataTableProps): ReactNode {
  return (
    <div className={cn("border border-border bg-card", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm [&_tbody_tr]:border-b [&_tbody_tr]:border-border [&_tbody_tr]:transition-colors [&_tbody_tr]:last:border-0 [&_tbody_tr:hover]:bg-muted" style={{ minWidth }}>
          <thead>
            <tr className="border-b border-border bg-muted">
              {columns.map((col, i) => (
                <th
                  key={`${col.label}-${String(i)}`}
                  className={cn(
                    "px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground",
                    alignClass(col.align),
                    col.className,
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {total === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-xs text-muted-foreground">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              children
            )}
          </tbody>
        </table>
      </div>
      {pagination !== undefined ? (
        pagination
      ) : (
        total !== undefined && (
          <div className="border-t border-border px-4 py-2">
            <span className="text-[10px] text-muted-foreground">
              {total} {total === 1 ? "registro" : "registros"}
            </span>
          </div>
        )
      )}
    </div>
  );
}
