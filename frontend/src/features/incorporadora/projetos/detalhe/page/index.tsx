import { useEffect, useState, type ReactNode } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, ExternalLink, AlertCircle, CheckCircle,
  Clock, FileText, Users, BarChart3, History,
} from "lucide-react";
import { api } from "@/services/api";
import type { Projeto, AuditoriaEntry } from "@/types";
import { StatusBadge } from "@/components/shared/status-badge";
import { PageSpinner } from "@/components/ui/spinner";
import { PageHeader } from "@/components/ui/page-header";
import { formatDateTime, formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Tab = "visao-geral" | "documentos" | "equipe" | "historico";

const TABS: { key: Tab; label: string; icon: typeof FileText }[] = [
  { key: "visao-geral", label: "Visão Geral", icon: BarChart3 },
  { key: "documentos", label: "Documentos", icon: FileText },
  { key: "equipe", label: "Equipe", icon: Users },
  { key: "historico", label: "Histórico", icon: History },
];

export default function IncorporadoraProjetoDetalhePage(): ReactNode {
  const { id } = useParams<{ id: string }>();
  const [projeto, setProjeto] = useState<(Projeto & { historico?: AuditoriaEntry[] }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("visao-geral");

  useEffect(() => {
    if (id === undefined) return;
    void api.get<Projeto & { historico?: AuditoriaEntry[] }>(`/projetos/${id}`)
      .then(setProjeto)
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) return <PageSpinner />;
  if (projeto === null) return (
    <div className="flex h-96 flex-col items-center justify-center gap-3">
      <p className="text-[#6B7280]">Projeto não encontrado</p>
      <Link to="/dashboard" className="btn btn-secondary btn-sm">Voltar</Link>
    </div>
  );

  return (
    <div className="animate-in">
      <PageHeader
        title={projeto.nome}
        description={`${projeto.cidade}, ${projeto.estado} · Rev. ${String(projeto.revisao)}`}
        breadcrumb={
          <Link to="/dashboard" className="inline-flex items-center gap-1 text-xs text-[#9CA3AF] hover:text-navy">
            <ArrowLeft className="h-3 w-3" /> Dashboard
          </Link>
        }
        action={<StatusBadge status={projeto.status} size="md" />}
      />

      <div className="page-content space-y-5">
        {/* Alert banners */}
        {projeto.status === "AJUSTE_SOLICITADO" && projeto.textoAjuste !== undefined && (
          <div className="alert alert-warning animate-in">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-orange-800">Ajuste necessário</p>
              <p className="mt-1 text-sm text-orange-700">{projeto.textoAjuste}</p>
              <Link to={`/projetos/${projeto.id}/editar`} className="btn btn-sm mt-3 inline-flex bg-orange-600 text-white hover:bg-orange-700">
                Editar e resubmeter
              </Link>
            </div>
          </div>
        )}

        {projeto.status === "REPROVADO" && projeto.justificativaReprovacao !== undefined && (
          <div className="alert alert-danger animate-in">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <div>
              <p className="font-semibold text-red-800">Projeto reprovado</p>
              <p className="mt-1 text-sm text-red-700">{projeto.justificativaReprovacao}</p>
            </div>
          </div>
        )}

        {projeto.status === "APROVADO" && (
          <div className="alert alert-success animate-in">
            <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
            <div>
              <p className="font-semibold text-green-800">Projeto aprovado!</p>
              <p className="mt-1 text-sm text-green-700">Nossa equipe está criando a oferta. Em breve você receberá o link para compartilhar com investidores.</p>
            </div>
          </div>
        )}

        {projeto.status === "OFERTA_CRIADA" && projeto.ofertaLink !== undefined && (
          <div className="alert alert-success animate-in">
            <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
            <div>
              <p className="font-semibold text-emerald-800">Oferta publicada!</p>
              <p className="mt-1 text-sm text-emerald-700">Sua oferta está disponível para investidores na plataforma Divify.</p>
              <a href={projeto.ofertaLink} target="_blank" rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700">
                <ExternalLink className="h-3.5 w-3.5" /> Ver oferta na Divify
              </a>
            </div>
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2">
            <div className="card overflow-hidden">
              {/* Tabs */}
              <div className="tab-bar overflow-x-auto">
                {TABS.map(({ key, label, icon: Icon }) => (
                  <button key={key} type="button" onClick={() => setTab(key)}
                    className={cn("tab-item flex items-center gap-1.5 whitespace-nowrap", tab === key && "tab-item-active")}>
                    <Icon className="h-3.5 w-3.5" />{label}
                  </button>
                ))}
              </div>

              <div className="p-5">
                {tab === "visao-geral" && (
                  <div className="animate-in space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-2">
                      <div><p className="text-[#9CA3AF]">Modelo</p><p className="mt-0.5 font-medium">{projeto.modelo}</p></div>
                      <div><p className="text-[#9CA3AF]">Tipo de Imóvel</p><p className="mt-0.5 font-medium">{projeto.tipoImovel}</p></div>
                      <div><p className="text-[#9CA3AF]">Cidade / Estado</p><p className="mt-0.5 font-medium">{projeto.cidade} — {projeto.estado}</p></div>
                      <div><p className="text-[#9CA3AF]">Endereço</p><p className="mt-0.5 font-medium text-xs">{projeto.endereco}</p></div>
                      {projeto.valorCaptar !== undefined && <div><p className="text-[#9CA3AF]">Valor a Captar</p><p className="mt-0.5 font-semibold text-navy">{formatCurrency(projeto.valorCaptar)}</p></div>}
                      {projeto.valorTotal !== undefined && <div><p className="text-[#9CA3AF]">Valor Total do Projeto</p><p className="mt-0.5 font-medium">{formatCurrency(projeto.valorTotal)}</p></div>}
                      {projeto.rentabilidadeEstimada !== undefined && <div><p className="text-[#9CA3AF]">Rentabilidade Estimada</p><p className="mt-0.5 font-medium text-green-700">{String(projeto.rentabilidadeEstimada)}% a.a.</p></div>}
                      {projeto.prazoObra !== undefined && <div><p className="text-[#9CA3AF]">Prazo de Obra</p><p className="mt-0.5 font-medium">{String(projeto.prazoObra)} meses</p></div>}
                      {projeto.modeloRetorno !== undefined && <div><p className="text-[#9CA3AF]">Modelo de Retorno</p><p className="mt-0.5 font-medium">{projeto.modeloRetorno}</p></div>}
                      {projeto.tipoOferta !== undefined && <div><p className="text-[#9CA3AF]">Tipo de Oferta</p><p className="mt-0.5 font-medium">{projeto.tipoOferta}</p></div>}
                    </div>
                    <div className="divider" />
                    <div>
                      <p className="mb-1.5 text-xs font-medium text-[#9CA3AF]">Descrição do Projeto</p>
                      <p className="text-sm leading-relaxed text-[#374151]">{projeto.descricao}</p>
                    </div>
                    {projeto.planoSaida !== undefined && (
                      <div>
                        <p className="mb-1.5 text-xs font-medium text-[#9CA3AF]">Plano de Saída dos Investidores</p>
                        <p className="text-sm leading-relaxed text-[#374151]">{projeto.planoSaida}</p>
                      </div>
                    )}
                  </div>
                )}

                {tab === "documentos" && (
                  <div className="animate-in space-y-2">
                    {projeto.documentos !== undefined
                      ? Object.entries(projeto.documentos).map(([key, url]) => {
                          if (url === undefined || url === null) return null;
                          const urls = Array.isArray(url) ? url : [url as string];
                          return urls.map((u: string, i: number) => (
                            <a key={`${key}-${String(i)}`} href={u} target="_blank" rel="noopener noreferrer"
                              className="flex items-center justify-between rounded-xl border border-[#E5E7EB] px-4 py-3 text-sm hover:bg-[#F9FAFB]">
                              <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-50">
                                  <FileText className="h-4 w-4 text-navy" />
                                </div>
                                <span className="font-medium text-[#374151]">{key}</span>
                              </div>
                              <ExternalLink className="h-4 w-4 text-[#9CA3AF]" />
                            </a>
                          ));
                        })
                      : <p className="py-4 text-center text-sm text-[#9CA3AF]">Nenhum documento enviado</p>
                    }
                  </div>
                )}

                {tab === "equipe" && (
                  <div className="animate-in space-y-3">
                    {(projeto.equipe ?? []).length === 0
                      ? <p className="py-4 text-center text-sm text-[#9CA3AF]">Nenhum membro cadastrado</p>
                      : (projeto.equipe ?? []).map((m, i) => (
                          <div key={i} className="flex gap-3 rounded-xl border border-[#E5E7EB] p-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy-100 text-navy font-bold">
                              {m.nome.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-[#111827]">{m.nome}</p>
                              <p className="text-xs text-[#9CA3AF]">{m.cargo}</p>
                              <p className="mt-1 text-sm text-[#374151]">{m.bio}</p>
                            </div>
                          </div>
                        ))
                    }
                  </div>
                )}

                {tab === "historico" && (
                  <ol className="animate-in space-y-3">
                    {(projeto.historico ?? []).length === 0
                      ? <p className="py-4 text-center text-sm text-[#9CA3AF]">Sem histórico</p>
                      : (projeto.historico ?? []).map((entry) => (
                          <li key={entry.criadoEm} className="flex gap-3">
                            <div className="mt-1.5 flex h-2.5 w-2.5 shrink-0 items-center justify-center">
                              <div className="h-2 w-2 rounded-full bg-navy" />
                            </div>
                            <div className="min-w-0 flex-1 pb-3 border-b border-[#F3F4F6] last:border-0">
                              <p className="text-sm font-medium text-[#111827]">{entry.descricao}</p>
                              <p className="mt-0.5 text-xs text-[#9CA3AF]">{formatDateTime(entry.criadoEm)}</p>
                            </div>
                          </li>
                        ))
                    }
                  </ol>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="card p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#9CA3AF]">Status Atual</p>
              <StatusBadge status={projeto.status} size="md" />
              <p className="mt-3 text-xs text-[#9CA3AF]">Atualizado em {formatDateTime(projeto.atualizadoEm)}</p>

              {projeto.analistaNome !== undefined && (
                <div className="mt-3 border-t border-[#E5E7EB] pt-3">
                  <p className="text-xs text-[#9CA3AF]">Analista responsável</p>
                  <p className="mt-0.5 text-sm font-medium text-[#374151]">{projeto.analistaNome}</p>
                </div>
              )}
            </div>

            {projeto.valorCaptar !== undefined && (
              <div className="card p-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#9CA3AF]">Financeiro</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-[#6B7280]">A captar</span><span className="font-semibold text-navy">{formatCurrency(projeto.valorCaptar)}</span></div>
                  {projeto.rentabilidadeEstimada !== undefined && <div className="flex justify-between"><span className="text-[#6B7280]">Rentabilidade</span><span className="font-medium text-green-700">{String(projeto.rentabilidadeEstimada)}% a.a.</span></div>}
                  {projeto.prazoRetorno !== undefined && <div className="flex justify-between"><span className="text-[#6B7280]">Retorno estimado</span><span className="font-medium">{String(projeto.prazoRetorno)} meses</span></div>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
