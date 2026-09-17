import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { api, getApiErrorMessage } from "@/services/api";
import type { CaptacaoCompraStatus, CaptacaoOfertaDetalhe } from "@/types";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonPage } from "@/components/ui/skeleton";
import { DataTable } from "@/components/ui/data-table";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

const COMPRA_COLS = [
  { label: "Compra" },
  { label: "Status" },
  { label: "Valor", align: "right" as const },
  { label: "Atualizado" },
];

const EVENTO_COLS = [
  { label: "Quando" },
  { label: "Evento" },
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

const STATUS_LABEL: Record<CaptacaoCompraStatus, string> = {
  PENDING: "Pendente",
  CANCELED: "Cancelada",
  FAILED: "Falhou",
  FAILED_REFUND: "Estorno falhou",
  APPROVED: "Aprovada",
  EXPIRED: "Expirada",
  REFUNDED: "Estornada",
  COMPLETED: "Concluída",
  UNKNOWN: "Desconhecido",
};

function centsToReais(cents: number): string {
  return formatCurrency(cents / 100);
}

function statusClass(status: CaptacaoCompraStatus): string {
  if (status === "APPROVED" || status === "COMPLETED") return "badge-aprovado";
  if (status === "PENDING") return "badge-ajuste";
  return "badge-reprovado";
}

export default function AdminCaptacaoOfertaPage(): ReactNode {
  const { ofertaId = "" } = useParams();
  const [data, setData] = useState<CaptacaoOfertaDetalhe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(): Promise<void> {
    const r = await api.get<CaptacaoOfertaDetalhe>(`/admin/captacao/ofertas/${encodeURIComponent(ofertaId)}`);
    setData(r);
    setError(null);
  }

  useEffect(() => {
    setIsLoading(true);
    void load()
      .catch((err: unknown) => {
        setData(null);
        setError(getApiErrorMessage(err));
      })
      .finally(() => setIsLoading(false));
  }, [ofertaId]);

  if (isLoading) return <SkeletonPage />;
  if (data === null) {
    return (
      <div className="page-content py-10">
        <p className="text-sm text-muted-foreground">{error ?? "Oferta não encontrada."}</p>
        <Link to="/admin/captacao" className="btn btn-outline btn-sm mt-4 inline-flex">Voltar</Link>
      </div>
    );
  }

  const titulo = data.projeto?.nome ?? data.ofertaId;
  const alvo = data.projeto?.valorCaptar;
  const pct = alvo !== null && alvo !== undefined && alvo > 0
    ? Math.min(100, Math.round((data.valorAprovadoCents / 100 / alvo) * 100))
    : null;

  return (
    <div className="animate-in">
      <PageHeader
        title={titulo}
        description={data.projeto !== null ? `${data.projeto.cidade}/${data.projeto.estado}` : data.ofertaId}
        breadcrumb={
          <Link to="/admin/captacao" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-navy">
            <ArrowLeft className="h-3 w-3" /> Captação
          </Link>
        }
      />

      <div className="page-content space-y-6">
        {!data.configured && (
          <p className="alert-warn px-4 py-3 text-xs text-status-warning">
            Eventos da plataforma ainda não entram neste ambiente.
          </p>
        )}

        <div className="kpi-strip grid-cols-1 sm:grid-cols-4">
          <div className="card border-l-4 border-l-navy p-4">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Captado</p>
            <p className="mt-2 text-lg font-semibold text-foreground">{centsToReais(data.valorAprovadoCents)}</p>
            {alvo !== null && alvo !== undefined && (
              <p className="mt-1 text-xs text-muted-foreground">de {formatCurrency(alvo)}{pct !== null ? ` (${String(pct)}%)` : ""}</p>
            )}
          </div>
          <div className="card p-4">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Compras aprovadas</p>
            <p className="mt-2 text-lg font-semibold text-foreground">{data.comprasAprovadas}</p>
          </div>
          <div className="card p-4">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Encerramento</p>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {data.encerramento === "FINISHED_SUCCESS"
                ? "Sucesso"
                : data.encerramento === "FINISHED_UNSUCCESS"
                  ? "Insucesso"
                  : "Em captação"}
            </p>
            {data.encerradaEm !== undefined && (
              <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(data.encerradaEm)}</p>
            )}
          </div>
          <div className="card p-4">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">ID da oferta</p>
            <p className="mt-2 break-all text-sm text-foreground">{data.ofertaId}</p>
            {data.projeto?.ofertaLink !== null && data.projeto?.ofertaLink !== undefined && (
              <a href={data.projeto.ofertaLink} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-navy hover:underline">
                Abrir oferta
              </a>
            )}
          </div>
        </div>

        {data.projeto !== null && (
          <p className="text-xs text-muted-foreground">
            Projeto no Atlas:{" "}
            <Link to={`/admin/curadoria/${data.projeto.id}`} className="text-navy hover:underline">{data.projeto.nome}</Link>
          </p>
        )}

        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-normal text-foreground">Compras</h2>
          <DataTable columns={COMPRA_COLS} total={data.compras.length} emptyMessage="Nenhuma compra recebida nesta oferta.">
            {data.compras.map((compra) => (
              <tr key={compra.purchaseId} className="table-row">
                <td>
                  <p className="font-medium text-foreground">{compra.purchaseId}</p>
                  {compra.investorId !== undefined && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{compra.investorId}</p>
                  )}
                </td>
                <td>
                  <span className={cn("badge border", statusClass(compra.status))}>{STATUS_LABEL[compra.status]}</span>
                </td>
                <td className="text-right font-medium text-foreground">
                  {compra.amountCents === undefined ? "—" : centsToReais(compra.amountCents)}
                </td>
                <td className="text-muted-foreground">{formatDateTime(compra.atualizadoEm)}</td>
              </tr>
            ))}
          </DataTable>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-normal text-foreground">Eventos</h2>
          <DataTable columns={EVENTO_COLS} total={data.eventos.length} emptyMessage="Nenhum evento nesta oferta.">
            {data.eventos.map((evento) => (
              <tr key={evento.id} className="table-row">
                <td className="text-muted-foreground">{formatDateTime(evento.recebidoEm)}</td>
                <td className="text-foreground">{TIPO_LABEL[evento.tipo] ?? evento.tipoOriginal}</td>
                <td className="text-right font-medium text-foreground">
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
