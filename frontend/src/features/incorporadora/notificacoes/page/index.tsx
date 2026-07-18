import { useEffect, type ReactNode } from "react";
import { Bell, Check, CheckCheck } from "lucide-react";
import { useNotificacoesStore } from "@/stores/notificacoes";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Notificacao } from "@/types";

const TIPO_COLORS: Record<Notificacao["tipo"], string> = {
  PROJETO_SUBMETIDO: "bg-status-info-subtle text-status-info",
  ANALISE_INICIADA: "bg-status-warning-subtle text-status-warning",
  AJUSTE_SOLICITADO: "bg-status-warning-subtle text-status-warning",
  REPROVADO: "bg-status-danger-subtle text-status-danger",
  APROVADO: "bg-status-success-subtle text-status-success",
  OFERTA_CRIADA: "bg-status-success-subtle text-status-success",
};

export default function IncorporadoraNotificacoesPage(): ReactNode {
  const { items, isLoading, fetchNotificacoes, marcarLida } = useNotificacoesStore();

  useEffect(() => { void fetchNotificacoes(); }, [fetchNotificacoes]);

  const naoLidas = items.filter((n) => !n.lida).length;

  function handleMarcarTodas(): void {
    items.filter((n) => !n.lida).forEach((n) => { void marcarLida(n.criadoEm); });
  }

  return (
    <div className="animate-in">
      <PageHeader
        title="Notificações"
        description={naoLidas > 0 ? `${String(naoLidas)} não lida${naoLidas !== 1 ? "s" : ""}` : "Todas lidas"}
        action={
          naoLidas > 0 ? (
            <button type="button" onClick={handleMarcarTodas} className="btn btn-secondary btn-sm">
              <CheckCheck className="h-3.5 w-3.5" /> Marcar todas como lidas
            </button>
          ) : undefined
        }
      />

      <div className="page-content">
        {isLoading ? (
          <div className="card divide-y divide-border">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 p-4">
                <Skeleton className="h-9 w-9  " />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-72" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="Nenhuma notificação"
            description="Você será notificado sobre o andamento dos seus projetos aqui"
          />
        ) : (
          <div className="card overflow-hidden divide-y divide-border">
            {items.map((notif) => (
              <div
                key={notif.criadoEm}
                className={cn(
                  "flex items-start gap-4 px-4 py-4 transition-colors",
                  !notif.lida && "bg-navy-50",
                )}
              >
                <div className={cn(
                  "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center  ",
                  TIPO_COLORS[notif.tipo] ?? "bg-muted text-muted-foreground",
                )}>
                  <Bell className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm", !notif.lida ? "font-semibold text-foreground" : "font-medium text-foreground")}>
                    {notif.titulo}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{notif.mensagem}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{timeAgo(notif.criadoEm)}</p>
                </div>

                {!notif.lida && (
                  <button
                    type="button"
                    onClick={() => void marcarLida(notif.criadoEm)}
                    className="shrink-0   p-1.5 text-muted-foreground hover:bg-muted hover:text-navy"
                    title="Marcar como lida"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
