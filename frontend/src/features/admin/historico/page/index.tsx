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
import { formatDate, formatCurrency } from "@/lib/utils";
import { History, ExternalLink, ArrowRight, MapPin } from "lucide-react";

const FILTER_FIELDS: FilterField[] = [
  { type: "text", key: "q", label: "Busca", placeholder: "Nome ou cidade…", width: "w-[220px]" },
  {
    type: "select",
    key: "status",
    label: "Status",
    options: [
      { value: "APROVADO", label: "Aprovado" },
      { value: "REPROVADO", label: "Reprovado" },
      { value: "OFERTA_CRIADA", label: "Oferta criada" },
    ],
  },
];

const COLUMNS = [
  { label: "Projeto" },
  { label: "Valor" },
  { label: "Analista" },
  { label: "Decisão" },
  { label: "Data" },
  { label: "Oferta" },
  { label: "", align: "right" as const },
];

export default function AdminHistoricoPage(): ReactNode {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<Record<string, string | undefined>>({});

  useEffect(() => {
    void api.get<{ items: Projeto[] }>("/admin/historico")
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
        title="Histórico de Decisões"
        description={`${String(filtered.length)} projeto${filtered.length !== 1 ? "s" : ""} decididos`}
      />

      <div className="page-content space-y-4">
        {projetos.length === 0 ? (
          <EmptyState icon={History} title="Nenhuma decisão ainda" description="Projetos aprovados e reprovados aparecerão aqui" />
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
                <div key={p.id} className="card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{p.nome}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{p.cidade}, {p.estado}</p>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
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

            <div className="hidden sm:block">
              <DataTable columns={COLUMNS} total={filtered.length} emptyMessage="Nenhum projeto com esses filtros.">
                {filtered.map((p) => (
                  <tr key={p.id} className="table-row">
                    <td>
                      <p className="font-semibold text-foreground">{p.nome}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{p.cidade}, {p.estado}</p>
                    </td>
                    <td className="font-medium text-foreground">
                      {p.valorCaptar !== undefined ? formatCurrency(p.valorCaptar) : "—"}
                    </td>
                    <td className="text-muted-foreground">{p.analistaNome ?? "—"}</td>
                    <td><StatusBadge status={p.status} /></td>
                    <td className="text-muted-foreground">
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
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="text-right">
                      <Link to={`/admin/curadoria/${p.id}`} className="btn btn-ghost btn-sm inline-flex">
                        Ver <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </DataTable>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
