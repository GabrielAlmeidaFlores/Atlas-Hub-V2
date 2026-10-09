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
import { HelpHint } from "@/components/ui/help-hint";
import { cn, formatDateTime } from "@/lib/utils";
import type {
  AnalyticsAlert,
  AnalyticsDashboard,
  AnalyticsFilters,
  AnalyticsFunnel,
  AnalyticsHeatmap,
} from "../types";
import { eventLabel, alertRuleLabel } from "../labels";
import { HeatmapPreview } from "../components/heatmap-preview";

type Tab = "overview" | "funnel" | "heatmap" | "alerts" | "export";

const HEAT_SCREENS: { path: string; label: string }[] = [
  { path: "/", label: "Home" },
  { path: "/para-incorporadoras", label: "Para incorporadoras" },
  { path: "/para-investidores", label: "Para investidores" },
  { path: "/projetos", label: "Projetos" },
  { path: "/quem-somos", label: "Quem somos" },
];

const TABS: { key: Tab; label: string; icon: typeof BarChart3 }[] = [
  { key: "overview", label: "Resumo", icon: BarChart3 },
  { key: "funnel", label: "Funil", icon: Activity },
  { key: "heatmap", label: "Mapa de calor", icon: Flame },
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

function BreakdownList({ title, hint, items }: { readonly title: string; readonly hint?: string; readonly items: { key: string; count: number }[] }): ReactNode {
  const max = Math.max(1, ...items.map((i) => i.count));
  const total = items.reduce((sum, i) => sum + i.count, 0);
  return (
    <div className="card p-5">
      <h3 className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-foreground">
        {title}
        {hint !== undefined && <HelpHint content={hint} />}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sem dados no período.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.key}>
              <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                <span className="truncate text-foreground">{item.key}</span>
                <span className="shrink-0 tabular-nums font-semibold text-navy">{item.count}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 bg-muted">
                  <div className="h-1.5 bg-navy/70" style={{ width: `${String(Math.round((item.count / max) * 100))}%` }} />
                </div>
                <span className="w-9 shrink-0 text-right text-[10px] tabular-nums text-muted-foreground">
                  {total > 0 ? `${String(Math.round((item.count / total) * 100))}%` : "0%"}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type StepKind = "landing" | "form" | "dashboard" | "cta";

const KIND_LABEL: Record<StepKind, string> = { landing: "Página", form: "Formulário", dashboard: "Painel", cta: "Ação" };

function stepKind(eventName: string, label: string): StepKind {
  const s = `${eventName} ${label}`.toLowerCase();
  if (/form|preench|cadastro|signup|submit|submeter|campo/.test(s)) return "form";
  if (/login|conta|confirm|dashboard|painel|e-?mail/.test(s)) return "dashboard";
  if (/hero|landing|visita|page_view|home|cta|clique|click|whatsapp|investir/.test(s)) return "landing";
  return "cta";
}

function StepPreview({ eventName, label }: { readonly eventName: string; readonly label: string }): ReactNode {
  const kind = stepKind(eventName, label);
  return (
    <div className="w-full">
      <div className="mx-auto h-20 w-28 border border-border bg-card">
        <div className="flex h-3 items-center gap-0.5 border-b border-border bg-muted px-1.5">
          <span className="h-1 w-1 bg-border" />
          <span className="h-1 w-1 bg-border" />
          <span className="h-1 w-1 bg-border" />
        </div>
        <div className="space-y-1 p-2">
          {kind === "landing" && (<><div className="h-5 bg-navy/15" /><div className="h-1.5 w-3/4 bg-border" /><div className="h-1.5 w-1/2 bg-border" /></>)}
          {kind === "form" && (<><div className="h-1.5 w-1/2 bg-border" /><div className="h-3 border border-border" /><div className="h-3 border border-border" /><div className="h-2.5 w-1/3 bg-gold/70" /></>)}
          {kind === "dashboard" && (<div className="grid grid-cols-2 gap-1"><div className="h-5 bg-navy/15" /><div className="h-5 bg-navy/10" /><div className="h-5 bg-navy/10" /><div className="h-5 bg-navy/15" /></div>)}
          {kind === "cta" && (<><div className="h-1.5 w-2/3 bg-border" /><div className="h-1.5 bg-border" /><div className="h-1.5 w-3/4 bg-border" /><div className="h-2.5 w-1/2 bg-gold/70" /></>)}
        </div>
      </div>
      <p className="mt-1.5 text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{KIND_LABEL[kind]}</p>
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
  const [heatDevice, setHeatDevice] = useState<"desktop" | "mobile">("desktop");
  const [heatDay, setHeatDay] = useState(new Date().toISOString().slice(0, 10));
  const [exportDay, setExportDay] = useState(new Date().toISOString().slice(0, 10));
  const [alertForm, setAlertForm] = useState({ name: "", rule: "conversion_drop", threshold: 20 });
  const [appliedFilters, setAppliedFilters] = useState<AnalyticsFilters>(EMPTY_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function loadOverview(next = appliedFilters): Promise<void> {
    const data = await api.get<AnalyticsDashboard>(`/analytics/admin/dashboard?${segmentQuery(next)}`);
    setDashboard(data);
  }

  async function loadFunnel(next = appliedFilters): Promise<void> {
    const data = await api.get<AnalyticsFunnel>(`/analytics/admin/funnel?${segmentQuery(next)}`);
    setFunnel(data);
  }

  async function loadHeatmap(): Promise<void> {
    const qs = new URLSearchParams({ path: heatPath, day: heatDay });
    const data = await api.get<AnalyticsHeatmap>(`/analytics/admin/heatmap?${qs.toString()}`);
    setHeatmap(data);
  }

  async function loadAlerts(): Promise<void> {
    const data = await api.get<{ items: AnalyticsAlert[] }>("/analytics/admin/alerts");
    setAlerts(data.items);
  }

  useEffect(() => {
    setIsLoading(true);
    void Promise.all([loadOverview(appliedFilters), loadFunnel(appliedFilters)])
      .catch((err: unknown) => {
        addToast({ type: "error", title: "Erro ao carregar os dados", description: getApiErrorMessage(err) });
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
      await api.post("/analytics/admin/alerts", {
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
      const data = await api.get<{ filename: string; csv: string; rowCount: number }>(`/analytics/admin/export?${qs.toString()}`);
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

  if (dashboard === null) {
    return (
      <div className="animate-in">
        <PageHeader title="Uso da plataforma" description="Jornada da landing page até a curadoria" />
        <div className="page-content">
          <p className="text-sm text-muted-foreground">Não foi possível carregar os dados. Tente de novo em instantes.</p>
          <button
            type="button"
            className="btn btn-primary btn-sm mt-4"
            onClick={() => {
              setIsLoading(true);
              void Promise.all([loadOverview(appliedFilters), loadFunnel(appliedFilters)])
                .catch((err: unknown) => {
                  addToast({ type: "error", title: "Erro ao carregar os dados", description: getApiErrorMessage(err) });
                })
                .finally(() => setIsLoading(false));
            }}
          >
            Tentar de novo
          </button>
        </div>
      </div>
    );
  }

  const maxVisitors = Math.max(1, ...(dashboard?.visitorsByDay?.map((d) => d.visitors) ?? [1]));
  const maxFunnel = Math.max(1, ...(funnel?.steps?.map((s) => s.count) ?? [1]));
  const periodLabel = appliedFilters.days === 1 ? "hoje" : `${String(appliedFilters.days)} dias`;

  return (
    <div className="animate-in">
      <PageHeader
        title="Uso da plataforma"
        description="Jornada da landing page até a curadoria"
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
            <span className="form-label">Origem do acesso</span>
            <input className="field" value={filters.utm} onChange={(e) => setFilters((p) => ({ ...p, utm: e.target.value }))} placeholder="ex.: google" />
          </label>
          <label className="form-group mb-0">
            <span className="form-label">Dispositivo</span>
            <select className="field" value={filters.device} onChange={(e) => setFilters((p) => ({ ...p, device: e.target.value }))}>
              <option value="">Todos</option>
              <option value="desktop">Computador</option>
              <option value="mobile">Celular</option>
              <option value="tablet">Tablet</option>
            </select>
          </label>
          <label className="form-group mb-0">
            <span className="form-label">Navegador / Sistema</span>
            <div className="flex gap-2">
              <input className="field" value={filters.browser} onChange={(e) => setFilters((p) => ({ ...p, browser: e.target.value }))} placeholder="ex.: Chrome" />
              <input className="field" value={filters.os} onChange={(e) => setFilters((p) => ({ ...p, os: e.target.value }))} placeholder="ex.: macOS" />
            </div>
          </label>
          <label className="form-group mb-0">
            <span className="form-label">Usuário / região</span>
            <div className="flex gap-2">
              <input className="field" value={filters.userId} onChange={(e) => setFilters((p) => ({ ...p, userId: e.target.value }))} placeholder="ID do usuário" />
              <input className="field" value={filters.geo} onChange={(e) => setFilters((p) => ({ ...p, geo: e.target.value }))} placeholder="ex.: BR" />
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
                Segmentação ativa — as listas abaixo só contam eventos que batem no filtro.
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
              <StatCard label={`Visitantes (${periodLabel})`} value={String(dashboard.cards.visitorsToday)} icon={Eye} accent="info" hint="Pessoas diferentes que acessaram a plataforma no período." />
              <StatCard label={`Logins (${periodLabel})`} value={String(dashboard.cards.activeUsers)} icon={Users} accent="info" hint="Entradas de usuários já cadastrados na conta." />
              <StatCard label={`Cadastros (${periodLabel})`} value={String(dashboard.cards.newSignups)} icon={Activity} accent="success" hint="Novas contas de incorporadora criadas no período." />
              <StatCard label="Conversão" value={`${String(dashboard.cards.conversion)}%`} icon={BarChart3} accent="success" hint="Percentual de visitantes que concluíram o cadastro." />
              <StatCard label="Taxa de rejeição" value={`${String(dashboard.cards.bounceRate)}%`} icon={AlertTriangle} accent="warning" hint="Percentual de visitas encerradas sem interação com a página." />
              <StatCard label={`Sessões (${periodLabel})`} value={String(dashboard.cards.sessions)} icon={Map} accent="info" hint="Total de visitas no período. Uma mesma pessoa pode gerar várias sessões." />
              <StatCard label="Voltaram no dia seguinte" value={`${String(dashboard.cards.retentionD1)}%`} icon={Activity} accent="warning" hint="Percentual de pessoas que voltaram a acessar no dia seguinte ao primeiro acesso." />
              <StatCard label="Duração média" value={formatMs(dashboard.cards.avgSessionMs)} icon={Activity} accent="info" hint="Tempo médio de permanência por sessão." />
            </div>

            <div className="card p-5">
              <h3 className="mb-4 text-sm font-semibold text-foreground">Visitantes e conversões por dia</h3>
              <div className="mb-4 flex gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 bg-navy/80" /> Visitantes</span>
                <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 bg-gold" /> Conversões</span>
              </div>
              <div className="flex h-48 items-end gap-3 border-b border-border pt-4">
                {dashboard.visitorsByDay.map((d) => {
                  const barMax = 150;
                  const visitorH = d.visitors > 0 ? Math.max(6, Math.round((d.visitors / maxVisitors) * barMax)) : 0;
                  const conversionH = d.conversions > 0 ? Math.max(6, Math.round((d.conversions / maxVisitors) * barMax)) : 0;
                  const rate = d.visitors > 0 ? Math.round((d.conversions / d.visitors) * 100) : 0;
                  return (
                    <div key={d.day} className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                      <div className="relative flex w-full items-end justify-center gap-1" style={{ height: barMax }}>
                        <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden -translate-x-1/2 whitespace-nowrap border border-border bg-navy px-3 py-2 text-xs text-white shadow-sm group-hover:block">
                          <p className="font-semibold tabular-nums">{`${d.day.slice(8, 10)}/${d.day.slice(5, 7)}/${d.day.slice(0, 4)}`}</p>
                          <p className="mt-1 flex items-center gap-1.5 tabular-nums">
                            <span className="inline-block h-2 w-2 bg-navy/80 ring-1 ring-white/50" />
                            {d.visitors} visitantes
                          </p>
                          <p className="flex items-center gap-1.5 tabular-nums">
                            <span className="inline-block h-2 w-2 bg-gold" />
                            {d.conversions} conversões
                          </p>
                          <p className="mt-1 border-t border-white/15 pt-1 text-white/70 tabular-nums">{`Conversão: ${String(rate)}%`}</p>
                        </div>
                        <div
                          className="w-full max-w-[1.5rem] bg-navy/80 transition-colors group-hover:bg-navy"
                          style={{ height: visitorH }}
                        />
                        <div
                          className="w-full max-w-[1.5rem] bg-gold transition-colors group-hover:brightness-95"
                          style={{ height: conversionH }}
                        />
                      </div>
                      <span className="text-[10px] tabular-nums text-muted-foreground">{d.day.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <BreakdownList title="Origem do acesso" hint="De onde os visitantes chegaram, pela origem (UTM) do link." items={dashboard.trafficSources} />
              <BreakdownList title="Dispositivo" hint="Tipo de aparelho usado no acesso (computador, celular ou tablet)." items={dashboard.devices} />
              <BreakdownList title="Navegador" hint="Navegador usado no acesso (Chrome, Safari, etc.)." items={dashboard.browsers} />
              <BreakdownList title="Sistema operacional" hint="Sistema do aparelho (Windows, macOS, Android, iOS...)." items={dashboard.operatingSystems} />
              <BreakdownList title="País" hint="País de origem do acesso." items={dashboard.countries} />
              <div className="card p-5">
                <h3 className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  Eventos mais frequentes
                  <HelpHint content="As ações mais registradas na plataforma no período." />
                </h3>
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
          <div className="card space-y-5 p-5 sm:p-6">
            <div>
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                {funnel.days === 1 ? "Funil · dia atual" : `Funil · últimos ${String(funnel.days)} dias`}
                <HelpHint content="Cada linha é uma tela da jornada. A porcentagem mostra quanto do público da etapa anterior chegou até esta tela." />
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">Da esquerda para a direita: a tela, quantas pessoas chegaram e o quanto avançaram.</p>
            </div>
            <div className="space-y-5">
              {funnel.steps.map((step, idx) => (
                <div key={step.eventName} className="grid gap-4 border-b border-border pb-5 last:border-0 last:pb-0 sm:grid-cols-[7rem_1fr_5.5rem] sm:items-center">
                  <StepPreview eventName={step.eventName} label={step.label} />
                  <div>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <span className="flex items-center gap-2 font-medium text-foreground">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center bg-navy text-[10px] font-bold text-white">{String(idx + 1)}</span>
                        {step.label}
                      </span>
                      <span className="text-sm text-foreground">
                        <strong className="font-semibold tabular-nums">{step.count}</strong> <span className="text-muted-foreground">pessoas</span>
                      </span>
                    </div>
                    <div className="mt-2 h-2.5 w-full bg-muted">
                      <div className="h-2.5 bg-navy" style={{ width: `${String(Math.round((step.count / maxFunnel) * 100))}%` }} />
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {step.dropOff > 0 ? `Saíram nesta etapa: ${String(step.dropOff)}%` : "Nenhuma saída nesta etapa"}
                      {step.avgMsBetween !== null ? ` · tempo médio até aqui: ${formatMs(step.avgMsBetween)}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold leading-none tabular-nums text-navy">{String(step.conversionFromPrev)}%</p>
                    <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">{idx === 0 ? "do total" : "da etapa anterior"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "heatmap" && (
          <div className="space-y-4">
            <div className="card space-y-3 p-4">
              <div className="flex flex-wrap items-end gap-3">
                <label className="form-group mb-0 min-w-[15rem]">
                  <span className="form-label">Tela</span>
                  <select className="field" value={heatPath} onChange={(e) => setHeatPath(e.target.value)}>
                    {HEAT_SCREENS.map((s) => (
                      <option key={s.path} value={s.path}>{s.label}</option>
                    ))}
                  </select>
                </label>
                <label className="form-group mb-0">
                  <span className="form-label">Dia</span>
                  <input type="date" className="field max-w-[11rem]" value={heatDay} onChange={(e) => setHeatDay(e.target.value)} />
                </label>
                <div className="form-group mb-0">
                  <span className="form-label">Tipo de acesso</span>
                  <div className="inline-flex border border-border">
                    {(["desktop", "mobile"] as const).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setHeatDevice(d)}
                        className={cn(
                          "px-3 py-2 text-sm transition-colors",
                          heatDevice === d ? "bg-navy text-white" : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {d === "desktop" ? "Computador" : "Celular"}
                      </button>
                    ))}
                  </div>
                </div>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => void loadHeatmap()}>Atualizar</button>
              </div>
              <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                Os pontos mostram onde as pessoas clicaram na tela real, e as linhas douradas até onde rolaram.
                <HelpHint content="A prévia é a tela renderizada de verdade. Cada ponto é uma célula de clique capturada no período; quanto maior e mais forte, mais cliques naquela região." />
              </p>
            </div>

            {(heatmap?.clicks.length ?? 0) === 0 && (heatmap?.scrolls.length ?? 0) === 0 && (
              <div className="card p-4 text-sm text-muted-foreground">
                Nenhum dado de mapa de calor para {heatPath} no dia selecionado. Tente outro dia ou outra tela.
              </div>
            )}

            <div className="card p-5">
              <h3 className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                Mapa de calor
                <HelpHint content="Cada ponto representa cliques numa região da tela. A linha dourada marca a profundidade de rolagem alcançada." />
              </h3>
              <HeatmapPreview
                path={heatPath}
                device={heatDevice}
                clicks={heatmap?.clicks ?? []}
                scrolls={heatmap?.scrolls ?? []}
              />
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
                <option value="bounce_high">Rejeição alta</option>
                <option value="traffic_drop">Queda de acessos</option>
                <option value="form_error">Erro de formulário</option>
                <option value="api_error">Erro na API</option>
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
            <h3 className="text-sm font-semibold text-foreground">Exportar planilha</h3>
            <label className="form-group">
              <span className="form-label">Dia</span>
              <input type="date" className="field" value={exportDay} onChange={(e) => setExportDay(e.target.value)} />
            </label>
            <p className="text-sm text-muted-foreground">Usa o ID do usuário do filtro global quando preenchido.</p>
            <button type="button" disabled={busy} className="btn btn-primary" onClick={() => void exportCsv()}>
              <Download className="h-4 w-4" /> Baixar planilha
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
