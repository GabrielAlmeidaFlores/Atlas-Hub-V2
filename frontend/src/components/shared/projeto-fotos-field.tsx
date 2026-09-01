import { type ReactNode, useEffect, useState, type ChangeEvent } from "react";
import { ImagePlus, X } from "lucide-react";
import { api } from "@/services/api";
import { cn } from "@/lib/utils";

const MAX_FOTOS = 10;

interface ProjetoFotosFieldProps {
  readonly value: readonly string[];
  readonly onChange: (urls: string[]) => void;
  readonly onUpload: (file: File) => Promise<string>;
  readonly disabled?: boolean;
}

function FotoThumb({
  location,
  onRemove,
  disabled,
}: {
  readonly location: string;
  readonly onRemove: () => void;
  readonly disabled?: boolean;
}): ReactNode {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (location.startsWith("/") || location.startsWith("blob:")) {
      setSrc(location);
      return;
    }
    void api
      .post<{ url: string }>("/documentos/download-url", { location })
      .then((r) => {
        if (!cancelled) setSrc(r.url);
      })
      .catch(() => {
        if (!cancelled) setSrc(null);
      });
    return () => {
      cancelled = true;
    };
  }, [location]);

  return (
    <div className="group relative aspect-[4/3] overflow-hidden border border-border bg-muted">
      {src !== null ? (
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          <ImagePlus className="h-5 w-5" />
        </div>
      )}
      <button
        type="button"
        aria-label="Remover foto"
        disabled={disabled}
        onClick={onRemove}
        className="absolute right-1.5 top-1.5 inline-flex h-7 w-7 items-center justify-center bg-navy text-white opacity-90 transition-opacity hover:opacity-100 disabled:opacity-40"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function ProjetoFotosField({
  value,
  onChange,
  onUpload,
  disabled = false,
}: ProjetoFotosFieldProps): ReactNode {
  const [busy, setBusy] = useState(false);
  const remaining = MAX_FOTOS - value.length;

  async function handleFiles(files: FileList | null): Promise<void> {
    if (files === null || files.length === 0 || remaining <= 0) return;
    setBusy(true);
    try {
      const selected = Array.from(files).slice(0, remaining);
      let next = [...value];
      for (const file of selected) {
        try {
          const location = await onUpload(file);
          next = [...next, location];
          onChange(next);
        } catch {
          break;
        }
      }
    } finally {
      setBusy(false);
    }
  }

  function onInputChange(e: ChangeEvent<HTMLInputElement>): void {
    const input = e.target;
    void handleFiles(input.files).finally(() => {
      input.value = "";
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="form-label mb-0">Fotos do empreendimento</p>
          <p className="form-hint">
            JPG ou PNG · máx. 10 MB · até {String(MAX_FOTOS)} fotos · {String(value.length)}/{String(MAX_FOTOS)}
          </p>
        </div>
        <label
          className={cn(
            "btn btn-secondary btn-sm cursor-pointer shrink-0",
            (busy || disabled || remaining <= 0) && "pointer-events-none opacity-50",
          )}
        >
          {busy ? "Enviando…" : "Adicionar fotos"}
          <input
            type="file"
            className="sr-only"
            accept=".jpg,.jpeg,.png,image/jpeg,image/png"
            multiple
            disabled={busy || disabled || remaining <= 0}
            onChange={onInputChange}
          />
        </label>
      </div>
      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {value.map((url) => (
            <FotoThumb
              key={url}
              location={url}
              disabled={busy || disabled}
              onRemove={() => onChange(value.filter((u) => u !== url))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
