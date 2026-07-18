import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { api } from "@/services/api";
import type { Incorporadora } from "@/types";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonPage } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { FilterBar, type FilterField } from "@/components/ui/filter-bar";
import { formatDate } from "@/lib/utils";
import { Building2, ArrowRight, Mail, Phone } from "lucide-react";

const FILTER_FIELDS: FilterField[] = [
  { type: "text", key: "q", label: "Busca", placeholder: "Razão social, CNPJ ou e-mail…", width: "w-[260px]" },
];

const COLUMNS = [
  { label: "Empresa" },
  { label: "CNPJ" },
  { label: "Responsável" },
  { label: "Contato" },
  { label: "Cadastro" },
  { label: "", align: "right" as const },
];

export default function AdminIncorporadorasListaPage(): ReactNode {
  const [items, setItems] = useState<Incorporadora[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<Record<string, string | undefined>>({});

  useEffect(() => {
    void api.get<{ items: Incorporadora[] }>("/admin/incorporadoras")
      .then((d) => setItems(d.items))
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = (filters.q ?? "").trim().toLowerCase();
    if (q.length === 0) return items;
    return items.filter((inc) => {
      const hay = `${inc.razaoSocial} ${inc.cnpj} ${inc.email} ${inc.nomeResponsavel ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, filters]);

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
        title="Incorporadoras"
        description={`${String(filtered.length)} empresa${filtered.length !== 1 ? "s" : ""} cadastrada${filtered.length !== 1 ? "s" : ""}`}
      />

      <div className="page-content space-y-4">
        {items.length === 0 ? (
          <EmptyState icon={Building2} title="Nenhuma incorporadora" description="Empresas que se cadastrarem aparecerão aqui" />
        ) : (
          <>
            <FilterBar
              fields={FILTER_FIELDS}
              values={filters}
              onChange={setFilter}
              onClear={() => setFilters({})}
            />

            <div className="space-y-3 sm:hidden">
              {filtered.map((inc) => (
                <Link key={inc.id} to={`/admin/incorporadoras/${inc.id}`} className="card card-hover block p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-navy-100 font-bold text-navy">
                      {(inc.razaoSocial || inc.email).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-foreground">{inc.razaoSocial || "—"}</p>
                      <p className="text-xs text-muted-foreground">{inc.cnpj || "—"}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Mail className="h-3 w-3" />{inc.email}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>

            <div className="hidden sm:block">
              <DataTable columns={COLUMNS} total={filtered.length} emptyMessage="Nenhuma incorporadora com essa busca.">
                {filtered.map((inc) => (
                  <tr key={inc.id} className="table-row">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-navy-100 text-xs font-bold text-navy">
                          {(inc.razaoSocial || inc.email).charAt(0).toUpperCase()}
                        </div>
                        <p className="font-semibold text-foreground">{inc.razaoSocial || "—"}</p>
                      </div>
                    </td>
                    <td className="font-mono text-xs text-foreground">{inc.cnpj || "—"}</td>
                    <td className="text-foreground">{inc.nomeResponsavel || "—"}</td>
                    <td>
                      <p className="flex items-center gap-1 text-sm text-muted-foreground"><Mail className="h-3 w-3" />{inc.email}</p>
                      {inc.telefone !== undefined && inc.telefone.length > 0 && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground"><Phone className="h-3 w-3" />{inc.telefone}</p>
                      )}
                    </td>
                    <td className="text-muted-foreground">{formatDate(inc.criadoEm)}</td>
                    <td className="text-right">
                      <Link to={`/admin/incorporadoras/${inc.id}`} className="btn btn-ghost btn-sm inline-flex">
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
