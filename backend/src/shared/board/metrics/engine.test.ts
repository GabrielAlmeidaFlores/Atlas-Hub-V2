import assert from 'node:assert/strict';
import { test } from 'node:test';
import { evaluateDashboard, buildDefaultDashboard } from './engine.js';
import type { BoardMetricsDashboard, MetricDefinition } from './types.js';
import type { Board, BoardCard, BoardColumn, BoardLabel, BoardTemplate, BoardView } from '../types.js';
import type { BoardItemRecord } from '../repository.js';

const board: Board = {
  boardId: 'board-1',
  name: 'Captação',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-10T00:00:00.000Z',
  createdBy: 'admin-1',
};

const columns: BoardColumn[] = [
  { boardId: board.boardId, columnId: 'novo', name: 'Novo', position: 0, createdAt: board.createdAt, updatedAt: board.createdAt },
  { boardId: board.boardId, columnId: 'ganho', name: 'Ganho', position: 1, createdAt: board.createdAt, updatedAt: board.createdAt },
  { boardId: board.boardId, columnId: 'perdido', name: 'Perdido', position: 2, createdAt: board.createdAt, updatedAt: board.createdAt },
];

const labels: BoardLabel[] = [
  { boardId: board.boardId, labelId: 'quente', name: 'Quente', color: 'green', createdAt: board.createdAt, updatedAt: board.createdAt },
  { boardId: board.boardId, labelId: 'frio', name: 'Frio', color: 'blue', createdAt: board.createdAt, updatedAt: board.createdAt },
];

const template: BoardTemplate = {
  boardId: board.boardId,
  templateId: 'template-1',
  name: 'Lead',
  fields: [
    { fieldId: 'valor', label: 'Valor', type: 'number', required: false, position: 0 },
    { fieldId: 'email', label: 'E-mail', type: 'email', required: false, position: 1 },
  ],
  createdAt: board.createdAt,
  updatedAt: board.createdAt,
};

function card(input: Partial<BoardCard> & { cardId: string; columnId: string; createdAt: string; fieldValues?: BoardCard['fieldValues'] }): BoardItemRecord {
  return {
    boardId: board.boardId,
    cardId: input.cardId,
    columnId: input.columnId,
    position: input.position ?? 0,
    title: input.title ?? input.cardId,
    fieldValues: input.fieldValues ?? {},
    labelIds: input.labelIds ?? [],
    assigneeEmails: input.assigneeEmails ?? [],
    createdAt: input.createdAt,
    updatedAt: input.updatedAt ?? input.createdAt,
    createdBy: 'admin-1',
    updatedBy: 'admin-1',
    ...(input.templateId !== undefined ? { templateId: input.templateId } : {}),
    ...(input.archivedAt !== undefined ? { archivedAt: input.archivedAt } : {}),
    itemKey: `CARD#${input.cardId}`,
  } as BoardItemRecord;
}

const cards: BoardItemRecord[] = [
  card({ cardId: 'c1', columnId: 'novo', createdAt: '2026-01-02T00:00:00.000Z', templateId: template.templateId, fieldValues: { valor: 100, email: 'a@x.com' }, labelIds: ['quente'], assigneeEmails: ['ana@x.com'] }),
  card({ cardId: 'c2', columnId: 'novo', createdAt: '2026-01-03T00:00:00.000Z', templateId: template.templateId, fieldValues: { valor: 200 }, labelIds: ['quente', 'frio'], assigneeEmails: ['bia@x.com'] }),
  card({ cardId: 'c3', columnId: 'ganho', createdAt: '2026-01-04T00:00:00.000Z', templateId: template.templateId, fieldValues: { valor: 300, email: 'c@x.com' }, labelIds: ['quente'], assigneeEmails: ['ana@x.com'] }),
  card({ cardId: 'c4', columnId: 'perdido', createdAt: '2026-01-05T00:00:00.000Z', templateId: template.templateId, fieldValues: { valor: 400 } }),
  card({ cardId: 'c5', columnId: 'novo', createdAt: '2026-01-06T00:00:00.000Z', templateId: template.templateId, fieldValues: { valor: 500 }, archivedAt: '2026-01-07T00:00:00.000Z' }),
];

const items: BoardItemRecord[] = [
  ...columns.map((column) => ({ ...column, itemKey: `COLUMN#${column.columnId}` })),
  ...labels.map((label) => ({ ...label, itemKey: `LABEL#${label.labelId}` })),
  { ...template, itemKey: `TEMPLATE#${template.templateId}` },
  ...cards,
];

const view: BoardView = { board, columns, labels, templates: [template], cards: cards.filter((item) => 'cardId' in item) as BoardCard[] };

function dashboardWith(metric: MetricDefinition, panelType: 'stat' | 'bar_chart' = 'stat'): BoardMetricsDashboard {
  return {
    schemaVersion: 1,
    documentType: 'boardMetricsDashboard',
    dashboardMetadata: { dashboardId: 'd1', dashboardName: 'Teste', createdAt: board.createdAt, updatedAt: board.updatedAt, metricsDataSince: board.createdAt, documentStatus: 'active' },
    dashboardSettings: {
      gridSettings: { columnCount: 12, rowHeightPixels: 88, horizontalGapPixels: 16, verticalGapPixels: 16, allowPanelOverlap: false, compactVerticalLayout: true },
      timeRangeSettings: { defaultRelativeDays: 30 },
      refreshSettings: { automaticRefreshEnabled: false, refreshIntervalSeconds: 60 },
    },
    dashboardVariables: [],
    metricDefinitions: [metric],
    panelDefinitions: [{
      panelId: 'panel-1', panelTitle: 'Painel', metricId: metric.metricId,
      visualization: { visualizationType: panelType },
      layout: { horizontalStartColumn: 0, verticalStartRow: 0, horizontalSpanColumns: 4, verticalSpanRows: 2, minimumHorizontalSpanColumns: 2, minimumVerticalSpanRows: 2 },
    }],
  };
}

function metric(id: string, query: MetricDefinition['calculation']['namedQueries'][string], extra?: Partial<MetricDefinition>): MetricDefinition {
  return {
    metricId: id, metricName: id,
    calculation: {
      dataSource: { dataSourceType: 'board_cards', includeArchivedCards: false, applyDashboardVariables: false, applyDashboardTimeRange: false },
      namedQueries: { value: query },
      formatting: { formatType: 'number', decimalPlaces: 0 },
    },
    ...extra,
  };
}

test('counts only active cards by default', () => {
  const dashboard = dashboardWith(metric('ativos', { measurement: { aggregationType: 'count', nullValueHandling: 'ignore_nulls' } }));
  const result = evaluateDashboard(dashboard, view, items, {});
  assert.equal(result.panels[0]?.metric.value, 4);
});

test('groups by column and filters labels', () => {
  const dashboard = dashboardWith(metric('por-coluna', {
    grouping: { groupByDimensions: [{ dimensionType: 'board_column' }] },
    measurement: { aggregationType: 'count', nullValueHandling: 'ignore_nulls' },
  }), 'bar_chart');
  const result = evaluateDashboard(dashboard, view, items, {});
  assert.deepEqual(result.panels[0]?.metric.groups.map((group) => [Object.values(group.dimensionValues)[0], group.value]), [['Novo', 2], ['Ganho', 1], ['Perdido', 1]]);

  const filtered = dashboardWith(metric('quentes', {
    filterGroup: { logicalOperator: 'and', filterConditions: [{ conditionType: 'comparison', sourceField: { sourceType: 'board_label', labelId: 'quente' }, comparisonOperator: 'equals', comparisonValue: 'quente' }] },
    measurement: { aggregationType: 'count', nullValueHandling: 'ignore_nulls' },
  }));
  assert.equal(evaluateDashboard(filtered, view, items, {}).panels[0]?.metric.value, 3);
});

test('calculates sum, weighted sum and formula', () => {
  const sum = dashboardWith(metric('soma', {
    measurement: { aggregationType: 'sum', numericField: { sourceType: 'template_field', fieldId: 'valor' }, nullValueHandling: 'ignore_nulls' },
  }));
  assert.equal(evaluateDashboard(sum, view, items, {}).panels[0]?.metric.value, 1000);

  const weighted = dashboardWith(metric('ponderado', {
    measurement: { aggregationType: 'weighted_sum', numericField: { sourceType: 'template_field', fieldId: 'valor' }, weightDefinition: { weightSourceType: 'board_column', columnWeights: [{ columnId: 'novo', weight: 0.1 }, { columnId: 'ganho', weight: 1 }] }, nullValueHandling: 'ignore_nulls' },
  }));
  assert.equal(evaluateDashboard(weighted, view, items, {}).panels[0]?.metric.value, 330);

  const winRate = dashboardWith({
    ...metric('taxa', { measurement: { aggregationType: 'count', nullValueHandling: 'ignore_nulls' } }),
    calculation: {
      dataSource: { dataSourceType: 'board_cards', includeArchivedCards: false, applyDashboardVariables: false, applyDashboardTimeRange: false },
      namedQueries: {
        ganhos: { filterGroup: { logicalOperator: 'and', filterConditions: [{ conditionType: 'comparison', sourceField: { sourceType: 'board_column', columnId: 'ganho' }, comparisonOperator: 'equals', comparisonValue: 'ganho' }] }, measurement: { aggregationType: 'count', nullValueHandling: 'ignore_nulls' } },
        perdidos: { filterGroup: { logicalOperator: 'and', filterConditions: [{ conditionType: 'comparison', sourceField: { sourceType: 'board_column', columnId: 'perdido' }, comparisonOperator: 'equals', comparisonValue: 'perdido' }] }, measurement: { aggregationType: 'count', nullValueHandling: 'ignore_nulls' } },
      },
      resultFormula: { formulaExpression: 'ganhos / (ganhos + perdidos) * 100' },
      formatting: { formatType: 'percentage', decimalPlaces: 1 },
    },
  });
  assert.equal(evaluateDashboard(winRate, view, items, {}).panels[0]?.metric.value, 50);
});

test('creates a default dashboard and returns filter options', () => {
  const defaultDashboard = buildDefaultDashboard(board, view);
  const result = evaluateDashboard(defaultDashboard, view, items, {});
  assert.ok(result.panels.length > 0);
  assert.ok(result.filterOptions.columns.some((column) => column.columnName === 'Ganho'));
  assert.ok(result.filterOptions.labels.some((label) => label.labelName === 'Quente'));
  assert.equal(result.metadata.archivedCards, 1);
});
