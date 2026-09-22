import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarRange } from "lucide-react";
import { api, getApiErrorMessage } from "@/services/api";
import { useAuthStore } from "@/stores/auth";
import type { CartaoObraDetalhe, CronogramaDetalhe } from "@/types";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonPage } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { CronogramaPainel } from "@/components/shared/cronograma-painel";
import { CartaoObraPainel } from "@/components/shared/cartao-obra-painel";

export default function AdminCronogramaDetalhePage(): ReactNode {
  const { projetoId } = useParams<{ projetoId: string }>();
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<CronogramaDetalhe | null>(null);
  const [cartao, setCartao] = useState<CartaoObraDetalhe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    if (projetoId === undefined) return;
    const r = await api.get<CronogramaDetalhe>(`/admin/cronograma/projetos/${projetoId}`);
    setData(r);
    try {
      setCartao(await api.get<CartaoObraDetalhe>(`/admin/financeiro/cartoes/${encodeURIComponent(projetoId)}`));
    } catch {
      setCartao(null);
    }
    setError(null);
  }, [projetoId]);

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
        <PageHeader title="Cronograma" />
        <div className="page-content">
          <EmptyState
            icon={CalendarRange}
            title="Não foi possível abrir o cronograma"
            description={error ?? "Tente novamente em instantes."}
            action={
              <Link to="/admin/cronograma" className="btn btn-primary btn-sm rounded-[8px]">Voltar</Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <PageHeader
        title={data.projeto.nome}
        description={`${data.projeto.cidade}, ${data.projeto.estado}`}
        breadcrumb={
          <Link to="/admin/cronograma" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-navy">
            <ArrowLeft className="h-3 w-3" /> Cronograma
          </Link>
        }
      />
      <div className="page-content space-y-6">
        {cartao !== null && (
          <CartaoObraPainel
            data={cartao}
            role="admin"
            isMaster={user?.perfil === "ADMIN_MASTER"}
            onReload={load}
          />
        )}
        <CronogramaPainel data={data} onReload={load} />
      </div>
    </div>
  );
}
