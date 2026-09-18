import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarRange } from "lucide-react";
import { api, getApiErrorMessage } from "@/services/api";
import type { CronogramaListaItem } from "@/types";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonPage } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, cn } from "@/lib/utils";
import { SITUACAO_LABEL, situacaoClass } from "@/lib/cronograma";

const COLUMNS = [
  { label: "Projeto" },
  { label: "Avanço" },
  { label: "Orçado", align: "right" as const },
  { label: "Realizado", align: "right" as const },
  { label: "Saldo", align: "right" as const },
  { label: "Situação" },
  { label: "", align: "right" as const },
];

export default function AdminCronogramaListaPage(): ReactNode {
  const [items, setItems] = useState<CronogramaListaItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(): Promise<void> {
    const r = await api.get<{ items: CronogramaListaItem[] }>("/admin/cronograma");
    setItems(r.items);
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
  if (items === null) {
    return (
      <div className="animate-in">
        <PageHeader title="Cronograma" description="Acompanhamento físico e financeiro das obras" />
        <div className="page-content">
          <EmptyState
            icon={CalendarRange}
            title="Não foi possível carregar o cronograma"
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

  return (
    <div className="animate-in">
      <PageHeader title="Cronograma" description="Desvios de prazo e orçamento nas obras aprovadas" />
      <div className="page-content">
        {items.length === 0 ? (
          <EmptyState icon={CalendarRange} title="Nenhuma obra elegível" description="Projetos aprovados ou com oferta criada aparecerão aqui." />
        ) : (
          <DataTable columns={COLUMNS} total={items.length} minWidth={880}>
            {items.map((item) => (
              <tr key={item.projetoId}>
                <td className="px-5 py-3">
                  <p className="font-medium">{item.nome}</p>
                  <p className="text-xs text-muted-foreground">{item.cidade}, {item.estado}</p>
                  <div className="mt-1"><StatusBadge status={item.status} /></div>
                </td>
                <td className="px-5 py-3">
                  <p className="font-medium">{String(item.percentualAvanco)}%</p>
                  <p className="text-xs text-muted-foreground">{String(item.etapasAtrasadas)} atrasada{item.etapasAtrasadas === 1 ? "" : "s"}</p>
                </td>
                <td className="px-5 py-3 text-right font-medium">{formatCurrency(item.valorOrcado)}</td>
                <td className="px-5 py-3 text-right font-medium">{formatCurrency(item.valorRealizado)}</td>
                <td className={cn("px-5 py-3 text-right font-medium", item.saldo < 0 ? "text-status-danger" : "")}>{formatCurrency(item.saldo)}</td>
                <td className="px-5 py-3.5">
                  <span className={cn("whitespace-nowrap px-3 py-1", situacaoClass(item.situacaoOrcamento))}>
                    {SITUACAO_LABEL[item.situacaoOrcamento]}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <Link to={`/admin/cronograma/${item.projetoId}`} className="btn btn-ghost btn-sm inline-flex">
                    Ver <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </div>
    </div>
  );
}
