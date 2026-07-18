import { useState, type ReactNode, type FormEvent, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, ChevronLeft, Check, MapPin, DollarSign, FileText, Users, Eye } from "lucide-react";
import { api, getApiErrorMessage } from "@/services/api";
import { useToastStore } from "@/stores/toast";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";

type Etapa = 1 | 2 | 3 | 4 | 5;

const ETAPAS = [
  { num: 1 as Etapa, label: "Local", icon: MapPin },
  { num: 2 as Etapa, label: "Financeiro", icon: DollarSign },
  { num: 3 as Etapa, label: "Documentos", icon: FileText },
  { num: 4 as Etapa, label: "Equipe", icon: Users },
  { num: 5 as Etapa, label: "Revisão", icon: Eye },
];

interface DadosGerais {
  nome: string; modelo: string; tipoImovel: string;
  cidade: string; estado: string; endereco: string;
  descricao: string; videoUrl: string;
}

interface DadosFinanceiros {
  valorTotal: string; valorCaptar: string; prazoObra: string;
  prazoRetorno: string; rentabilidadeEstimada: string;
  modeloRetorno: string; planoSaida: string; tipoOferta: string;
}

const g0: DadosGerais = { nome: "", modelo: "VENDA", tipoImovel: "RESIDENCIAL", cidade: "", estado: "", endereco: "", descricao: "", videoUrl: "" };
const f0: DadosFinanceiros = { valorTotal: "", valorCaptar: "", prazoObra: "", prazoRetorno: "", rentabilidadeEstimada: "", modeloRetorno: "SCP", planoSaida: "", tipoOferta: "PUBLICA" };

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }): ReactNode {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {children}
      {hint !== undefined && <p className="form-hint">{hint}</p>}
    </div>
  );
}

export default function IncorporadoraProjetoNovoPage(): ReactNode {
  const [etapa, setEtapa] = useState<Etapa>(1);
  const [gerais, setGerais] = useState<DadosGerais>(g0);
  const [financeiros, setFinanceiros] = useState<DadosFinanceiros>(f0);
  const [projetoId, setProjetoId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const addToast = useToastStore((s) => s.addToast);
  const navigate = useNavigate();

  function g(field: keyof DadosGerais) {
    return (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setGerais((p) => ({ ...p, [field]: e.target.value }));
  }
  function fin(field: keyof DadosFinanceiros) {
    return (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setFinanceiros((p) => ({ ...p, [field]: e.target.value }));
  }

  async function salvarRascunho(): Promise<string> {
    if (projetoId !== null) return projetoId;
    const r = await api.post<{ id: string }>("/projetos", {
      nome: gerais.nome, modelo: gerais.modelo, tipoImovel: gerais.tipoImovel,
      cidade: gerais.cidade, estado: gerais.estado, endereco: gerais.endereco,
      descricao: gerais.descricao,
      ...(gerais.videoUrl !== "" && { videoUrl: gerais.videoUrl }),
    });
    setProjetoId(r.id);
    return r.id;
  }

  async function avancar(): Promise<void> {
    if (etapa === 1) {
      setIsLoading(true);
      try { await salvarRascunho(); } catch (err) { addToast({ type: "error", title: "Erro ao salvar", description: getApiErrorMessage(err) }); return; } finally { setIsLoading(false); }
    }
    if (etapa < 5) setEtapa((p) => (p + 1) as Etapa);
  }

  async function submeter(): Promise<void> {
    if (projetoId === null) return;
    setIsLoading(true);
    try {
      await api.put(`/projetos/${projetoId}`, {
        valorTotal: parseFloat(financeiros.valorTotal), valorCaptar: parseFloat(financeiros.valorCaptar),
        prazoObra: parseInt(financeiros.prazoObra, 10), prazoRetorno: parseInt(financeiros.prazoRetorno, 10),
        rentabilidadeEstimada: parseFloat(financeiros.rentabilidadeEstimada),
        modeloRetorno: financeiros.modeloRetorno, planoSaida: financeiros.planoSaida, tipoOferta: financeiros.tipoOferta,
      });
      await api.post(`/projetos/${projetoId}/submeter`, {});
      addToast({ type: "success", title: "Projeto submetido!", description: "Aguarde a análise da nossa equipe." });
      navigate("/dashboard");
    } catch (err) {
      addToast({ type: "error", title: "Erro ao submeter", description: getApiErrorMessage(err) });
    } finally {
      setIsLoading(false);
    }
  }

  const progress = Math.round(((etapa - 1) / 4) * 100);

  return (
    <div className="animate-in">
      <PageHeader title="Novo Projeto" description="Preencha as informações para submeter à curadoria" />

      <div className="page-content">
        {/* Progress */}
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
                className={cn("flex items-center gap-1.5 text-xs font-medium transition-colors",
                  num === etapa ? "text-navy" : num < etapa ? "cursor-pointer text-status-success hover:text-status-success" : "text-muted-foreground")}>
                <div className={cn("flex h-6 w-6 items-center justify-center  ",
                  num === etapa ? "bg-navy text-white" : num < etapa ? "bg-status-success-subtle text-status-success" : "bg-muted text-muted-foreground")}>
                  {num < etapa ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                </div>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="card p-5 sm:p-6">
          {etapa === 1 && (
            <div className="space-y-4 animate-in">
              <h2 className="font-semibold text-foreground">Dados do Projeto</h2>
              <Field label="Nome do Projeto"><input className="input-base" placeholder="Ex: Residencial Park View" value={gerais.nome} onChange={g("nome")} required /></Field>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Modelo de Investimento">
                  <select className="input-base" value={gerais.modelo} onChange={g("modelo")}>
                    <option value="VENDA">Construção para Venda</option>
                    <option value="RENDA">Construção para Renda</option>
                    <option value="MISTO">Modelo Misto</option>
                  </select>
                </Field>
                <Field label="Tipo de Imóvel">
                  <select className="input-base" value={gerais.tipoImovel} onChange={g("tipoImovel")}>
                    <option value="RESIDENCIAL">Residencial</option>
                    <option value="COMERCIAL">Comercial</option>
                    <option value="MISTO">Misto</option>
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Cidade"><input className="input-base" placeholder="São Paulo" value={gerais.cidade} onChange={g("cidade")} required /></Field>
                <Field label="Estado (sigla)"><input className="input-base" placeholder="SP" maxLength={2} value={gerais.estado} onChange={g("estado")} required /></Field>
              </div>
              <Field label="Endereço do Terreno"><input className="input-base" placeholder="Rua, número, bairro" value={gerais.endereco} onChange={g("endereco")} required /></Field>
              <Field label="Descrição do Projeto" hint={`${gerais.descricao.length}/200 caracteres mínimos`}>
                <textarea className="input-base min-h-[100px] resize-y" placeholder="Descreva o empreendimento em detalhes..." rows={4} value={gerais.descricao} onChange={g("descricao")} required />
              </Field>
              <Field label="Vídeo de Apresentação (opcional)" hint="Link do YouTube">
                <input className="input-base" placeholder="https://youtube.com/watch?v=..." value={gerais.videoUrl} onChange={g("videoUrl")} />
              </Field>
            </div>
          )}

          {etapa === 2 && (
            <div className="space-y-4 animate-in">
              <h2 className="font-semibold text-foreground">Dados Financeiros</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Valor Total do Projeto (R$)"><input type="number" className="input-base" placeholder="0" min={0} value={financeiros.valorTotal} onChange={fin("valorTotal")} required /></Field>
                <Field label="Valor a Captar (R$)" hint="Máx. R$15M (CVM 88)"><input type="number" className="input-base" placeholder="0" min={0} max={15000000} value={financeiros.valorCaptar} onChange={fin("valorCaptar")} required /></Field>
                <Field label="Prazo de Obra (meses)"><input type="number" className="input-base" placeholder="12" min={1} max={120} value={financeiros.prazoObra} onChange={fin("prazoObra")} required /></Field>
                <Field label="Prazo de Retorno (meses)"><input type="number" className="input-base" placeholder="24" min={1} max={120} value={financeiros.prazoRetorno} onChange={fin("prazoRetorno")} required /></Field>
                <Field label="Rentabilidade Estimada (% a.a.)"><input type="number" className="input-base" placeholder="20" min={0} max={100} step={0.1} value={financeiros.rentabilidadeEstimada} onChange={fin("rentabilidadeEstimada")} required /></Field>
                <Field label="Modelo de Retorno">
                  <select className="input-base" value={financeiros.modeloRetorno} onChange={fin("modeloRetorno")}>
                    <option value="SCP">SCP — Participação nos Lucros</option>
                    <option value="NOTA_COMERCIAL">Nota Comercial — Dívida</option>
                  </select>
                </Field>
              </div>
              <Field label="Tipo de Oferta">
                <select className="input-base" value={financeiros.tipoOferta} onChange={fin("tipoOferta")}>
                  <option value="PUBLICA">Pública (CVM 88 — ilimitado de investidores)</option>
                  <option value="PRIVADA">Privada (Club Deal — até 15 investidores)</option>
                </select>
              </Field>
              <Field label="Plano de Saída dos Investidores" hint="Como e quando os investidores receberão o retorno">
                <textarea className="input-base resize-none" rows={3} placeholder="Ex: Após a venda das unidades, lucro distribuído proporcionalmente às cotas..." value={financeiros.planoSaida} onChange={fin("planoSaida")} required />
              </Field>
            </div>
          )}

          {etapa === 3 && (
            <div className="space-y-4 animate-in">
              <h2 className="font-semibold text-foreground">Documentos do Projeto</h2>
              <p className="text-sm text-muted-foreground">Faça o upload dos documentos necessários para a análise de curadoria.</p>
              <div className="space-y-2">
                {[
                  { label: "Matrícula do Terreno", required: true, hint: "Certidão atualizada (máx 90 dias)" },
                  { label: "Alvará de Construção", required: true, hint: "Ou protocolo de aprovação" },
                  { label: "Memorial Descritivo", required: true, hint: "" },
                  { label: "Planta do Empreendimento", required: true, hint: "" },
                  { label: "Estudo de Viabilidade Financeira", required: true, hint: "Assinado por responsável técnico" },
                  { label: "Planilha de Orçamento de Obra", required: false, hint: "Recomendado — assinada por engenheiro" },
                  { label: "Projeto 3D / Renderizações", required: false, hint: "Facilita a venda da oferta" },
                  { label: "Contrato Social da SPE", required: false, hint: "Se já constituída" },
                ].map(({ label, required, hint }) => (
                  <div key={label} className="flex items-center justify-between   border border-border px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground">{required ? "Obrigatório" : "Opcional"}{hint !== "" ? ` · ${hint}` : ""}</p>
                    </div>
                    <label className="btn btn-secondary btn-sm cursor-pointer">
                      <input type="file" className="sr-only" accept=".pdf,.jpg,.png" />
                      Selecionar
                    </label>
                  </div>
                ))}
              </div>
              <div className="alert alert-warn text-xs text-status-warning">
                Upload real disponível após configuração do S3. Por ora, prossiga para revisar os dados.
              </div>
            </div>
          )}

          {etapa === 4 && (
            <div className="space-y-4 animate-in">
              <h2 className="font-semibold text-foreground">Equipe do Projeto</h2>
              <p className="text-sm text-muted-foreground">Adicione os responsáveis pelo empreendimento. Mínimo 1 membro.</p>
              <div className="  border border-dashed border-input bg-muted p-8 text-center">
                <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">Gerenciamento de equipe</p>
                <p className="mt-1 text-xs text-muted-foreground">Disponível após salvar o projeto como rascunho</p>
              </div>
            </div>
          )}

          {etapa === 5 && (
            <div className="space-y-4 animate-in">
              <h2 className="font-semibold text-foreground">Revisão e Envio</h2>
              <p className="text-sm text-muted-foreground">Verifique os dados antes de submeter para análise.</p>
              <div className="space-y-3">
                <div className="  bg-muted p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Dados Gerais</p>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <div><dt className="text-muted-foreground">Projeto</dt><dd className="font-medium">{gerais.nome || "—"}</dd></div>
                    <div><dt className="text-muted-foreground">Modelo</dt><dd className="font-medium">{gerais.modelo}</dd></div>
                    <div><dt className="text-muted-foreground">Localização</dt><dd className="font-medium">{gerais.cidade || "—"}, {gerais.estado || "—"}</dd></div>
                    <div><dt className="text-muted-foreground">Tipo</dt><dd className="font-medium">{gerais.tipoImovel}</dd></div>
                  </dl>
                </div>
                <div className="  bg-muted p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Dados Financeiros</p>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <div><dt className="text-muted-foreground">A Captar</dt><dd className="font-semibold text-navy">{financeiros.valorCaptar !== "" ? `R$ ${financeiros.valorCaptar}` : "—"}</dd></div>
                    <div><dt className="text-muted-foreground">Rentabilidade</dt><dd className="font-medium text-status-success">{financeiros.rentabilidadeEstimada !== "" ? `${financeiros.rentabilidadeEstimada}% a.a.` : "—"}</dd></div>
                    <div><dt className="text-muted-foreground">Modelo</dt><dd className="font-medium">{financeiros.modeloRetorno}</dd></div>
                    <div><dt className="text-muted-foreground">Oferta</dt><dd className="font-medium">{financeiros.tipoOferta}</dd></div>
                  </dl>
                </div>
              </div>
              <div className="alert alert-warn text-sm text-status-warning">
                Após submissão, os campos ficarão bloqueados para edição até a conclusão da análise.
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
                {isLoading ? <><span className="h-4 w-4 animate-spin   border-2 border-white/30 border-t-white" />Submetendo...</> : <><Check className="h-4 w-4" />Submeter Projeto</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
