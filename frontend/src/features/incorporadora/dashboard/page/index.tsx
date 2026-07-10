import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Plus, FolderOpen, Clock, AlertCircle,
  CheckCircle, TrendingUp, ArrowRight, MapPin, Calendar,
} from "lucide-react";
import { api } from "@/services/api";
import type { Projeto, StatusProjeto } from "@/types";
import { StatusBadge } from "@/components/shared/status-badge";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton, SkeletonPage } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { formatCurrency, formatDate } from "@/lib/utils";

const STAT_ITEMS = [
  { key: ["RASCUNHO"] as StatusProjeto[], label: "Rascunhos", icon: FolderOpen, iconBg: "bg-gray-100", iconColor: "text-gray-500" },
  { key: ["SUBMETIDO", "EM_ANALISE"] as StatusProjeto[], label: "Em Análise", icon: Clock, iconBg: "bg-blue-50", iconColor: "text-blue-600" },
  { key: ["AJUSTE_SOLICITADO", "REPROVADO"] as StatusProjeto[], label: "Requer Atenção", icon: AlertCircle, iconBg: "bg-orange-50", iconColor: "text-orange-600" },
  { key: ["APROVADO", "OFERTA_CRIADA"] as StatusProjeto[], label: "Publicados", icon: TrendingUp, iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
] as const;

export default function IncorporadoraDashboardPage(): ReactNode {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void api.get<{ items: Projeto[] }>("/projetos")
      .then((d) => setProjetos(d.items))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <SkeletonPage />;

  const total = projetos.length;

  return (
    <div className="animate-in">
      <PageHeader
        title="Meus Projetos"
        description="Acompanhe e gerencie todos os seus projetos na plataforma"
        action={
          <Link to="/projetos/novo" className="btn btn-primary">
            <Plus className="h-4 w-4" /> Novo Projeto
          </Link>
        }
      />

      <div className="page-content space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {STAT_ITEMS.map(({ key, label, icon, iconBg, iconColor }) => {
            const count = projetos.filter((p) => (key as readonly StatusProjeto[]).includes(p.status)).length;
            return (
              <StatCard
                key={label}
                label={label}
                value={String(count)}
                icon={icon}
                iconBg={iconBg}
                iconColor={iconColor}
                sublabel={`de ${String(total)} total`}
              />
            );
          })}
        </div>

        {/* Projects list */}
        {projetos.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="Nenhum projeto ainda"
            description="Crie seu primeiro projeto para começar a captar recursos com investidores"
            action={
              <Link to="/projetos/novo" className="btn btn-primary">
                <Plus className="h-4 w-4" /> Criar primeiro projeto
              </Link>
            }
          />
        ) : (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#374151]">Todos os projetos</h2>
              <span className="text-xs text-[#9CA3AF]">{String(total)} projeto{total !== 1 ? "s" : ""}</span>
            </div>

            {/* Mobile: cards */}
            <div className="space-y-3 sm:hidden">
              {projetos.map((p) => (
                <Link key={p.id} to={`/projetos/${p.id}`} className="card card-hover block p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-[#111827]">{p.nome}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-[#6B7280]">
                        <MapPin className="h-3 w-3 shrink-0" /> {p.cidade} — {p.estado}
                      </div>
                      {p.valorCaptar !== undefined && (
                        <p className="mt-1 text-xs font-medium text-[#374151]">{formatCurrency(p.valorCaptar)}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge status={p.status} />
                      <ArrowRight className="h-4 w-4 text-[#9CA3AF]" />
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
                    <th>Submetido em</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {projetos.map((p) => (
                    <tr key={p.id} className="table-row">
                      <td>
                        <p className="font-medium text-[#111827]">{p.nome}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-[#9CA3AF]">
                          <MapPin className="h-3 w-3" /> {p.cidade}, {p.estado}
                        </p>
                      </td>
                      <td className="font-medium text-[#374151]">
                        {p.valorCaptar !== undefined ? formatCurrency(p.valorCaptar) : <span className="text-[#9CA3AF]">—</span>}
                      </td>
                      <td className="text-[#6B7280]">
                        {p.submetidoEm !== undefined
                          ? <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(p.submetidoEm)}</span>
                          : <span className="text-[#9CA3AF]">—</span>}
                      </td>
                      <td><StatusBadge status={p.status} /></td>
                      <td className="text-right">
                        <Link to={`/projetos/${p.id}`} className="btn btn-ghost btn-sm inline-flex">
                          Ver detalhes <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
