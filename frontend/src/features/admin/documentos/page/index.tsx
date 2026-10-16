import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Plus, Pencil, PowerOff, Power, X } from "lucide-react";
import { api, getApiErrorMessage } from "@/services/api";
import { useToastStore } from "@/stores/toast";
import { PageHeader } from "@/components/ui/page-header";
import { PageSpinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { CATEGORIA_LABELS, CATEGORIA_ORDER, clearCatalogoCache } from "@/lib/documentos-catalogo";
import type { DocumentoCategoria, DocumentoCatalogoItem, DocumentoScope } from "@/types";

const CATEGORIAS: DocumentoCategoria[] = ["EPROJ", "SOCIO_ADMIN", "PROPRIETARIO", "IMOVEL"];
const SCOPES: DocumentoScope[] = ["EMPRESA", "PROJETO"];
const SCOPE_LABEL: Record<DocumentoScope, string> = { EMPRESA: "Cadastro da empresa", PROJETO: "Submissão do projeto" };

interface FormState {
  key: string;
  categoria: DocumentoCategoria;
  scope: DocumentoScope;
  label: string;
  obrigatorio: boolean;
  condicional: string;
  validadeDias: string;
  ordem: string;
  ativo: boolean;
}

const emptyForm: FormState = {
  key: "", categoria: "IMOVEL", scope: "PROJETO", label: "",
  obrigatorio: false, condicional: "", validadeDias: "", ordem: "", ativo: true,
};

export default function AdminDocumentosPage(): ReactNode {
  const addToast = useToastStore((s) => s.addToast);
  const [items, setItems] = useState<DocumentoCatalogoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [editKey, setEditKey] = useState<string | null>(null);

  async function load(): Promise<void> {
    const data = await api.get<{ items: DocumentoCatalogoItem[] }>("/admin/documentos/catalogo");
    setItems(data.items);
  }

  useEffect(() => {
    void load()
      .catch((err: unknown) => addToast({ type: "error", title: "Erro ao carregar", description: getApiErrorMessage(err) }))
      .finally(() => setIsLoading(false));
  }, []);

  function startCreate(): void {
    setEditKey(null);
    setForm({ ...emptyForm });
  }

  function startEdit(item: DocumentoCatalogoItem): void {
    setEditKey(item.key);
    setForm({
      key: item.key,
      categoria: item.categoria,
      scope: item.scope,
      label: item.label,
      obrigatorio: item.obrigatorio,
      condicional: item.condicional ?? "",
      validadeDias: item.validadeDias !== undefined ? String(item.validadeDias) : "",
      ordem: String(item.ordem),
      ativo: item.ativo,
    });
  }

  function cancel(): void {
    setForm(null);
    setEditKey(null);
  }

  async function save(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (form === null) return;
    setIsSaving(true);
    try {
      const base = {
        categoria: form.categoria,
        scope: form.scope,
        label: form.label.trim(),
        obrigatorio: form.obrigatorio,
        ordem: form.ordem.trim() === "" ? 0 : Number(form.ordem),
        ativo: form.ativo,
      };
      const condicional = form.condicional.trim();
      const validade = form.validadeDias.trim();
      if (editKey === null) {
        await api.post("/admin/documentos/catalogo", {
          key: form.key.trim(),
          ...base,
          ...(condicional !== "" ? { condicional } : {}),
          ...(validade !== "" ? { validadeDias: Number(validade) } : {}),
        });
        addToast({ type: "success", title: "Item criado" });
      } else {
        await api.put(`/admin/documentos/catalogo/${encodeURIComponent(editKey)}`, {
          ...base,
          condicional: condicional === "" ? null : condicional,
          validadeDias: validade === "" ? null : Number(validade),
        });
        addToast({ type: "success", title: "Item atualizado" });
      }
      clearCatalogoCache();
      await load();
      cancel();
    } catch (err) {
      addToast({ type: "error", title: "Erro ao salvar", description: getApiErrorMessage(err) });
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleAtivo(item: DocumentoCatalogoItem): Promise<void> {
    try {
      if (item.ativo) {
        await api.delete(`/admin/documentos/catalogo/${encodeURIComponent(item.key)}`);
      } else {
        await api.put(`/admin/documentos/catalogo/${encodeURIComponent(item.key)}`, { ativo: true });
      }
      clearCatalogoCache();
      await load();
      addToast({ type: "success", title: item.ativo ? "Item desativado" : "Item reativado" });
    } catch (err) {
      addToast({ type: "error", title: "Erro", description: getApiErrorMessage(err) });
    }
  }

  if (isLoading) return <PageSpinner />;

  return (
    <div className="animate-in">
      <PageHeader
        title="Documentos"
        description="Catálogo de documentos exigidos no cadastro da empresa e na submissão de projetos"
        action={
          <button type="button" className="btn btn-primary btn-sm rounded-[8px]" onClick={startCreate}>
            <Plus className="h-4 w-4" /> Novo item
          </button>
        }
      />

      <div className="page-content space-y-6">
        {form !== null && (
          <div className="card p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">{editKey === null ? "Novo item" : `Editar · ${editKey}`}</h3>
              <button type="button" className="btn btn-outline btn-sm" onClick={cancel}><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={(e) => void save(e)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="form-group mb-0">
                  <span className="form-label">Chave</span>
                  <input
                    className="input-base font-mono text-xs"
                    value={form.key}
                    disabled={editKey !== null}
                    placeholder="ex: empresa.contratoSocial"
                    onChange={(e) => setForm((p) => (p === null ? p : { ...p, key: e.target.value }))}
                    required
                  />
                </label>
                <label className="form-group mb-0">
                  <span className="form-label">Rótulo</span>
                  <input
                    className="input-base"
                    value={form.label}
                    onChange={(e) => setForm((p) => (p === null ? p : { ...p, label: e.target.value }))}
                    required
                  />
                </label>
                <label className="form-group mb-0">
                  <span className="form-label">Escopo</span>
                  <select className="input-base" value={form.scope} onChange={(e) => setForm((p) => (p === null ? p : { ...p, scope: e.target.value as DocumentoScope }))}>
                    {SCOPES.map((s) => <option key={s} value={s}>{SCOPE_LABEL[s]}</option>)}
                  </select>
                </label>
                <label className="form-group mb-0">
                  <span className="form-label">Categoria</span>
                  <select className="input-base" value={form.categoria} onChange={(e) => setForm((p) => (p === null ? p : { ...p, categoria: e.target.value as DocumentoCategoria }))}>
                    {CATEGORIAS.map((c) => <option key={c} value={c}>{CATEGORIA_LABELS[c]}</option>)}
                  </select>
                </label>
                <label className="form-group mb-0">
                  <span className="form-label">Ordem</span>
                  <input type="number" min={0} className="input-base" value={form.ordem} onChange={(e) => setForm((p) => (p === null ? p : { ...p, ordem: e.target.value }))} />
                </label>
                <label className="form-group mb-0">
                  <span className="form-label">Validade (dias)</span>
                  <input type="number" min={1} className="input-base" placeholder="vazio = sem validade" value={form.validadeDias} onChange={(e) => setForm((p) => (p === null ? p : { ...p, validadeDias: e.target.value }))} />
                </label>
                <label className="form-group mb-0 sm:col-span-2">
                  <span className="form-label">Condicional (quando não for obrigatório)</span>
                  <input className="input-base" placeholder="ex: Se já houver" value={form.condicional} onChange={(e) => setForm((p) => (p === null ? p : { ...p, condicional: e.target.value }))} />
                </label>
              </div>
              <div className="flex flex-wrap items-center gap-5">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                  <input type="checkbox" checked={form.obrigatorio} onChange={(e) => setForm((p) => (p === null ? p : { ...p, obrigatorio: e.target.checked }))} />
                  Obrigatório
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                  <input type="checkbox" checked={form.ativo} onChange={(e) => setForm((p) => (p === null ? p : { ...p, ativo: e.target.checked }))} />
                  Ativo
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" className="btn btn-secondary btn-sm" onClick={cancel}>Cancelar</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={isSaving}>{isSaving ? "Salvando…" : "Salvar"}</button>
              </div>
            </form>
          </div>
        )}

        {SCOPES.map((scope) => {
          const scopeItems = items.filter((i) => i.scope === scope);
          if (scopeItems.length === 0) return null;
          return (
            <div key={scope} className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">{SCOPE_LABEL[scope]}</h3>
              {CATEGORIA_ORDER.filter((c) => scopeItems.some((i) => i.categoria === c)).map((cat) => (
                <div key={cat} className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{CATEGORIA_LABELS[cat]}</p>
                  {scopeItems.filter((i) => i.categoria === cat).map((item) => (
                    <div key={item.key} className={cn("flex items-start justify-between gap-3 rounded-[8px] border border-border p-3.5", !item.ativo && "opacity-60")}>
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-foreground">
                          {item.label}
                          {item.obrigatorio
                            ? <span className="text-[10px] font-semibold uppercase tracking-wide text-navy">Obrigatório</span>
                            : item.condicional !== undefined && <span className="text-[10px] text-muted-foreground">{item.condicional}</span>}
                          {item.validadeDias !== undefined && <span className="text-[10px] text-muted-foreground">· {String(item.validadeDias)} dias</span>}
                          {!item.ativo && <span className="text-[10px] font-semibold uppercase tracking-wide text-status-danger">Inativo</span>}
                        </p>
                        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{item.key} · ordem {String(item.ordem)}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => startEdit(item)}><Pencil className="h-3.5 w-3.5" /> Editar</button>
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => void toggleAtivo(item)}>
                          {item.ativo ? <><PowerOff className="h-3.5 w-3.5" /> Desativar</> : <><Power className="h-3.5 w-3.5" /> Reativar</>}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
