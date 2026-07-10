import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { api } from "@/services/api";
import type { Projeto } from "@/types";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonPage } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { formatDate, formatCurrency } from "@/lib/utils";
import { History, ExternalLink, ArrowRight, MapPin } from "lucide-react";

export default function AdminHistoricoPage(): ReactNode {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void api.get<{ items: Projeto[] }>("/admin/historico")
      .then((d) => setProjetos(d.items))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <SkeletonPage />;

  return (
    <div className="animate-in">
      <PageHeader
        title="Histórico de Decisões"
        description={`${String(projetos.length)} projeto${projetos.length !== 1 ? "s" : ""} decididos`}
      />

      <div className="page-content">
        {projetos.length === 0 ? (
          <EmptyState icon={History} title="Nenhuma decisão ainda" description="Projetos aprovados e reprovados aparecerão aqui" />
        ) : (
          <>
            {/* Mobile */}
            <div className="space-y-3 sm:hidden">
              {projetos.map((p) => (
                <div key={p.id} className="card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[#111827]">{p.nome}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-[#9CA3AF]"><MapPin className="h-3 w-3" />{p.cidade}, {p.estado}</p>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-[#6B7280]">
                    <span>{p.analistaNome ?? "—"}</span>
                    <span>{p.aprovadoEm !== undefined ? formatDate(p.aprovadoEm) : p.reprovadoEm !== undefined ? formatDate(p.reprovadoEm) : "—"}</span>
                  </div>
                  {p.ofertaLink !== undefined && (
                    <a href={p.ofertaLink} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center gap-1 text-xs font-medium text-navy hover:underline">
                      <ExternalLink className="h-3 w-3" /> Ver oferta
                    </a>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop */}
            <div className="table-container hidden sm:block">
              <table className="table-base">
                <thead className="table-head">
                  <tr>
                    <th>Projeto</th>
                    <th>Valor</th>
                    <th>Analista</th>
                    <th>Decisão</th>
                    <th>Data</th>
                    <th>Oferta Divify</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {projetos.map((p) => (
                    <tr key={p.id} className="table-row">
                      <td>
                        <p className="font-semibold text-[#111827]">{p.nome}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-[#9CA3AF]"><MapPin className="h-3 w-3" />{p.cidade}, {p.estado}</p>
                      </td>
                      <td className="font-medium text-[#374151]">
                        {p.valorCaptar !== undefined ? formatCurrency(p.valorCaptar) : "—"}
                      </td>
                      <td className="text-[#6B7280]">{p.analistaNome ?? "—"}</td>
                      <td><StatusBadge status={p.status} /></td>
                      <td className="text-[#6B7280]">
                        {p.aprovadoEm !== undefined ? formatDate(p.aprovadoEm)
                          : p.reprovadoEm !== undefined ? formatDate(p.reprovadoEm)
                          : "—"}
                      </td>
                      <td>
                        {p.ofertaLink !== undefined && p.ofertaId !== undefined ? (
                          <a href={p.ofertaLink} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium text-navy hover:underline">
                            {p.ofertaId} <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : <span className="text-[#9CA3AF]">—</span>}
                      </td>
                      <td className="text-right">
                        <Link to={`/admin/curadoria/${p.id}`} className="btn btn-ghost btn-sm inline-flex">
                          Ver <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
