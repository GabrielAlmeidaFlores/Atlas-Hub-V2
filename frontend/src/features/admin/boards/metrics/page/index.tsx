import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BarChart3, Check, Code2, GripVertical, Pencil, Plus, RefreshCw, Save, Trash2, X } from "lucide-react";
import { Responsive, WidthProvider, type Layout } from "react-grid-layout";
import {
  Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis,
} from "recharts";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { boardsApi } from "@/services/boards";
import { getApiErrorMessage } from "@/services/api";
import { useToastStore } from "@/stores/toast";
import { PageHeader } from "@/components/ui/page-header";
import { setBreadcrumbLeaf } from "@/components/shared/app-breadcrumb";
import { SkeletonPage } from "@/components/ui/skeleton";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { formatDate } from "@/lib/utils";
import { PanelBuilder } from "../components/panel-builder";
import type {
  BoardMetricsDashboard, BoardMetricsResponse, DashboardPanel, DashboardPanelResult,
  MetricDefinition, MetricFormatType, PanelVisualizationType,
} from "../types";

const ResponsiveGridLayout = WidthProvider(Responsive);
const CHART_COLORS = ["#1b2b5e", "#c79b45", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#14b8a6"];
const PERIOD_OPTIONS = [
  { value: "7", label: "Últimos 7 dias" },
  { value: "30", label: "Últimos 30 dias" },
  { value: "90", label: "Últimos 90 dias" },
  { value: "365", label: "Últimos 12 meses" },
];
const VISUALIZATION_OPTIONS: { value: PanelVisualizationType; label: string }[] = [
  { value: "stat", label: "Número" },
  { value: "bar_chart", label: "Gráfico de barras" },
  { value: "line_chart", label: "Gráfico de linha" },
  { value: "donut_chart", label: "Donut" },
  { value: "gauge", label: "Gauge" },
  { value: "table", label: "Tabela" },
  { value: "card_list", label: "Lista" },
];

function thresholdClass(panel: DashboardPanel, value: number | null): string {
  if (value === null) return "text-foreground";
  const threshold = [...(panel.visualization.thresholds ?? [])].sort((a, b) => b.thresholdValue - a.thresholdValue).find((item) => value >= item.thresholdValue);
  if (threshold?.thresholdColor === "success") return "text-status-success";
  if (threshold?.thresholdColor === "warning") return "text-status-warning";
  if (threshold?.thresholdColor === "danger") return "text-status-danger";
  return "text-foreground";
}

function formatMetricValue(value: number | null, formatType: MetricFormatType, definition: MetricDefinition | undefined): string {
  if (value === null || value === undefined) return definition?.calculation.formatting.nullDisplayValue ?? "—";
  const formatting = definition?.calculation.formatting;
  const decimals = formatting?.decimalPlaces ?? 0;
  if (formatType === "currency") {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: formatting?.currencyCode ?? "BRL", minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
  }
  if (formatType === "percentage") return `${value.toFixed(decimals)}%`;
  if (formatType === "duration_days") return `${value.toFixed(decimals)} d`;
  if (formatType === "text") return String(value);
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
}

function ChartTooltip({ active, payload }: { readonly active?: boolean; readonly payload?: readonly { readonly payload?: { readonly name?: string; readonly value?: number } }[] }): ReactNode {
  if (active !== true || payload === undefined || payload.length === 0) return null;
  const item = payload[0]?.payload;
  if (item === undefined) return null;
  return <div className="rounded-[7px] border border-border bg-card px-3 py-2 text-xs shadow-lg"><p className="font-medium text-foreground">{item.name}</p><p className="mt-1 tabular-nums text-muted-foreground">{item.value}</p></div>;
}

function MetricChart({ result, panel }: { readonly result: DashboardPanelResult; readonly panel: DashboardPanel }): ReactNode {
  const groups = result.metric.groups.map((group) => ({ name: Object.values(group.dimensionValues).join(" / ") || "Total", value: group.value }));
  if (groups.length === 0) return <p className="text-xs text-muted-foreground">Sem dados para os filtros selecionados.</p>;
  if (panel.visualization.visualizationType === "line_chart") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={groups} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
          <RechartsTooltip content={<ChartTooltip />} />
          <Line type="monotone" dataKey="value" stroke="#1b2b5e" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    );
  }
  if (panel.visualization.visualizationType === "donut_chart") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={groups} dataKey="value" nameKey="name" innerRadius="52%" outerRadius="78%" paddingAngle={2}>
            {groups.map((group, index) => <Cell key={group.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
          </Pie>
          <RechartsTooltip content={<ChartTooltip />} />
          {panel.visualization.showLegend === true && <Legend wrapperStyle={{ fontSize: 10 }} />}
        </PieChart>
      </ResponsiveContainer>
    );
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={groups} layout={panel.visualization.orientation === "horizontal" ? "vertical" : "horizontal"} margin={{ top: 8, right: 10, left: panel.visualization.orientation === "horizontal" ? 30 : -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        {panel.visualization.orientation === "horizontal"
          ? <><XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} /><YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={80} /></>
          : <><XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} /><YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} /></>}
        <RechartsTooltip content={<ChartTooltip />} />
        <Bar dataKey="value" fill="#1b2b5e" radius={[3, 3, 0, 0]}>
          {panel.visualization.showDataLabels === true && <LabelList dataKey="value" position={panel.visualization.orientation === "horizontal" ? "right" : "top"} fontSize={10} fill="#64748b" />}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function gaugeStroke(panel: DashboardPanel, value: number): string {
  const threshold = [...(panel.visualization.thresholds ?? [])].sort((a, b) => b.thresholdValue - a.thresholdValue).find((item) => value >= item.thresholdValue);
  if (threshold?.thresholdColor === "success") return "#10b981";
  if (threshold?.thresholdColor === "warning") return "#f59e0b";
  if (threshold?.thresholdColor === "danger") return "#ef4444";
  return "#1b2b5e";
}

function Gauge({ result, definition, panel }: { readonly result: DashboardPanelResult; readonly definition: MetricDefinition | undefined; readonly panel: DashboardPanel }): ReactNode {
  const value = result.metric.value ?? 0;
  const percentage = Math.max(0, Math.min(100, value));
  const circumference = 2 * Math.PI * 45;
  return (
    <div className="relative flex h-full items-center justify-center">
      <svg viewBox="0 0 120 120" className="h-full max-h-[190px] w-full max-w-[190px] -rotate-90">
        <circle cx="60" cy="60" r="45" fill="none" stroke="var(--muted)" strokeWidth="10" />
        <circle cx="60" cy="60" r="45" fill="none" stroke={gaugeStroke(panel, value)} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${String((percentage / 100) * circumference)} ${String(circumference)}`} />
      </svg>
      <div className="absolute text-center"><p className="text-2xl font-semibold tabular-nums text-foreground">{formatMetricValue(value, result.metric.formatType, definition)}</p><p className="mt-1 text-[10px] text-muted-foreground">{panel.panelTitle}</p></div>
    </div>
  );
}

function PanelBody({ result, definition, panel }: { readonly result: DashboardPanelResult; readonly definition: MetricDefinition | undefined; readonly panel: DashboardPanel }): ReactNode {
  if (result.error !== undefined || result.metric.error !== undefined) return <div className="flex h-full items-center justify-center rounded-[7px] border border-status-danger-border bg-status-danger-subtle p-3 text-center text-xs text-status-danger">{result.error ?? result.metric.error}</div>;
  if (panel.visualization.visualizationType === "stat") {
    return (
      <div className="flex h-full flex-col justify-center">
        <p className={`text-3xl font-semibold tracking-tight tabular-nums ${thresholdClass(panel, result.metric.value)}`}>{formatMetricValue(result.metric.value, result.metric.formatType, definition)}</p>
        <p className="mt-2 text-[11px] text-muted-foreground">{result.metric.sampleSize} card{result.metric.sampleSize === 1 ? "" : "s"} na amostra</p>
        {result.metric.comparisonValue !== undefined && <p className="mt-1 text-[11px] text-muted-foreground">Período anterior: {formatMetricValue(result.metric.comparisonValue ?? null, result.metric.formatType, definition)}{result.metric.comparisonPercentage !== undefined ? ` (${result.metric.comparisonPercentage.toFixed(1)}%)` : ""}</p>}
      </div>
    );
  }
  if (panel.visualization.visualizationType === "gauge") return <Gauge result={result} definition={definition} panel={panel} />;
  if (panel.visualization.visualizationType === "table" || panel.visualization.visualizationType === "card_list") {
    return (
      <div className="max-h-full overflow-auto rounded-[7px] border border-border">
        <table className="w-full min-w-[320px] text-left text-xs">
          <thead className="sticky top-0 bg-muted/80 text-[10px] uppercase tracking-wide text-muted-foreground"><tr><th className="px-3 py-2">Grupo</th><th className="px-3 py-2 text-right">Valor</th></tr></thead>
          <tbody>{result.metric.groups.map((group) => (
            <tr key={Object.values(group.dimensionValues).join("|")} className="border-t border-border"><td className="px-3 py-2 text-muted-foreground">{Object.values(group.dimensionValues).join(" / ") || "Total"}</td><td className="px-3 py-2 text-right font-mono font-semibold text-foreground">{formatMetricValue(group.value, result.metric.formatType, definition)}</td></tr>
          ))}</tbody>
        </table>
      </div>
    );
  }
  return <MetricChart result={result} panel={panel} />;
}

function DashboardPanelCard({ panel, result, definition, editing, onEdit, onDelete }: { readonly panel: DashboardPanel; readonly result: DashboardPanelResult | undefined; readonly definition: MetricDefinition | undefined; readonly editing: boolean; readonly onEdit: () => void; readonly onDelete: () => void }): ReactNode {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[9px] border border-border bg-card shadow-[0_1px_2px_rgb(15_23_42/0.04),0_5px_14px_rgb(15_23_42/0.04)]">
      <div className="panel-drag-handle flex shrink-0 cursor-grab items-center gap-2 border-b border-border px-4 py-3 active:cursor-grabbing">
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/60" />
        <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-foreground">{panel.panelTitle}</p>{panel.panelDescription !== undefined && <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{panel.panelDescription}</p>}</div>
        {editing && <div className="flex items-center gap-1" onMouseDown={(event) => event.stopPropagation()}><button type="button" className="rounded-[5px] p-1 text-muted-foreground hover:bg-muted hover:text-foreground" onClick={onEdit} aria-label="Editar painel"><Pencil className="h-3.5 w-3.5" /></button><button type="button" className="rounded-[5px] p-1 text-muted-foreground hover:bg-status-danger-subtle hover:text-status-danger" onClick={onDelete} aria-label="Excluir painel"><Trash2 className="h-3.5 w-3.5" /></button></div>}
      </div>
      <div className="min-h-0 flex-1 p-3">{result === undefined ? <p className="text-xs text-muted-foreground">Sem resultado.</p> : <PanelBody result={result} definition={definition} panel={panel} />}</div>
    </div>
  );
}

function toLayout(panels: readonly DashboardPanel[]): Layout[] {
  return panels.map((panel) => ({ i: panel.panelId, x: panel.layout.horizontalStartColumn, y: panel.layout.verticalStartRow, w: panel.layout.horizontalSpanColumns, h: panel.layout.verticalSpanRows, minW: panel.layout.minimumHorizontalSpanColumns, minH: panel.layout.minimumVerticalSpanRows }));
}

export default function BoardMetricsPage(): ReactNode {
  const { boardId = "" } = useParams();
  const addToast = useToastStore((state) => state.addToast);
  const confirm = useConfirm();
  const [data, setData] = useState<BoardMetricsResponse | null>(null);
  const [dashboard, setDashboard] = useState<BoardMetricsDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState("30");
  const [variableValues, setVariableValues] = useState<Record<string, string[]>>({});
  const [editing, setEditing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advancedText, setAdvancedText] = useState("");
  const [advancedError, setAdvancedError] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [panelDraft, setPanelDraft] = useState<{ panelTitle: string; metricId: string; visualizationType: PanelVisualizationType; span: string }>({ panelTitle: "", metricId: "", visualizationType: "stat", span: "4" });
  const [editingPanelId, setEditingPanelId] = useState<string | null>(null);

  const canManage = data?.board.accessRole === "owner" || data?.board.accessRole === "admin";
  const panelResults = useMemo(() => new Map((data?.panels ?? []).map((panel) => [panel.panelId, panel])), [data]);
  const definitions = useMemo(() => new Map((dashboard?.metricDefinitions ?? []).map((metric) => [metric.metricId, metric])), [dashboard]);
  const dateRange = useMemo(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - Number(days));
    return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
  }, [days]);

  async function load(): Promise<void> {
    setIsLoading(true);
    setError(null);
    try {
      const response = await boardsApi.getMetrics(boardId, { ...dateRange, variableValues });
      setData(response);
      setDashboard(response.dashboard);
      setBreadcrumbLeaf(response.dashboard.dashboardMetadata.dashboardName);
      if (data === null) setDays(String(response.dashboard.dashboardSettings.timeRangeSettings.defaultRelativeDays));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { void load(); }, [boardId]);

  useEffect(() => () => setBreadcrumbLeaf(undefined), []);
  useEffect(() => {
    if (data === null) return;
    void boardsApi.getMetrics(boardId, { ...dateRange, variableValues }).then((response) => { setData(response); setDashboard(response.dashboard); }).catch((err: unknown) => addToast({ type: "error", title: "Erro ao atualizar métricas", description: getApiErrorMessage(err) }));
  }, [days, variableValues]);

  useEffect(() => {
    const refreshSettings = dashboard?.dashboardSettings.refreshSettings;
    if (refreshSettings?.automaticRefreshEnabled !== true || editing || dirty) return;
    const timer = window.setInterval(() => { void load(); }, refreshSettings.refreshIntervalSeconds * 1000);
    return () => window.clearInterval(timer);
  }, [dashboard?.dashboardSettings.refreshSettings.automaticRefreshEnabled, dashboard?.dashboardSettings.refreshSettings.refreshIntervalSeconds, boardId, days, editing, dirty, variableValues]);

  function updatePanels(panels: readonly DashboardPanel[]): void {
    setDashboard((current) => current === null ? current : { ...current, panelDefinitions: panels });
    setDirty(true);
  }

  function handleLayoutChange(nextLayout: readonly Layout[]): void {
    if (!editing || dashboard === null) return;
    const byId = new Map(nextLayout.map((item) => [item.i, item]));
    updatePanels(dashboard.panelDefinitions.map((panel) => {
      const item = byId.get(panel.panelId);
      return item === undefined ? panel : { ...panel, layout: { ...panel.layout, horizontalStartColumn: item.x, verticalStartRow: item.y, horizontalSpanColumns: item.w, verticalSpanRows: item.h } };
    }));
  }

  async function saveDashboard(): Promise<void> {
    if (dashboard === null) return;
    try {
      await boardsApi.saveMetricsDashboard(boardId, dashboard);
      addToast({ type: "success", title: "Dashboard salvo" });
      setDirty(false);
      setEditing(false);
      await load();
    } catch (err) {
      addToast({ type: "error", title: "Não foi possível salvar", description: getApiErrorMessage(err) });
    }
  }

  function openAdvanced(): void {
    if (dashboard === null) return;
    setAdvancedText(JSON.stringify(dashboard, null, 2));
    setAdvancedError(null);
    setAdvancedOpen(true);
  }

  async function applyAdvanced(): Promise<void> {
    try {
      const parsed = JSON.parse(advancedText) as BoardMetricsDashboard;
      if (parsed.documentType !== "boardMetricsDashboard") throw new Error("Documento inválido: documentType incorreto");
      await boardsApi.saveMetricsDashboard(boardId, parsed);
      setAdvancedOpen(false);
      setDirty(false);
      setEditing(false);
      addToast({ type: "success", title: "Dashboard validado e salvo" });
      await load();
    } catch (err) {
      setAdvancedError(getApiErrorMessage(err));
    }
  }

  function openPanelEditor(panel?: DashboardPanel): void {
    if (dashboard === null) return;
    if (panel !== undefined) {
      setEditingPanelId(panel.panelId);
      setPanelDraft({ panelTitle: panel.panelTitle, metricId: panel.metricId, visualizationType: panel.visualization.visualizationType, span: String(panel.layout.horizontalSpanColumns) });
    } else {
      setEditingPanelId(null);
      setPanelDraft({ panelTitle: "", metricId: dashboard.metricDefinitions[0]?.metricId ?? "", visualizationType: "stat", span: "4" });
    }
    setPanelOpen(true);
  }

  function savePanel(): void {
    if (dashboard === null || panelDraft.metricId.length === 0) return;
    const metric = dashboard.metricDefinitions.find((item) => item.metricId === panelDraft.metricId);
    if (metric === undefined) return;
    const currentPanel = editingPanelId === null ? undefined : dashboard.panelDefinitions.find((panel) => panel.panelId === editingPanelId);
    const startColumn = currentPanel?.layout.horizontalStartColumn ?? 0;
    const maxSpan = Math.max(1, dashboard.dashboardSettings.gridSettings.columnCount - startColumn);
    const span = Math.max(1, Math.min(maxSpan, Number(panelDraft.span) || 4));
    if (editingPanelId !== null) {
      updatePanels(dashboard.panelDefinitions.map((panel) => panel.panelId === editingPanelId ? { ...panel, panelTitle: panelDraft.panelTitle.trim() || metric.metricName, metricId: panelDraft.metricId, visualization: { ...panel.visualization, visualizationType: panelDraft.visualizationType }, layout: { ...panel.layout, horizontalSpanColumns: span, minimumHorizontalSpanColumns: Math.min(span, panel.layout.minimumHorizontalSpanColumns) } } : panel));
    } else {
      const bottom = dashboard.panelDefinitions.reduce((max, panel) => Math.max(max, panel.layout.verticalStartRow + panel.layout.verticalSpanRows), 0);
      updatePanels([...dashboard.panelDefinitions, { panelId: `panel-${String(Date.now())}`, panelTitle: panelDraft.panelTitle.trim() || metric.metricName, metricId: panelDraft.metricId, visualization: { visualizationType: panelDraft.visualizationType }, layout: { horizontalStartColumn: 0, verticalStartRow: bottom, horizontalSpanColumns: span, verticalSpanRows: 3, minimumHorizontalSpanColumns: 2, minimumVerticalSpanRows: 2 } }]);
    }
    setPanelOpen(false);
  }

  async function saveNewPanel(result: { readonly metric: MetricDefinition; readonly panel: DashboardPanel }): Promise<void> {
    if (dashboard === null) return;
    const nextDashboard: BoardMetricsDashboard = {
      ...dashboard,
      metricDefinitions: [...dashboard.metricDefinitions, result.metric],
      panelDefinitions: [...dashboard.panelDefinitions, result.panel],
    };
    await boardsApi.saveMetricsDashboard(boardId, nextDashboard);
    setBuilderOpen(false);
    setDirty(false);
    setEditing(false);
    addToast({ type: "success", title: "Painel criado" });
    await load();
  }

  async function exitEditing(): Promise<void> {
    if (dirty) {
      const confirmed = await confirm({
        title: "Sair da edição?",
        description: "As alterações não salvas serão descartadas.",
        confirmLabel: "Sair sem salvar",
        cancelLabel: "Continuar editando",
        destructive: false,
      });
      if (!confirmed) return;
      setDirty(false);
      await load();
    }
    setEditing(false);
  }

  async function removePanel(panel: DashboardPanel): Promise<void> {
    const confirmed = await confirm({ title: "Excluir painel", description: `Remover “${panel.panelTitle}” do dashboard?`, confirmLabel: "Remover painel", destructive: true });
    if (confirmed && dashboard !== null) updatePanels(dashboard.panelDefinitions.filter((item) => item.panelId !== panel.panelId));
  }

  if (isLoading && data === null) return <SkeletonPage />;
  if (error !== null || data === null || dashboard === null) return <div className="page-content"><p className="text-sm text-status-danger">{error ?? "Não foi possível carregar as métricas."}</p></div>;

  return (
    <div className="animate-in">
      <PageHeader
        title={dashboard.dashboardMetadata.dashboardName}
        description={dashboard.dashboardMetadata.dashboardDescription ?? "Métricas do quadro"}
        action={(
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/admin/boards/${boardId}`} className="btn btn-outline btn-sm"><ArrowLeft className="h-4 w-4" /> Quadro</Link>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => void load()}><RefreshCw className="h-4 w-4" /> Atualizar</button>
            {canManage && <button type="button" className={editing ? "btn btn-primary btn-sm" : "btn btn-outline btn-sm"} onClick={() => { if (editing) { void exitEditing(); } else { setEditing(true); } }}><Pencil className="h-4 w-4" /> {editing ? "Sair da edição" : "Editar"}</button>}
            {canManage && editing && <button type="button" className="btn btn-outline btn-sm" onClick={openAdvanced}><Code2 className="h-4 w-4" /> JSON</button>}
            {canManage && editing && <button type="button" className="btn btn-outline btn-sm" onClick={() => setBuilderOpen(true)}><Plus className="h-4 w-4" /> Painel</button>}
            {canManage && dirty && <button type="button" className="btn btn-primary btn-sm" onClick={() => void saveDashboard()}><Save className="h-4 w-4" /> Salvar</button>}
          </div>
        )}
      />
      <div className="page-content-wide space-y-4 pb-10">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[9px] border border-border bg-card px-4 py-3">
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground"><span className="flex items-center gap-1.5 font-medium text-foreground"><BarChart3 className="h-3.5 w-3.5 text-gold" /> {data.metadata.totalCards} cards ativos</span><span>{data.metadata.archivedCards} arquivados</span><span>Dados desde {formatDate(data.metadata.metricsDataSince)}</span>{data.metadata.historyTruncated && <span className="text-status-warning">Histórico parcial</span>}</div>
          <Select value={days} onValueChange={setDays} options={PERIOD_OPTIONS} ariaLabel="Período" disabled={editing || dirty} className="w-48" />
        </div>
        <ResponsiveGridLayout
          className="layout"
          layouts={{ lg: toLayout(dashboard.panelDefinitions), md: toLayout(dashboard.panelDefinitions), sm: toLayout(dashboard.panelDefinitions), xs: toLayout(dashboard.panelDefinitions), xxs: toLayout(dashboard.panelDefinitions) }}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: dashboard.dashboardSettings.gridSettings.columnCount, md: dashboard.dashboardSettings.gridSettings.columnCount, sm: dashboard.dashboardSettings.gridSettings.columnCount, xs: dashboard.dashboardSettings.gridSettings.columnCount, xxs: dashboard.dashboardSettings.gridSettings.columnCount }}
          rowHeight={dashboard.dashboardSettings.gridSettings.rowHeightPixels}
          margin={[dashboard.dashboardSettings.gridSettings.horizontalGapPixels, dashboard.dashboardSettings.gridSettings.verticalGapPixels]}
          isDraggable={editing}
          isResizable={editing}
          draggableHandle=".panel-drag-handle"
          allowOverlap={dashboard.dashboardSettings.gridSettings.allowPanelOverlap}
          compactType={dashboard.dashboardSettings.gridSettings.compactVerticalLayout ? "vertical" : null}
          onLayoutChange={handleLayoutChange}
        >
          {dashboard.panelDefinitions.map((panel) => <div key={panel.panelId}><DashboardPanelCard panel={panel} result={panelResults.get(panel.panelId)} definition={definitions.get(panel.metricId)} editing={editing} onEdit={() => openPanelEditor(panel)} onDelete={() => void removePanel(panel)} /></div>)}
        </ResponsiveGridLayout>
        {editing && <p className="text-[11px] text-muted-foreground">Arraste os painéis pelo cabeçalho e redimensione pelas bordas. Altere métricas avançadas pelo editor JSON.</p>}
      </div>
      <Modal open={panelOpen} onOpenChange={setPanelOpen} title="Editar painel" description="Ajuste a apresentação deste painel. Para alterar a query, use o editor JSON avançado.">
        <div className="space-y-4">
          <div className="form-group"><label className="form-label">Título</label><input className="input-base" value={panelDraft.panelTitle} onChange={(event) => setPanelDraft((current) => ({ ...current, panelTitle: event.target.value }))} placeholder="Deixe vazio para usar o nome da métrica" /></div>
          <div className="form-group"><label className="form-label">Métrica</label><Select value={panelDraft.metricId} onValueChange={(value) => setPanelDraft((current) => ({ ...current, metricId: value }))} options={dashboard.metricDefinitions.map((metric) => ({ value: metric.metricId, label: metric.metricName }))} ariaLabel="Métrica" /></div>
          <div className="grid gap-4 sm:grid-cols-2"><div className="form-group"><label className="form-label">Visualização</label><Select value={panelDraft.visualizationType} onValueChange={(value) => setPanelDraft((current) => ({ ...current, visualizationType: value as PanelVisualizationType }))} options={VISUALIZATION_OPTIONS} ariaLabel="Visualização" /></div><div className="form-group"><label className="form-label">Largura no grid</label><Select value={panelDraft.span} onValueChange={(value) => setPanelDraft((current) => ({ ...current, span: value }))} options={[3, 4, 6, 8, 12].map((value) => ({ value: String(value), label: `${String(value)} colunas` }))} ariaLabel="Largura" /></div></div>
          <div className="flex justify-end gap-2"><button type="button" className="btn btn-secondary rounded-[8px]" onClick={() => setPanelOpen(false)}>Cancelar</button><button type="button" className="btn btn-primary rounded-[8px]" onClick={savePanel}>Aplicar</button></div>
        </div>
      </Modal>
      <PanelBuilder open={builderOpen} board={data.board} dashboard={dashboard} onClose={() => setBuilderOpen(false)} onSave={saveNewPanel} />

      <Modal open={advancedOpen} onOpenChange={setAdvancedOpen} title="Documento avançado do dashboard" description="Use o JSON descritivo para criar métricas, filtros, fórmulas e layouts complexos." className="max-h-[90vh] max-w-5xl overflow-y-auto">
        <div className="space-y-3">
          {advancedError !== null && <div className="rounded-[7px] border border-status-danger-border bg-status-danger-subtle p-3 text-xs text-status-danger">{advancedError}</div>}
          <textarea className="min-h-[55vh] w-full resize-y rounded-[7px] border border-border bg-slate-950 p-4 font-mono text-[11px] leading-relaxed text-slate-200 outline-none focus:border-navy" value={advancedText} onChange={(event) => setAdvancedText(event.target.value)} spellCheck={false} />
          <div className="flex justify-end gap-2"><button type="button" className="btn btn-secondary rounded-[8px]" onClick={() => setAdvancedOpen(false)}><X className="h-4 w-4" /> Fechar</button><button type="button" className="btn btn-primary rounded-[8px]" onClick={() => void applyAdvanced()}><Check className="h-4 w-4" /> Validar e salvar</button></div>
        </div>
      </Modal>
    </div>
  );
}
