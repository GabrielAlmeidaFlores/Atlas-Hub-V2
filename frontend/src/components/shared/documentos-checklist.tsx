import { type ReactNode } from "react";
import type { DocumentoArquivo, DocumentoCatalogoItem } from "@/types";
import { CATEGORIA_LABELS, CATEGORIA_ORDER, documentoStatus, type DocumentoStatus } from "@/lib/documentos-catalogo";
import { openDocument } from "@/lib/documents";
import { cn } from "@/lib/utils";
import { DatePicker } from "@/components/ui/date-picker";
import { AlertTriangle, CheckCircle2, Circle, FileText, Trash2, Upload, XCircle } from "lucide-react";

interface DocumentosChecklistProps {
  readonly items: DocumentoCatalogoItem[];
  readonly valores: Record<string, DocumentoArquivo>;
  readonly onUpload: (key: string, file: File) => void | Promise<void>;
  readonly onSetEmitidoEm: (key: string, emitidoEm: string) => void | Promise<void>;
  readonly onRemove: (key: string) => void | Promise<void>;
  readonly uploadingKey?: string | null;
  readonly readOnly?: boolean;
}

function StatusBadge({ status }: { readonly status: DocumentoStatus }): ReactNode {
  if (status === "ok") {
    return <span className="inline-flex items-center gap-1 text-[11px] font-medium text-status-success"><CheckCircle2 className="h-3.5 w-3.5" /> Enviado</span>;
  }
  if (status === "vencendo") {
    return <span className="inline-flex items-center gap-1 text-[11px] font-medium text-status-warning"><AlertTriangle className="h-3.5 w-3.5" /> Vencendo</span>;
  }
  if (status === "vencido") {
    return <span className="inline-flex items-center gap-1 text-[11px] font-medium text-status-danger"><XCircle className="h-3.5 w-3.5" /> Vencido</span>;
  }
  return <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground"><Circle className="h-3.5 w-3.5" /> Pendente</span>;
}

function fileLabel(url: string): string {
  try {
    const parts = url.split("/");
    return decodeURIComponent(parts[parts.length - 1] ?? "arquivo");
  } catch {
    return "arquivo enviado";
  }
}

export function DocumentosChecklist({
  items, valores, onUpload, onSetEmitidoEm, onRemove, uploadingKey, readOnly,
}: DocumentosChecklistProps): ReactNode {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum documento exigido no momento.</p>;
  }
  const categorias = CATEGORIA_ORDER.filter((c) => items.some((i) => i.categoria === c));

  return (
    <div className="space-y-6">
      {categorias.map((cat) => (
        <div key={cat} className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{CATEGORIA_LABELS[cat]}</p>
          {items.filter((i) => i.categoria === cat).map((item) => {
            const arquivo = valores[item.key];
            const status = documentoStatus(item, arquivo);
            const busy = uploadingKey === item.key;
            const enviado = arquivo !== undefined && arquivo.url !== "";
            return (
              <div key={item.key} className="rounded-[8px] border border-border p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-foreground">
                      {item.label}
                      {item.obrigatorio ? (
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-navy">Obrigatório</span>
                      ) : item.condicional !== undefined ? (
                        <span className="text-[10px] text-muted-foreground">{item.condicional}</span>
                      ) : null}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <StatusBadge status={status} />
                      {enviado && (
                        <>
                          <button type="button" onClick={() => void openDocument(arquivo.url)} className="inline-flex max-w-[16rem] items-center gap-1 truncate text-xs text-navy hover:underline">
                            <FileText className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{fileLabel(arquivo.url)}</span>
                          </button>
                          {readOnly !== true && (
                            <button type="button" onClick={() => void onRemove(item.key)} className="inline-flex items-center gap-1 text-xs text-status-danger hover:underline">
                              <Trash2 className="h-3.5 w-3.5" /> Remover
                            </button>
                          )}
                        </>
                      )}
                    </div>
                    {item.validadeDias !== undefined && enviado && (
                      <label className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        Emitido em
                        <DatePicker
                          value={arquivo.emitidoEm ?? ""}
                          onValueChange={(value) => void onSetEmitidoEm(item.key, value)}
                          className="h-8 w-auto py-0"
                          disabled={readOnly === true}
                          ariaLabel="Emitido em"
                        />
                        <span>· válido por {String(item.validadeDias)} dias</span>
                      </label>
                    )}
                  </div>
                  {readOnly !== true && (
                    <label className={cn("btn btn-secondary btn-sm shrink-0 cursor-pointer rounded-[8px]", busy && "pointer-events-none opacity-50")}>
                      {busy ? "Enviando…" : enviado ? "Trocar" : (<><Upload className="h-3.5 w-3.5" /> Enviar</>)}
                      <input
                        type="file"
                        className="sr-only"
                        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                        disabled={busy}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file !== undefined) void onUpload(item.key, file);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
