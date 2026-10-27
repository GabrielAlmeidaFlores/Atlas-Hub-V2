import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  readonly placeholder?: string;
  readonly id?: string;
  readonly className?: string;
  readonly disabled?: boolean;
  readonly required?: boolean;
  readonly ariaLabel?: string;
  readonly min?: string;
  readonly max?: string;
}

interface CalendarDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

type ViewMode = "days" | "months" | "years";

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function toIso(year: number, month: number, day: number): string {
  return `${String(year)}-${pad(month + 1)}-${pad(day)}`;
}

function parseIso(value: string): CalendarDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match === null) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) return null;
  return { year, month, day };
}

function formatDisplay(value: string): string {
  const parsed = parseIso(value);
  if (parsed === null) return value;
  return `${pad(parsed.day)}/${pad(parsed.month + 1)}/${String(parsed.year)}`;
}

function today(): CalendarDate {
  const date = new Date();
  return { year: date.getFullYear(), month: date.getMonth(), day: date.getDate() };
}

export function DatePicker({
  value,
  onValueChange,
  placeholder = "dd/mm/aaaa",
  id,
  className,
  disabled = false,
  required = false,
  ariaLabel,
  min,
  max,
}: DatePickerProps): ReactNode {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<CalendarDate>(() => parseIso(value) ?? today());
  const [mode, setMode] = useState<ViewMode>("days");
  const [placement, setPlacement] = useState<"bottom" | "top">("bottom");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const selected = parseIso(value);

  useEffect(() => {
    if (!open) return;
    setView(parseIso(value) ?? today());
    setMode("days");
    function handlePointerDown(event: MouseEvent): void {
      if (rootRef.current !== null && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    function updatePlacement(): void {
      const trigger = triggerRef.current;
      if (trigger === null) return;
      const rect = trigger.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const panelHeight = 360;
      setPlacement(spaceBelow < panelHeight && spaceAbove > spaceBelow ? "top" : "bottom");
    }
    updatePlacement();
    window.addEventListener("resize", updatePlacement);
    window.addEventListener("scroll", updatePlacement, true);
    return () => {
      window.removeEventListener("resize", updatePlacement);
      window.removeEventListener("scroll", updatePlacement, true);
    };
  }, [open]);

  const days = useMemo(() => {
    const first = new Date(view.year, view.month, 1);
    const total = new Date(view.year, view.month + 1, 0).getDate();
    const cells: (number | null)[] = Array.from({ length: first.getDay() }, () => null);
    for (let day = 1; day <= total; day += 1) cells.push(day);
    return cells;
  }, [view]);

  const decadeStart = Math.floor(view.year / 12) * 12;
  const years = Array.from({ length: 12 }, (_, index) => decadeStart + index);

  function moveMonth(direction: -1 | 1): void {
    setView((current) => {
      const date = new Date(current.year, current.month + direction, 1);
      return { year: date.getFullYear(), month: date.getMonth(), day: 1 };
    });
  }

  function moveYear(direction: -1 | 1): void {
    setView((current) => ({ ...current, year: current.year + direction }));
  }

  function moveDecade(direction: -1 | 1): void {
    setView((current) => ({ ...current, year: current.year + direction * 12 }));
  }

  function moveBackward(): void {
    if (mode === "days") moveMonth(-1);
    else if (mode === "months") moveYear(-1);
    else moveDecade(-1);
  }

  function moveForward(): void {
    if (mode === "days") moveMonth(1);
    else if (mode === "months") moveYear(1);
    else moveDecade(1);
  }

  function selectDay(day: number): void {
    onValueChange(toIso(view.year, view.month, day));
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-required={required}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "field flex w-full items-center gap-2 text-left outline-none",
          disabled && "cursor-not-allowed opacity-50",
          className,
        )}
      >
        <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className={cn("min-w-0 flex-1 truncate", value === "" && "text-muted-foreground")}>
          {value === "" ? placeholder : formatDisplay(value)}
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Calendário"
          className={cn(
            "absolute left-0 z-[120] max-h-[70vh] w-[292px] max-w-full overflow-y-auto rounded-[8px] border border-border bg-card p-3 text-foreground shadow-[0_16px_40px_rgb(15_23_42/0.18)]",
            placement === "bottom" ? "top-full mt-1" : "bottom-full mb-1",
          )}
        >
          <div className="mb-3 flex items-center justify-between gap-1">
            <button
              type="button"
              onClick={moveBackward}
              className="flex h-8 w-8 items-center justify-center rounded-[4px] text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={mode === "days" ? "Mês anterior" : mode === "months" ? "Ano anterior" : "Década anterior"}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex min-w-0 items-center justify-center gap-1">
              {mode === "days" ? (
                <>
                  <button
                    type="button"
                    onClick={() => setMode("months")}
                    className="truncate rounded-[4px] px-1.5 py-1 text-sm font-semibold capitalize hover:bg-muted"
                  >
                    {MONTHS[view.month]}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("years")}
                    className="rounded-[4px] px-1.5 py-1 text-sm font-semibold hover:bg-muted"
                  >
                    {view.year}
                  </button>
                </>
              ) : mode === "months" ? (
                <button
                  type="button"
                  onClick={() => setMode("years")}
                  className="rounded-[4px] px-1.5 py-1 text-sm font-semibold hover:bg-muted"
                >
                  {view.year}
                </button>
              ) : (
                <span className="px-1.5 py-1 text-sm font-semibold">{decadeStart}–{decadeStart + 11}</span>
              )}
            </div>
            <button
              type="button"
              onClick={moveForward}
              className="flex h-8 w-8 items-center justify-center rounded-[4px] text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={mode === "days" ? "Próximo mês" : mode === "months" ? "Próximo ano" : "Próxima década"}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {mode === "days" && (
            <>
              <div className="mb-1 grid grid-cols-7 text-center text-[10px] font-semibold text-muted-foreground">
                {WEEKDAYS.map((weekday, index) => <span key={`${weekday}-${String(index)}`} className="py-1">{weekday}</span>)}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {days.map((day, index) => {
                  if (day === null) return <span key={`empty-${String(index)}`} />;
                  const iso = toIso(view.year, view.month, day);
                  const isSelected = selected !== null && selected.year === view.year && selected.month === view.month && selected.day === day;
                  const isToday = (() => {
                    const current = today();
                    return current.year === view.year && current.month === view.month && current.day === day;
                  })();
                  const isDisabled = (min !== undefined && iso < min) || (max !== undefined && iso > max);
                  return (
                    <button
                      key={iso}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => selectDay(day)}
                      className={cn(
                        "flex h-8 items-center justify-center rounded-[4px] text-xs transition-colors",
                        isSelected
                          ? "bg-navy font-semibold text-white"
                          : "hover:bg-muted",
                        isToday && !isSelected && "border border-navy/40 font-semibold text-navy",
                        isDisabled && "cursor-not-allowed opacity-30",
                      )}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {mode === "months" && (
            <div className="grid grid-cols-3 gap-1">
              {MONTHS.map((month, index) => (
                <button
                  key={month}
                  type="button"
                  onClick={() => {
                    setView((current) => ({ ...current, month: index }));
                    setMode("days");
                  }}
                  className={cn(
                    "rounded-[4px] px-2 py-2 text-xs transition-colors",
                    index === view.month ? "bg-navy font-semibold text-white" : "hover:bg-muted",
                  )}
                >
                  {month.slice(0, 3)}
                </button>
              ))}
            </div>
          )}

          {mode === "years" && (
            <div className="grid grid-cols-3 gap-1">
              {years.map((year) => (
                <button
                  key={year}
                  type="button"
                  onClick={() => {
                    setView((current) => ({ ...current, year }));
                    setMode("months");
                  }}
                  className={cn(
                    "rounded-[4px] px-2 py-2 text-xs transition-colors",
                    year === view.year ? "bg-navy font-semibold text-white" : "hover:bg-muted",
                  )}
                >
                  {year}
                </button>
              ))}
            </div>
          )}

          <div className="mt-3 flex items-center justify-between border-t border-border pt-2">
            <button
              type="button"
              onClick={() => {
                const current = today();
                const iso = toIso(current.year, current.month, current.day);
                if ((min !== undefined && iso < min) || (max !== undefined && iso > max)) return;
                setView(current);
                setMode("days");
                onValueChange(iso);
                setOpen(false);
              }}
              className="text-xs font-medium text-navy hover:underline"
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={() => {
                onValueChange("");
                setOpen(false);
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Limpar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
