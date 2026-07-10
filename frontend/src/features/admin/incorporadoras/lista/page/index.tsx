import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { api } from "@/services/api";
import type { Incorporadora } from "@/types";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonPage } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { formatDate } from "@/lib/utils";
import { Building2, ArrowRight, Mail, Phone } from "lucide-react";

export default function AdminIncorporadorasListaPage(): ReactNode {
  const [items, setItems] = useState<Incorporadora[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void api.get<{ items: Incorporadora[] }>("/admin/incorporadoras")
      .then((d) => setItems(d.items))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <SkeletonPage />;

  return (
    <div className="animate-in">
      <PageHeader
        title="Incorporadoras"
        description={`${String(items.length)} empresa${items.length !== 1 ? "s" : ""} cadastrada${items.length !== 1 ? "s" : ""}`}
      />

      <div className="page-content">
        {items.length === 0 ? (
          <EmptyState icon={Building2} title="Nenhuma incorporadora" description="Empresas que se cadastrarem aparecerão aqui" />
        ) : (
          <>
            {/* Mobile */}
            <div className="space-y-3 sm:hidden">
              {items.map((inc) => (
                <Link key={inc.id} to={`/admin/incorporadoras/${inc.id}`} className="card card-hover block p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy-100 font-bold text-navy">
                      {(inc.razaoSocial || inc.email).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-[#111827]">{inc.razaoSocial || "—"}</p>
                      <p className="text-xs text-[#9CA3AF]">{inc.cnpj || "—"}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-[#9CA3AF]"><Mail className="h-3 w-3" />{inc.email}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-[#9CA3AF]" />
                  </div>
                </Link>
              ))}
            </div>

            {/* Desktop */}
            <div className="table-container hidden sm:block">
              <table className="table-base">
                <thead className="table-head">
                  <tr>
                    <th>Empresa</th>
                    <th>CNPJ</th>
                    <th>Responsável</th>
                    <th>Contato</th>
                    <th>Cadastro</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((inc) => (
                    <tr key={inc.id} className="table-row">
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-100 text-xs font-bold text-navy">
                            {(inc.razaoSocial || inc.email).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-[#111827]">{inc.razaoSocial || "—"}</p>
                            {inc.site !== undefined && <p className="text-xs text-[#9CA3AF]">{inc.site}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="font-mono text-xs text-[#6B7280]">{inc.cnpj || "—"}</td>
                      <td>
                        <p className="text-[#374151]">{inc.nomeResponsavel || "—"}</p>
                        <p className="text-xs text-[#9CA3AF]">{inc.cargoResponsavel || "—"}</p>
                      </td>
                      <td>
                        <p className="flex items-center gap-1 text-xs text-[#6B7280]"><Mail className="h-3 w-3" />{inc.email}</p>
                        {inc.telefone !== "" && inc.telefone !== undefined && (
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-[#6B7280]"><Phone className="h-3 w-3" />{inc.telefone}</p>
                        )}
                      </td>
                      <td className="text-[#6B7280]">{formatDate(inc.criadoEm)}</td>
                      <td className="text-right">
                        <Link to={`/admin/incorporadoras/${inc.id}`} className="btn btn-ghost btn-sm inline-flex">
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
