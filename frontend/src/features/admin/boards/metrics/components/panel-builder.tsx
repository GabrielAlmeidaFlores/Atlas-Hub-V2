import { useEffect, useMemo, useState, type ReactNode } from "react";
import { BarChart3, Calculator, Filter, LayoutPanelTop, Plus, SlidersHorizontal, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { BoardView } from "@/types";
import type {
  BoardMetricsDashboard, DashboardPanel, MetricDefinition, MetricFilterCondition,
  MetricFilterGroup, MetricGroupByDimension, MetricQuery, MetricSourceField,
  PanelVisualizationType,
} from "../types";

interface BuilderCondition {
  readonly conditionId: string;
  readonly sourceType: "board_column" | "board_label" | "board_assignee" | "template_field" | "system_updated_at" | "board_archived_state";
  readonly sourceId: string;
  readonly operator: "equals" | "not_equals" | "contains" | "exists" | "not_exists" | "greater_than" | "less_than" | "older_than_days" | "within_last_days" | "is_archived" | "is_not_archived";
  readonly value: string;
}

type BuilderMode = "simple" | "ratio" | "weighted";
type MeasureType = "count" | "distinct_count" | "sum" | "average" | "median" | "p90" | "minimum" | "maximum" | "completeness" | "weighted_sum";

interface BuilderState {
  readonly panelTitle: string;
  readonly panelDescription: string;
  readonly metricName: string;
  readonly mode: BuilderMode;
  readonly measureType: MeasureType;
  readonly numericFieldId: string;
  readonly groupBy: string;
  readonly visualizationType: PanelVisualizationType;
  readonly span: string;
  readonly formatType: "number" | "percentage" | "currency" | "duration_days";
  readonly decimalPlaces: string;
  readonly logicalOperator: "and" | "or";
  readonly conditions: readonly BuilderCondition[];
  readonly numeratorConditions: readonly BuilderCondition[];
  readonly denominatorConditions: readonly BuilderCondition[];
  readonly weights: Readonly<Record<string, string>>;
}

const SOURCE_OPTIONS = [
  { value: "board_column", label: "Coluna" },
  { value: "board_label", label: "Label" },
  { value: "board_assignee", label: "Responsável" },
  { value: "template_field", label: "Campo do template" },
  { value: "system_updated_at", label: "Última atualização" },
  { value: "board_archived_state", label: "Estado arquivado" },
];
const OPERATOR_OPTIONS = [
  { value: "equals", label: "é igual a" },
  { value: "not_equals", label: "é diferente de" },
  { value: "contains", label: "contém" },
  { value: "exists", label: "está preenchido" },
  { value: "not_exists", label: "está vazio" },
  { value: "greater_than", label: "maior que" },
  { value: "less_than", label: "menor que" },
  { value: "older_than_days", label: "há mais de X dias" },
  { value: "within_last_days", label: "nos últimos X dias" },
  { value: "is_archived", label: "está arquivado" },
  { value: "is_not_archived", label: "não está arquivado" },
];
const MEASURE_OPTIONS = [
  { value: "count", label: "Contagem de cards" },
  { value: "distinct_count", label: "Contagem distinta" },
  { value: "sum", label: "Soma" },
  { value: "average", label: "Média" },
  { value: "median", label: "Mediana" },
  { value: "p90", label: "P90" },
  { value: "minimum", label: "Mínimo" },
  { value: "maximum", label: "Máximo" },
];
const MODE_OPTIONS = [
  { value: "simple", label: "Medida simples", description: "Conte, some ou calcule uma média." },
  { value: "ratio", label: "Proporção", description: "Compare dois conjuntos de filtros." },
  { value: "weighted", label: "Soma ponderada", description: "Aplique pesos por coluna." },
] as const;

const VISUALIZATION_OPTIONS: { value: PanelVisualizationType; label: string }[] = [
  { value: "stat", label: "Número" },
  { value: "bar_chart", label: "Barras" },
  { value: "line_chart", label: "Linha" },
  { value: "donut_chart", label: "Donut" },
  { value: "gauge", label: "Gauge" },
  { value: "table", label: "Tabela" },
  { value: "card_list", label: "Lista" },
];

function fieldOptionsFor(sourceType: BuilderCondition["sourceType"], board: BoardView): { readonly value: string; readonly label: string }[] {
  if (sourceType === "board_column") return board.columns.map((column) => ({ value: column.columnId, label: column.name }));
  if (sourceType === "board_label") return board.labels.map((label) => ({ value: label.labelId, label: label.name }));
  if (sourceType === "board_assignee") return [...new Set(board.cards.flatMap((card) => card.assigneeEmails ?? []))].map((email) => ({ value: email, label: email }));
  if (sourceType === "template_field") return board.templates.flatMap((template) => template.fields).map((field) => ({ value: field.fieldId, label: field.label }));
  return [];
}

function newCondition(board: BoardView): BuilderCondition {
  return { conditionId: crypto.randomUUID(), sourceType: "board_column", sourceId: board.columns[0]?.columnId ?? "", operator: "equals", value: "" };
}

function sourceField(condition: BuilderCondition, board: BoardView): MetricSourceField {
  if (condition.sourceType === "board_column") return { sourceType: "board_column", columnId: condition.sourceId, ...(board.columns.find((item) => item.columnId === condition.sourceId)?.name !== undefined ? { sourceLabelSnapshot: board.columns.find((item) => item.columnId === condition.sourceId)?.name } : {}) };
  if (condition.sourceType === "board_label") return { sourceType: "board_label", labelId: condition.sourceId };
  if (condition.sourceType === "board_assignee") return { sourceType: "board_assignee", assigneeEmail: condition.sourceId };
  if (condition.sourceType === "template_field") return { sourceType: "template_field", fieldId: condition.sourceId };
  if (condition.sourceType === "system_updated_at") return { sourceType: "system_field", systemField: "updatedAt" };
  return { sourceType: "board_archived_state" };
}

function conditionValue(condition: BuilderCondition): unknown {
  if (condition.operator === "exists" || condition.operator === "not_exists" || condition.operator === "is_archived" || condition.operator === "is_not_archived") return undefined;
  if (condition.operator === "older_than_days" || condition.operator === "within_last_days" || condition.operator === "greater_than" || condition.operator === "less_than") return Number(condition.value);
  return condition.value;
}

function filterGroup(conditions: readonly BuilderCondition[], logicalOperator: "and" | "or", board: BoardView): MetricFilterGroup | undefined {
  const active = conditions.filter((condition) => condition.operator === "exists" || condition.operator === "not_exists" || condition.operator === "is_archived" || condition.operator === "is_not_archived" || condition.sourceType === "system_updated_at" || condition.sourceId.length > 0);
  if (active.length === 0) return undefined;
  const filterConditions: MetricFilterCondition[] = active.map((condition) => {
    const value = conditionValue(condition);
    return {
      conditionType: "comparison",
      sourceField: sourceField(condition, board),
      comparisonOperator: condition.operator,
      ...(value !== undefined ? { comparisonValue: value } : {}),
    };
  });
  return { logicalOperator, filterConditions, nestedFilterGroups: [] };
}

function buildGroupBy(value: string, board: BoardView): MetricGroupByDimension | undefined {
  if (value === "none") return undefined;
  if (value === "column") return { dimensionType: "board_column", dimensionLabel: "Coluna" };
  if (value === "label") return { dimensionType: "board_label", dimensionLabel: "Label" };
  if (value === "assignee") return { dimensionType: "board_assignee", dimensionLabel: "Responsável" };
  if (value === "template") return { dimensionType: "template", dimensionLabel: "Template" };
  if (value === "week") return { dimensionType: "time_bucket", timeBucketSource: "createdAt", bucketSize: "week", dimensionLabel: "Semana" };
  if (value.startsWith("field:")) {
    const fieldId = value.slice("field:".length);
    const field = board.templates.flatMap((template) => template.fields).find((item) => item.fieldId === fieldId);
    return { dimensionType: "template_field", fieldId, ...(field !== undefined ? { dimensionLabel: field.label } : {}) };
  }
  return undefined;
}

function buildQuery(state: BuilderState, board: BoardView, conditions: readonly BuilderCondition[]): MetricQuery {
  const measurement: MetricQuery["measurement"] = state.mode === "weighted" || state.measureType === "weighted_sum"
    ? {
        aggregationType: "weighted_sum",
        numericField: { sourceType: "template_field", fieldId: state.numericFieldId },
        weightDefinition: {
          weightSourceType: "board_column",
          columnWeights: board.columns.map((column) => ({ columnId: column.columnId, columnLabelSnapshot: column.name, weight: Number(state.weights[column.columnId] ?? 0) })),
        },
        nullValueHandling: "ignore_nulls",
      }
    : {
        aggregationType: state.measureType,
        ...(["sum", "average", "median", "p90", "minimum", "maximum"].includes(state.measureType) && state.numericFieldId.length > 0 ? { numericField: { sourceType: "template_field" as const, fieldId: state.numericFieldId } } : {}),
        nullValueHandling: "ignore_nulls",
      };
  const groupBy = buildGroupBy(state.groupBy, board);
  return {
    filterGroup: filterGroup(conditions, state.logicalOperator, board),
    ...(groupBy !== undefined ? { grouping: { groupByDimensions: [groupBy] } } : {}),
    measurement,
  };
}

function buildDefinitions(state: BuilderState, board: BoardView, dashboard: BoardMetricsDashboard): { metric: MetricDefinition; panel: DashboardPanel } {
  const metricId = `metric-${String(Date.now())}`;
  const panelId = `panel-${String(Date.now())}`;
  const metricName = state.metricName.trim() || state.panelTitle.trim() || "Nova métrica";
  const baseFormatting = { formatType: state.formatType, decimalPlaces: Number(state.decimalPlaces) || 0, nullDisplayValue: "—" as const };
  const dataSource = { dataSourceType: "board_cards" as const, includeArchivedCards: false, applyDashboardVariables: true, applyDashboardTimeRange: false };
  const namedQueries: Record<string, MetricQuery> = state.mode === "ratio"
    ? {
        numerador: buildQuery(state, board, state.numeratorConditions),
        denominador: buildQuery(state, board, state.denominatorConditions),
      }
    : { value: buildQuery(state, board, state.conditions) };
  const metric: MetricDefinition = {
    metricId,
    metricName,
    metricDescription: state.panelDescription.trim() || undefined,
    calculation: {
      dataSource,
      namedQueries,
      ...(state.mode === "ratio" ? { resultFormula: { formulaExpression: "numerador / (numerador + denominador) * 100" } } : {}),
      formatting: { ...baseFormatting, ...(state.mode === "ratio" ? { formatType: "percentage" as const } : {}) },
    },
  };
  const bottom = dashboard.panelDefinitions.reduce((max, panel) => Math.max(max, panel.layout.verticalStartRow + panel.layout.verticalSpanRows), 0);
  const span = Math.max(2, Math.min(dashboard.dashboardSettings.gridSettings.columnCount, Number(state.span) || 4));
  const panel: DashboardPanel = {
    panelId,
    panelTitle: state.panelTitle.trim() || metricName,
    ...(state.panelDescription.trim().length > 0 ? { panelDescription: state.panelDescription.trim() } : {}),
    metricId,
    visualization: { visualizationType: state.visualizationType },
    layout: { horizontalStartColumn: 0, verticalStartRow: bottom, horizontalSpanColumns: span, verticalSpanRows: 3, minimumHorizontalSpanColumns: 2, minimumVerticalSpanRows: 2 },
  };
  return { metric, panel };
}

function ConditionRows({ conditions, board, onChange }: { readonly conditions: readonly BuilderCondition[]; readonly board: BoardView; readonly onChange: (next: readonly BuilderCondition[]) => void }): ReactNode {
  function update(id: string, patch: Partial<BuilderCondition>): void {
    onChange(conditions.map((condition) => condition.conditionId === id ? { ...condition, ...patch } : condition));
  }
  return (
    <div className="space-y-2">
      {conditions.map((condition) => {
        const fieldOptions = fieldOptionsFor(condition.sourceType, board);
        const hasValue = !["exists", "not_exists", "is_archived", "is_not_archived"].includes(condition.operator);
        return (
          <div key={condition.conditionId} className="grid gap-2 rounded-[7px] border border-border bg-muted/20 p-3 sm:grid-cols-[150px_150px_150px_minmax(0,1fr)_32px] sm:items-center">
            <Select value={condition.sourceType} onValueChange={(value) => {
              const sourceType = value as BuilderCondition["sourceType"];
              update(condition.conditionId, { sourceType, sourceId: fieldOptionsFor(sourceType, board)[0]?.value ?? "", operator: "equals", value: "" });
            }} options={SOURCE_OPTIONS} ariaLabel="Campo do filtro" />
            {fieldOptions.length > 0 ? <Select value={condition.sourceId} onValueChange={(value) => update(condition.conditionId, { sourceId: value })} options={fieldOptions} ariaLabel="Valor do campo" /> : <span className="text-xs text-muted-foreground">Data de atualização</span>}
            <Select value={condition.operator} onValueChange={(value) => update(condition.conditionId, { operator: value as BuilderCondition["operator"] })} options={OPERATOR_OPTIONS.filter((option) => condition.sourceType === "board_archived_state" ? ["is_archived", "is_not_archived"].includes(option.value) : condition.sourceType === "system_updated_at" ? ["older_than_days", "within_last_days"].includes(option.value) : true)} ariaLabel="Operador" />
            {hasValue ? <input className="input-base" value={condition.value} onChange={(event) => update(condition.conditionId, { value: event.target.value })} placeholder="Valor" /> : <span className="text-xs text-muted-foreground">Sem valor</span>}
            <button type="button" className="rounded-[5px] p-1.5 text-muted-foreground hover:bg-status-danger-subtle hover:text-status-danger" onClick={() => onChange(conditions.filter((item) => item.conditionId !== condition.conditionId))} aria-label="Remover condição"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        );
      })}
      <button type="button" className="btn btn-outline btn-sm" onClick={() => onChange([...conditions, newCondition(board)])}><Plus className="h-3.5 w-3.5" /> Adicionar condição</button>
    </div>
  );
}

function SectionHeading({ step, title, description, icon: Icon }: { readonly step: string; readonly title: string; readonly description: string; readonly icon: typeof BarChart3 }): ReactNode {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy text-[11px] font-semibold text-white">{step}</span>
      <div>
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground"><Icon className="h-3.5 w-3.5 text-gold" /> {title}</h3>
        <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function initialState(): BuilderState {
  return {
    panelTitle: "", panelDescription: "", metricName: "", mode: "simple", measureType: "count",
    numericFieldId: "", groupBy: "none", visualizationType: "stat", span: "4",
    formatType: "number", decimalPlaces: "0", logicalOperator: "and",
    conditions: [], numeratorConditions: [], denominatorConditions: [], weights: {},
  };
}

export function PanelBuilder({ open, board, dashboard, onClose, onSave }: {
  readonly open: boolean;
  readonly board: BoardView;
  readonly dashboard: BoardMetricsDashboard;
  readonly onClose: () => void;
  readonly onSave: (result: { metric: MetricDefinition; panel: DashboardPanel }) => Promise<void>;
}): ReactNode {
  const [state, setState] = useState<BuilderState>(initialState);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!open) return;
    setState(initialState());
    setError(null);
  }, [open]);
  const [saving, setSaving] = useState(false);
  const numericFields = useMemo(() => board.templates.flatMap((template) => template.fields).filter((field) => field.type === "number"), [board.templates]);
  const groupOptions = [
    { value: "none", label: "Sem agrupamento" },
    { value: "column", label: "Coluna" },
    { value: "label", label: "Label" },
    { value: "assignee", label: "Responsável" },
    { value: "template", label: "Template" },
    { value: "week", label: "Criado por semana" },
    ...board.templates.flatMap((template) => template.fields.filter((field) => field.type === "select" || field.type === "checkbox").map((field) => ({ value: `field:${field.fieldId}`, label: field.label }))),
  ];

  function update(patch: Partial<BuilderState>): void {
    setState((current) => ({ ...current, ...patch }));
  }

  async function handleSave(): Promise<void> {
    if (state.panelTitle.trim().length === 0 && state.metricName.trim().length === 0) {
      setError("Informe o título do painel");
      return;
    }
    if (state.mode !== "ratio" && ["sum", "average", "median", "p90", "minimum", "maximum", "weighted_sum"].includes(state.measureType) && state.numericFieldId.length === 0) {
      setError("Escolha um campo numérico para esta medida");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(buildDefinitions(state, board, dashboard));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o painel");
    } finally {
      setSaving(false);
    }
  }

  const modeLabel = MODE_OPTIONS.find((option) => option.value === state.mode)?.label ?? "Medida";
  const visualizationLabel = VISUALIZATION_OPTIONS.find((option) => option.value === state.visualizationType)?.label ?? "Número";
  const groupLabel = groupOptions.find((option) => option.value === state.groupBy)?.label ?? "Sem agrupamento";
  const needsNumericField = state.mode === "weighted" || ["sum", "average", "median", "p90", "minimum", "maximum"].includes(state.measureType);
  const spanOptions = [3, 4, 6, 8, 12].filter((value) => value <= dashboard.dashboardSettings.gridSettings.columnCount);
  const summaryTitle = state.panelTitle.trim() || state.metricName.trim() || "Novo painel";

  return (
    <Modal open={open} onOpenChange={(next) => { if (!next) onClose(); }} title="Novo painel" description="Monte uma métrica visual em poucos passos. O painel será salvo e aparecerá no dashboard." className="flex max-h-[calc(100vh-2rem)] max-w-5xl flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
        {error !== null && <div className="rounded-[7px] border border-status-danger-border bg-status-danger-subtle p-3 text-xs text-status-danger">{error}</div>}

        <div className="rounded-[9px] border border-navy/15 bg-navy/[0.04] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-navy/60">Resumo do painel</p>
          <p className="mt-1 text-sm font-semibold text-foreground">{summaryTitle}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{modeLabel} · {groupLabel} · {visualizationLabel}</p>
        </div>

        <section className="space-y-4 rounded-[9px] border border-border p-4">
          <SectionHeading step="1" title="O que você quer mostrar?" description="Dê um nome ao painel e à métrica. Esses nomes aparecem no dashboard e no editor." icon={LayoutPanelTop} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="form-group"><label className="form-label" htmlFor="panel-title">Título do painel</label><input id="panel-title" className="input-base" value={state.panelTitle} onChange={(event) => update({ panelTitle: event.target.value })} placeholder="Ex.: Pipeline por etapa" /></div>
            <div className="form-group"><label className="form-label" htmlFor="metric-name">Nome da métrica</label><input id="metric-name" className="input-base" value={state.metricName} onChange={(event) => update({ metricName: event.target.value })} placeholder="Ex.: Valor por etapa" /></div>
            <div className="form-group sm:col-span-2"><label className="form-label" htmlFor="panel-description">Descrição</label><input id="panel-description" className="input-base" value={state.panelDescription} onChange={(event) => update({ panelDescription: event.target.value })} placeholder="Explique em uma frase o que este painel mostra." /></div>
          </div>
        </section>

        <section className="space-y-4 rounded-[9px] border border-border p-4">
          <SectionHeading step="2" title="Como calcular?" description="Escolha o tipo de cálculo e como os cards serão agrupados." icon={Calculator} />
          <div className="grid gap-2 sm:grid-cols-3">
            {MODE_OPTIONS.map((option) => (
              <button key={option.value} type="button" onClick={() => update({ mode: option.value })} className={cn("rounded-[7px] border p-3 text-left transition-colors", state.mode === option.value ? "border-navy bg-navy/[0.05] text-navy" : "border-border bg-card text-foreground hover:bg-muted/40")}>
                <span className="block text-xs font-semibold">{option.label}</span>
                <span className={cn("mt-1 block text-[10px] leading-relaxed", state.mode === option.value ? "text-navy/70" : "text-muted-foreground")}>{option.description}</span>
              </button>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {state.mode === "simple" && <div className="form-group"><label className="form-label">Medida</label><Select value={state.measureType} onValueChange={(value) => update({ measureType: value as MeasureType, numericFieldId: value === "count" || value === "distinct_count" ? "" : state.numericFieldId })} options={MEASURE_OPTIONS} ariaLabel="Medida" /><p className="mt-1 text-[10px] text-muted-foreground">O que deve ser calculado em cada grupo de cards.</p></div>}
            {needsNumericField && <div className="form-group"><label className="form-label">Campo numérico</label><Select value={state.numericFieldId} onValueChange={(value) => update({ numericFieldId: value })} options={[{ value: "", label: "Selecione um campo" }, ...numericFields.map((field) => ({ value: field.fieldId, label: field.label }))]} ariaLabel="Campo numérico" /><p className="mt-1 text-[10px] text-muted-foreground">Usado para somas, médias, medianas e percentis.</p></div>}
            <div className="form-group"><label className="form-label">Agrupar por</label><Select value={state.groupBy} onValueChange={(value) => update({ groupBy: value })} options={groupOptions} ariaLabel="Agrupamento" /><p className="mt-1 text-[10px] text-muted-foreground">Cada grupo vira uma barra, fatia ou linha.</p></div>
          </div>
          {state.mode === "weighted" && (
            <div className="space-y-3 rounded-[7px] border border-border bg-muted/20 p-3">
              <div><p className="text-xs font-semibold text-foreground">Pesos por coluna</p><p className="mt-0.5 text-[10px] text-muted-foreground">O valor de cada card será multiplicado pelo peso da coluna atual. Ex.: 0,3 = 30%.</p></div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {board.columns.map((column) => <div key={column.columnId} className="flex items-center gap-2"><span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{column.name}</span><input type="number" min="0" max="1" step="0.05" className="input-base w-24" value={state.weights[column.columnId] ?? "0"} onChange={(event) => update({ weights: { ...state.weights, [column.columnId]: event.target.value } })} aria-label={`Peso de ${column.name}`} /></div>)}
              </div>
            </div>
          )}
          {state.mode === "ratio" && <div className="rounded-[7px] border border-status-info-border bg-status-info-subtle p-3 text-[11px] leading-relaxed text-status-info">Configure abaixo os cards do numerador e do denominador. A fórmula será <strong>numerador / (numerador + denominador) × 100</strong>.</div>}
        </section>

        <section className="space-y-4 rounded-[9px] border border-border p-4">
          <SectionHeading step="3" title={state.mode === "ratio" ? "Filtros do numerador" : "Filtros"} description="Opcional. Restrinja os cards por coluna, label, responsável, campo, data ou arquivamento." icon={Filter} />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] text-muted-foreground">{state.conditions.length === 0 && state.mode !== "ratio" ? "Nenhum filtro: todos os cards ativos serão considerados." : "Combine as condições abaixo."}</p>
            {state.mode !== "ratio" && <Select value={state.logicalOperator} onValueChange={(value) => update({ logicalOperator: value as "and" | "or" })} options={[{ value: "and", label: "Todas as condições (E)" }, { value: "or", label: "Qualquer condição (OU)" }]} ariaLabel="Operador lógico" className="w-52" />}
          </div>
          <ConditionRows conditions={state.mode === "ratio" ? state.numeratorConditions : state.conditions} board={board} onChange={(next) => update(state.mode === "ratio" ? { numeratorConditions: next } : { conditions: next })} />
        </section>

        {state.mode === "ratio" && (
          <section className="space-y-4 rounded-[9px] border border-border p-4">
            <SectionHeading step="3b" title="Filtros do denominador" description="Defina o conjunto usado como base da proporção." icon={Filter} />
            <ConditionRows conditions={state.denominatorConditions} board={board} onChange={(next) => update({ denominatorConditions: next })} />
          </section>
        )}

        <section className="space-y-4 rounded-[9px] border border-border p-4">
          <SectionHeading step="4" title="Como exibir?" description="Escolha o formato visual, a largura e a apresentação dos números." icon={BarChart3} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="form-group"><label className="form-label">Visualização</label><Select value={state.visualizationType} onValueChange={(value) => update({ visualizationType: value as PanelVisualizationType })} options={VISUALIZATION_OPTIONS} ariaLabel="Visualização" /></div>
            <div className="form-group"><label className="form-label">Largura</label><Select value={state.span} onValueChange={(value) => update({ span: value })} options={spanOptions.map((value) => ({ value: String(value), label: `${String(value)} colunas` }))} ariaLabel="Largura" /></div>
            {state.mode !== "ratio" && <div className="form-group"><label className="form-label">Formato</label><Select value={state.formatType} onValueChange={(value) => update({ formatType: value as BuilderState["formatType"] })} options={[{ value: "number", label: "Número" }, { value: "percentage", label: "Percentual" }, { value: "currency", label: "Moeda" }, { value: "duration_days", label: "Dias" }]} ariaLabel="Formato" /></div>}
            <div className="form-group"><label className="form-label">Casas decimais</label><input type="number" min="0" max="6" className="input-base" value={state.decimalPlaces} onChange={(event) => update({ decimalPlaces: event.target.value })} /></div>
          </div>
        </section>

        </div>
        <div className="shrink-0 flex justify-end gap-2 border-t border-border bg-card pt-4">
          <button type="button" className="btn btn-secondary rounded-[8px]" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn btn-primary rounded-[8px]" disabled={saving} onClick={() => void handleSave()}>{saving ? "Salvando…" : "Salvar e visualizar"}</button>
        </div>
      </div>
    </Modal>
  );
}
