import { useEffect, useState, type ReactNode } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Save, ThumbsUp, ThumbsDown, AlertCircle,
  ExternalLink, FileText, Users, BarChart3, History,
  StickyNote, Building2, MapPin,
} from "lucide-react";
import { api, getApiErrorMessage } from "@/services/api";
import { useToastStore } from "@/stores/toast";
import type { Projeto, Scorecard, Incorporadora, AuditoriaEntry, NotaInterna } from "@/types";
import { StatusBadge } from "@/components/shared/status-badge";
import { PageSpinner } from "@/components/ui/spinner";
import { PageHeader } from "@/components/ui/page-header";
import { formatDateTime, formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface CuradoriaDetalhe {
  projeto: Projeto;
  incorporadora: Incorporadora | null;
  scorecards: Scorecard[];
  historico: AuditoriaEntry[];
  notas: NotaInterna[];
}

const CRITERIOS = [
  { key: "localizacao", label: "Localização", peso: "25%", desc: "Demanda, infraestrutura, potencial de valorização" },
  { key: "financeira", label: "Viabilidade Financeira", peso: "25%", desc: "Orçamento, margem, cronograma" },
  { key: "documentacao", label: "Documentação", peso: "20%", desc: "Completude, validade, regularidade" },
  { key: "equipe", label: "Experiência da Equipe", peso: "15%", desc: "Projetos anteriores, qualificação" },
  { key: "risco", label: "Risco do Projeto", peso: "15%", desc: "Mercado, execução, jurídico" },
] as const;

type Tab = "dados" | "financeiro" | "docs" | "equipe" | "incorporadora" | "historico" | "notas";
const TABS: { key: Tab; label: string; icon: typeof FileText }[] = [
  { key: "dados", label: "Dados Gerais", icon: BarChart3 },
  { key: "financeiro", label: "Financeiro", icon: BarChart3 },
  { key: "docs", label: "Documentos", icon: FileText },
  { key: "equipe", label: "Equipe", icon: Users },
  { key: "incorporadora", label: "Incorporadora", icon: Building2 },
  { key: "historico", label: "Histórico", icon: History },
  { key: "notas", label: "Notas Internas", icon: StickyNote },
];

function NoteItem(nota: NotaInterna): ReactNode {
  return (
    <div className="border border-status-warning-border bg-status-warning-subtle p-3.5">
      <p className="text-sm text-foreground">{nota.texto}</p>
      <p className="mt-2 text-xs text-muted-foreground">{nota.analistaNome} · {formatDateTime(nota.criadoEm)}</p>
    </div>
  );
}

export default function AdminCuradoriaDetalhePage(): ReactNode {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);
  const [data, setData] = useState<CuradoriaDetalhe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("dados");
  const [scorecard, setScorecard] = useState<Record<string, { nota: string; comentario: string }>>({
    localizacao: { nota: "", comentario: "" }, financeira: { nota: "", comentario: "" },
    documentacao: { nota: "", comentario: "" }, equipe: { nota: "", comentario: "" }, risco: { nota: "", comentario: "" },
  });
  const [parecer, setParecer] = useState("");
  const [textoAjuste, setTextoAjuste] = useState("");
  const [justificativa, setJustificativa] = useState("");
  const [ofertaId, setOfertaId] = useState("");
  const [ofertaLink, setOfertaLink] = useState("");
  const [notaTexto, setNotaTexto] = useState("");
  const [checklist, setChecklist] = useState({
    patrimonioAfetacao: false,
    seguroObra: false,
    speScp: false,
    elegibilidadeCvm: false,
  });

  const checklistOk = checklist.patrimonioAfetacao && checklist.seguroObra && checklist.speScp && checklist.elegibilidadeCvm;

  async function reload(): Promise<void> {
    if (id === undefined) return;
    const r = await api.get<CuradoriaDetalhe>(`/admin/curadoria/${id}`);
    setData(r);
    const u = r.scorecards[0];
    if (u !== undefined) {
      setScorecard({
        localizacao: { nota: String(u.localizacaoNota ?? ""), comentario: u.localizacaoComentario ?? "" },
        financeira: { nota: String(u.financeiraNota ?? ""), comentario: u.financeiraComentario ?? "" },
        documentacao: { nota: String(u.documentacaoNota ?? ""), comentario: u.documentacaoComentario ?? "" },
        equipe: { nota: String(u.equipeNota ?? ""), comentario: u.equipeComentario ?? "" },
        risco: { nota: String(u.riscoNota ?? ""), comentario: u.riscoComentario ?? "" },
      });
      setParecer(u.parecer ?? "");
    }
  }

  useEffect(() => {
    void reload().finally(() => setIsLoading(false));
  }, [id]);

  function buildScorecardBody() {
    const s = scorecard;
    return {
      localizacaoNota: s["localizacao"]?.nota !== "" ? parseFloat(s["localizacao"]?.nota ?? "0") : undefined,
      localizacaoComentario: s["localizacao"]?.comentario || undefined,
      financeiraNota: s["financeira"]?.nota !== "" ? parseFloat(s["financeira"]?.nota ?? "0") : undefined,
      financeiraComentario: s["financeira"]?.comentario || undefined,
      documentacaoNota: s["documentacao"]?.nota !== "" ? parseFloat(s["documentacao"]?.nota ?? "0") : undefined,
      documentacaoComentario: s["documentacao"]?.comentario || undefined,
      equipeNota: s["equipe"]?.nota !== "" ? parseFloat(s["equipe"]?.nota ?? "0") : undefined,
      equipeComentario: s["equipe"]?.comentario || undefined,
      riscoNota: s["risco"]?.nota !== "" ? parseFloat(s["risco"]?.nota ?? "0") : undefined,
      riscoComentario: s["risco"]?.comentario || undefined,
      parecer: parecer || undefined,
    };
  }

  const notaGeral = CRITERIOS.every((c) => scorecard[c.key]?.nota !== "")
    ? Math.round(
        [0.25, 0.25, 0.20, 0.15, 0.15].reduce((acc, peso, i) => {
          const nota = parseFloat(scorecard[CRITERIOS[i]?.key ?? "localizacao"]?.nota ?? "0");
          return acc + nota * peso;
        }, 0) * 10) / 10
    : null;

  async function action(fn: () => Promise<unknown>, successMsg: string, redirect?: string): Promise<void> {
    setActionLoading(true);
    try {
      await fn();
      addToast({ type: "success", title: successMsg });
      if (redirect !== undefined) { navigate(redirect); } else { await reload(); }
    } catch (err) {
      addToast({ type: "error", title: "Erro", description: getApiErrorMessage(err) });
    } finally {
      setActionLoading(false);
    }
  }

  if (isLoading) return <PageSpinner />;
  if (data === null) return <div className="p-8 text-center text-muted-foreground">Projeto não encontrado</div>;

  const { projeto } = data;

  return (
    <div className="animate-in">
      <PageHeader
        title={projeto.nome}
        description={`${projeto.cidade}, ${projeto.estado}`}
        breadcrumb={
          <Link to="/admin/curadoria" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-navy">
            <ArrowLeft className="h-3 w-3" /> Fila
          </Link>
        }
        action={
          <div className="flex items-center gap-2">
            <span className="  bg-muted px-2.5 py-1 text-xs text-muted-foreground">Rev. {String(projeto.revisao)}</span>
            <StatusBadge status={projeto.status} size="md" />
          </div>
        }
      />

      <div className="page-content space-y-5">
        {/* Iniciar análise */}
        {projeto.status === "SUBMETIDO" && (
          <div className="alert alert-info animate-in">
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-status-info" />
            <div>
              <p className="font-semibold text-status-info">Projeto aguardando análise</p>
              <p className="mt-0.5 text-sm text-status-info">Clique para iniciar e atribuir este projeto a você.</p>
              <button type="button" onClick={() => void action(() => api.post(`/admin/curadoria/${id ?? ""}/iniciar`, {}), "Análise iniciada!")} disabled={actionLoading}
                className="btn btn-primary btn-sm mt-3">
                {actionLoading ? <span className="h-3.5 w-3.5 animate-spin   border-2 border-white/30 border-t-white" /> : null}
                Iniciar análise
              </button>
            </div>
          </div>
        )}

        {/* Confirmar publicação */}
        {projeto.status === "APROVADO" && (
          <div className="card p-5 border-status-success-border animate-in">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center   bg-status-success-subtle">
                <ThumbsUp className="h-5 w-5 text-status-success" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-status-success">Projeto aprovado — Criar oferta na plataforma</p>
                <ol className="mt-2 list-decimal list-inside space-y-0.5 text-sm text-status-success">
                  <li>Acesse o painel da plataforma de investimento</li>
                  <li>Crie a oferta com os dados do projeto</li>
                  <li>Registre o ID e o link da oferta abaixo</li>
                </ol>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input value={ofertaId} onChange={(e) => setOfertaId(e.target.value)} className="input-base text-sm" placeholder="ID da oferta" />
                  <input type="url" value={ofertaLink} onChange={(e) => setOfertaLink(e.target.value)} className="input-base text-sm" placeholder="https://..." />
                </div>
                <button type="button"
                  onClick={() => void action(() => api.post(`/admin/curadoria/${id ?? ""}/confirmar-publicacao`, { ofertaId, ofertaLink }), "Publicação confirmada!", "/admin/historico")}
                  disabled={actionLoading || ofertaId === "" || ofertaLink === ""}
                  className="btn mt-3 bg-status-success text-white hover:opacity-90 disabled:opacity-50">
                  <ExternalLink className="h-4 w-4" />
                  {actionLoading ? "Confirmando..." : "Confirmar Publicação"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-5 xl:grid-cols-3">
          {/* Main */}
          <div className="lg:col-span-2">
            <div className="card overflow-hidden">
              <div className="tab-bar overflow-x-auto">
                {TABS.map(({ key, label, icon: Icon }) => (
                  <button key={key} type="button" onClick={() => setTab(key)}
                    className={cn("tab-item flex items-center gap-1.5 whitespace-nowrap", tab === key && "tab-item-active")}>
                    <Icon className="h-3.5 w-3.5" />{label}
                  </button>
                ))}
              </div>

              <div className="p-5">
                {tab === "dados" && (
                  <dl className="animate-in grid grid-cols-2 gap-3 text-sm">
                    {[
                      ["Nome", projeto.nome], ["Modelo", projeto.modelo], ["Tipo", projeto.tipoImovel],
                      ["Localização", `${projeto.cidade}, ${projeto.estado}`], ["Oferta", projeto.tipoOferta ?? "—"],
                    ].map(([k, v]) => (
                      <div key={k}><dt className="text-muted-foreground">{k}</dt><dd className="mt-0.5 font-medium">{v}</dd></div>
                    ))}
                    <div className="col-span-2"><dt className="text-muted-foreground">Endereço</dt><dd className="mt-0.5 font-medium flex items-center gap-1"><MapPin className="h-3 w-3 text-muted-foreground" />{projeto.endereco}</dd></div>
                    <div className="col-span-2 mt-2">
                      <dt className="mb-1.5 text-muted-foreground">Descrição</dt>
                      <dd className="text-foreground leading-relaxed">{projeto.descricao}</dd>
                    </div>
                  </dl>
                )}

                {tab === "financeiro" && (
                  <dl className="animate-in grid grid-cols-2 gap-3 text-sm">
                    {[
                      ["Valor Total", projeto.valorTotal !== undefined ? formatCurrency(projeto.valorTotal) : "—"],
                      ["A Captar", projeto.valorCaptar !== undefined ? formatCurrency(projeto.valorCaptar) : "—"],
                      ["Prazo Obra", projeto.prazoObra !== undefined ? `${String(projeto.prazoObra)} meses` : "—"],
                      ["Prazo Retorno", projeto.prazoRetorno !== undefined ? `${String(projeto.prazoRetorno)} meses` : "—"],
                      ["Rentabilidade", projeto.rentabilidadeEstimada !== undefined ? `${String(projeto.rentabilidadeEstimada)}% a.a.` : "—"],
                      ["Modelo Retorno", projeto.modeloRetorno ?? "—"],
                    ].map(([k, v]) => (
                      <div key={k}><dt className="text-muted-foreground">{k}</dt><dd className="mt-0.5 font-medium">{v}</dd></div>
                    ))}
                    {projeto.planoSaida !== undefined && (
                      <div className="col-span-2">
                        <dt className="text-muted-foreground">Plano de Saída</dt>
                        <dd className="mt-0.5 text-foreground">{projeto.planoSaida}</dd>
                      </div>
                    )}
                  </dl>
                )}

                {tab === "docs" && (
                  <div className="animate-in space-y-2">
                    {projeto.documentos !== undefined
                      ? Object.entries(projeto.documentos).map(([key, url]) => {
                          if (!url) return null;
                          const urls = Array.isArray(url) ? url : [url as string];
                          return urls.map((u: string, i: number) => (
                            <a key={`${key}-${String(i)}`} href={u} target="_blank" rel="noopener noreferrer"
                              className="flex items-center justify-between   border border-border px-4 py-3 hover:bg-muted">
                              <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center   bg-navy-50"><FileText className="h-4 w-4 text-navy" /></div>
                                <span className="text-sm font-medium text-foreground">{key}</span>
                              </div>
                              <ExternalLink className="h-4 w-4 text-muted-foreground" />
                            </a>
                          ));
                        })
                      : <p className="py-6 text-center text-sm text-muted-foreground">Nenhum documento</p>
                    }
                  </div>
                )}

                {tab === "equipe" && (
                  <div className="animate-in space-y-3">
                    {(projeto.equipe ?? []).length === 0
                      ? <p className="py-6 text-center text-sm text-muted-foreground">Nenhum membro</p>
                      : (projeto.equipe ?? []).map((m, i) => (
                          <div key={i} className="flex gap-3   border border-border p-3.5">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center   bg-navy-100 font-bold text-navy">{m.nome.charAt(0)}</div>
                            <div><p className="font-semibold text-foreground">{m.nome}</p><p className="text-xs text-muted-foreground">{m.cargo}</p><p className="mt-1 text-sm text-foreground">{m.bio}</p></div>
                          </div>
                        ))
                    }
                  </div>
                )}

                {tab === "incorporadora" && (
                  <div className="animate-in">
                    {data.incorporadora !== null ? (
                      <>
                        <dl className="grid grid-cols-2 gap-3 text-sm">
                          {[
                            ["Razão Social", data.incorporadora.razaoSocial || "—"],
                            ["CNPJ", data.incorporadora.cnpj || "—"],
                            ["Responsável", data.incorporadora.nomeResponsavel || "—"],
                            ["E-mail", data.incorporadora.email],
                          ].map(([k, v]) => <div key={k}><dt className="text-muted-foreground">{k}</dt><dd className="mt-0.5 font-medium">{v}</dd></div>)}
                        </dl>
                        {data.incorporadora.descricao !== undefined && (
                          <div className="mt-3"><p className="text-xs text-muted-foreground">Descrição</p><p className="mt-0.5 text-sm text-foreground">{data.incorporadora.descricao}</p></div>
                        )}
                        <Link to={`/admin/incorporadoras/${projeto.incorporadoraId}`} className="btn btn-secondary btn-sm mt-4 inline-flex">
                          Ver perfil completo <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </>
                    ) : <p className="text-sm text-muted-foreground">Dados não disponíveis</p>}
                  </div>
                )}

                {tab === "historico" && (
                  <ol className="animate-in space-y-3">
                    {data.historico.length === 0
                      ? <p className="py-6 text-center text-sm text-muted-foreground">Sem histórico</p>
                      : data.historico.map((e) => (
                          <li key={e.criadoEm} className="flex gap-3 pb-3 border-b border-border last:border-0">
                            <div className="mt-2 h-2 w-2 shrink-0   bg-navy" />
                            <div><p className="text-sm font-medium text-foreground">{e.descricao}</p><p className="mt-0.5 text-xs text-muted-foreground">{e.userName} · {formatDateTime(e.criadoEm)}</p></div>
                          </li>
                        ))
                    }
                  </ol>
                )}

                {tab === "notas" && (
                  <div className="animate-in space-y-4">
                    <div>
                      <textarea
                        value={notaTexto} onChange={(e) => setNotaTexto(e.target.value)}
                        rows={3} placeholder="Nota interna (visível apenas para a equipe)..."
                        className="input-base resize-none text-sm"
                      />
                      <button type="button" onClick={() => void action(async () => { await api.post(`/admin/curadoria/${id ?? ""}/notas`, { texto: notaTexto }); setNotaTexto(""); await reload(); }, "Nota adicionada")} disabled={notaTexto.length < 5 || actionLoading}
                        className="btn btn-secondary btn-sm mt-2">
                        Adicionar nota
                      </button>
                    </div>
                    <div className="space-y-2">
                      {data.notas.length === 0
                        ? <p className="text-sm text-muted-foreground">Nenhuma nota</p>
                        : data.notas.map((n) => <NoteItem key={n.criadoEm} {...n} />)
                      }
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Scorecard sidebar */}
          <div className="space-y-4">
            {projeto.status === "EM_ANALISE" && (
              <>
                <div className="card p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">Scorecard</h3>
                    {notaGeral !== null && (
                      <div className="flex h-9 w-9 items-center justify-center   bg-navy text-sm font-bold text-white">
                        {String(notaGeral)}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {CRITERIOS.map(({ key, label, peso }) => (
                      <div key={key}>
                        <div className="mb-1 flex items-center justify-between">
                          <p className="text-xs font-medium text-foreground">{label}</p>
                          <span className="text-[10px] text-muted-foreground">{peso}</span>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <input type="number" min={1} max={10}
                            value={scorecard[key]?.nota ?? ""}
                            onChange={(e) => setScorecard((p) => ({ ...p, [key]: { ...p[key]!, nota: e.target.value } }))}
                            className="input-base w-14 text-center text-sm" placeholder="—" />
                          <input type="text"
                            value={scorecard[key]?.comentario ?? ""}
                            onChange={(e) => setScorecard((p) => ({ ...p, [key]: { ...p[key]!, comentario: e.target.value } }))}
                            className="input-base flex-1 text-xs" placeholder="Comentário..." />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3">
                    <p className="mb-1.5 text-xs font-medium text-foreground">Parecer Final</p>
                    <textarea value={parecer} onChange={(e) => setParecer(e.target.value)} rows={3}
                      className="input-base resize-none text-xs" placeholder="Resumo da análise e justificativa..." />
                  </div>

                  <button type="button" onClick={() => void action(() => api.put(`/admin/curadoria/${id ?? ""}/scorecard`, buildScorecardBody()), "Rascunho salvo")} disabled={actionLoading}
                    className="btn btn-secondary w-full mt-3 text-xs">
                    <Save className="h-3.5 w-3.5" /> Salvar rascunho
                  </button>
                </div>

                <div className="card p-5 space-y-3">
                  <h3 className="font-semibold text-foreground">Decisão</h3>

                  <div>
                    <textarea value={textoAjuste} onChange={(e) => setTextoAjuste(e.target.value)} rows={2}
                      className="input-base resize-none text-xs" placeholder="Descreva o ajuste necessário..." />
                    <button type="button" onClick={() => void action(() => api.post(`/admin/curadoria/${id ?? ""}/ajuste`, { scorecard: buildScorecardBody(), textoAjuste }), "Ajuste solicitado!", "/admin/curadoria")}
                      disabled={actionLoading || textoAjuste.length < 20}
                      className="btn btn-sm w-full mt-2 border border-status-warning bg-status-warning-subtle text-status-warning hover:opacity-90">
                      <AlertCircle className="h-3.5 w-3.5" /> Solicitar Ajuste
                    </button>
                  </div>

                  <div>
                    <textarea value={justificativa} onChange={(e) => setJustificativa(e.target.value)} rows={2}
                      className="input-base resize-none text-xs" placeholder="Justificativa de reprovação..." />
                    <button type="button" onClick={() => void action(() => api.post(`/admin/curadoria/${id ?? ""}/reprovar`, { scorecard: buildScorecardBody(), justificativa }), "Projeto reprovado", "/admin/curadoria")}
                      disabled={actionLoading || justificativa.length < 20}
                      className="btn btn-danger w-full mt-2 btn-sm">
                      <ThumbsDown className="h-3.5 w-3.5" /> Reprovar
                    </button>
                  </div>

                  <div className="border border-border bg-muted/40 p-3 space-y-2">
                    <p className="text-xs font-semibold text-foreground">Checklist pré-aprovação</p>
                    <p className="text-xs text-muted-foreground">Confirme antes de aprovar (obrigatório).</p>
                    {([
                      { key: "patrimonioAfetacao" as const, label: "Patrimônio de afetação (cláusula no contrato)" },
                      { key: "seguroObra" as const, label: "Seguro de obra (apólice antes da oferta)" },
                      { key: "speScp" as const, label: "SPE/SCP constituída ou em processo" },
                      { key: "elegibilidadeCvm" as const, label: "Elegibilidade CVM 88 (receita ≤ R$40M / até R$80M)" },
                    ]).map(({ key, label }) => (
                      <label key={key} className="flex items-start gap-2 text-xs text-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          className="mt-0.5"
                          checked={checklist[key]}
                          onChange={(e) => setChecklist((p) => ({ ...p, [key]: e.target.checked }))}
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!checklistOk) {
                        addToast({ type: "error", title: "Checklist incompleto", description: "Marque todos os itens pré-aprovação antes de aprovar." });
                        return;
                      }
                      void action(() => api.post(`/admin/curadoria/${id ?? ""}/aprovar`, { scorecard: buildScorecardBody() }), "Projeto aprovado!");
                    }}
                    disabled={actionLoading || parecer.length < 20 || !checklistOk}
                    className="btn w-full bg-status-success text-white hover:opacity-90 disabled:opacity-50">
                    <ThumbsUp className="h-4 w-4" />
                    {actionLoading ? "Aprovando..." : "Aprovar Projeto"}
                  </button>
                </div>
              </>
            )}

            {projeto.status !== "EM_ANALISE" && projeto.status !== "SUBMETIDO" && data.scorecards[0] !== undefined && (
              <div className="card p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Scorecard Final</h3>
                  {data.scorecards[0].notaGeral !== undefined && (
                    <div className="flex h-9 w-9 items-center justify-center   bg-navy text-sm font-bold text-white">
                      {String(data.scorecards[0].notaGeral)}
                    </div>
                  )}
                </div>
                {data.scorecards[0].parecer !== undefined && (
                  <p className="text-sm text-foreground">{data.scorecards[0].parecer}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Clock(props: { className?: string }): ReactNode {
  return <svg className={props.className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}
