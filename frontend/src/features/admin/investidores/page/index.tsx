import { useEffect, useRef, useState, type ReactNode } from "react";
import { BellRing, CalendarDays, ChevronRight, Download, FileCheck2, Mail, Megaphone, Phone, Search, UserRound, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { HelpHint } from "@/components/ui/help-hint";
import { Modal } from "@/components/ui/modal";
import { SkeletonPage } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { api, getApiErrorMessage } from "@/services/api";
import { useToastStore } from "@/stores/toast";
import { cn, formatDate, formatDateTime } from "@/lib/utils";
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

function StatusBadge({ active }: { readonly active: boolean }): ReactNode {
  return (
    <span className={cn("inline-flex rounded-[4px] px-2 py-0.5 text-[10px] font-semibold", active ? "bg-status-success-subtle text-status-success" : "bg-muted text-muted-foreground")}>
      {active ? "Sim" : "Não"}
    </span>
  );
}

function Detail({ label, value }: { readonly label: string; readonly value: ReactNode }): ReactNode {
  return (
    <div className="rounded-[8px] border border-border bg-muted/30 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm font-medium text-foreground">{value}</div>
    </div>
  );
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
  const [selected, setSelected] = useState<Investidor | null>(null);
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
        description="Acompanhe quem criou conta de investidor, os consentimentos registrados e o interesse em novas oportunidades."
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

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Nesta página"
            value={items.length}
            icon={UsersRound}
            accent="navy"
            sublabel="Investidores carregados"
            hint="Quantidade de investidores exibidos na página atual. Use Próxima para navegar."
          />
          <StatCard
            label="Marketing"
            value={items.filter((item) => item.marketingOptIn).length}
            icon={Megaphone}
            accent="success"
            sublabel="Opt-in nesta página"
            hint="Investidores que autorizaram receber comunicações de marketing da Atlas."
          />
          <StatCard
            label="Avisos"
            value={items.filter((item) => item.wantsOpportunityAlerts).length}
            icon={BellRing}
            accent="warning"
            sublabel="Interesse nesta página"
            hint="Investidores que pediram para ser avisados quando novas oportunidades forem publicadas."
          />
          <StatCard
            label="Termos aceitos"
            value={items.filter((item) => item.termosAceitosEm !== undefined).length}
            icon={FileCheck2}
            accent="info"
            sublabel="Nesta página"
            hint="Investidores com aceite dos Termos de Uso registrado."
          />
        </div>

        {items.length === 0 ? (
          <EmptyState
            icon={UsersRound}
            title="Nenhum investidor encontrado"
            description="Ajuste os filtros ou aguarde novos cadastros."
          />
        ) : (
          <DataTable
            minWidth={900}
            columns={[
              { label: <span className="inline-flex items-center gap-1">Investidor <HelpHint content="Nome e e-mail da conta usados para identificar e contatar o investidor." /></span> },
              { label: <span className="inline-flex items-center gap-1">Telefone <HelpHint content="Número de telefone informado pelo investidor no perfil." /></span> },
              { label: <span className="inline-flex items-center gap-1">Marketing <HelpHint content="Opt-in para comunicações de marketing. Sim significa que o investidor autorizou receber novidades e comunicações da Atlas." /></span> },
              { label: <span className="inline-flex items-center gap-1">Avisos <HelpHint content="Interesse em novas oportunidades. Sim significa que o investidor clicou em Quero ser avisado na área do investidor." /></span> },
              { label: <span className="inline-flex items-center gap-1">Cadastro <HelpHint content="Data em que a conta de investidor foi criada." /></span> },
              { label: "Visão geral", align: "right" },
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
                  <button
                    type="button"
                    className="group text-left"
                    onClick={() => setSelected(investidor)}
                    aria-label={`Ver visão geral de ${investidor.nome}`}
                  >
                    <p className="font-medium text-foreground transition-colors group-hover:text-navy">
                      {investidor.nome}
                    </p>
                    <p className="text-xs text-muted-foreground">{investidor.email}</p>
                  </button>
                </td>
                <td className="text-muted-foreground">{investidor.telefone ?? "—"}</td>
                <td><StatusBadge active={investidor.marketingOptIn} /></td>
                <td><StatusBadge active={investidor.wantsOpportunityAlerts} /></td>
                <td className="text-muted-foreground">{formatDate(investidor.criadoEm)}</td>
                <td className="text-right">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-navy hover:text-gold-dark"
                    onClick={() => setSelected(investidor)}
                  >
                    Ver <ChevronRight className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </div>

      <Modal
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        title="Visão geral do investidor"
        description={selected?.email}
        className="max-w-2xl"
      >
        {selected !== null && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 rounded-[8px] border border-border bg-muted/40 p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] bg-navy text-sm font-bold text-white">
                {selected.nome.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{selected.nome}</p>
                <p className="truncate text-xs text-muted-foreground">{selected.email}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">Investidor desde {formatDate(selected.criadoEm)}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Detail label="E-mail" value={<span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-muted-foreground" /> {selected.email}</span>} />
              <Detail label="Telefone" value={<span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-muted-foreground" /> {selected.telefone ?? "Não informado"}</span>} />
              <Detail label="Cadastro" value={<span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-muted-foreground" /> {formatDateTime(selected.criadoEm)}</span>} />
              <Detail label="Última atualização" value={formatDateTime(selected.atualizadoEm)} />
            </div>

            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Consentimentos</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[8px] border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground"><Megaphone className="h-4 w-4 text-navy" /> Marketing</span>
                    <StatusBadge active={selected.marketingOptIn} />
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {selected.marketingOptIn ? "Autorizou receber comunicações e novidades da Atlas." : "Não autorizou receber comunicações de marketing."}
                  </p>
                </div>
                <div className="rounded-[8px] border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground"><BellRing className="h-4 w-4 text-navy" /> Avisos de oportunidades</span>
                    <StatusBadge active={selected.wantsOpportunityAlerts} />
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {selected.wantsOpportunityAlerts ? "Pediu para ser avisado quando novas oportunidades forem publicadas." : "Ainda não registrou interesse em novas oportunidades."}
                  </p>
                  {selected.interestUpdatedAt !== undefined && (
                    <p className="mt-1 text-[10px] text-muted-foreground">Registrado em {formatDateTime(selected.interestUpdatedAt)}</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Termos e privacidade</p>
              <div className="flex items-start gap-3 rounded-[8px] border border-border p-3">
                <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-navy" />
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    {selected.termosAceitosEm !== undefined ? `Termos aceitos em ${formatDateTime(selected.termosAceitosEm)}` : "Aceite de termos não registrado"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {selected.termosVersao !== undefined ? `Versão dos termos: ${selected.termosVersao}` : "Nenhuma versão de termos registrada."}
                  </p>
                </div>
              </div>
            </div>

            <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><UserRound className="h-3 w-3" /> ID da conta: {selected.id}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
