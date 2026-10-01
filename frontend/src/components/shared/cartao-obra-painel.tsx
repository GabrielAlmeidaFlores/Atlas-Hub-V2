import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { api, getApiErrorMessage } from "@/services/api";
import { useToastStore } from "@/stores/toast";
import type { CartaoLiberacao, CartaoObraDetalhe, StatusEtapaObra, StatusLiberacaoCartao } from "@/types";
import { DataTable } from "@/components/ui/data-table";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { STATUS_ETAPA_LABEL, statusEtapaClass } from "@/lib/cronograma";

const LIMITE_COLS = [
  { label: "Etapa" },
  { label: "Situação" },
  { label: "Orçado", align: "right" as const },
  { label: "Limite", align: "right" as const },
];

const LIB_LABEL: Record<StatusLiberacaoCartao, string> = {
  SOLICITADA: "Aguardando Atlas",
  CONFIRMADA: "Liberada",
  REJEITADA: "Recusada",
  CANCELADA: "Cancelada",
};

function libClass(status: StatusLiberacaoCartao): string {
  if (status === "CONFIRMADA") return "badge-aprovado";
  if (status === "SOLICITADA") return "badge-ajuste";
  return "badge-reprovado";
}

function liberacaoDaEtapa(data: CartaoObraDetalhe, etapaId: string): CartaoLiberacao | undefined {
  return data.liberacoes.find((item) => item.etapaId === etapaId);
}

interface Props {
  readonly data: CartaoObraDetalhe;
  readonly role: "admin" | "owner";
  readonly isMaster?: boolean;
  readonly cronogramaHref?: string;
  readonly onReload: () => Promise<void>;
  readonly onRegistrarPedido?: () => void;
}

export function CartaoObraPainel({
  data,
  role,
  isMaster = false,
  cronogramaHref,
  onReload,
  onRegistrarPedido,
}: Props): ReactNode {
  const addToast = useToastStore((s) => s.addToast);
  const [isSaving, setIsSaving] = useState(false);

  async function solicitarLiberacao(): Promise<void> {
    if (data.etapaVigenteId === undefined) return;
    setIsSaving(true);
    try {
      await api.post(`/projetos/${encodeURIComponent(data.projetoId)}/cartao/liberacoes`, {
        etapaId: data.etapaVigenteId,
      });
      addToast({ type: "success", title: "Liberação solicitada", description: "A Atlas confirma o limite desta etapa." });
      await onReload();
    } catch (err) {
      addToast({ type: "error", title: getApiErrorMessage(err) });
    } finally {
      setIsSaving(false);
    }
  }

  async function decidirLiberacao(etapaId: string, acao: "confirmar" | "rejeitar"): Promise<void> {
    setIsSaving(true);
    try {
      await api.post(`/admin/financeiro/cartoes/${encodeURIComponent(data.projetoId)}/liberacoes/${encodeURIComponent(etapaId)}/${acao}`, {});
      addToast({ type: "success", title: acao === "confirmar" ? "Etapa liberada" : "Liberação recusada" });
      await onReload();
    } catch (err) {
      addToast({ type: "error", title: getApiErrorMessage(err) });
    } finally {
      setIsSaving(false);
    }
  }

  const pendente = data.liberacoes.find((item) => item.status === "SOLICITADA");

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-normal text-foreground">Cartão da obra</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            O teto vigente é só a etapa em andamento. A incorporadora solicita; a Atlas confirma. Comissão Atlas é % da captação, não do cartão.
          </p>
        </div>
        <span className={cn("badge border", data.status === "SOLICITADO" ? "badge-aprovado" : "badge-ajuste")}>
          {data.status === "SOLICITADO" ? "Pedido ativo" : "Preparação"}
        </span>
      </div>
      <p className="alert-warn px-4 py-3 text-xs text-status-warning">
        Emissão, CDI e cashback ainda não estão ligados. A SPE precisa de conta no próprio CNPJ — workspace Atlas não serve.
      </p>
      {data.limiteRecalculado && (
        <p className="alert-info px-4 py-3 text-xs text-status-info">
          O pedido foi mantido. O limite foi atualizado automaticamente com o cronograma.
        </p>
      )}
      <div className="kpi-strip grid-cols-1 sm:grid-cols-3">
        <div className="card border-l-4 border-l-navy p-4">
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Limite vigente</p>
          <p className="mt-2 text-lg font-semibold text-foreground">{formatCurrency(data.limiteVigente)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{data.etapaVigenteNome ?? "Nenhuma etapa em andamento"}</p>
        </div>
        <div className="card p-4">
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Soma das etapas</p>
          <p className="mt-2 text-lg font-semibold text-foreground">{formatCurrency(data.limiteTotal)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Referência. Não é o teto liberado.</p>
        </div>
        <div className="card p-4">
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Titular</p>
          <p className="mt-2 text-sm font-semibold text-foreground">CNPJ da SPE</p>
          <p className="mt-1 text-xs text-muted-foreground">Cashback 1,5% fica na SPE</p>
        </div>
      </div>
      <DataTable columns={LIMITE_COLS} total={data.limites.length} emptyMessage="Cadastre etapas no cronograma para calcular o limite.">
        {data.limites.map((linha) => {
          const lib = liberacaoDaEtapa(data, linha.etapaId);
          return (
            <tr key={linha.etapaId} className="table-row">
              <td className="text-foreground">
                {linha.nome}
                {linha.vigente === true && <span className="ml-2 text-[10px] uppercase tracking-widest text-navy">Vigente</span>}
              </td>
              <td>
                {linha.statusExibicao !== undefined && (
                  <span className={cn("badge border", statusEtapaClass(linha.statusExibicao as StatusEtapaObra))}>
                    {STATUS_ETAPA_LABEL[linha.statusExibicao as StatusEtapaObra] ?? linha.statusExibicao}
                  </span>
                )}
                {lib !== undefined && (
                  <p className={cn("mt-1")}>
                    <span className={cn("badge border", libClass(lib.status))}>{LIB_LABEL[lib.status]}</span>
                  </p>
                )}
              </td>
              <td className="text-right text-muted-foreground">{formatCurrency(linha.valorOrcado)}</td>
              <td className="text-right font-medium text-foreground">{formatCurrency(linha.limiteProposto)}</td>
            </tr>
          );
        })}
      </DataTable>
      {data.status === "PREPARACAO" && data.bloqueiosRegistro.length > 0 && (
        <ul className="space-y-1 text-xs text-muted-foreground">
          {data.bloqueiosRegistro.map((item) => (
            <li key={item.codigo}>{item.mensagem}</li>
          ))}
        </ul>
      )}
      {data.cartao?.solicitadoEm !== undefined && (
        <p className="text-xs text-muted-foreground">
          Pedido do cartão em {formatDateTime(data.cartao.solicitadoEm)}
          {data.cartao.solicitadoPorNome !== undefined ? ` por ${data.cartao.solicitadoPorNome}` : ""}.
        </p>
      )}
      {role === "owner" && data.status === "PREPARACAO" && (
        <p className="text-xs text-muted-foreground">A Atlas ainda não registrou o pedido deste cartão.</p>
      )}
      {role === "owner" && pendente !== undefined && (
        <p className="text-xs text-muted-foreground">Aguardando a Atlas confirmar a etapa em andamento.</p>
      )}
      <div className="flex flex-wrap gap-2">
        {cronogramaHref !== undefined && (
          <Link to={cronogramaHref} className="btn btn-ghost btn-sm inline-flex">
            Ver cronograma
          </Link>
        )}
        {role === "admin" && isMaster && data.podeRegistrar && onRegistrarPedido !== undefined && (
          <button type="button" className="btn btn-secondary btn-sm rounded-[8px]" disabled={isSaving} onClick={onRegistrarPedido}>
            Registrar pedido do cartão
          </button>
        )}
        {role === "owner" && data.podeSolicitarLiberacao && (
          <button type="button" className="btn btn-primary btn-sm rounded-[8px]" disabled={isSaving} onClick={() => void solicitarLiberacao()}>
            Solicitar liberação da etapa
          </button>
        )}
        {role === "admin" && isMaster && pendente !== undefined && (
          <>
            <button type="button" className="btn btn-primary btn-sm rounded-[8px]" disabled={isSaving} onClick={() => void decidirLiberacao(pendente.etapaId, "confirmar")}>
              Confirmar liberação
            </button>
            <button type="button" className="btn btn-secondary btn-sm rounded-[8px]" disabled={isSaving} onClick={() => void decidirLiberacao(pendente.etapaId, "rejeitar")}>
              Recusar
            </button>
          </>
        )}
      </div>
    </section>
  );
}
