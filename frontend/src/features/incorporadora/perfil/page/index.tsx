import { useEffect, useState, type ReactNode, type FormEvent } from "react";
import { api, getApiErrorMessage } from "@/services/api";
import { uploadIncorporadoraDocumento } from "@/lib/upload";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import type { Incorporadora } from "@/types";
import { PageHeader } from "@/components/ui/page-header";
import { PageSpinner } from "@/components/ui/spinner";
import { Building2, Globe, FileText, Phone, User, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

type DocKey = "contratoSocialUrl" | "comprovanteCnpjUrl";

const EMPRESA_DOCS: { key: DocKey; label: string; hint: string }[] = [
  { key: "contratoSocialUrl", label: "Contrato Social", hint: "PDF" },
  { key: "comprovanteCnpjUrl", label: "Comprovante CNPJ", hint: "PDF ou imagem" },
];

function fileLabel(url: string): string {
  try {
    const parts = url.split("/");
    return decodeURIComponent(parts[parts.length - 1] ?? "arquivo");
  } catch {
    return "arquivo enviado";
  }
}

export default function IncorporadoraPerfilPage(): ReactNode {
  const user = useAuthStore((s) => s.user);
  const addToast = useToastStore((s) => s.addToast);
  const [perfil, setPerfil] = useState<Incorporadora | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<DocKey | null>(null);
  const [form, setForm] = useState({ endereco: "", site: "", descricao: "", historicoAnterior: "" });
  const [docs, setDocs] = useState<{ contratoSocialUrl?: string; comprovanteCnpjUrl?: string }>({});

  useEffect(() => {
    void api.get<Incorporadora>("/incorporadora/perfil")
      .then((d) => {
        setPerfil(d);
        setForm({
          endereco: d.endereco ?? "",
          site: d.site ?? "",
          descricao: d.descricao ?? "",
          historicoAnterior: d.historicoAnterior ?? "",
        });
        setDocs({
          contratoSocialUrl: d.contratoSocialUrl,
          comprovanteCnpjUrl: d.comprovanteCnpjUrl,
        });
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function handleSave(e: FormEvent): Promise<void> {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.put("/incorporadora/perfil", {
        ...form,
        ...(docs.contratoSocialUrl !== undefined && { contratoSocialUrl: docs.contratoSocialUrl }),
        ...(docs.comprovanteCnpjUrl !== undefined && { comprovanteCnpjUrl: docs.comprovanteCnpjUrl }),
      });
      addToast({ type: "success", title: "Perfil atualizado com sucesso!" });
    } catch (err) {
      addToast({ type: "error", title: "Erro ao salvar", description: getApiErrorMessage(err) });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDocUpload(key: DocKey, file: File | undefined): Promise<void> {
    if (file === undefined) return;
    setUploadingKey(key);
    try {
      const location = await uploadIncorporadoraDocumento(file);
      const next = { ...docs, [key]: location };
      setDocs(next);
      await api.put("/incorporadora/perfil", { [key]: location });
      addToast({ type: "success", title: "Documento enviado" });
    } catch (err) {
      addToast({
        type: "error",
        title: "Falha no upload",
        description: err instanceof Error ? err.message : getApiErrorMessage(err),
      });
    } finally {
      setUploadingKey(null);
    }
  }

  if (isLoading) return <PageSpinner />;

  return (
    <div className="animate-in">
      <PageHeader title="Perfil da Empresa" description="Informações sobre a sua incorporadora" />

      <div className="page-content">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-5">
            <div className="card p-5 sm:p-6">
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center bg-navy-50">
                  <Building2 className="h-4 w-4 text-navy" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">Dados Cadastrais</h2>
                  <p className="text-xs text-muted-foreground">Não editáveis — entre em contato para alterar</p>
                </div>
              </div>
              <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                {[
                  { icon: Building2, label: "Razão Social", value: perfil?.razaoSocial },
                  { icon: FileText, label: "CNPJ", value: perfil?.cnpj },
                  { icon: User, label: "Responsável", value: perfil?.nomeResponsavel },
                  { icon: FileText, label: "CPF do Responsável", value: perfil?.cpfResponsavel },
                  { icon: User, label: "Cargo", value: perfil?.cargoResponsavel },
                  { icon: Mail, label: "E-mail", value: user?.email },
                  { icon: Phone, label: "Telefone", value: perfil?.telefone },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-2.5 bg-muted px-3 py-2.5">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="font-medium text-foreground">{value ?? "—"}</p>
                    </div>
                  </div>
                ))}
              </dl>
            </div>

            <div className="card p-5 sm:p-6">
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center bg-gold-50">
                  <Globe className="h-4 w-4 text-gold" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">Informações Complementares</h2>
                  <p className="text-xs text-muted-foreground">Visíveis para os analistas durante a curadoria</p>
                </div>
              </div>

              <form onSubmit={(e) => void handleSave(e)} className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Endereço completo</label>
                  <input className="input-base" placeholder="Rua, número, bairro, cidade, estado, CEP" value={form.endereco} onChange={(e) => setForm((p) => ({ ...p, endereco: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Site da empresa</label>
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input type="url" className="input-base pl-10" placeholder="https://suaempresa.com.br" value={form.site} onChange={(e) => setForm((p) => ({ ...p, site: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Descrição da empresa</label>
                  <textarea className="input-base resize-none" rows={4} placeholder="Descreva a sua empresa, história e experiência no mercado imobiliário..." value={form.descricao} onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Histórico de projetos anteriores</label>
                  <textarea className="input-base resize-none" rows={3} placeholder="Liste projetos concluídos antes de entrar na plataforma Atlas Hub..." value={form.historicoAnterior} onChange={(e) => setForm((p) => ({ ...p, historicoAnterior: e.target.value }))} />
                </div>
                <div className="flex justify-end pt-2">
                  <button type="submit" disabled={isSaving} className="btn btn-primary">
                    {isSaving ? <><span className="h-4 w-4 animate-spin border-2 border-white/30 border-t-white" />Salvando...</> : "Salvar alterações"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div>
            <div className="card p-5">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Documentos da Empresa</h3>
              <div className="space-y-2">
                {EMPRESA_DOCS.map(({ key, label, hint }) => {
                  const url = docs[key];
                  const done = typeof url === "string" && url !== "";
                  const busy = uploadingKey === key;
                  return (
                    <div key={key} className="flex items-center justify-between border border-dashed border-input px-3 py-2.5 text-sm">
                      <div className="min-w-0 pr-2">
                        <p className="font-medium text-foreground">{label}</p>
                        <p className="text-xs text-muted-foreground">{hint}</p>
                        {done && (
                          <a href={url} target="_blank" rel="noreferrer" className="mt-1 block truncate text-xs text-navy hover:underline">
                            {fileLabel(url)}
                          </a>
                        )}
                      </div>
                      <label className={cn("btn btn-secondary btn-sm cursor-pointer shrink-0", busy && "pointer-events-none opacity-50")}>
                        {busy ? "Enviando…" : done ? "Trocar" : "Upload"}
                        <input
                          type="file"
                          className="sr-only"
                          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                          disabled={busy || isSaving}
                          onChange={(e) => {
                            void handleDocUpload(key, e.target.files?.[0]);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">PDF, JPG ou PNG · máx. 50 MB. Recomendado antes de submeter o primeiro projeto.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
