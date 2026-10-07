import { type ReactNode, useEffect, useRef, useState, type ChangeEvent } from "react";
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

function isDirectPreview(location: string): boolean {
  return location.startsWith("/") || location.startsWith("blob:") || location.startsWith("data:image/");
}

function FotoThumb({
  location,
  previewSrc,
  onRemove,
  disabled,
}: {
  readonly location: string;
  readonly previewSrc?: string;
  readonly onRemove: () => void;
  readonly disabled?: boolean;
}): ReactNode {
  const [src, setSrc] = useState<string | null>(previewSrc ?? (isDirectPreview(location) ? location : null));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (previewSrc !== undefined && previewSrc.length > 0) {
      setSrc(previewSrc);
      setFailed(false);
      return;
    }
    if (isDirectPreview(location)) {
      setSrc(location);
      setFailed(false);
      return;
    }
    let cancelled = false;
    setSrc(null);
    setFailed(false);
    void api
      .post<{ url: string }>("/documentos/download-url", { location })
      .then((r) => {
        if (!cancelled) setSrc(r.url);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [location, previewSrc]);

  const showImage = src !== null && !failed;

  return (
    <div className="group relative isolate aspect-[4/3] overflow-hidden border border-border bg-muted">
      {showImage ? (
        <img
          src={src}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <ImagePlus className="h-6 w-6" />
        </div>
      )}
      <button
        type="button"
        aria-label="Remover foto"
        disabled={disabled}
        onClick={onRemove}
        className="absolute right-1.5 top-1.5 z-10 inline-flex h-7 w-7 items-center justify-center bg-navy text-white opacity-90 transition-opacity hover:opacity-100 disabled:opacity-40"
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
  const [pending, setPending] = useState<string[]>([]);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const previewsRef = useRef<Record<string, string>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const remaining = MAX_FOTOS - value.length;

  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);

  useEffect(() => {
    return () => {
      for (const src of Object.values(previewsRef.current)) URL.revokeObjectURL(src);
    };
  }, []);

  function rememberPreview(location: string, src: string): void {
    setPreviews((prev) => {
      const previous = prev[location];
      if (previous !== undefined && previous !== src) URL.revokeObjectURL(previous);
      return { ...prev, [location]: src };
    });
  }

  function forgetPreview(location: string): void {
    setPreviews((prev) => {
      const src = prev[location];
      if (src !== undefined) URL.revokeObjectURL(src);
      const next = { ...prev };
      delete next[location];
      return next;
    });
  }

  async function handleFiles(files: FileList | null): Promise<void> {
    if (files === null || files.length === 0 || remaining <= 0) return;
    setBusy(true);
    try {
      const selected = Array.from(files).slice(0, remaining);
      let next = [...value];
      for (const file of selected) {
        const localSrc = URL.createObjectURL(file);
        setPending((p) => [...p, localSrc]);
        try {
          const location = await onUpload(file);
          rememberPreview(location, localSrc);
          next = [...next, location];
          onChange(next);
        } catch {
          URL.revokeObjectURL(localSrc);
          break;
        } finally {
          setPending((p) => p.filter((src) => src !== localSrc));
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
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy || disabled || remaining <= 0}
          className={cn("btn btn-secondary btn-sm shrink-0", (busy || disabled || remaining <= 0) && "opacity-50")}
        >
          {busy ? "Enviando…" : "Adicionar fotos"}
        </button>
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept=".jpg,.jpeg,.png,image/jpeg,image/png"
          multiple
          onChange={onInputChange}
        />
      </div>
      {(value.length > 0 || pending.length > 0) && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {value.map((url, index) => (
            <FotoThumb
              key={url}
              location={url}
              previewSrc={previews[url]}
              disabled={busy || disabled}
              onRemove={() => {
                forgetPreview(url);
                onChange(value.filter((_, i) => i !== index));
              }}
            />
          ))}
          {pending.map((src) => (
            <div key={src} className="relative aspect-[4/3] overflow-hidden border border-border bg-muted">
              <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
