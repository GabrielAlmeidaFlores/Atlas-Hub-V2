import { useEffect, useRef, useState, type ReactNode } from "react";
import { Download, Search, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonPage } from "@/components/ui/skeleton";
import { api, getApiErrorMessage } from "@/services/api";
import { useToastStore } from "@/stores/toast";
import { formatDate } from "@/lib/utils";
import type { Investidor } from "@/types";

interface Response {
  readonly items: readonly Investidor[];
  readonly nextCursor?: string | null;
  readonly pageSize: number;
}

function queryString(params: {
  readonly search: string;
  readonly marketing: string;
  readonly alerts: string;
  readonly cursor: string | null;
}): string {
  const query = new URLSearchParams({ pageSize: "20" });
  if (params.cursor !== null) query.set("cursor", params.cursor);
  if (params.search.trim().length > 0)
    query.set("search", params.search.trim());
  if (params.marketing !== "all") query.set("marketingOptIn", params.marketing);
  if (params.alerts !== "all")
    query.set("wantsOpportunityAlerts", params.alerts);
  return query.toString();
}

export default function AdminInvestidoresPage(): ReactNode {
  const addToast = useToastStore((s) => s.addToast);
  const [items, setItems] = useState<readonly Investidor[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [cursorHistory, setCursorHistory] = useState<readonly (string | null)[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [marketing, setMarketing] = useState("all");
  const [alerts, setAlerts] = useState("all");
  const [initialLoading, setInitialLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const requestIdRef = useRef(0);

  function resetPaging(): void {
    setCursor(null);
    setCursorHistory([]);
  }

  async function load(requestId: number): Promise<void> {
    const result = await api.get<Response>(
      `/admin/investidores?${queryString({ search, marketing, alerts, cursor })}`,
    );
    if (requestId !== requestIdRef.current) return;
    setItems(result.items);
    setNextCursor(result.nextCursor ?? null);
  }

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    void load(requestId)
      .catch((err: unknown) => {
        if (requestId === requestIdRef.current) {
          addToast({
            type: "error",
            title: "Erro ao carregar investidores",
            description: getApiErrorMessage(err),
          });
        }
      })
      .finally(() => {
        if (requestId === requestIdRef.current) setInitialLoading(false);
      });
    return () => {
      requestIdRef.current++;
    };
  }, [cursor, search, marketing, alerts]);

  async function handleExport(): Promise<void> {
    setExporting(true);
    try {
      const blob = await api.download(
        `/admin/investidores/export?${queryString({ search, marketing, alerts, cursor: null })}`,
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "investidores.csv";
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      addToast({
        type: "error",
        title: "Erro ao exportar",
        description: getApiErrorMessage(err),
      });
    } finally {
      setExporting(false);
    }
  }

  if (initialLoading) return <SkeletonPage />;

  return (
    <div className="animate-in">
      <PageHeader
        title="Investidores"
        description="Base de investidores cadastrada na Atlas"
        action={
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => void handleExport()}
            disabled={exporting}
          >
            <Download className="h-4 w-4" />
            {exporting ? "Exportando…" : "Exportar CSV"}
          </button>
        }
      />
      <div className="page-content space-y-4">
        <div className="flex flex-col gap-2 border border-border bg-card p-3 sm:flex-row sm:items-center">
          <label className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="field pl-9"
              placeholder="Buscar nome, e-mail ou telefone"
              value={search}
              onChange={(event) => {
                resetPaging();
                setSearch(event.target.value);
              }}
            />
          </label>
          <select
            className="field sm:w-48"
            value={marketing}
            onChange={(event) => {
              resetPaging();
              setMarketing(event.target.value);
            }}
            aria-label="Marketing"
          >
            <option value="all">Marketing: todos</option>
            <option value="true">Marketing: sim</option>
            <option value="false">Marketing: não</option>
          </select>
          <select
            className="field sm:w-56"
            value={alerts}
            onChange={(event) => {
              resetPaging();
              setAlerts(event.target.value);
            }}
            aria-label="Avisos de oportunidades"
          >
            <option value="all">Avisos: todos</option>
            <option value="true">Avisos: sim</option>
            <option value="false">Avisos: não</option>
          </select>
        </div>

        {items.length === 0 ? (
          <EmptyState
            icon={UsersRound}
            title="Nenhum investidor encontrado"
            description="Ajuste os filtros ou aguarde novos cadastros."
          />
        ) : (
          <DataTable
            columns={[
              { label: "Investidor" },
              { label: "Telefone" },
              { label: "Marketing" },
              { label: "Avisos" },
              { label: "Cadastro" },
            ]}
            pagination={
              <div className="flex items-center justify-between border-t border-border px-5 py-2.5 text-xs text-muted-foreground">
                <span>
                  {items.length} registro{items.length === 1 ? "" : "s"} nesta página
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    disabled={cursorHistory.length === 0}
                    onClick={() => {
                      const previous = cursorHistory[cursorHistory.length - 1] ?? null;
                      setCursorHistory((history) => history.slice(0, -1));
                      setCursor(previous);
                    }}
                  >
                    Anterior
                  </button>
                  <span>Página {cursorHistory.length + 1}</span>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    disabled={nextCursor === null}
                    onClick={() => {
                      if (nextCursor === null) return;
                      setCursorHistory((history) => [...history, cursor]);
                      setCursor(nextCursor);
                    }}
                  >
                    Próxima
                  </button>
                </div>
              </div>
            }
          >
            {items.map((investidor) => (
              <tr key={investidor.id} className="table-row">
                <td>
                  <p className="font-medium text-foreground">
                    {investidor.nome}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {investidor.email}
                  </p>
                </td>
                <td className="text-muted-foreground">
                  {investidor.telefone ?? "—"}
                </td>
                <td className="text-muted-foreground">
                  {investidor.marketingOptIn ? "Sim" : "Não"}
                </td>
                <td className="text-muted-foreground">
                  {investidor.wantsOpportunityAlerts ? "Sim" : "Não"}
                </td>
                <td className="text-muted-foreground">
                  {formatDate(investidor.criadoEm)}
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </div>
    </div>
  );
}
