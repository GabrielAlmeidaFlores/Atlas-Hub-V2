import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CircleDollarSign } from "lucide-react";
import { api, getApiErrorMessage } from "@/services/api";
import type { CaptacaoEvento, CaptacaoListaResponse, CaptacaoOfertaResumo } from "@/types";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonPage } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable } from "@/components/ui/data-table";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

const OFERTA_COLS = [
  { label: "Projeto" },
  { label: "Status" },
  { label: "Captado" },
  { label: "Compras" },
  { label: "Atualizado" },
  { label: "", align: "right" as const },
];

const EVENTO_COLS = [
  { label: "Quando" },
  { label: "Evento" },
  { label: "Oferta" },
  { label: "Valor", align: "right" as const },
];

const TIPO_LABEL: Record<string, string> = {
  USER_ACTIVE: "Usuário ativo",
  INVESTOR_CREATED: "Investidor criado",
  PURCHASE_APPROVED: "Compra aprovada",
  PURCHASE_EXPIRED: "Compra expirada",
  OFFER_FINISHED_SUCCESS: "Oferta encerrada (sucesso)",
  OFFER_FINISHED_UNSUCCESS: "Oferta encerrada (insucesso)",
  OUTRO: "Outro evento",
};

function centsToReais(cents: number): string {
  return formatCurrency(cents / 100);
}

function progresso(oferta: CaptacaoOfertaResumo): number | null {
  if (oferta.valorCaptar === undefined || oferta.valorCaptar <= 0) return null;
  return Math.min(100, Math.round((oferta.valorAprovadoCents / 100 / oferta.valorCaptar) * 100));
}

function encerramentoLabel(oferta: CaptacaoOfertaResumo): string {
  if (oferta.encerramento === "FINISHED_SUCCESS") return "Sucesso";
  if (oferta.encerramento === "FINISHED_UNSUCCESS") return "Insucesso";
  return "Em captação";
}

function encerramentoClass(oferta: CaptacaoOfertaResumo): string {
  if (oferta.encerramento === "FINISHED_SUCCESS") return "badge-aprovado";
  if (oferta.encerramento === "FINISHED_UNSUCCESS") return "badge-reprovado";
  return "badge-ajuste";
}

export default function AdminCaptacaoListaPage(): ReactNode {
  const [data, setData] = useState<CaptacaoListaResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(): Promise<void> {
    const r = await api.get<CaptacaoListaResponse>("/admin/captacao");
    setData(r);
    setError(null);
  }

  useEffect(() => {
    void load()
      .catch((err: unknown) => {
        setError(getApiErrorMessage(err));
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <SkeletonPage />;
  if (data === null) {
    return (
      <div className="animate-in">
        <PageHeader title="Captação" description="Progresso das ofertas publicadas" />
        <div className="page-content">
          <EmptyState
            icon={CircleDollarSign}
            title="Não foi possível carregar a captação"
            description={error ?? "Tente novamente em instantes."}
            action={
              <button type="button" className="btn btn-primary btn-sm rounded-[8px]" onClick={() => { setIsLoading(true); void load().catch((err: unknown) => setError(getApiErrorMessage(err))).finally(() => setIsLoading(false)); }}>
                Tentar de novo
              </button>
            }
          />
        </div>
      </div>
    );
  }

  const totalCaptado = data.ofertas.reduce((sum, o) => sum + o.valorAprovadoCents, 0);
  const totalCompras = data.ofertas.reduce((sum, o) => sum + o.comprasAprovadas, 0);
  const semVinculo = data.ofertas.filter((o) => !o.vinculada).length;

  return (
    <div className="animate-in">
      <PageHeader
        title="Captação"
        description="Compras aprovadas e expiradas nas ofertas publicadas. O dinheiro do investidor permanece na plataforma até o encerramento."
      />
      <div className="page-content space-y-5">
        {!data.configured && (
          <p className="alert-warn px-4 py-3 text-xs text-status-warning">
            Webhook da Divify ainda não está ligado neste ambiente. Ofertas publicadas aparecem abaixo; valores atualizam com UserActiveEvent (com offerId), InvestorCreatedEvent, PurchaseApprovedEvent, PurchaseExpiredEvent e oferta encerrada.
          </p>
        )}
        {data.configured && data.apiConfigured === false && (
          <p className="alert-warn px-4 py-3 text-xs text-status-warning">
            Webhook ativo. API docs-third (`DIVIFY_API_BASE_URL` + token) ainda não configurada — compras sem valor no evento não serão enriquecidas.
          </p>
        )}

        <div className="kpi-strip grid-cols-1 sm:grid-cols-3">
          <div className="card border-l-4 border-l-navy p-4">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Captado (aprovado)</p>
            <p className="mt-2 text-lg font-semibold text-foreground">{centsToReais(totalCaptado)}</p>
          </div>
          <div className="card p-4">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Compras aprovadas</p>
            <p className="mt-2 text-lg font-semibold text-foreground">{totalCompras}</p>
          </div>
          <div className="card p-4">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Ofertas</p>
            <p className="mt-2 text-lg font-semibold text-foreground">{data.ofertas.length}</p>
            {semVinculo > 0 && (
              <p className="mt-1 text-xs text-status-warning">{semVinculo} sem projeto no Atlas</p>
            )}
          </div>
        </div>

        {data.ofertas.length === 0 ? (
          <EmptyState
            icon={CircleDollarSign}
            title="Nenhuma oferta em captação"
            description="Quando a curadoria confirmar a publicação, a oferta entra aqui. Compras aprovadas na plataforma passam a somar o progresso."
          />
        ) : (
          <DataTable columns={OFERTA_COLS} total={data.ofertas.length} emptyMessage="Nenhuma oferta.">
            {data.ofertas.map((oferta) => {
              const pct = progresso(oferta);
              return (
                <tr key={oferta.ofertaId} className="table-row">
                  <td>
                    <p className="font-semibold text-foreground">{oferta.projetoNome ?? "Oferta sem projeto"}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{oferta.ofertaId}</p>
                    {!oferta.vinculada && (
                      <p className="mt-0.5 text-xs text-status-warning">ID não encontrado no Atlas</p>
                    )}
                  </td>
                  <td>
                    <span className={cn("badge border", encerramentoClass(oferta))}>{encerramentoLabel(oferta)}</span>
                  </td>
                  <td>
                    <p className="font-medium text-foreground">{centsToReais(oferta.valorAprovadoCents)}</p>
                    {oferta.valorCaptar !== undefined && (
                      <p className="mt-0.5 text-xs text-muted-foreground">de {formatCurrency(oferta.valorCaptar)}</p>
                    )}
                    {pct !== null && (
                      <div className="mt-2 h-1.5 w-28 bg-muted">
                        <div className="h-1.5 bg-navy" style={{ width: `${String(pct)}%` }} />
                      </div>
                    )}
                  </td>
                  <td className="text-muted-foreground">
                    {oferta.comprasAprovadas} aprovada{oferta.comprasAprovadas === 1 ? "" : "s"}
                    {oferta.comprasExpiradas > 0 ? ` · ${String(oferta.comprasExpiradas)} expirada${oferta.comprasExpiradas === 1 ? "" : "s"}` : ""}
                    {oferta.investidores > 0 ? ` · ${String(oferta.investidores)} invest.` : ""}
                  </td>
                  <td className="text-muted-foreground">{oferta.atualizadoEm !== undefined ? formatDateTime(oferta.atualizadoEm) : "—"}</td>
                  <td className="text-right">
                    <Link
                      to={`/admin/captacao/${encodeURIComponent(oferta.ofertaId)}`}
                      state={oferta.projetoNome !== undefined ? { breadcrumb: oferta.projetoNome } : undefined}
                      className="btn btn-ghost btn-sm inline-flex"
                    >
                      Ver <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </DataTable>
        )}

        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-normal text-foreground">Eventos recentes</h2>
          <DataTable columns={EVENTO_COLS} total={data.eventos.length} emptyMessage="Nenhum evento recebido ainda.">
            {data.eventos.map((evento: CaptacaoEvento) => (
              <tr key={evento.id} className="table-row">
                <td className="text-muted-foreground">{formatDateTime(evento.recebidoEm)}</td>
                <td className="text-foreground">{TIPO_LABEL[evento.tipo] ?? evento.tipoOriginal}</td>
                <td className="text-muted-foreground">{evento.projetoNome ?? evento.ofertaId ?? "—"}</td>
                <td className={cn("text-right font-medium", evento.amountCents === undefined ? "text-muted-foreground" : "text-foreground")}>
                  {evento.amountCents === undefined ? "—" : centsToReais(evento.amountCents)}
                </td>
              </tr>
            ))}
          </DataTable>
        </section>
      </div>
    </div>
  );
}
