import { useEffect, useState, type ReactNode, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { api, getApiErrorMessage } from "@/services/api";
import { uploadProjetoDocumento } from "@/lib/upload";
import { useToastStore } from "@/stores/toast";
import type { DocumentosProjeto, MembroEquipe, Projeto, StatusProjeto } from "@/types";
import { PageHeader } from "@/components/ui/page-header";
import { PageSpinner } from "@/components/ui/spinner";
import { StatusBadge } from "@/components/shared/status-badge";
import { cn } from "@/lib/utils";
import {
  ViabilidadeCalculator,
  formToViabilidade,
  viabilidadeToForm,
  VIABILIDADE_FORM_EMPTY,
  type ViabilidadeFormState,
} from "@/components/shared/viabilidade-calculator";
import { getProjetoProgressItems, ProjetoProgressBar } from "@/components/shared/projeto-progress";
import { EquipeEditor } from "@/components/shared/equipe-editor";

const EDITABLE: StatusProjeto[] = ["RASCUNHO", "AJUSTE_SOLICITADO", "REPROVADO"];

const DOC_FIELDS: { key: keyof DocumentosProjeto; label: string; required: boolean }[] = [
  { key: "matriculaUrl", label: "Matrícula do Terreno", required: true },
  { key: "alvaraUrl", label: "Alvará de Construção", required: true },
  { key: "memorialUrl", label: "Memorial Descritivo", required: true },
  { key: "plantaUrl", label: "Planta do Empreendimento", required: true },
  { key: "viabilidadeUrl", label: "Estudo de Viabilidade", required: true },
  { key: "orcamentoUrl", label: "Orçamento de Obra", required: false },
  { key: "projeto3dUrl", label: "Projeto 3D", required: false },
  { key: "contratoSpeUrl", label: "Contrato Social SPE", required: false },
];

function fileLabel(url: string): string {
  try {
    const parts = url.split("/");
    return decodeURIComponent(parts[parts.length - 1] ?? "arquivo");
  } catch {
    return "arquivo enviado";
  }
}

export default function IncorporadoraProjetoEditarPage(): ReactNode {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);
  const [projeto, setProjeto] = useState<Projeto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [documentos, setDocumentos] = useState<DocumentosProjeto>({});
  const [equipe, setEquipe] = useState<MembroEquipe[]>([]);
  const [viabilidadeForm, setViabilidadeForm] = useState<ViabilidadeFormState>(VIABILIDADE_FORM_EMPTY);
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    cidade: "",
    estado: "",
    endereco: "",
    valorTotal: "",
    valorCaptar: "",
    prazoObra: "",
    prazoRetorno: "",
    rentabilidadeEstimada: "",
    modeloRetorno: "SCP",
    planoSaida: "",
    tipoOferta: "PUBLICA",
  });

  useEffect(() => {
    if (id === undefined) return;
    void api.get<Projeto>(`/projetos/${id}`)
      .then((p) => {
        setProjeto(p);
        setDocumentos(p.documentos ?? {});
        setEquipe([...(p.equipe ?? [])]);
        setViabilidadeForm(viabilidadeToForm(p.viabilidade));
        setForm({
          nome: p.nome,
          descricao: p.descricao,
          cidade: p.cidade,
          estado: p.estado,
          endereco: p.endereco,
          valorTotal: p.valorTotal !== undefined ? String(p.valorTotal) : "",
          valorCaptar: p.valorCaptar !== undefined ? String(p.valorCaptar) : "",
          prazoObra: p.prazoObra !== undefined ? String(p.prazoObra) : "",
          prazoRetorno: p.prazoRetorno !== undefined ? String(p.prazoRetorno) : "",
          rentabilidadeEstimada: p.rentabilidadeEstimada !== undefined ? String(p.rentabilidadeEstimada) : "",
          modeloRetorno: p.modeloRetorno ?? "SCP",
          planoSaida: p.planoSaida ?? "",
          tipoOferta: p.tipoOferta ?? "PUBLICA",
        });
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  function setField(field: keyof typeof form) {
    return (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [field]: e.target.value }));
  }

  async function handleDocUpload(key: keyof DocumentosProjeto, file: File | undefined): Promise<void> {
    if (file === undefined || id === undefined) return;
    setUploadingKey(key);
    try {
      const location = await uploadProjetoDocumento(id, file);
      const next = { ...documentos, [key]: location };
      setDocumentos(next);
      await api.put(`/projetos/${id}`, { documentos: next });
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

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (id === undefined || projeto === null) return;
    const missing = DOC_FIELDS.filter((d) => d.required && (documentos[d.key] === undefined || documentos[d.key] === ""));
    if (missing.length > 0) {
      addToast({ type: "error", title: "Documentos obrigatórios", description: `Envie: ${missing.map((m) => m.label).join(", ")}` });
      return;
    }
    if (equipe.length === 0) {
      addToast({ type: "error", title: "Equipe incompleta", description: "Adicione ao menos um membro da equipe." });
      return;
    }
    setIsSaving(true);
    try {
      const viabilidade = formToViabilidade(viabilidadeForm);
      await api.put(`/projetos/${id}`, {
        nome: form.nome,
        descricao: form.descricao,
        cidade: form.cidade,
        estado: form.estado,
        endereco: form.endereco,
        valorTotal: parseFloat(form.valorTotal),
        valorCaptar: parseFloat(form.valorCaptar),
        prazoObra: parseInt(form.prazoObra, 10),
        prazoRetorno: parseInt(form.prazoRetorno, 10),
        rentabilidadeEstimada: parseFloat(form.rentabilidadeEstimada),
        modeloRetorno: form.modeloRetorno,
        planoSaida: form.planoSaida,
        tipoOferta: form.tipoOferta,
        documentos,
        equipe,
        ...(viabilidade !== null && { viabilidade }),
      });
      if (projeto.status === "RASCUNHO") {
        await api.post(`/projetos/${id}/submeter`, {});
      } else {
        await api.post(`/projetos/${id}/resubmeter`, {});
      }
      addToast({ type: "success", title: "Projeto enviado para análise" });
      navigate(`/projetos/${id}`);
    } catch (err) {
      addToast({ type: "error", title: "Erro ao salvar", description: getApiErrorMessage(err) });
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <PageSpinner />;
  if (projeto === null || id === undefined) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <p className="text-muted-foreground">Projeto não encontrado</p>
        <Link to="/dashboard" className="btn btn-secondary btn-sm">Voltar</Link>
      </div>
    );
  }

  if (!EDITABLE.includes(projeto.status)) {
    return (
      <div className="animate-in page-content space-y-4">
        <PageHeader title={projeto.nome} action={<StatusBadge status={projeto.status} size="md" />} />
        <div className="alert alert-warn">
          <p className="text-sm">Este projeto não pode ser editado no status atual.</p>
          <Link to={`/projetos/${id}`} className="btn btn-sm btn-secondary mt-3 inline-flex">Ver detalhe</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <PageHeader
        title={`Editar · ${projeto.nome}`}
        description="Atualize os dados e documentos antes de reenviar à curadoria"
        breadcrumb={
          <Link to={`/projetos/${id}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-navy">
            <ArrowLeft className="h-3 w-3" /> Voltar ao projeto
          </Link>
        }
        action={<StatusBadge status={projeto.status} size="md" />}
      />

      <form onSubmit={(e) => void handleSubmit(e)} className="page-content space-y-5">
        {projeto.status === "AJUSTE_SOLICITADO" && projeto.textoAjuste !== undefined && (
          <div className="alert alert-warn text-sm">{projeto.textoAjuste}</div>
        )}

        <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
        <div className="card p-5 sm:p-6 space-y-4">
          <h2 className="font-semibold text-foreground">Dados do projeto</h2>
          <div className="form-group">
            <label className="form-label">Nome</label>
            <input className="input-base" value={form.nome} onChange={setField("nome")} required />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="form-group">
              <label className="form-label">Cidade</label>
              <input className="input-base" value={form.cidade} onChange={setField("cidade")} required />
            </div>
            <div className="form-group">
              <label className="form-label">Estado</label>
              <input className="input-base" maxLength={2} value={form.estado} onChange={setField("estado")} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Endereço</label>
            <input className="input-base" value={form.endereco} onChange={setField("endereco")} required />
          </div>
          <div className="form-group">
            <label className="form-label">Descrição</label>
            <textarea className="input-base min-h-[100px] resize-y" rows={4} value={form.descricao} onChange={setField("descricao")} required />
          </div>
        </div>

        <div className="card p-5 sm:p-6 space-y-4">
          <h2 className="font-semibold text-foreground">Financeiro</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="form-group">
              <label className="form-label">Valor total (R$)</label>
              <input type="number" min={0} className="input-base" value={form.valorTotal} onChange={setField("valorTotal")} required />
            </div>
            <div className="form-group">
              <label className="form-label">Valor a captar (R$)</label>
              <input type="number" min={0} max={15000000} className="input-base" value={form.valorCaptar} onChange={setField("valorCaptar")} required />
            </div>
            <div className="form-group">
              <label className="form-label">Prazo de obra (meses)</label>
              <input type="number" min={1} className="input-base" value={form.prazoObra} onChange={setField("prazoObra")} required />
            </div>
            <div className="form-group">
              <label className="form-label">Prazo de retorno (meses)</label>
              <input type="number" min={1} className="input-base" value={form.prazoRetorno} onChange={setField("prazoRetorno")} required />
            </div>
            <div className="form-group">
              <label className="form-label">Rentabilidade (% a.a.)</label>
              <input type="number" min={0} step={0.1} className="input-base" value={form.rentabilidadeEstimada} onChange={setField("rentabilidadeEstimada")} required />
            </div>
            <div className="form-group">
              <label className="form-label">Modelo de retorno</label>
              <select className="input-base" value={form.modeloRetorno} onChange={setField("modeloRetorno")}>
                <option value="SCP">SCP</option>
                <option value="NOTA_COMERCIAL">Nota Comercial</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Tipo de oferta</label>
            <select className="input-base" value={form.tipoOferta} onChange={setField("tipoOferta")}>
              <option value="PUBLICA">Pública</option>
              <option value="PRIVADA">Privada</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Plano de saída</label>
            <textarea className="input-base resize-none" rows={3} value={form.planoSaida} onChange={setField("planoSaida")} required />
          </div>
          <ViabilidadeCalculator value={viabilidadeForm} onChange={setViabilidadeForm} />
        </div>

        <div className="card p-5 sm:p-6 space-y-3">
          <h2 className="font-semibold text-foreground">Equipe</h2>
          <EquipeEditor value={equipe} onChange={setEquipe} />
        </div>

        <div className="card p-5 sm:p-6 space-y-3">
          <h2 className="font-semibold text-foreground">Documentos</h2>
          <p className="text-sm text-muted-foreground">PDF, JPG ou PNG · máx. 50 MB</p>
          {DOC_FIELDS.map(({ key, label, required }) => {
            const url = documentos[key];
            const done = typeof url === "string" && url !== "";
            const busy = uploadingKey === key;
            return (
              <div key={key} className="flex items-center justify-between border border-border px-4 py-3">
                <div className="min-w-0 pr-3">
                  <p className="text-sm font-medium text-foreground">
                    {label}{required && <span className="text-status-danger"> *</span>}
                  </p>
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
                    onChange={(ev) => {
                      void handleDocUpload(key, ev.target.files?.[0]);
                      ev.target.value = "";
                    }}
                  />
                </label>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-3">
          <Link to={`/projetos/${id}`} className="btn btn-secondary">Cancelar</Link>
          <button type="submit" disabled={isSaving} className="btn btn-primary">
            {isSaving ? "Enviando…" : projeto.status === "RASCUNHO" ? "Salvar e submeter" : "Salvar e resubmeter"}
          </button>
        </div>
        </div>
        <div>
          <ProjetoProgressBar items={getProjetoProgressItems({
            ...projeto,
            descricao: form.descricao,
            valorTotal: form.valorTotal !== "" ? parseFloat(form.valorTotal) : undefined,
            valorCaptar: form.valorCaptar !== "" ? parseFloat(form.valorCaptar) : undefined,
            prazoObra: form.prazoObra !== "" ? parseInt(form.prazoObra, 10) : undefined,
            prazoRetorno: form.prazoRetorno !== "" ? parseInt(form.prazoRetorno, 10) : undefined,
            rentabilidadeEstimada: form.rentabilidadeEstimada !== "" ? parseFloat(form.rentabilidadeEstimada) : undefined,
            modeloRetorno: form.modeloRetorno as Projeto["modeloRetorno"],
            planoSaida: form.planoSaida,
            tipoOferta: form.tipoOferta as Projeto["tipoOferta"],
            documentos,
            equipe,
            viabilidade: formToViabilidade(viabilidadeForm) ?? undefined,
          })} />
        </div>
        </div>
      </form>
    </div>
  );
}
