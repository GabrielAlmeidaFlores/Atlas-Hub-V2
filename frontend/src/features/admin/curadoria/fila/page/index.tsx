import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { api } from "@/services/api";
import type { Projeto, StatusProjeto } from "@/types";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonPage } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { FilterBar, type FilterField } from "@/components/ui/filter-bar";
import { formatCurrency, timeAgo } from "@/lib/utils";
import { ClipboardList, ArrowRight, MapPin, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const FILTER_FIELDS: FilterField[] = [
  { type: "text", key: "q", label: "Busca", placeholder: "Nome ou cidade…", width: "w-[220px]" },
  {
    type: "select",
    key: "status",
    label: "Status",
    options: [
      { value: "SUBMETIDO", label: "Submetido" },
      { value: "EM_ANALISE", label: "Em análise" },
      { value: "AJUSTE_SOLICITADO", label: "Ajuste solicitado" },
    ],
  },
];

const COLUMNS = [
  { label: "Projeto" },
  { label: "Valor a Captar" },
  { label: "Submetido" },
  { label: "Revisão" },
  { label: "Status" },
  { label: "Analista" },
  { label: "", align: "right" as const },
];

export default function AdminCuradoriaFilaPage(): ReactNode {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<Record<string, string | undefined>>({});

  useEffect(() => {
    void api.get<{ items: Projeto[] }>("/admin/curadoria")
      .then((d) => setProjetos(d.items))
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = (filters.q ?? "").trim().toLowerCase();
    const status = filters.status;
    return projetos.filter((p) => {
      if (status !== undefined && status !== "all" && p.status !== (status as StatusProjeto)) return false;
      if (q.length === 0) return true;
      const hay = `${p.nome} ${p.cidade} ${p.estado} ${p.analistaNome ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [projetos, filters]);

  if (isLoading) return <SkeletonPage />;

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
        title="Fila de Curadoria"
        description={`${String(filtered.length)} projeto${filtered.length !== 1 ? "s" : ""} aguardando análise · Ordem: mais antigo primeiro`}
      />

      <div className="page-content space-y-4">
        {projetos.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Fila vazia"
            description="Nenhum projeto aguardando análise no momento"
          />
        ) : (
          <>
            <FilterBar
              fields={FILTER_FIELDS}
              values={filters}
              onChange={setFilter}
              onClear={() => setFilters({})}
            />

            <div className="space-y-3 sm:hidden">
              {filtered.map((p) => (
                <Link key={p.id} to={`/admin/curadoria/${p.id}`} className="card card-hover block p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-foreground">{p.nome}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />{p.cidade}, {p.estado}
                      </p>
                      {p.submetidoEm !== undefined && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />{timeAgo(p.submetidoEm)}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge status={p.status} />
                      <span className="text-xs text-muted-foreground">Rev. {String(p.revisao)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="hidden sm:block">
              <DataTable columns={COLUMNS} total={filtered.length} emptyMessage="Nenhum projeto com esses filtros.">
                {filtered.map((p) => {
                  const urgente = p.submetidoEm !== undefined &&
                    (Date.now() - new Date(p.submetidoEm).getTime()) > 3 * 24 * 60 * 60 * 1000;

                  return (
                    <tr key={p.id} className={cn("table-row", urgente && "bg-status-warning-subtle")}>
                      <td>
                        <p className="font-semibold text-foreground">{p.nome}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />{p.cidade}, {p.estado}
                        </p>
                      </td>
                      <td className="font-medium text-foreground">
                        {p.valorCaptar !== undefined ? formatCurrency(p.valorCaptar) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td>
                        {p.submetidoEm !== undefined ? (
                          <div>
                            <p className="text-sm text-foreground">{timeAgo(p.submetidoEm)}</p>
                            {urgente && <p className="text-xs text-status-warning">⚠ Há mais de 3 dias</p>}
                          </div>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td>
                        <span className="bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          Rev. {String(p.revisao)}
                        </span>
                      </td>
                      <td><StatusBadge status={p.status} /></td>
                      <td className="text-sm text-muted-foreground">{p.analistaNome ?? "—"}</td>
                      <td className="text-right">
                        <Link to={`/admin/curadoria/${p.id}`} className="btn btn-primary btn-sm inline-flex">
                          {p.status === "SUBMETIDO" ? "Iniciar" : "Continuar"}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </DataTable>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
