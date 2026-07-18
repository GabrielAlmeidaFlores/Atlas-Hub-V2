import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Plus, FolderOpen, Clock, AlertCircle,
  TrendingUp, ArrowRight, MapPin, Calendar,
} from "lucide-react";
import { api } from "@/services/api";
import type { Projeto, StatusProjeto } from "@/types";
import { StatusBadge } from "@/components/shared/status-badge";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonPage } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { FilterBar, type FilterField } from "@/components/ui/filter-bar";
import { formatCurrency, formatDate } from "@/lib/utils";

const STAT_ITEMS = [
  { key: ["RASCUNHO"] as StatusProjeto[], label: "Rascunhos", icon: FolderOpen, accent: "neutral" as const },
  { key: ["SUBMETIDO", "EM_ANALISE"] as StatusProjeto[], label: "Em Análise", icon: Clock, accent: "info" as const },
  { key: ["AJUSTE_SOLICITADO", "REPROVADO"] as StatusProjeto[], label: "Requer Atenção", icon: AlertCircle, accent: "warning" as const },
  { key: ["APROVADO", "OFERTA_CRIADA"] as StatusProjeto[], label: "Publicados", icon: TrendingUp, accent: "success" as const },
] as const;

const FILTER_FIELDS: FilterField[] = [
  { type: "text", key: "q", label: "Busca", placeholder: "Nome ou cidade…", width: "w-[220px]" },
  {
    type: "select",
    key: "status",
    label: "Status",
    options: [
      { value: "RASCUNHO", label: "Rascunho" },
      { value: "SUBMETIDO", label: "Submetido" },
      { value: "EM_ANALISE", label: "Em análise" },
      { value: "AJUSTE_SOLICITADO", label: "Ajuste solicitado" },
      { value: "REPROVADO", label: "Reprovado" },
      { value: "APROVADO", label: "Aprovado" },
      { value: "OFERTA_CRIADA", label: "Oferta criada" },
    ],
  },
];

const COLUMNS = [
  { label: "Projeto" },
  { label: "Valor a Captar" },
  { label: "Submetido em" },
  { label: "Status" },
  { label: "", align: "right" as const },
];

export default function IncorporadoraDashboardPage(): ReactNode {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<Record<string, string | undefined>>({});

  useEffect(() => {
    void api.get<{ items: Projeto[] }>("/projetos")
      .then((d) => setProjetos(d.items))
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = (filters.q ?? "").trim().toLowerCase();
    const status = filters.status;
    return projetos.filter((p) => {
      if (status !== undefined && status !== "all" && p.status !== (status as StatusProjeto)) return false;
      if (q.length === 0) return true;
      const hay = `${p.nome} ${p.cidade} ${p.estado}`.toLowerCase();
      return hay.includes(q);
    });
  }, [projetos, filters]);

  if (isLoading) return <SkeletonPage />;

  const total = projetos.length;

  function setFilter(key: string, value: string | null): void {
    setFilters((prev) => {
      const next = { ...prev };
      if (value === null || value.length === 0 || value === "all") {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
  }

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
        <div className="kpi-strip grid-cols-2 lg:grid-cols-4">
          {STAT_ITEMS.map(({ key, label, icon, accent }) => {
            const count = projetos.filter((p) => (key as readonly StatusProjeto[]).includes(p.status)).length;
            return (
              <StatCard
                key={label}
                label={label}
                value={String(count)}
                icon={icon}
                accent={accent}
                sublabel={`de ${String(total)} total`}
              />
            );
          })}
        </div>

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
          <div className="space-y-4">
            <FilterBar
              fields={FILTER_FIELDS}
              values={filters}
              onChange={setFilter}
              onClear={() => setFilters({})}
            />

            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Todos os projetos</h2>
              <span className="text-xs text-muted-foreground">{String(filtered.length)} projeto{filtered.length !== 1 ? "s" : ""}</span>
            </div>

            <div className="space-y-3 sm:hidden">
              {filtered.map((p) => (
                <Link key={p.id} to={`/projetos/${p.id}`} className="card card-hover block p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold uppercase tracking-widest text-foreground">{p.nome}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" /> {p.cidade} — {p.estado}
                      </div>
                      {p.valorCaptar !== undefined && (
                        <p className="mt-1 text-xs font-medium text-foreground">{formatCurrency(p.valorCaptar)}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge status={p.status} />
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="hidden sm:block">
              <DataTable columns={COLUMNS} total={filtered.length} emptyMessage="Nenhum projeto com esses filtros.">
                {filtered.map((p) => (
                  <tr key={p.id} className="table-row">
                    <td>
                      <p className="font-medium text-foreground">{p.nome}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {p.cidade}, {p.estado}
                      </p>
                    </td>
                    <td className="font-medium text-foreground">
                      {p.valorCaptar !== undefined ? formatCurrency(p.valorCaptar) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="text-muted-foreground">
                      {p.submetidoEm !== undefined
                        ? <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(p.submetidoEm)}</span>
                        : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td><StatusBadge status={p.status} /></td>
                    <td className="text-right">
                      <Link to={`/projetos/${p.id}`} className="btn btn-ghost btn-sm inline-flex">
                        Ver detalhes <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </DataTable>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
