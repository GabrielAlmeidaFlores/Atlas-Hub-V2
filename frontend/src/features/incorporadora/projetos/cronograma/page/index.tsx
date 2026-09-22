import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarRange } from "lucide-react";
import { api, getApiErrorMessage } from "@/services/api";
import type { CartaoObraDetalhe, CronogramaDetalhe } from "@/types";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonPage } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { CronogramaPainel } from "@/components/shared/cronograma-painel";
import { CartaoObraPainel } from "@/components/shared/cartao-obra-painel";

export default function IncorporadoraCronogramaPage(): ReactNode {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<CronogramaDetalhe | null>(null);
  const [cartao, setCartao] = useState<CartaoObraDetalhe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    if (id === undefined) return;
    const r = await api.get<CronogramaDetalhe>(`/projetos/${id}/cronograma`);
    setData(r);
    try {
      setCartao(await api.get<CartaoObraDetalhe>(`/projetos/${id}/cartao`));
    } catch {
      setCartao(null);
    }
    setError(null);
  }, [id]);

  useEffect(() => {
    void load()
      .catch((err: unknown) => {
        setError(getApiErrorMessage(err));
      })
      .finally(() => setIsLoading(false));
  }, [load]);

  if (isLoading) return <SkeletonPage />;
  if (data === null) {
    return (
      <div className="animate-in">
        <PageHeader title="Cronograma" description="Acompanhamento físico e financeiro da obra" />
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
      <PageHeader
        title="Cronograma da obra"
        description={`${data.projeto.nome} · ${data.projeto.cidade}, ${data.projeto.estado}`}
        breadcrumb={
          <Link to={`/projetos/${data.projeto.id}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-navy">
            <ArrowLeft className="h-3 w-3" /> Projeto
          </Link>
        }
      />
      <div className="page-content space-y-6">
        {cartao !== null && (
          <CartaoObraPainel data={cartao} role="owner" onReload={load} />
        )}
        <CronogramaPainel data={data} onReload={load} />
      </div>
    </div>
  );
}
