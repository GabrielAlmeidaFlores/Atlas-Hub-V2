import { useRef, useState, type ChangeEvent, type DragEvent, type ReactNode } from "react";
import { FileText, Loader2, Upload, X } from "lucide-react";
import { api, getApiErrorMessage } from "@/services/api";
import { uploadBoardFile } from "@/lib/upload";
import type { BoardFieldValue, BoardFile } from "@/types";
import { cn } from "@/lib/utils";

interface FileFieldProps {
  readonly boardId: string;
  readonly value: BoardFieldValue | undefined;
  readonly multiple: boolean;
  readonly onChange: (value: BoardFieldValue) => void;
  readonly invalid?: boolean;
  readonly disabled?: boolean;
}

const MAX_BYTES = 25 * 1024 * 1024;

function isBoardFile(value: unknown): value is BoardFile {
  return value !== null
    && typeof value === "object"
    && !Array.isArray(value)
    && typeof (value as BoardFile).key === "string"
    && typeof (value as BoardFile).name === "string"
    && typeof (value as BoardFile).size === "number"
    && typeof (value as BoardFile).contentType === "string";
}

function filesOf(value: BoardFieldValue | undefined, multiple: boolean): BoardFile[] {
  if (multiple) return Array.isArray(value) ? value.filter(isBoardFile) : [];
  return isBoardFile(value) ? [value] : [];
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${String(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileField({
  boardId,
  value,
  multiple,
  onChange,
  invalid = false,
  disabled = false,
}: FileFieldProps): ReactNode {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const files = filesOf(value, multiple);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File): Promise<BoardFile> {
    if (file.size > MAX_BYTES) throw new Error(`${file.name} excede o limite de 25 MB`);
    return uploadBoardFile(boardId, file);
  }

  async function uploadFiles(selected: readonly File[]): Promise<void> {
    if (selected.length === 0 || disabled) return;
    const limit = multiple ? 20 - files.length : 1;
    if (limit <= 0) {
      setError("Limite de 20 arquivos por campo");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const uploaded: BoardFile[] = [];
      for (const file of selected.slice(0, limit)) {
        uploaded.push(await upload(file));
      }
      if (multiple) {
        onChange([...files, ...uploaded]);
      } else {
        onChange(uploaded[0] ?? null);
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  function handleInput(event: ChangeEvent<HTMLInputElement>): void {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    void uploadFiles(selected);
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>): void {
    event.preventDefault();
    setDragActive(false);
    if (disabled || uploading) return;
    void uploadFiles(Array.from(event.dataTransfer.files));
  }

  async function download(file: BoardFile): Promise<void> {
    try {
      const response = await api.post<{ url: string }>("/admin/boards/files/download-url", { key: file.key });
      window.open(response.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  function remove(file: BoardFile): void {
    if (multiple) onChange(files.filter((item) => item.key !== file.key));
    else onChange(null);
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        className={cn(
          "flex w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-[8px] border-2 border-dashed bg-card px-4 py-5 text-center transition-colors",
          invalid ? "border-status-danger" : "border-border hover:border-navy-200 hover:bg-muted/40",
          dragActive && "border-navy bg-navy-50/50",
          (disabled || uploading) && "cursor-not-allowed opacity-50",
        )}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(event) => { event.preventDefault(); if (!disabled && !uploading) setDragActive(true); }}
        onDragOver={(event) => { event.preventDefault(); if (!disabled && !uploading) setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        disabled={disabled || uploading}
        aria-label={multiple ? "Selecionar arquivos ou arrastar" : "Selecionar arquivo ou arrastar"}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        </span>
        <span className="text-sm font-medium text-foreground">
          {uploading ? "Enviando…" : multiple ? "Arraste arquivos ou clique para selecionar" : "Arraste um arquivo ou clique para selecionar"}
        </span>
        <span className="text-[11px] text-muted-foreground">Até 25 MB por arquivo</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        className="hidden"
        disabled={disabled || uploading}
        onChange={handleInput}
      />
      {files.length > 0 && (
        <ul className="space-y-1">
          {files.map((file) => (
            <li key={file.key} className="flex items-center gap-2 rounded-[4px] border border-border bg-muted/30 px-2 py-1.5 text-xs">
              <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <button type="button" className="min-w-0 flex-1 truncate text-left hover:underline" onClick={() => void download(file)}>
                {file.name}
              </button>
              <span className="shrink-0 text-[10px] text-muted-foreground">{formatBytes(file.size)}</span>
              {!disabled && (
                <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => remove(file)} aria-label={`Remover ${file.name}`}>
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {error !== null && <p className="text-xs text-status-danger">{error}</p>}
    </div>
  );
}
