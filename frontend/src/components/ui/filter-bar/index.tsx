import type { ReactNode } from "react";
import { X } from "lucide-react";

export interface SelectFilterField {
  type: "select";
  key: string;
  label: string;
  width?: string;
  options: { value: string; label: string }[];
  allLabel?: string;
}

export interface TextFilterField {
  type: "text";
  key: string;
  label: string;
  placeholder?: string;
  width?: string;
  mono?: boolean;
}

export interface DateFilterField {
  type: "date";
  key: string;
  label: string;
  width?: string;
}

export type FilterField = SelectFilterField | TextFilterField | DateFilterField;

export interface FilterBarProps {
  fields: FilterField[];
  values: Record<string, string | undefined>;
  title?: string;
  onChange: (key: string, value: string | null) => void;
  onClear?: () => void;
}

function hasActiveFilter(values: Record<string, string | undefined>): boolean {
  return Object.values(values).some((v) => v !== undefined && v.length > 0);
}

export function FilterBar({
  fields,
  values,
  title = "Filtros",
  onChange,
  onClear,
}: FilterBarProps): ReactNode {
  const active = hasActiveFilter(values);

  function handleClear(): void {
    if (onClear !== undefined) {
      onClear();
      return;
    }
    for (const field of fields) {
      onChange(field.key, null);
    }
  }

  return (
    <div className="filter-bar">
      <div className="filter-bar-header flex items-center justify-between">
        <span>{title}</span>
        {active && (
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex h-6 items-center gap-1 px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
            Limpar
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-3 px-4 py-3">
        {fields.map((field) => {
          if (field.type === "select") {
            const currentValue = values[field.key] ?? "all";
            return (
              <div key={field.key} className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {field.label}
                </span>
                <select
                  value={currentValue}
                  onChange={(e) => {
                    onChange(field.key, e.target.value);
                  }}
                  className={`field h-8 py-1 text-xs ${field.width ?? "min-w-[130px]"}`}
                >
                  <option value="all">{field.allLabel ?? "Todos"}</option>
                  {field.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          }

          if (field.type === "text") {
            return (
              <div key={field.key} className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {field.label}
                </span>
                <input
                  key={`${field.key}-${values[field.key] ?? ""}`}
                  className={`field h-8 text-xs ${field.width ?? "w-[200px]"} ${field.mono === true ? "font-mono" : ""}`}
                  placeholder={field.placeholder}
                  defaultValue={values[field.key] ?? ""}
                  onBlur={(e) => {
                    onChange(field.key, e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onChange(field.key, e.currentTarget.value);
                  }}
                />
              </div>
            );
          }

          return (
            <div key={field.key} className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {field.label}
              </span>
              <input
                type="date"
                className={`field h-8 text-xs ${field.width ?? "w-[140px]"}`}
                defaultValue={values[field.key] ?? ""}
                onChange={(e) => {
                  onChange(field.key, e.target.value);
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
