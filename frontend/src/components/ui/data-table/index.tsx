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
    <div
      className={cn(
        "overflow-hidden border border-border bg-card",
        "rounded-[8px] shadow-[0_1px_2px_rgb(15_23_42/0.04),0_6px_16px_rgb(15_23_42/0.05)]",
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm [&_tbody_tr]:border-b [&_tbody_tr]:border-border [&_tbody_tr]:transition-colors [&_tbody_tr]:last:border-0 [&_tbody_tr:hover]:bg-muted/60" style={{ minWidth }}>
          <thead>
            <tr className="border-b border-border bg-muted/70">
              {columns.map((col, i) => (
                <th
                  key={`${col.label}-${String(i)}`}
                  className={cn(
                    "px-5 py-3.5 text-[11px] font-semibold tracking-normal text-muted-foreground",
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
                <td colSpan={columns.length} className="px-5 py-10 text-center text-xs text-muted-foreground">
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
          <div className="border-t border-border px-5 py-2.5">
            <span className="text-[10px] text-muted-foreground">
              {total} {total === 1 ? "registro" : "registros"}
            </span>
          </div>
        )
      )}
    </div>
  );
}
