import { useState, type ReactNode, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, ChevronLeft, Check, MapPin, DollarSign, FileText, Users, Eye } from "lucide-react";
import { api, getApiErrorMessage, getApiErrorFields } from "@/services/api";
import { buscarCep, formatCep } from "@/lib/cep";
import { uploadProjetoDocumento, uploadProjetoFoto } from "@/lib/upload";
import { analytics } from "@/lib/analytics";
import { useToastStore } from "@/stores/toast";
import { PageHeader } from "@/components/ui/page-header";
import { cn, parseMoneyInput, formatCurrency } from "@/lib/utils";
import type { DocumentosProjeto, MembroEquipe } from "@/types";
import {
  ViabilidadeCalculator,
  formToViabilidade,
  VIABILIDADE_FORM_EMPTY,
  type ViabilidadeFormState,
} from "@/components/shared/viabilidade-calculator";
import { ProjetoProgressBar, type ProgressItem } from "@/components/shared/projeto-progress";
import { EquipeEditor } from "@/components/shared/equipe-editor";
import { ProjetoFotosField } from "@/components/shared/projeto-fotos-field";
import { CurrencyInput } from "@/components/shared/currency-input";

type Etapa = 1 | 2 | 3 | 4 | 5;

const ETAPAS = [
  { num: 1 as Etapa, label: "Local", icon: MapPin },
  { num: 2 as Etapa, label: "Financeiro", icon: DollarSign },
  { num: 3 as Etapa, label: "Documentos", icon: FileText },
  { num: 4 as Etapa, label: "Equipe", icon: Users },
  { num: 5 as Etapa, label: "Revisão", icon: Eye },
];

const DOC_FIELDS: { key: keyof DocumentosProjeto; label: string; hint: string }[] = [
  { key: "matriculaUrl", label: "Matrícula do Terreno", hint: "Certidão atualizada (máx 90 dias)" },
  { key: "alvaraUrl", label: "Alvará de Construção", hint: "Ou protocolo de aprovação" },
  { key: "memorialUrl", label: "Memorial Descritivo", hint: "" },
  { key: "plantaUrl", label: "Planta do Empreendimento", hint: "" },
  { key: "viabilidadeUrl", label: "Estudo de Viabilidade Financeira", hint: "Assinado por responsável técnico" },
  { key: "orcamentoUrl", label: "Planilha de Orçamento de Obra", hint: "Assinada por engenheiro" },
  { key: "projeto3dUrl", label: "Projeto 3D / Renderizações", hint: "Facilita a venda da oferta" },
  { key: "contratoSpeUrl", label: "Contrato Social da SPE", hint: "Se já constituída" },
];

interface DadosGerais {
  nome: string; modelo: string; tipoImovel: string;
  cep: string; cidade: string; estado: string; endereco: string;
  descricao: string; videoUrl: string;
}

interface DadosFinanceiros {
  valorTotal: string; valorCaptar: string; prazoObra: string;
  prazoRetorno: string; rentabilidadeEstimada: string;
}

const g0: DadosGerais = { nome: "", modelo: "VENDA", tipoImovel: "RESIDENCIAL", cep: "", cidade: "", estado: "", endereco: "", descricao: "", videoUrl: "" };
const f0: DadosFinanceiros = { valorTotal: "", valorCaptar: "", prazoObra: "", prazoRetorno: "", rentabilidadeEstimada: "" };

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }): ReactNode {
  const hasError = error !== undefined && error !== "";
  return (
    <div className={cn("form-group", hasError && "form-group-error")}>
      <label className="form-label">{label}</label>
      {children}
      {hasError ? <p className="form-error">{error}</p> : hint !== undefined && <p className="form-hint">{hint}</p>}
    </div>
  );
}

function fileLabel(url: string | undefined): string {
  if (url === undefined || url === "") return "";
  try {
    const parts = url.split("/");
    return decodeURIComponent(parts[parts.length - 1] ?? "arquivo");
  } catch {
    return "arquivo enviado";
  }
}

export default function IncorporadoraProjetoNovoPage(): ReactNode {
  const [etapa, setEtapa] = useState<Etapa>(1);
  const [gerais, setGerais] = useState<DadosGerais>(g0);
  const [financeiros, setFinanceiros] = useState<DadosFinanceiros>(f0);
  const [documentos, setDocumentos] = useState<DocumentosProjeto>({});
  const [fotosUrls, setFotosUrls] = useState<string[]>([]);
  const [equipe, setEquipe] = useState<MembroEquipe[]>([]);
  const [viabilidadeForm, setViabilidadeForm] = useState<ViabilidadeFormState>(VIABILIDADE_FORM_EMPTY);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [projetoId, setProjetoId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const addToast = useToastStore((s) => s.addToast);
  const navigate = useNavigate();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [cepErro, setCepErro] = useState<string | undefined>(undefined);

  const FIELD_STEP: Record<string, Etapa> = {
    nome: 1, modelo: 1, tipoImovel: 1, cidade: 1, estado: 1, endereco: 1, descricao: 1, videoUrl: 1,
    valorTotal: 2, valorCaptar: 2, prazoObra: 2, prazoRetorno: 2, rentabilidadeEstimada: 2,
    documentos: 3, equipe: 4,
  };

  function limparErro(field: string): void {
    setFieldErrors((prev) => {
      if (prev[field] === undefined) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function aplicarErros(err: unknown): void {
    const fields = getApiErrorFields(err);
    const keys = Object.keys(fields);
    if (keys.length === 0) return;
    setFieldErrors(fields);
    const step = FIELD_STEP[(keys[0] ?? "").split(".")[0] ?? ""];
    if (step !== undefined) setEtapa(step);
  }

  function g(field: keyof DadosGerais) {
    return (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setGerais((p) => ({ ...p, [field]: e.target.value }));
      limparErro(field);
    };
  }

  async function onCepChange(e: ChangeEvent<HTMLInputElement>): Promise<void> {
    const value = formatCep(e.target.value);
    setGerais((p) => ({ ...p, cep: value }));
    setCepErro(undefined);
    if (value.replace(/\D/g, "").length !== 8) return;
    setBuscandoCep(true);
    try {
      const r = await buscarCep(value);
      setGerais((p) => ({
        ...p,
        endereco: r.endereco.length > 0 ? r.endereco : p.endereco,
        cidade: r.cidade.length > 0 ? r.cidade : p.cidade,
        estado: r.estado.length > 0 ? r.estado : p.estado,
      }));
      limparErro("endereco");
      limparErro("cidade");
      limparErro("estado");
    } catch (err) {
      setCepErro(err instanceof Error ? err.message : "Não foi possível buscar o CEP.");
    } finally {
      setBuscandoCep(false);
    }
  }
  function fin(field: keyof DadosFinanceiros) {
    return (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setFinanceiros((p) => ({ ...p, [field]: e.target.value }));
      limparErro(field);
    };
  }

  async function salvarRascunho(): Promise<string> {
    if (projetoId !== null) return projetoId;
    const r = await api.post<{ id: string }>("/projetos", {
      nome: gerais.nome, modelo: gerais.modelo, tipoImovel: gerais.tipoImovel,
      cidade: gerais.cidade, estado: gerais.estado, endereco: gerais.endereco,
      descricao: gerais.descricao,
      ...(gerais.videoUrl !== "" && { videoUrl: gerais.videoUrl }),
    });
    analytics.track("project_created", { projectId: r.id });
    setProjetoId(r.id);
    return r.id;
  }

  async function persistDocumentos(id: string, docs: DocumentosProjeto): Promise<void> {
    await api.put(`/projetos/${id}`, { documentos: docs });
  }

  async function persistFotos(id: string, urls: string[]): Promise<void> {
    await api.put(`/projetos/${id}`, { fotosUrls: urls });
  }

  async function handleFotoUpload(file: File): Promise<string> {
    const id = await salvarRascunho();
    return uploadProjetoFoto(id, file);
  }

  async function handleFotosChange(urls: string[]): Promise<void> {
    setFotosUrls(urls);
    try {
      const id = await salvarRascunho();
      await persistFotos(id, urls);
      if (urls.length > 0) analytics.track("project_photo_uploaded", { projectId: id, count: urls.length });
    } catch (err) {
      addToast({ type: "error", title: "Falha ao salvar fotos", description: getApiErrorMessage(err) });
    }
  }

  async function handleDocUpload(key: keyof DocumentosProjeto, file: File | undefined): Promise<void> {
    if (file === undefined) return;
    setUploadingKey(key);
    try {
      const id = await salvarRascunho();
      const location = await uploadProjetoDocumento(id, file);
      const next = { ...documentos, [key]: location };
      setDocumentos(next);
      await persistDocumentos(id, next);
      analytics.track("project_doc_uploaded", { projectId: id, doc: key });
      addToast({ type: "success", title: "Documento enviado" });
    } catch (err) {
      addToast({ type: "error", title: "Falha no upload", description: getApiErrorMessage(err) });
    } finally {
      setUploadingKey(null);
    }
  }

  async function avancar(): Promise<void> {
    if (etapa === 1) {
      const erros: Record<string, string> = {};
      if (gerais.nome.trim().length < 3) erros["nome"] = "Nome deve ter ao menos 3 caracteres";
      if (gerais.cidade.trim().length < 2) erros["cidade"] = "Cidade deve ter ao menos 2 caractere(s)";
      if (gerais.estado.trim().length !== 2) erros["estado"] = "Use a sigla do estado com 2 letras";
      if (gerais.endereco.trim().length < 5) erros["endereco"] = "Endereço deve ter ao menos 5 caractere(s)";
      if (Object.keys(erros).length > 0) {
        setFieldErrors(erros);
        addToast({ type: "error", title: "Revise os campos destacados", description: "Preencha os dados do projeto para continuar." });
        return;
      }
      setIsLoading(true);
      try { await salvarRascunho(); } catch (err) { addToast({ type: "error", title: "Erro ao salvar", description: getApiErrorMessage(err) }); aplicarErros(err); return; } finally { setIsLoading(false); }
    }
    if (etapa < 5) setEtapa((p) => (p + 1) as Etapa);
  }

  async function submeter(): Promise<void> {
    if (projetoId === null) return;
    if (equipe.length === 0) {
      addToast({ type: "error", title: "Equipe incompleta", description: "Inclua pelo menos um responsável pelo projeto." });
      setEtapa(4);
      return;
    }
    const valorCaptar = parseMoneyInput(financeiros.valorCaptar);
    if (!Number.isFinite(valorCaptar) || valorCaptar > 15_000_000) {
      addToast({ type: "error", title: "Valor a captar inválido", description: "Informe um valor de até R$15M (CVM 88)." });
      setEtapa(2);
      return;
    }
    const viabilidade = formToViabilidade(viabilidadeForm);
    setIsLoading(true);
    try {
      await api.put(`/projetos/${projetoId}`, {
        valorTotal: parseMoneyInput(financeiros.valorTotal), valorCaptar: parseMoneyInput(financeiros.valorCaptar),
        prazoObra: parseInt(financeiros.prazoObra, 10), prazoRetorno: parseInt(financeiros.prazoRetorno, 10),
        rentabilidadeEstimada: parseFloat(financeiros.rentabilidadeEstimada),
        modeloRetorno: "SCP", tipoOferta: "PUBLICA",
        documentos,
        fotosUrls,
        equipe,
        ...(viabilidade !== null && { viabilidade }),
      });
      await api.post(`/projetos/${projetoId}/submeter`, {});
      analytics.track("project_submitted", { projectId: projetoId });
      addToast({ type: "success", title: "Projeto submetido!", description: "Aguarde a análise da nossa equipe." });
      navigate("/dashboard");
    } catch (err) {
      addToast({ type: "error", title: "Erro ao submeter", description: getApiErrorMessage(err) });
      aplicarErros(err);
    } finally {
      setIsLoading(false);
    }
  }

  const progress = Math.round(((etapa - 1) / 4) * 100);

  const progressItems: ProgressItem[] = [
    { id: "dados", label: "Dados gerais", done: gerais.nome.length >= 3 },
    {
      id: "financeiro",
      label: "Dados financeiros",
      done: financeiros.valorTotal !== "" && financeiros.valorCaptar !== "" && financeiros.prazoObra !== ""
        && financeiros.prazoRetorno !== "" && financeiros.rentabilidadeEstimada !== "",
    },
    { id: "viabilidade", label: "Calculadora de viabilidade", done: formToViabilidade(viabilidadeForm) !== null },
    { id: "equipe", label: "Equipe (mín. 1)", done: equipe.length >= 1 },
  ];

  return (
    <div className="animate-in">
      <PageHeader title="Novo Projeto" description="Preencha as informações para submeter à curadoria" />

      <div className="page-content">
        <div className="mb-6 card p-4">
          <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium">{ETAPAS[etapa - 1]?.label ?? ""}</span>
            <span>{String(etapa)} de 5</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${String(progress)}%` }} />
          </div>
          <div className="mt-3 hidden items-center justify-between sm:flex">
            {ETAPAS.map(({ num, label, icon: Icon }) => (
              <button key={num} type="button"
                onClick={() => { if (num < etapa) setEtapa(num); }}
                className={cn("flex items-center gap-3 text-xs font-medium transition-colors",
                  num === etapa ? "text-navy" : num < etapa ? "cursor-pointer text-status-success hover:text-status-success" : "text-muted-foreground")}>
                {num < etapa ? <Check className="h-5 w-5 shrink-0" strokeWidth={2.25} /> : <Icon className="h-5 w-5 shrink-0" strokeWidth={num === etapa ? 2.25 : 2} />}
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 card p-5 sm:p-6">
          {etapa === 1 && (
            <div className="space-y-4 animate-in">
              <h2 className="font-semibold text-foreground">Dados do Projeto</h2>
              <Field label="Nome do Projeto" error={fieldErrors.nome}><input className="input-base" placeholder="Ex: Residencial Park View" value={gerais.nome} onChange={g("nome")} required /></Field>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Modelo de Investimento" error={fieldErrors.modelo}>
                  <select className="input-base" value={gerais.modelo} onChange={g("modelo")}>
                    <option value="VENDA">Construção para Venda</option>
                    <option value="RENDA">Construção para Renda</option>
                    <option value="MISTO">Modelo Misto</option>
                  </select>
                </Field>
                <Field label="Tipo de Imóvel" error={fieldErrors.tipoImovel}>
                  <select className="input-base" value={gerais.tipoImovel} onChange={g("tipoImovel")}>
                    <option value="RESIDENCIAL">Residencial</option>
                    <option value="COMERCIAL">Comercial</option>
                    <option value="MISTO">Misto</option>
                  </select>
                </Field>
              </div>
              <Field label="CEP" hint="Preenchemos o endereço automaticamente" error={cepErro}>
                <div className="relative">
                  <input className="input-base pr-10" placeholder="00000-000" inputMode="numeric" maxLength={9} value={gerais.cep} onChange={(e) => void onCepChange(e)} />
                  {buscandoCep && <span className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-navy-200 border-t-navy" />}
                </div>
              </Field>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Cidade" error={fieldErrors.cidade}><input className="input-base" placeholder="São Paulo" value={gerais.cidade} onChange={g("cidade")} required /></Field>
                <Field label="Estado (sigla)" error={fieldErrors.estado}><input className="input-base" placeholder="SP" maxLength={2} value={gerais.estado} onChange={g("estado")} required /></Field>
              </div>
              <Field label="Endereço do Terreno" error={fieldErrors.endereco}><input className="input-base" placeholder="Rua, número, bairro" value={gerais.endereco} onChange={g("endereco")} required /></Field>
              <Field label="Descrição do Projeto (opcional)" hint={`${gerais.descricao.length} caracteres · recomendamos detalhar o empreendimento`} error={fieldErrors.descricao}>
                <textarea className="input-base min-h-[100px] resize-y" placeholder="Descreva o empreendimento em detalhes (opcional)..." rows={4} value={gerais.descricao} onChange={g("descricao")} />
              </Field>
              <Field label="Vídeo de Apresentação (opcional)" hint="Link do YouTube" error={fieldErrors.videoUrl}>
                <input className="input-base" placeholder="https://youtube.com/watch?v=..." value={gerais.videoUrl} onChange={g("videoUrl")} />
              </Field>
              <ProjetoFotosField
                value={fotosUrls}
                disabled={isLoading}
                onUpload={async (file) => {
                  try {
                    const location = await handleFotoUpload(file);
                    addToast({ type: "success", title: "Foto enviada" });
                    return location;
                  } catch (err) {
                    const message = getApiErrorMessage(err);
                    addToast({
                      type: "error",
                      title: "Falha no upload",
                      description: message,
                    });
                    throw err;
                  }
                }}
                onChange={(urls) => {
                  void handleFotosChange(urls);
                }}
              />
            </div>
          )}

          {etapa === 2 && (
            <div className="space-y-4 animate-in">
              <h2 className="font-semibold text-foreground">Dados Financeiros</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Valor Total do Projeto (R$)" error={fieldErrors.valorTotal}><CurrencyInput placeholder="0" value={financeiros.valorTotal} onValueChange={(v) => { setFinanceiros((p) => ({ ...p, valorTotal: v })); limparErro("valorTotal"); }} required /></Field>
                <Field label="Valor a Captar (R$)" hint="Máx. R$15M (CVM 88)" error={fieldErrors.valorCaptar}><CurrencyInput placeholder="0" value={financeiros.valorCaptar} onValueChange={(v) => { setFinanceiros((p) => ({ ...p, valorCaptar: v })); limparErro("valorCaptar"); }} required /></Field>
                <Field label="Prazo de Obra (meses)" error={fieldErrors.prazoObra}><input type="number" className="input-base" placeholder="12" min={1} max={120} value={financeiros.prazoObra} onChange={fin("prazoObra")} required /></Field>
                <Field label="Prazo de Retorno (meses)" error={fieldErrors.prazoRetorno}><input type="number" className="input-base" placeholder="24" min={1} max={120} value={financeiros.prazoRetorno} onChange={fin("prazoRetorno")} required /></Field>
                <Field label="Rentabilidade Estimada (% a.a.)" error={fieldErrors.rentabilidadeEstimada}><input type="number" className="input-base" placeholder="20" min={0} max={100} step={0.1} value={financeiros.rentabilidadeEstimada} onChange={fin("rentabilidadeEstimada")} required /></Field>
              </div>
              <ViabilidadeCalculator value={viabilidadeForm} onChange={setViabilidadeForm} />
            </div>
          )}

          {etapa === 3 && (
            <div className="space-y-4 animate-in">
              <h2 className="font-semibold text-foreground">Documentos do Projeto</h2>
              <p className="text-sm text-muted-foreground">
                PDF, JPG ou PNG · máx. 50 MB. Os arquivos são enviados com segurança para o armazenamento Atlas.
              </p>
              <div className="space-y-2">
                {DOC_FIELDS.map(({ key, label, hint }) => {
                  const url = documentos[key];
                  const done = typeof url === "string" && url !== "";
                  const busy = uploadingKey === key;
                  return (
                    <div key={key} className="flex items-center justify-between border border-border px-4 py-3">
                      <div className="min-w-0 pr-3">
                        <p className="text-sm font-medium text-foreground">
                          {label}
                        </p>
                        <p className="text-xs text-muted-foreground">{hint !== "" ? `Opcional · ${hint}` : "Opcional"}</p>
                        {done && (
                          <a href={url} target="_blank" rel="noreferrer" className="mt-1 block truncate text-xs text-navy hover:underline">
                            {fileLabel(url)}
                          </a>
                        )}
                      </div>
                      <label className={cn(
                        "btn btn-secondary btn-sm cursor-pointer shrink-0",
                        busy && "pointer-events-none opacity-50",
                        done && "border-status-success text-status-success",
                      )}>
                        {busy ? "Enviando…" : done ? "Trocar" : "Selecionar"}
                        <input
                          type="file"
                          className="sr-only"
                          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                          disabled={busy || isLoading}
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
            </div>
          )}

          {etapa === 4 && (
            <div className="space-y-4 animate-in">
              <h2 className="font-semibold text-foreground">Equipe do Projeto</h2>
              <p className="text-sm text-muted-foreground">Adicione os responsáveis pelo empreendimento. Mínimo 1 membro.</p>
              <EquipeEditor value={equipe} onChange={setEquipe} />
            </div>
          )}

          {etapa === 5 && (
            <div className="space-y-4 animate-in">
              <h2 className="font-semibold text-foreground">Revisão e Envio</h2>
              <p className="text-sm text-muted-foreground">Verifique os dados antes de submeter para análise.</p>
              <div className="space-y-3">
                <div className="  bg-muted p-4">
                  <p className="mb-3 text-xs font-medium tracking-normal text-muted-foreground">Dados Gerais</p>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <div><dt className="text-muted-foreground">Projeto</dt><dd className="font-medium">{gerais.nome || "—"}</dd></div>
                    <div><dt className="text-muted-foreground">Modelo</dt><dd className="font-medium">{gerais.modelo}</dd></div>
                    <div><dt className="text-muted-foreground">Localização</dt><dd className="font-medium">{gerais.cidade || "—"}, {gerais.estado || "—"}</dd></div>
                    <div><dt className="text-muted-foreground">Tipo</dt><dd className="font-medium">{gerais.tipoImovel}</dd></div>
                  </dl>
                </div>
                <div className="  bg-muted p-4">
                  <p className="mb-3 text-xs font-medium tracking-normal text-muted-foreground">Dados Financeiros</p>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <div><dt className="text-muted-foreground">A Captar</dt><dd className="font-semibold text-navy">{financeiros.valorCaptar !== "" && Number.isFinite(parseMoneyInput(financeiros.valorCaptar)) ? formatCurrency(parseMoneyInput(financeiros.valorCaptar)) : "—"}</dd></div>
                    <div><dt className="text-muted-foreground">Rentabilidade</dt><dd className="font-medium text-status-success">{financeiros.rentabilidadeEstimada !== "" ? `${financeiros.rentabilidadeEstimada}% a.a.` : "—"}</dd></div>
                  </dl>
                </div>
                <div className="bg-muted p-4">
                  <p className="mb-3 text-xs font-medium tracking-normal text-muted-foreground">Documentos</p>
                  <p className="text-sm text-foreground">
                    {DOC_FIELDS.filter((d) => typeof documentos[d.key] === "string" && documentos[d.key] !== "").length}
                    {" / "}
                    {DOC_FIELDS.length} enviados
                  </p>
                </div>
              </div>
              <div className="alert alert-warn text-sm text-status-warning">
                Você poderá continuar editando o projeto enquanto ele estiver em análise. Toda alteração fica registrada no histórico.
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-6 flex justify-between border-t border-border pt-5">
            <button type="button" onClick={() => setEtapa((p) => (p - 1) as Etapa)} disabled={etapa === 1}
              className="btn btn-secondary disabled:opacity-0">
              <ChevronLeft className="h-4 w-4" /> Anterior
            </button>

            {etapa < 5 ? (
              <button type="button" onClick={() => void avancar()} disabled={isLoading}
                className="btn btn-primary">
                {isLoading ? <><span className="h-4 w-4 animate-spin   border-2 border-white/30 border-t-white" />Salvando...</> : <>Próxima etapa <ChevronRight className="h-4 w-4" /></>}
              </button>
            ) : (
              <button type="button" onClick={() => void submeter()} disabled={isLoading || projetoId === null}
                className="btn bg-status-success text-white hover:opacity-90">
                {isLoading ? <><span className="h-4 w-4 animate-spin border-2 border-white/30 border-t-white" />Submetendo...</> : "Submeter Projeto"}
              </button>
            )}
          </div>
        </div>
        <div className="space-y-4">
          <ProjetoProgressBar items={progressItems} />
        </div>
        </div>
      </div>
    </div>
  );
}
