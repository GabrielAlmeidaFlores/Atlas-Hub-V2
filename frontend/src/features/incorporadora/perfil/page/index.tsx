import { useEffect, useState, type ReactNode, type FormEvent } from "react";
import { api } from "@/services/api";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import type { Incorporadora } from "@/types";
import { getApiErrorMessage } from "@/services/api";
import { PageHeader } from "@/components/ui/page-header";
import { PageSpinner } from "@/components/ui/spinner";
import { Building2, Globe, FileText, Phone, User, Mail } from "lucide-react";

export default function IncorporadoraPerfilPage(): ReactNode {
  const user = useAuthStore((s) => s.user);
  const addToast = useToastStore((s) => s.addToast);
  const [perfil, setPerfil] = useState<Incorporadora | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ endereco: "", site: "", descricao: "", historicoAnterior: "" });

  useEffect(() => {
    void api.get<Incorporadora>("/incorporadora/perfil")
      .then((d) => { setPerfil(d); setForm({ endereco: d.endereco ?? "", site: d.site ?? "", descricao: d.descricao ?? "", historicoAnterior: d.historicoAnterior ?? "" }); })
      .finally(() => setIsLoading(false));
  }, []);

  async function handleSave(e: FormEvent): Promise<void> {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.put("/incorporadora/perfil", form);
      addToast({ type: "success", title: "Perfil atualizado com sucesso!" });
    } catch (err) {
      addToast({ type: "error", title: "Erro ao salvar", description: getApiErrorMessage(err) });
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <PageSpinner />;

  return (
    <div className="animate-in">
      <PageHeader title="Perfil da Empresa" description="Informações sobre a sua incorporadora" />

      <div className="page-content">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-5">
            {/* Dados cadastrais (readonly) */}
            <div className="card p-5 sm:p-6">
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-50">
                  <Building2 className="h-4 w-4 text-navy" />
                </div>
                <div>
                  <h2 className="font-semibold text-[#111827]">Dados Cadastrais</h2>
                  <p className="text-xs text-[#9CA3AF]">Não editáveis — entre em contato para alterar</p>
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
                  <div key={label} className="flex items-start gap-2.5 rounded-lg bg-[#F9FAFB] px-3 py-2.5">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#9CA3AF]" />
                    <div>
                      <p className="text-xs text-[#9CA3AF]">{label}</p>
                      <p className="font-medium text-[#374151]">{value ?? "—"}</p>
                    </div>
                  </div>
                ))}
              </dl>
            </div>

            {/* Complementar (editável) */}
            <div className="card p-5 sm:p-6">
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-50">
                  <Globe className="h-4 w-4 text-gold" />
                </div>
                <div>
                  <h2 className="font-semibold text-[#111827]">Informações Complementares</h2>
                  <p className="text-xs text-[#9CA3AF]">Visíveis para os analistas durante a curadoria</p>
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
                    <Globe className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
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
                    {isSaving ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Salvando...</> : "Salvar alterações"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <div className="card p-5">
              <h3 className="mb-3 text-sm font-semibold text-[#111827]">Documentos da Empresa</h3>
              <div className="space-y-2">
                {[
                  { label: "Contrato Social", hint: "PDF" },
                  { label: "Comprovante CNPJ", hint: "PDF ou imagem" },
                ].map(({ label, hint }) => (
                  <div key={label} className="flex items-center justify-between rounded-lg border border-dashed border-[#D1D5DB] px-3 py-2.5 text-sm">
                    <div>
                      <p className="font-medium text-[#374151]">{label}</p>
                      <p className="text-xs text-[#9CA3AF]">{hint}</p>
                    </div>
                    <label className="btn btn-secondary btn-sm cursor-pointer">
                      <input type="file" className="sr-only" accept=".pdf,.jpg,.png" />
                      Upload
                    </label>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-[#9CA3AF]">Recomendado antes de submeter o primeiro projeto</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
