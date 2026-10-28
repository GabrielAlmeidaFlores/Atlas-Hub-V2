import type {
  Board,
  BoardCard,
  BoardColumn,
  BoardLabel,
  BoardTemplate,
  BoardView,
} from '../types.js';
import type { BoardItemRecord } from '../repository.js';
import type {
  BoardMetricsDashboard,
  BoardMetricsFilterOptions,
  BoardMetricsQuery,
  BoardMetricsResponse,
  DashboardPanel,
  DashboardPanelResult,
  MetricDefinition,
  MetricEvaluationResult,
  MetricFilterCondition,
  MetricFilterGroup,
  MetricGroupByDimension,
  MetricGroupResult,
  MetricQuery,
  MetricSourceField,
} from './types.js';

interface MetricCard {
  readonly card: BoardCard;
  readonly column?: BoardColumn;
  readonly template?: BoardTemplate;
  readonly labels: readonly BoardLabel[];
}

interface EvaluationContext {
  readonly board: Board;
  readonly cards: readonly MetricCard[];
  readonly columns: readonly BoardColumn[];
  readonly labels: readonly BoardLabel[];
  readonly templates: readonly BoardTemplate[];
  readonly query: BoardMetricsQuery;
  readonly dashboardVariables: BoardMetricsDashboard['dashboardVariables'];
}

interface QueryEvaluation {
  readonly value: number | null;
  readonly groups: readonly MetricGroupResult[];
  readonly sampleSize: number;
}

const isColumn = (item: BoardItemRecord): item is BoardItemRecord & BoardColumn => item.itemKey.startsWith('COLUMN#');
const isLabel = (item: BoardItemRecord): item is BoardItemRecord & BoardLabel => item.itemKey.startsWith('LABEL#');
const isTemplate = (item: BoardItemRecord): item is BoardItemRecord & BoardTemplate => item.itemKey.startsWith('TEMPLATE#');
const isCard = (item: BoardItemRecord): item is BoardItemRecord & BoardCard => item.itemKey.startsWith('CARD#');

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function isPresent(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function valuesEqual(source: unknown, expected: unknown): boolean {
  if (Array.isArray(source)) return source.some((item) => valuesEqual(item, expected));
  if (typeof source === 'number' || typeof expected === 'number') {
    return asNumber(source) === asNumber(expected);
  }
  if (typeof source === 'boolean' || typeof expected === 'boolean') {
    return source === expected || String(source) === String(expected);
  }
  return String(source ?? '').toLowerCase() === String(expected ?? '').toLowerCase();
}

function sourceValue(card: MetricCard, source: MetricSourceField, variables: BoardMetricsQuery['variableValues']): unknown {
  switch (source.sourceType) {
    case 'board_column':
      return card.card.columnId;
    case 'template_field':
      return card.card.fieldValues[source.fieldId];
    case 'board_label':
      return card.card.labelIds;
    case 'board_assignee':
      return card.card.assigneeEmails ?? [];
    case 'template':
      return card.card.templateId ?? null;
    case 'system_field':
      switch (source.systemField) {
        case 'cardId': return card.card.cardId;
        case 'cardNumber': return card.card.cardNumber;
        case 'cardTitle': return card.card.title;
        case 'cardDescription': return card.card.description;
        case 'columnId': return card.card.columnId;
        case 'templateId': return card.card.templateId;
        case 'createdAt': return card.card.createdAt;
        case 'updatedAt': return card.card.updatedAt;
        case 'archivedAt': return card.card.archivedAt;
      }
      return null;
    case 'board_archived_state':
      return card.card.archivedAt !== undefined;
    case 'dashboard_variable':
      return variables?.[source.variableId] ?? [];
  }
}

function compare(source: unknown, condition: MetricFilterCondition): boolean {
  const operator = condition.comparisonOperator;
  const expected = condition.comparisonValue;
  if (operator === 'is_archived') return source === true;
  if (operator === 'is_not_archived') return source !== true;
  if (operator === 'is_true') return source === true;
  if (operator === 'is_false') return source === false;
  if (operator === 'exists') return isPresent(source);
  if (operator === 'not_exists') return !isPresent(source);
  if (operator === 'equals') return valuesEqual(source, expected);
  if (operator === 'not_equals') return !valuesEqual(source, expected);
  if (operator === 'contains') {
    if (Array.isArray(source)) return source.some((item) => valuesEqual(item, expected));
    return String(source ?? '').toLowerCase().includes(String(expected ?? '').toLowerCase());
  }
  if (operator === 'not_contains') {
    if (Array.isArray(source)) return !source.some((item) => valuesEqual(item, expected));
    return !String(source ?? '').toLowerCase().includes(String(expected ?? '').toLowerCase());
  }
  if (operator === 'in' || operator === 'not_in') {
    const values = Array.isArray(expected) ? expected : [expected];
    const matched = values.some((value) => valuesEqual(source, value));
    return operator === 'in' ? matched : !matched;
  }
  if (operator === 'between') {
    if (!Array.isArray(expected) || expected.length < 2) return false;
    const numeric = asNumber(source);
    const min = asNumber(expected[0]);
    const max = asNumber(expected[1]);
    return numeric !== null && min !== null && max !== null && numeric >= min && numeric <= max;
  }
  if (operator === 'older_than_days' || operator === 'within_last_days') {
    const days = asNumber(expected);
    if (days === null || source === null || source === undefined) return false;
    const timestamp = Date.parse(String(source));
    if (Number.isNaN(timestamp)) return false;
    const threshold = Date.now() - days * 86_400_000;
    return operator === 'older_than_days' ? timestamp < threshold : timestamp >= threshold;
  }
  if (operator === 'greater_than' || operator === 'greater_than_or_equal' || operator === 'less_than' || operator === 'less_than_or_equal') {
    const numeric = asNumber(source);
    const target = asNumber(expected);
    if (numeric === null || target === null) return false;
    if (operator === 'greater_than') return numeric > target;
    if (operator === 'greater_than_or_equal') return numeric >= target;
    if (operator === 'less_than') return numeric < target;
    return numeric <= target;
  }
  return false;
}

function matchesFilterGroup(card: MetricCard, group: MetricFilterGroup | undefined, variables: BoardMetricsQuery['variableValues']): boolean {
  if (group === undefined) return true;
  const conditions = group.filterConditions ?? [];
  const nested = group.nestedFilterGroups ?? [];
  const results = [
    ...conditions.map((condition) => compare(sourceValue(card, condition.sourceField, variables), condition)),
    ...nested.map((child) => matchesFilterGroup(card, child, variables)),
  ];
  if (results.length === 0) return true;
  return group.logicalOperator === 'and' ? results.every(Boolean) : results.some(Boolean);
}

function matchesTimeRange(card: MetricCard, query: BoardMetricsQuery): boolean {
  const from = query.from === undefined ? null : Date.parse(query.from);
  const to = query.to === undefined ? null : Date.parse(`${query.to}T23:59:59.999Z`);
  if (from === null && to === null) return true;
  const created = Date.parse(card.card.createdAt);
  if (Number.isNaN(created)) return false;
  return (from === null || created >= from) && (to === null || created <= to);
}

function dimensionValues(card: MetricCard, dimension: MetricGroupByDimension): readonly string[] {
  switch (dimension.dimensionType) {
    case 'board_column':
      return [card.column?.name ?? 'Sem coluna'];
    case 'board_label':
      return card.labels.length > 0 ? card.labels.map((label) => label.name) : ['Sem label'];
    case 'board_assignee':
      return (card.card.assigneeEmails ?? []).length > 0 ? (card.card.assigneeEmails ?? []).map((email) => email.toLowerCase()) : ['Sem responsável'];
    case 'board_archived_state':
      return [card.card.archivedAt === undefined ? 'Ativo' : 'Arquivado'];
    case 'template':
      return [card.template?.name ?? 'Sem template'];
    case 'template_field': {
      const value = card.card.fieldValues[dimension.fieldId];
      if (Array.isArray(value)) return value.map((item) => String(item));
      return [isPresent(value) ? String(value) : 'Não preenchido'];
    }
    case 'time_bucket': {
      const raw = card.card[dimension.timeBucketSource];
      const date = new Date(raw);
      if (Number.isNaN(date.getTime())) return ['Data inválida'];
      if (dimension.bucketSize === 'hour') date.setUTCMinutes(0, 0, 0);
      if (dimension.bucketSize === 'day') date.setUTCHours(0, 0, 0, 0);
      if (dimension.bucketSize === 'week') {
        const day = date.getUTCDay();
        date.setUTCDate(date.getUTCDate() - ((day + 6) % 7));
        date.setUTCHours(0, 0, 0, 0);
      }
      if (dimension.bucketSize === 'month') {
        date.setUTCDate(1);
        date.setUTCHours(0, 0, 0, 0);
      }
      return [date.toISOString()];
    }
  }
}

function groupKey(values: Readonly<Record<string, string>>): string {
  return Object.entries(values).map(([key, value]) => `${key}:${value}`).join('|');
}

function expandDimensions(card: MetricCard, dimensions: readonly MetricGroupByDimension[]): readonly Readonly<Record<string, string>>[] {
  if (dimensions.length === 0) return [{}];
  let combinations: Record<string, string>[] = [{}];
  dimensions.forEach((dimension, index) => {
    const values = dimensionValues(card, dimension);
    const key = `${dimension.dimensionType}-${index}`;
    combinations = combinations.flatMap((current) => values.map((value) => ({ ...current, [key]: value })));
  });
  return combinations;
}

function numericFieldValue(card: MetricCard, fieldId: string | undefined): number | null {
  if (fieldId === undefined) return null;
  return asNumber(card.card.fieldValues[fieldId]);
}

function aggregate(cards: readonly MetricCard[], query: MetricQuery, variables: BoardMetricsQuery['variableValues']): number {
  const measurement = query.measurement;
  const fieldId = measurement.numericField?.fieldId;
  const values = fieldId === undefined ? [] : cards.map((card) => numericFieldValue(card, fieldId));
  const present = values.filter((value): value is number => value !== null);
  const nulls = values.length - present.length;
  const selected = measurement.nullValueHandling === 'treat_as_zero' ? [...present, ...Array.from({ length: nulls }, () => 0)] : present;

  if (measurement.aggregationType === 'count') return cards.length;
  if (measurement.aggregationType === 'distinct_count') {
    if (measurement.sourceField === undefined) return new Set(cards.map((card) => card.card.cardId)).size;
    const distinctValues = cards.flatMap((card) => {
      const value = sourceValue(card, measurement.sourceField!, variables);
      if (Array.isArray(value)) return value.map((item) => String(item));
      return isPresent(value) ? [String(value)] : [];
    });
    return new Set(distinctValues).size;
  }
  if (measurement.aggregationType === 'completeness') {
    if (cards.length === 0) return 0;
    return (cards.filter((card) => {
      if (measurement.sourceField === undefined) return true;
      return isPresent(sourceValue(card, measurement.sourceField, variables));
    }).length / cards.length) * 100;
  }
  if (measurement.aggregationType === 'weighted_sum') {
    const weights = new Map((measurement.weightDefinition?.columnWeights ?? []).map((weight) => [weight.columnId, weight.weight]));
    return cards.reduce((sum, card) => {
      const value = numericFieldValue(card, fieldId);
      return sum + (value === null ? 0 : value * (weights.get(card.card.columnId) ?? 0));
    }, 0);
  }
  if (selected.length === 0) return 0;
  if (measurement.aggregationType === 'sum') return selected.reduce((sum, value) => sum + value, 0);
  if (measurement.aggregationType === 'average') return selected.reduce((sum, value) => sum + value, 0) / selected.length;
  if (measurement.aggregationType === 'minimum') return Math.min(...selected);
  if (measurement.aggregationType === 'maximum') return Math.max(...selected);
  if (measurement.aggregationType === 'median') {
    const sorted = [...selected].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2 : (sorted[middle] ?? 0);
  }
  if (measurement.aggregationType === 'p90') {
    const sorted = [...selected].sort((a, b) => a - b);
    return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.9) - 1)] ?? 0;
  }
  return 0;
}

function matchesDashboardVariables(card: MetricCard, variableValues: BoardMetricsQuery['variableValues'], variables: BoardMetricsDashboard['dashboardVariables']): boolean {
  if (variableValues === undefined) return true;
  for (const variable of variables) {
    const values = variableValues[variable.variableId];
    if (values === undefined || values.length === 0) continue;
    const normalized = values.map((value) => value.toLowerCase());
    if (variable.variableType === 'board_assignee' && !(card.card.assigneeEmails ?? []).some((email) => normalized.includes(email.toLowerCase()))) return false;
    if (variable.variableType === 'board_label' && !card.card.labelIds.some((labelId) => values.includes(labelId))) return false;
    if (variable.variableType === 'board_column' && !values.includes(card.card.columnId)) return false;
    if (variable.variableType === 'template' && !values.includes(card.card.templateId ?? '')) return false;
  }
  return true;
}

function evaluateQuery(query: MetricQuery, context: EvaluationContext, dataSource: MetricDefinition['calculation']['dataSource']): QueryEvaluation {
  const variables = context.query.variableValues;
  let cards = dataSource.includeArchivedCards
    ? [...context.cards]
    : context.cards.filter((card) => card.card.archivedAt === undefined);
  if (dataSource.applyDashboardVariables) cards = cards.filter((card) => matchesDashboardVariables(card, variables, context.dashboardVariables));
  cards = cards.filter((card) => matchesFilterGroup(card, query.filterGroup, variables));
  if (dataSource.applyDashboardTimeRange) cards = cards.filter((card) => matchesTimeRange(card, context.query));

  const dimensions = query.grouping?.groupByDimensions ?? [];
  const grouped = new Map<string, { values: Record<string, string>; cards: MetricCard[] }>();
  for (const card of cards) {
    for (const values of expandDimensions(card, dimensions)) {
      const key = groupKey(values);
      const current = grouped.get(key) ?? { values: { ...values }, cards: [] };
      current.cards.push(card);
      grouped.set(key, current);
    }
  }

  let groups: MetricGroupResult[] = dimensions.length === 0
    ? []
    : [...grouped.values()].map((group) => ({
        dimensionValues: group.values,
        value: aggregate(group.cards, query, variables),
      }));

  if (query.grouping?.having !== undefined && query.grouping.having !== undefined) {
    const having = query.grouping.having;
    groups = groups.filter((group) => {
      if (having.comparisonOperator === 'equals') return group.value === having.comparisonValue;
      if (having.comparisonOperator === 'greater_than') return group.value > having.comparisonValue;
      if (having.comparisonOperator === 'greater_than_or_equal') return group.value >= having.comparisonValue;
      if (having.comparisonOperator === 'less_than') return group.value < having.comparisonValue;
      return group.value <= having.comparisonValue;
    });
  }
  if (query.grouping?.sorting !== undefined) {
    const sorting = query.grouping.sorting;
    groups.sort((a, b) => {
      const comparison = sorting.sortBy === 'value'
        ? a.value - b.value
        : Object.values(a.dimensionValues).join(' ').localeCompare(Object.values(b.dimensionValues).join(' '));
      return sorting.sortDirection === 'ascending' ? comparison : -comparison;
    });
  }
  if (query.grouping?.maximumRows !== undefined) groups = groups.slice(0, query.grouping.maximumRows);
  const value = dimensions.length === 0 ? aggregate(cards, query, variables) : null;
  return { value, groups, sampleSize: cards.length };
}

function tokenizeFormula(expression: string): readonly string[] {
  const tokens = expression.match(/[A-Za-z_][A-Za-z0-9_]*|\d+(?:\.\d+)?|[()+\-*/,<>!]/g);
  if (tokens === null) throw new Error('Fórmula inválida');
  return tokens;
}

export function validateFormulaExpression(expression: string, variableNames: readonly string[]): void {
  evaluateFormula(expression, Object.fromEntries(variableNames.map((name) => [name, 1])));
}

function evaluateFormula(expression: string, variables: Readonly<Record<string, number>>): number {
  const tokens = tokenizeFormula(expression);
  let index = 0;
  const peek = (): string | undefined => tokens[index];
  const consume = (expected?: string): string => {
    const token = tokens[index];
    if (token === undefined || (expected !== undefined && token !== expected)) throw new Error('Fórmula inválida');
    index += 1;
    return token;
  };
  const parseExpression = (): number => {
    let left = parseTerm();
    while (peek() === '+' || peek() === '-') {
      const operator = consume();
      const right = parseTerm();
      left = operator === '+' ? left + right : left - right;
    }
    return left;
  };
  const parseTerm = (): number => {
    let left = parseUnary();
    while (peek() === '*' || peek() === '/') {
      const operator = consume();
      const right = parseUnary();
      left = operator === '*' ? left * right : right === 0 ? 0 : left / right;
    }
    return left;
  };
  const parseUnary = (): number => {
    if (peek() === '-') {
      consume('-');
      return -parseUnary();
    }
    if (peek() === '(') {
      consume('(');
      const value = parseExpression();
      consume(')');
      return value;
    }
    const token = consume();
    if (/^\d/.test(token)) return Number(token);
    if (peek() === '(') {
      consume('(');
      const args: number[] = [];
      if (peek() !== ')') {
        args.push(parseExpression());
        while (peek() === ',') {
          consume(',');
          args.push(parseExpression());
        }
      }
      consume(')');
      if (token === 'min') return Math.min(...args);
      if (token === 'max') return Math.max(...args);
      if (token === 'abs') return Math.abs(args[0] ?? 0);
      if (token === 'round') return Math.round(args[0] ?? 0);
      if (token === 'coalesce') return args.find((value) => Number.isFinite(value)) ?? 0;
      throw new Error(`Função desconhecida: ${token}`);
    }
    const value = variables[token];
    if (value === undefined) throw new Error(`Variável desconhecida: ${token}`);
    return value;
  };
  const result = parseExpression();
  if (index !== tokens.length || !Number.isFinite(result)) throw new Error('Fórmula inválida');
  return result;
}

function evaluateMetricAt(metric: MetricDefinition, context: EvaluationContext): MetricEvaluationResult {
  const queryEntries = Object.entries(metric.calculation.namedQueries);
  if (queryEntries.length === 0) {
    return {
      metricId: metric.metricId,
      metricName: metric.metricName,
      formatType: metric.calculation.formatting.formatType,
      value: null,
      groups: [],
      sampleSize: 0,
      error: 'Métrica sem queries',
    };
  }
  const evaluations = queryEntries.map(([name, query]) => ({
    name,
    result: evaluateQuery(query, context, metric.calculation.dataSource),
  }));
  const first = evaluations[0]?.result;
  if (first === undefined) throw new Error('Métrica sem queries');
  if (metric.calculation.resultFormula !== undefined) {
    if (evaluations.some((entry) => entry.result.groups.length > 0)) {
      throw new Error('Fórmula não pode ser usada com agrupamento');
    }
    const variables = Object.fromEntries(evaluations.map((entry) => [entry.name, entry.result.value ?? 0]));
    const value = evaluateFormula(metric.calculation.resultFormula.formulaExpression, variables);
    return {
      metricId: metric.metricId,
      metricName: metric.metricName,
      formatType: metric.calculation.formatting.formatType,
      value,
      groups: [],
      sampleSize: first.sampleSize,
    };
  }
  if (evaluations.length > 1) throw new Error('Múltiplas queries exigem resultFormula');
  return {
    metricId: metric.metricId,
    metricName: metric.metricName,
    formatType: metric.calculation.formatting.formatType,
    value: first.value,
    groups: first.groups,
    sampleSize: first.sampleSize,
  };
}

function previousPeriodQuery(query: BoardMetricsQuery): BoardMetricsQuery | null {
  if (query.from === undefined || query.to === undefined) return null;
  const from = Date.parse(`${query.from}T00:00:00.000Z`);
  const to = Date.parse(`${query.to}T23:59:59.999Z`);
  if (Number.isNaN(from) || Number.isNaN(to) || to < from) return null;
  const duration = to - from;
  const previousTo = from - 1;
  const previousFrom = previousTo - duration;
  return {
    ...query,
    from: new Date(previousFrom).toISOString().slice(0, 10),
    to: new Date(previousTo).toISOString().slice(0, 10),
  };
}

function evaluateMetric(metric: MetricDefinition, context: EvaluationContext): MetricEvaluationResult {
  const result = evaluateMetricAt(metric, context);
  if (metric.calculation.comparison?.comparisonEnabled !== true || metric.calculation.dataSource.applyDashboardTimeRange !== true) return result;
  const previousQuery = previousPeriodQuery(context.query);
  if (previousQuery === null) return result;
  const previous = evaluateMetricAt(metric, { ...context, query: previousQuery });
  if (previous.value === null) return result;
  const percentage = previous.value === 0 || result.value === null
    ? null
    : ((result.value - previous.value) / Math.abs(previous.value)) * 100;
  return {
    ...result,
    comparisonValue: previous.value,
    ...(percentage !== null ? { comparisonPercentage: percentage } : {}),
  };
}

function buildCards(items: readonly BoardItemRecord[]): { cards: MetricCard[]; columns: BoardColumn[]; labels: BoardLabel[]; templates: BoardTemplate[] } {
  const columns = items.filter(isColumn);
  const labels = items.filter(isLabel);
  const templates = items.filter(isTemplate);
  const columnMap = new Map(columns.map((column) => [column.columnId, column]));
  const templateMap = new Map(templates.map((template) => [template.templateId, template]));
  const labelMap = new Map(labels.map((label) => [label.labelId, label]));
  const cards: MetricCard[] = items.filter(isCard).map((card) => {
    const column = columnMap.get(card.columnId);
    const template = card.templateId === null || card.templateId === undefined ? undefined : templateMap.get(card.templateId);
    const labels = card.labelIds.map((labelId) => labelMap.get(labelId)).filter((label) => label !== undefined) as BoardLabel[];
    return {
      card,
      ...(column !== undefined ? { column } : {}),
      ...(template !== undefined ? { template } : {}),
      labels,
    };
  });
  return { cards, columns, labels, templates };
}

export function evaluateDashboard(
  dashboard: BoardMetricsDashboard,
  boardView: BoardView,
  items: readonly BoardItemRecord[],
  query: BoardMetricsQuery,
): BoardMetricsResponse {
  const board = boardView.board;
  const data = buildCards(items);
  const context: EvaluationContext = {
    board,
    cards: data.cards,
    columns: data.columns,
    labels: data.labels,
    templates: data.templates,
    query,
    dashboardVariables: dashboard.dashboardVariables,
  };
  const metrics = new Map(dashboard.metricDefinitions.map((metric) => [metric.metricId, metric]));
  const panels: DashboardPanelResult[] = dashboard.panelDefinitions.map((panel) => {
    const metric = metrics.get(panel.metricId);
    if (metric === undefined) {
      return {
        panelId: panel.panelId,
        panelTitle: panel.panelTitle,
        visualizationType: panel.visualization.visualizationType,
        metric: {
          metricId: panel.metricId,
          metricName: panel.metricId,
          formatType: 'text',
          value: null,
          groups: [],
          sampleSize: 0,
          error: 'Métrica não encontrada',
        },
        error: 'Métrica não encontrada',
      };
    }
    try {
      return {
        panelId: panel.panelId,
        panelTitle: panel.panelTitle,
        visualizationType: panel.visualization.visualizationType,
        metric: evaluateMetric(metric, context),
      };
    } catch (err) {
      return {
        panelId: panel.panelId,
        panelTitle: panel.panelTitle,
        visualizationType: panel.visualization.visualizationType,
        metric: {
          metricId: metric.metricId,
          metricName: metric.metricName,
          formatType: metric.calculation.formatting.formatType,
          value: null,
          groups: [],
          sampleSize: 0,
          error: err instanceof Error ? err.message : 'Erro ao calcular métrica',
        },
        error: err instanceof Error ? err.message : 'Erro ao calcular métrica',
      };
    }
  });
  const assignees = [...new Set(data.cards.flatMap((card) => card.card.assigneeEmails ?? []))]
    .map((email) => ({ assigneeEmail: email, assigneeName: email }));
  const filterOptions: BoardMetricsFilterOptions = {
    columns: data.columns.map((column) => ({ columnId: column.columnId, columnName: column.name })),
    labels: data.labels.map((label) => ({ labelId: label.labelId, labelName: label.name })),
    assignees,
    templates: data.templates.map((template) => ({ templateId: template.templateId, templateName: template.name })),
  };
  return {
    board: boardView,
    dashboard,
    panels,
    filterOptions,
    metadata: {
      generatedAt: new Date().toISOString(),
      metricsDataSince: dashboard.dashboardMetadata.metricsDataSince,
      ...(query.from !== undefined ? { requestedFrom: query.from } : {}),
      ...(query.to !== undefined ? { requestedTo: query.to } : {}),
      totalCards: data.cards.filter((card) => card.card.archivedAt === undefined).length,
      archivedCards: data.cards.filter((card) => card.card.archivedAt !== undefined).length,
      historyTruncated: data.cards.some((card) => (card.card.history?.length ?? 0) >= 100),
    },
  };
}

function defaultMetric(
  metricId: string,
  metricName: string,
  query: MetricQuery,
  formatType: MetricDefinition['calculation']['formatting']['formatType'] = 'number',
  extra: Partial<MetricDefinition> = {},
): MetricDefinition {
  return {
    metricId,
    metricName,
    calculation: {
      dataSource: {
        dataSourceType: 'board_cards',
        includeArchivedCards: false,
        applyDashboardVariables: false,
        applyDashboardTimeRange: false,
      },
      namedQueries: { value: query },
      formatting: {
        formatType,
        decimalPlaces: 0,
        decimalSeparator: ',',
        thousandsSeparator: '.',
        nullDisplayValue: '—',
      },
    },
    ...extra,
  };
}

function defaultPanel(
  panelId: string,
  panelTitle: string,
  metricId: string,
  visualizationType: DashboardPanel['visualization']['visualizationType'],
  x: number,
  y: number,
  w: number,
  h: number,
): DashboardPanel {
  return {
    panelId,
    panelTitle,
    metricId,
    visualization: {
      visualizationType,
      ...(visualizationType === 'bar_chart' ? { orientation: 'vertical' as const, showLegend: false, showDataLabels: false } : {}),
      ...(visualizationType === 'line_chart' ? { showLegend: false } : {}),
      ...(visualizationType === 'donut_chart' ? { showLegend: true } : {}),
    },
    layout: {
      horizontalStartColumn: x,
      verticalStartRow: y,
      horizontalSpanColumns: w,
      verticalSpanRows: h,
      minimumHorizontalSpanColumns: 2,
      minimumVerticalSpanRows: 2,
    },
  };
}

export function buildDefaultDashboard(board: Board, view: BoardView): BoardMetricsDashboard {
  const activeFilter: MetricFilterGroup = {
    logicalOperator: 'and',
    filterConditions: [{ conditionType: 'comparison', sourceField: { sourceType: 'board_archived_state' }, comparisonOperator: 'is_not_archived' }],
    nestedFilterGroups: [],
  };
  const numericFields = view.templates.flatMap((template) => template.fields).filter((field) => field.type === 'number');
  const createdMetricBase = defaultMetric('cards-created-by-week', 'Cards criados por semana', {
    filterGroup: activeFilter,
    grouping: {
      groupByDimensions: [{ dimensionType: 'time_bucket', timeBucketSource: 'createdAt', bucketSize: 'week', dimensionLabel: 'Semana' }],
      sorting: { sortBy: 'label', sortDirection: 'ascending' },
      maximumRows: 52,
    },
    measurement: { aggregationType: 'count', nullValueHandling: 'ignore_nulls' },
  });
  const createdMetric: MetricDefinition = {
    ...createdMetricBase,
    calculation: {
      ...createdMetricBase.calculation,
      dataSource: { ...createdMetricBase.calculation.dataSource, applyDashboardTimeRange: true },
    },
  };

  const byColumn = defaultMetric('cards-by-column', 'Cards por coluna', {
    filterGroup: activeFilter,
    grouping: { groupByDimensions: [{ dimensionType: 'board_column', dimensionLabel: 'Coluna' }] },
    measurement: { aggregationType: 'count', nullValueHandling: 'ignore_nulls' },
  });
  const byLabel = defaultMetric('cards-by-label', 'Cards por label', {
    filterGroup: activeFilter,
    grouping: { groupByDimensions: [{ dimensionType: 'board_label', dimensionLabel: 'Label' }] },
    measurement: { aggregationType: 'count', nullValueHandling: 'ignore_nulls' },
  });
  const byAssignee = defaultMetric('cards-by-assignee', 'Cards por responsável', {
    filterGroup: activeFilter,
    grouping: { groupByDimensions: [{ dimensionType: 'board_assignee', dimensionLabel: 'Responsável' }] },
    measurement: { aggregationType: 'count', nullValueHandling: 'ignore_nulls' },
  });
  const active = defaultMetric('active-cards', 'Cards ativos', {
    filterGroup: activeFilter,
    measurement: { aggregationType: 'count', nullValueHandling: 'ignore_nulls' },
  });
  const archivedBase = defaultMetric('archived-cards', 'Cards arquivados', {
    filterGroup: {
      logicalOperator: 'and',
      filterConditions: [{ conditionType: 'comparison', sourceField: { sourceType: 'board_archived_state' }, comparisonOperator: 'is_archived' }],
      nestedFilterGroups: [],
    },
    measurement: { aggregationType: 'count', nullValueHandling: 'ignore_nulls' },
  });
  const archived: MetricDefinition = {
    ...archivedBase,
    calculation: {
      ...archivedBase.calculation,
      dataSource: { ...archivedBase.calculation.dataSource, includeArchivedCards: true },
    },
  };
  const stale = defaultMetric('stale-cards', 'Parados há mais de 7 dias', {
    filterGroup: {
      logicalOperator: 'and',
      filterConditions: [
        { conditionType: 'comparison', sourceField: { sourceType: 'system_field', systemField: 'updatedAt' }, comparisonOperator: 'older_than_days', comparisonValue: 7 },
      ],
      nestedFilterGroups: [],
    },
    measurement: { aggregationType: 'count', nullValueHandling: 'ignore_nulls' },
  });
  const metrics: MetricDefinition[] = [active, archived, stale, byColumn, byLabel, byAssignee, createdMetric];
  numericFields.slice(0, 4).forEach((field) => {
    metrics.push(defaultMetric(`sum-${field.fieldId}`, `Soma de ${field.label}`, {
      filterGroup: activeFilter,
      measurement: {
        aggregationType: 'sum',
        numericField: { sourceType: 'template_field', fieldId: field.fieldId, sourceLabelSnapshot: field.label },
        nullValueHandling: 'ignore_nulls',
      },
    }, 'number'));
  });
  const panels: DashboardPanel[] = [
    defaultPanel('active-cards-panel', 'Cards ativos', 'active-cards', 'stat', 0, 0, 3, 2),
    defaultPanel('stale-cards-panel', 'Parados há 7+ dias', 'stale-cards', 'stat', 3, 0, 3, 2),
    defaultPanel('archived-cards-panel', 'Cards arquivados', 'archived-cards', 'stat', 6, 0, 3, 2),
    defaultPanel('cards-by-column-panel', 'Cards por coluna', 'cards-by-column', 'bar_chart', 0, 2, 6, 4),
    defaultPanel('created-by-week-panel', 'Criados por semana', 'cards-created-by-week', 'line_chart', 6, 2, 6, 4),
    defaultPanel('cards-by-label-panel', 'Cards por label', 'cards-by-label', 'donut_chart', 0, 6, 4, 4),
    defaultPanel('cards-by-assignee-panel', 'Cards por responsável', 'cards-by-assignee', 'bar_chart', 4, 6, 8, 4),
  ];
  numericFields.slice(0, 4).forEach((field, index) => {
    panels.push(defaultPanel(`sum-${field.fieldId}-panel`, `Soma de ${field.label}`, `sum-${field.fieldId}`, 'stat', (index % 3) * 4, 10 + Math.floor(index / 3) * 2, 4, 2));
  });
  return {
    schemaVersion: 1,
    documentType: 'boardMetricsDashboard',
    dashboardMetadata: {
      dashboardId: `dashboard-${board.boardId}`,
      dashboardName: board.name,
      dashboardDescription: 'Dashboard gerado automaticamente a partir dos dados do quadro.',
      dashboardOwnerUserId: board.createdBy,
      createdAt: board.createdAt,
      updatedAt: board.createdAt,
      metricsDataSince: board.createdAt,
      documentStatus: 'active',
    },
    dashboardSettings: {
      gridSettings: { columnCount: 12, rowHeightPixels: 88, horizontalGapPixels: 16, verticalGapPixels: 16, allowPanelOverlap: false, compactVerticalLayout: true },
      timeRangeSettings: { defaultRelativeDays: 30 },
      refreshSettings: { automaticRefreshEnabled: false, refreshIntervalSeconds: 60 },
    },
    dashboardVariables: [],
    metricDefinitions: metrics,
    panelDefinitions: panels,
  };
}
