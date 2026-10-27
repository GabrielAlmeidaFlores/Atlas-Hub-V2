import { useEffect, useRef, useState, type ReactNode } from "react";
import { Search, X } from "lucide-react";
import { boardsApi } from "@/services/boards";
import { getApiErrorMessage } from "@/services/api";
import { useToastStore } from "@/stores/toast";
import type { BoardLabel, BoardLabelColor } from "@/types";
import { cn } from "@/lib/utils";
import { LABEL_COLOR_CLASSES, LABEL_COLOR_LABELS } from "../labels";

interface LabelPickerProps {
  readonly boardId?: string;
  readonly labels: readonly BoardLabel[];
  readonly selectedIds: readonly string[];
  readonly onChange: (ids: readonly string[]) => void;
  readonly onCreated?: () => Promise<void>;
  readonly onCreateLabel?: (input: { readonly name: string; readonly color: BoardLabelColor }) => Promise<BoardLabel>;
  readonly disabled?: boolean;
  readonly placeholder?: string;
  readonly emptyPlaceholder?: string;
  readonly className?: string;
  readonly inputId?: string;
  readonly ariaLabel?: string;
}

const COLOR_OPTIONS: readonly BoardLabelColor[] = [
  "green",
  "yellow",
  "orange",
  "red",
  "purple",
  "blue",
  "sky",
  "lime",
  "pink",
  "gray",
];

function sameName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function LabelPicker({
  boardId,
  labels,
  selectedIds,
  onChange,
  onCreated,
  onCreateLabel,
  disabled = false,
  placeholder = "Adicionar label…",
  emptyPlaceholder = "Buscar ou criar label…",
  className,
  inputId,
  ariaLabel,
}: LabelPickerProps): ReactNode {
  const addToast = useToastStore((s) => s.addToast);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [color, setColor] = useState<BoardLabelColor>("blue");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdLabels, setCreatedLabels] = useState<readonly BoardLabel[]>([]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent): void {
      if (rootRef.current !== null && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  const allLabels = [
    ...labels,
    ...createdLabels.filter((created) => !labels.some((label) => label.labelId === created.labelId)),
  ];
  const selected = allLabels.filter((label) => selectedIds.includes(label.labelId));
  const filtered = allLabels
    .filter((label) => label.name.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));
  const canCreateLabel = onCreateLabel !== undefined || boardId !== undefined;
  const canCreate = canCreateLabel && query.trim().length > 0 && !allLabels.some((label) => sameName(label.name, query));

  function toggle(labelId: string): void {
    onChange(selectedIds.includes(labelId)
      ? selectedIds.filter((id) => id !== labelId)
      : [...selectedIds, labelId]);
  }

  async function createLabel(): Promise<void> {
    const name = query.trim();
    const create = onCreateLabel ?? (boardId !== undefined
      ? (input: { readonly name: string; readonly color: BoardLabelColor }) => boardsApi.createLabel(boardId, input)
      : undefined);
    if (name.length === 0 || isCreating || create === undefined) return;
    setIsCreating(true);
    setError(null);
    try {
      const response = await create({ name, color });
      setCreatedLabels((prev) => [...prev, response]);
      if (onCreated !== undefined) await onCreated();
      onChange([...selectedIds, response.labelId]);
      setQuery("");
      setColor("blue");
      addToast({ type: "success", title: `Label “${name}” criada` });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <div
        className={cn(
          "w-full overflow-hidden border bg-card",
          "transition-colors focus-within:border-navy focus-within:shadow-[0_0_0_2px_rgb(27_43_94/0.15)]",
          disabled ? "cursor-not-allowed opacity-60" : "",
        )}
      >
        {selected.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 px-2.5 py-2">
            {selected.map((label) => (
              <span
                key={label.labelId}
                className="inline-flex items-center gap-1.5 rounded-[4px] border border-border px-2 py-0.5 text-xs font-medium text-foreground"
              >
                <span className={cn("h-2.5 w-2.5 rounded-full", LABEL_COLOR_CLASSES[label.color])} />
                {label.name}
                <button
                  type="button"
                  aria-label={`Remover label ${label.name}`}
                  onClick={() => toggle(label.labelId)}
                  disabled={disabled}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div
          className={cn(
            "flex min-h-[2.75rem] items-center gap-1.5 px-2.5 py-1.5",
            selected.length > 0 && "border-t border-border",
          )}
        >
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <input
            id={inputId}
            aria-label={ariaLabel ?? placeholder}
            className="min-w-0 flex-1 bg-transparent py-1 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            placeholder={selected.length === 0 ? emptyPlaceholder : placeholder}
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            disabled={disabled}
          />
        </div>
      </div>

      {open && !disabled && (
        <div className="mt-1 overflow-hidden rounded-[6px] border border-border bg-card shadow-[0_10px_30px_rgb(15_23_42/0.16)]">
          <div className="max-h-52 overflow-y-auto p-1">
            {filtered.length === 0 && query.trim().length === 0 && (
              <p className="px-2.5 py-3 text-xs text-muted-foreground">Nenhuma label criada ainda.</p>
            )}
            {filtered.map((label) => {
              const isSelected = selectedIds.includes(label.labelId);
              return (
                <button
                  key={label.labelId}
                  type="button"
                  onClick={() => toggle(label.labelId)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-[4px] px-2.5 py-2 text-left text-sm",
                    isSelected ? "bg-navy-50 text-navy" : "text-foreground hover:bg-muted",
                  )}
                >
                  <span className={cn("h-3 w-3 shrink-0 rounded-full", LABEL_COLOR_CLASSES[label.color])} />
                  <span className="min-w-0 flex-1 truncate">{label.name}</span>
                  {isSelected && <span className="text-xs font-medium">selecionada</span>}
                </button>
              );
            })}
            {filtered.length === 0 && query.trim().length > 0 && !canCreate && (
              <p className="px-2.5 py-3 text-xs text-muted-foreground">Label já selecionada.</p>
            )}
          </div>
          {canCreate && (
            <div className="border-t border-border p-2.5">
              <p className="mb-2 text-xs text-muted-foreground">Criar label “{query.trim()}”</p>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {COLOR_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-label={`Cor ${LABEL_COLOR_LABELS[option]}`}
                    title={LABEL_COLOR_LABELS[option]}
                    onClick={() => setColor(option)}
                    className={cn(
                      "h-5 w-5 rounded-full transition-transform",
                      LABEL_COLOR_CLASSES[option],
                      color === option ? "ring-2 ring-navy ring-offset-1" : "hover:scale-110",
                    )}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => void createLabel()}
                disabled={isCreating}
                className="btn btn-primary btn-sm w-full"
              >
                {isCreating ? "Criando…" : "Criar e selecionar"}
              </button>
            </div>
          )}
          {error !== null && <p className="border-t border-border px-2.5 py-2 text-xs text-status-danger">{error}</p>}
        </div>
      )}
    </div>
  );
}
