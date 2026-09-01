import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Activity, AlertTriangle, BarChart3, Download, Eye, Filter, Flame, Map, Users,
} from "lucide-react";
import { api, getApiErrorMessage } from "@/services/api";
import { useToastStore } from "@/stores/toast";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonPage } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { Tooltip } from "@/components/ui/tooltip";
import { cn, formatDateTime } from "@/lib/utils";
import type {
  AnalyticsAlert,
  AnalyticsDashboard,
  AnalyticsFilters,
  AnalyticsFunnel,
  AnalyticsHeatmap,
} from "../types";
import { eventLabel, alertRuleLabel } from "../labels";

type Tab = "overview" | "funnel" | "heatmap" | "alerts" | "export";

const TABS: { key: Tab; label: string; icon: typeof BarChart3 }[] = [
  { key: "overview", label: "Dashboard", icon: BarChart3 },
  { key: "funnel", label: "Funil", icon: Activity },
  { key: "heatmap", label: "Heatmaps", icon: Flame },
  { key: "alerts", label: "Alertas", icon: AlertTriangle },
  { key: "export", label: "Exportar", icon: Download },
];

const EMPTY_FILTERS: AnalyticsFilters = {
  days: 7,
  utm: "",
  device: "",
  os: "",
  browser: "",
  geo: "",
  userId: "",
};

function segmentQuery(filters: AnalyticsFilters): string {
  const qs = new URLSearchParams({ days: String(filters.days) });
  if (filters.utm !== "") qs.set("utm", filters.utm);
  if (filters.device !== "") qs.set("device", filters.device);
  if (filters.os !== "") qs.set("os", filters.os);
  if (filters.browser !== "") qs.set("browser", filters.browser);
  if (filters.geo !== "") qs.set("geo", filters.geo);
  if (filters.userId !== "") qs.set("userId", filters.userId);
  return qs.toString();
}

function formatMs(ms: number | null): string {
  if (ms === null || ms <= 0) return "—";
  if (ms < 60_000) return `${String(Math.round(ms / 1000))}s`;
  if (ms < 3_600_000) return `${String(Math.round(ms / 60_000))}m`;
  return `${String(Math.round(ms / 3_600_000))}h`;
}

function BreakdownList({ title, items }: { readonly title: string; readonly items: { key: string; count: number }[] }): ReactNode {
  return (
    <div className="card p-5">
      <h3 className="mb-4 text-sm font-semibold text-foreground">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sem dados no período.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.key} className="flex items-center justify-between text-sm">
              <span className="truncate text-foreground">{item.key}</span>
              <span className="font-semibold text-navy">{item.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AdminAnalyticsPage(): ReactNode {
  const addToast = useToastStore((s) => s.addToast);
  const [tab, setTab] = useState<Tab>("overview");
  const [filters, setFilters] = useState<AnalyticsFilters>(EMPTY_FILTERS);
  const [dashboard, setDashboard] = useState<AnalyticsDashboard | null>(null);
  const [funnel, setFunnel] = useState<AnalyticsFunnel | null>(null);
  const [heatmap, setHeatmap] = useState<AnalyticsHeatmap | null>(null);
  const [alerts, setAlerts] = useState<AnalyticsAlert[]>([]);
  const [heatPath, setHeatPath] = useState("/");
  const [heatDay, setHeatDay] = useState(new Date().toISOString().slice(0, 10));
  const [exportDay, setExportDay] = useState(new Date().toISOString().slice(0, 10));
  const [alertForm, setAlertForm] = useState({ name: "", rule: "conversion_drop", threshold: 20 });
  const [appliedFilters, setAppliedFilters] = useState<AnalyticsFilters>(EMPTY_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function loadOverview(next = appliedFilters): Promise<void> {
    const data = await api.get<AnalyticsDashboard>(`/admin/analytics/dashboard?${segmentQuery(next)}`);
    setDashboard(data);
  }

  async function loadFunnel(next = appliedFilters): Promise<void> {
    const data = await api.get<AnalyticsFunnel>(`/admin/analytics/funnel?${segmentQuery(next)}`);
    setFunnel(data);
  }

  async function loadHeatmap(): Promise<void> {
    const qs = new URLSearchParams({ path: heatPath, day: heatDay });
    const data = await api.get<AnalyticsHeatmap>(`/admin/analytics/heatmap?${qs.toString()}`);
    setHeatmap(data);
  }

  async function loadAlerts(): Promise<void> {
    const data = await api.get<{ items: AnalyticsAlert[] }>("/admin/analytics/alerts");
    setAlerts(data.items);
  }

  useEffect(() => {
    setIsLoading(true);
    void Promise.all([loadOverview(appliedFilters), loadFunnel(appliedFilters)])
      .catch((err: unknown) => {
        addToast({ type: "error", title: "Erro ao carregar analytics", description: getApiErrorMessage(err) });
      })
      .finally(() => setIsLoading(false));
  }, [appliedFilters]);

  useEffect(() => {
    if (tab === "heatmap") void loadHeatmap().catch(() => undefined);
    if (tab === "alerts") void loadAlerts().catch(() => undefined);
  }, [tab, heatPath, heatDay]);

  function applyFilters(): void {
    setAppliedFilters({ ...filters });
  }

  function clearSegmentFilters(): void {
    const next = { ...EMPTY_FILTERS, days: filters.days };
    setFilters(next);
    setAppliedFilters(next);
  }

  const hasActiveSegments =
    appliedFilters.utm !== ""
    || appliedFilters.device !== ""
    || appliedFilters.os !== ""
    || appliedFilters.browser !== ""
    || appliedFilters.geo !== ""
    || appliedFilters.userId !== "";

  async function createAlert(e: FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/admin/analytics/alerts", {
        name: alertForm.name,
        rule: alertForm.rule,
        threshold: alertForm.threshold,
        active: true,
      });
      setAlertForm({ name: "", rule: "conversion_drop", threshold: 20 });
      await loadAlerts();
      addToast({ type: "success", title: "Alerta criado" });
    } catch (err) {
      addToast({ type: "error", title: "Erro", description: getApiErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  async function exportCsv(): Promise<void> {
    setBusy(true);
    try {
      const qs = new URLSearchParams({ type: "events", day: exportDay });
      if (filters.userId !== "") qs.set("userId", filters.userId);
      const data = await api.get<{ filename: string; csv: string; rowCount: number }>(`/admin/analytics/export?${qs.toString()}`);
      const blob = new Blob([data.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename;
      a.click();
      URL.revokeObjectURL(url);
      addToast({ type: "success", title: "Exportação pronta", description: `${String(data.rowCount)} linhas` });
    } catch (err) {
      addToast({ type: "error", title: "Erro na exportação", description: getApiErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  if (isLoading && dashboard === null) return <SkeletonPage />;

  const maxVisitors = Math.max(1, ...(dashboard?.visitorsByDay?.map((d) => d.visitors) ?? [1]));
  const maxFunnel = Math.max(1, ...(funnel?.steps?.map((s) => s.count) ?? [1]));
  const maxClick = Math.max(1, ...(heatmap?.clicks?.map((c) => c.count) ?? [1]));
  const periodLabel = appliedFilters.days === 1 ? "hoje" : `${String(appliedFilters.days)} dias`;

  return (
    <div className="animate-in">
      <PageHeader
        title="Analytics"
        description="Jornada LP → cadastro → curadoria"
        action={
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              className="field h-9 w-auto py-1 text-sm"
              value={filters.days}
              onChange={(e) => {
                const days = Number(e.target.value);
                setFilters((p) => ({ ...p, days }));
                setAppliedFilters((p) => ({ ...p, days }));
              }}
            >
              {[1, 7, 14, 30].map((d) => (
                <option key={d} value={d}>{d === 1 ? "Dia atual" : `${String(d)} dias`}</option>
              ))}
            </select>
          </div>
        }
      />

      <div className="page-content space-y-6">
        <div className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="form-group mb-0">
            <span className="form-label">UTM source</span>
            <input className="field" value={filters.utm} onChange={(e) => setFilters((p) => ({ ...p, utm: e.target.value }))} placeholder="google" />
          </label>
          <label className="form-group mb-0">
            <span className="form-label">Device</span>
            <select className="field" value={filters.device} onChange={(e) => setFilters((p) => ({ ...p, device: e.target.value }))}>
              <option value="">Todos</option>
              <option value="desktop">Desktop</option>
              <option value="mobile">Mobile</option>
              <option value="tablet">Tablet</option>
            </select>
          </label>
          <label className="form-group mb-0">
            <span className="form-label">Browser / OS</span>
            <div className="flex gap-2">
              <input className="field" value={filters.browser} onChange={(e) => setFilters((p) => ({ ...p, browser: e.target.value }))} placeholder="Chrome" />
              <input className="field" value={filters.os} onChange={(e) => setFilters((p) => ({ ...p, os: e.target.value }))} placeholder="macOS" />
            </div>
          </label>
          <label className="form-group mb-0">
            <span className="form-label">Usuário / geo</span>
            <div className="flex gap-2">
              <input className="field" value={filters.userId} onChange={(e) => setFilters((p) => ({ ...p, userId: e.target.value }))} placeholder="userId" />
              <input className="field" value={filters.geo} onChange={(e) => setFilters((p) => ({ ...p, geo: e.target.value }))} placeholder="BR" />
            </div>
          </label>
          <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-4">
            <button type="button" className="btn btn-primary btn-sm" onClick={applyFilters}>Aplicar filtros</button>
            {hasActiveSegments && (
              <button type="button" className="btn btn-outline btn-sm" onClick={clearSegmentFilters}>
                Limpar segmentação
              </button>
            )}
            {hasActiveSegments && (
              <span className="text-xs text-muted-foreground">
                Segmentação ativa — breakdowns só com eventos que batem no filtro.
              </span>
            )}
            {filters.userId !== "" && (
              <Link to={`/admin/analytics/users/${filters.userId}`} className="btn btn-outline btn-sm inline-flex items-center gap-2">
                <Users className="h-3.5 w-3.5" /> Abrir jornada do usuário
              </Link>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-1 border-b border-border">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors",
                tab === key ? "border-b-2 border-navy text-navy" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {tab === "overview" && dashboard !== null && (
          <div className="space-y-6">
            <div className="kpi-strip grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              <StatCard label={`Visitantes (${periodLabel})`} value={String(dashboard.cards.visitorsToday)} icon={Eye} accent="info" />
              <StatCard label={`Logins (${periodLabel})`} value={String(dashboard.cards.activeUsers)} icon={Users} accent="info" />
              <StatCard label={`Cadastros (${periodLabel})`} value={String(dashboard.cards.newSignups)} icon={Activity} accent="success" />
              <StatCard label="Conversão" value={`${String(dashboard.cards.conversion)}%`} icon={BarChart3} accent="success" />
              <StatCard label="Bounce" value={`${String(dashboard.cards.bounceRate)}%`} icon={AlertTriangle} accent="warning" />
              <StatCard label={`Sessões (${periodLabel})`} value={String(dashboard.cards.sessions)} icon={Map} accent="info" />
              <StatCard label="Retenção D1" value={`${String(dashboard.cards.retentionD1)}%`} icon={Activity} accent="warning" />
              <StatCard label="Duração média" value={formatMs(dashboard.cards.avgSessionMs)} icon={Activity} accent="info" />
            </div>

            <div className="card p-5">
              <h3 className="mb-4 text-sm font-semibold text-foreground">Visitantes e conversões por dia</h3>
              <div className="mb-3 flex gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 bg-navy/80" /> Visitantes</span>
                <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 bg-gold" /> Conversões</span>
              </div>
              <div className="flex h-44 items-end gap-2">
                {dashboard.visitorsByDay.map((d) => {
                  const barMax = 148;
                  const visitorH = d.visitors > 0 ? Math.max(6, Math.round((d.visitors / maxVisitors) * barMax)) : 0;
                  const conversionH = d.conversions > 0 ? Math.max(6, Math.round((d.conversions / maxVisitors) * barMax)) : 0;
                  return (
                    <div key={d.day} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
                      <div className="flex w-full items-end justify-center gap-0.5" style={{ height: barMax }}>
                        <div
                          className="w-full max-w-[1.25rem] bg-navy/80"
                          style={{ height: visitorH }}
                          title={`${String(d.visitors)} visitantes`}
                        />
                        <div
                          className="w-full max-w-[1.25rem] bg-gold"
                          style={{ height: conversionH }}
                          title={`${String(d.conversions)} conversões`}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{d.day.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <BreakdownList title="Origem (UTM)" items={dashboard.trafficSources} />
              <BreakdownList title="Device" items={dashboard.devices} />
              <BreakdownList title="Browser" items={dashboard.browsers} />
              <BreakdownList title="SO" items={dashboard.operatingSystems} />
              <BreakdownList title="País" items={dashboard.countries} />
              <div className="card p-5">
                <h3 className="mb-4 text-sm font-semibold text-foreground">Top eventos</h3>
                <ul className="space-y-2">
                  {dashboard.topEvents.map((e) => (
                    <li key={e.eventName} className="flex justify-between gap-3 text-sm">
                      <span className="text-foreground">{eventLabel(e.eventName)}</span>
                      <span className="shrink-0 font-semibold text-navy">{e.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {tab === "funnel" && funnel !== null && (
          <div className="card space-y-4 p-5">
            <h3 className="text-sm font-semibold text-foreground">
              {funnel.days === 1 ? "Funil Atlas · Dia atual" : `Funil Atlas · ${String(funnel.days)} dias`}
            </h3>
            <div className="hidden gap-3 border-b border-border pb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground sm:grid sm:grid-cols-[minmax(0,1fr)_4.5rem_4.5rem_5rem_4.5rem]">
              <span>Passo</span>
              <Tooltip content="Pessoas únicas que chegaram nesse passo" side="top">
                <button type="button" className="cursor-help text-right hover:text-foreground">N</button>
              </Tooltip>
              <Tooltip content="Conversão vs o passo anterior" side="top">
                <button type="button" className="cursor-help text-right hover:text-foreground">%</button>
              </Tooltip>
              <Tooltip content="Quem caiu entre o passo anterior e este" side="top">
                <button type="button" className="cursor-help text-right hover:text-foreground">drop</button>
              </Tooltip>
              <Tooltip content="Tempo médio entre o passo anterior e este" side="top">
                <button type="button" className="cursor-help text-right hover:text-foreground">Δ</button>
              </Tooltip>
            </div>
            {funnel.steps.map((step, idx) => (
              <div key={step.eventName} className="space-y-1.5">
                <div className="grid gap-1 text-sm sm:grid-cols-[minmax(0,1fr)_4.5rem_4.5rem_5rem_4.5rem] sm:items-center sm:gap-3">
                  <span className="font-medium text-foreground">{`${String(idx + 1)}. ${step.label}`}</span>
                  <span className="text-muted-foreground sm:text-right">
                    <span className="sm:hidden">N </span>{step.count}
                  </span>
                  <span className="text-muted-foreground sm:text-right">
                    <span className="sm:hidden">% </span>{`${String(step.conversionFromPrev)}%`}
                  </span>
                  <span className="text-muted-foreground sm:text-right">
                    <span className="sm:hidden">drop </span>{`${String(step.dropOff)}%`}
                  </span>
                  <span className="text-muted-foreground sm:text-right">
                    <span className="sm:hidden">Δ </span>{formatMs(step.avgMsBetween)}
                  </span>
                </div>
                <div className="h-2 w-full bg-muted">
                  <div className="h-2 bg-navy transition-all" style={{ width: `${String(Math.round((step.count / maxFunnel) * 100))}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "heatmap" && (
          <div className="space-y-4">
            <div className="card flex flex-wrap gap-3 p-4">
              <input className="field max-w-xs" value={heatPath} onChange={(e) => setHeatPath(e.target.value)} placeholder="/" />
              <input type="date" className="field max-w-[11rem]" value={heatDay} onChange={(e) => setHeatDay(e.target.value)} />
              <button type="button" className="btn btn-primary btn-sm" onClick={() => void loadHeatmap()}>Atualizar</button>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="card p-5">
                <h3 className="mb-3 text-sm font-semibold text-foreground">Cliques (amostra)</h3>
                <div className="relative aspect-[4/5] border border-border bg-navy/5">
                  {(heatmap?.clicks ?? []).map((c) => (
                    <span
                      key={`${String(c.x)}-${String(c.y)}`}
                      className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold"
                      style={{
                        left: `${String((c.x / 19) * 100)}%`,
                        top: `${String((c.y / 29) * 100)}%`,
                        opacity: 0.35 + (c.count / maxClick) * 0.65,
                        transform: `translate(-50%, -50%) scale(${String(0.8 + (c.count / maxClick) * 1.4)})`,
                      }}
                      title={`${String(c.count)} cliques`}
                    />
                  ))}
                  {(heatmap?.clicks.length ?? 0) === 0 && (
                    <p className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">Sem cliques neste dia</p>
                  )}
                </div>
              </div>
              <div className="card p-5">
                <h3 className="mb-3 text-sm font-semibold text-foreground">Scroll depth</h3>
                <ul className="space-y-3">
                  {(heatmap?.scrolls ?? []).map((s) => (
                    <li key={s.band}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span>{`${s.band}%`}</span>
                        <span className="font-semibold">{s.count}</span>
                      </div>
                      <div className="h-2 bg-muted">
                        <div className="h-2 bg-gold" style={{ width: `${String(Math.min(100, s.count * 5))}%` }} />
                      </div>
                    </li>
                  ))}
                  {(heatmap?.scrolls.length ?? 0) === 0 && (
                    <p className="text-sm text-muted-foreground">Sem dados de scroll.</p>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {tab === "alerts" && (
          <div className="grid gap-4 lg:grid-cols-2">
            <form className="card space-y-3 p-5" onSubmit={(e) => void createAlert(e)}>
              <h3 className="text-sm font-semibold text-foreground">Novo alerta</h3>
              <input className="field" required value={alertForm.name} onChange={(e) => setAlertForm((p) => ({ ...p, name: e.target.value }))} placeholder="Nome do alerta" />
              <select className="field" value={alertForm.rule} onChange={(e) => setAlertForm((p) => ({ ...p, rule: e.target.value }))}>
                <option value="conversion_drop">Queda de conversão</option>
                <option value="bounce_high">Bounce alto</option>
                <option value="traffic_drop">Queda de acessos</option>
                <option value="form_error">Erro de formulário</option>
                <option value="api_error">Erro de API</option>
                <option value="traffic_spike">Pico de tráfego</option>
              </select>
              <input
                type="number"
                className="field"
                min={0}
                max={1000}
                value={alertForm.threshold}
                onChange={(e) => setAlertForm((p) => ({ ...p, threshold: Number(e.target.value) }))}
              />
              <button type="submit" disabled={busy} className="btn btn-primary">Criar alerta</button>
            </form>
            <div className="card p-5">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Alertas configurados</h3>
              <ul className="space-y-3">
                {alerts.map((a) => (
                  <li key={a.id} className="border border-border p-3 text-sm">
                    <p className="font-medium text-foreground">{a.name}</p>
                    <p className="text-muted-foreground">{`${alertRuleLabel(a.rule)} · limiar ${String(a.threshold)} · ${a.active ? "ativo" : "inativo"}`}</p>
                    {a.lastTriggeredAt !== undefined && (
                      <p className="text-xs text-muted-foreground">{`Último disparo: ${formatDateTime(a.lastTriggeredAt)}`}</p>
                    )}
                  </li>
                ))}
                {alerts.length === 0 && <p className="text-sm text-muted-foreground">Nenhum alerta ainda. Avaliação automática a cada hora via SES.</p>}
              </ul>
            </div>
          </div>
        )}

        {tab === "export" && (
          <div className="card max-w-lg space-y-4 p-5">
            <h3 className="text-sm font-semibold text-foreground">Exportar CSV</h3>
            <label className="form-group">
              <span className="form-label">Dia</span>
              <input type="date" className="field" value={exportDay} onChange={(e) => setExportDay(e.target.value)} />
            </label>
            <p className="text-sm text-muted-foreground">Usa o userId do filtro global quando preenchido.</p>
            <button type="button" disabled={busy} className="btn btn-primary" onClick={() => void exportCsv()}>
              <Download className="h-4 w-4" /> Baixar CSV
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
