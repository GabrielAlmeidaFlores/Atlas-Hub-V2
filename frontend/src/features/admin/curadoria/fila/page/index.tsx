import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { api } from "@/services/api";
import type { Projeto } from "@/types";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonPage } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { formatCurrency, timeAgo } from "@/lib/utils";
import { ClipboardList, ArrowRight, MapPin, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminCuradoriaFilaPage(): ReactNode {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void api.get<{ items: Projeto[] }>("/admin/curadoria")
      .then((d) => setProjetos(d.items))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <SkeletonPage />;

  return (
    <div className="animate-in">
      <PageHeader
        title="Fila de Curadoria"
        description={`${String(projetos.length)} projeto${projetos.length !== 1 ? "s" : ""} aguardando análise · Ordem: mais antigo primeiro`}
      />

      <div className="page-content">
        {projetos.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Fila vazia"
            description="Nenhum projeto aguardando análise no momento"
          />
        ) : (
          <>
            {/* Mobile: cards */}
            <div className="space-y-3 sm:hidden">
              {projetos.map((p) => (
                <Link key={p.id} to={`/admin/curadoria/${p.id}`} className="card card-hover block p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-[#111827]">{p.nome}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-[#9CA3AF]">
                        <MapPin className="h-3 w-3" />{p.cidade}, {p.estado}
                      </p>
                      {p.submetidoEm !== undefined && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-[#9CA3AF]">
                          <Clock className="h-3 w-3" />{timeAgo(p.submetidoEm)}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge status={p.status} />
                      <span className="text-xs text-[#9CA3AF]">Rev. {String(p.revisao)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="table-container hidden sm:block">
              <table className="table-base">
                <thead className="table-head">
                  <tr>
                    <th>Projeto</th>
                    <th>Valor a Captar</th>
                    <th>Submetido</th>
                    <th>Revisão</th>
                    <th>Status</th>
                    <th>Analista</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {projetos.map((p) => {
                    const urgente = p.submetidoEm !== undefined &&
                      (Date.now() - new Date(p.submetidoEm).getTime()) > 3 * 24 * 60 * 60 * 1000;

                    return (
                      <tr key={p.id} className={cn("table-row", urgente && "bg-amber-50/30")}>
                        <td>
                          <p className="font-semibold text-[#111827]">{p.nome}</p>
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-[#9CA3AF]">
                            <MapPin className="h-3 w-3" />{p.cidade}, {p.estado}
                          </p>
                        </td>
                        <td className="font-medium text-[#374151]">
                          {p.valorCaptar !== undefined ? formatCurrency(p.valorCaptar) : <span className="text-[#9CA3AF]">—</span>}
                        </td>
                        <td>
                          {p.submetidoEm !== undefined ? (
                            <div>
                              <p className="text-sm text-[#374151]">{timeAgo(p.submetidoEm)}</p>
                              {urgente && <p className="text-xs text-amber-600">⚠ Há mais de 3 dias</p>}
                            </div>
                          ) : <span className="text-[#9CA3AF]">—</span>}
                        </td>
                        <td>
                          <span className="rounded-full bg-[#F3F4F6] px-2 py-0.5 text-xs font-medium text-[#6B7280]">
                            Rev. {String(p.revisao)}
                          </span>
                        </td>
                        <td><StatusBadge status={p.status} /></td>
                        <td className="text-sm text-[#6B7280]">{p.analistaNome ?? <span className="text-[#9CA3AF]">—</span>}</td>
                        <td className="text-right">
                          <Link to={`/admin/curadoria/${p.id}`} className="btn btn-primary btn-sm inline-flex">
                            {p.status === "SUBMETIDO" ? "Iniciar" : "Continuar"}
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
