import { z } from 'zod';
import {
  DASHBOARD_VARIABLE_TYPES,
  FILTER_COMPARISON_OPERATORS,
  FILTER_LOGICAL_OPERATORS,
  METRIC_AGGREGATION_TYPES,
  METRIC_FORMAT_TYPES,
  PANEL_VISUALIZATION_TYPES,
  SYSTEM_FIELD_KEYS,
  TIME_BUCKET_SIZES,
} from './types.js';
import type { BoardMetricsDashboard, MetricFilterGroup, MetricSourceField } from './types.js';
import { ValidationError } from '../../http/validators.js';
import { validateFormulaExpression } from './engine.js';

const id = z.string().trim().min(1).max(80);
const label = z.string().trim().min(1).max(160);
const description = z.string().trim().max(1000);
const isoDate = z.string().datetime({ offset: true });

const gridSettingsSchema = z.object({
  columnCount: z.number().int().min(1).max(24),
  rowHeightPixels: z.number().int().min(24).max(240),
  horizontalGapPixels: z.number().int().min(0).max(64),
  verticalGapPixels: z.number().int().min(0).max(64),
  allowPanelOverlap: z.boolean(),
  compactVerticalLayout: z.boolean(),
}).strict();

const timeRangeSettingsSchema = z.object({
  defaultRelativeDays: z.number().int().min(1).max(3650),
}).strict();

const refreshSettingsSchema = z.object({
  automaticRefreshEnabled: z.boolean(),
  refreshIntervalSeconds: z.number().int().min(30).max(86400),
}).strict();

const dashboardMetadataSchema = z.object({
  dashboardId: id,
  dashboardName: label,
  dashboardDescription: description.optional(),
  dashboardOwnerUserId: id.optional(),
  createdAt: isoDate,
  updatedAt: isoDate,
  metricsDataSince: isoDate,
  documentStatus: z.enum(['active', 'draft']),
}).strict();

const dashboardVariableSchema = z.object({
  variableId: id,
  variableName: label,
  variableDescription: description.optional(),
  variableType: z.enum(DASHBOARD_VARIABLE_TYPES),
  valueSource: z.object({
    sourceType: z.enum(['board_assignees', 'board_labels', 'board_columns', 'templates', 'template_fields', 'static']),
    templateId: id.optional(),
  }).strict().optional(),
  defaultSelection: z.object({
    selectionType: z.enum(['all', 'none', 'values']),
    selectedValues: z.array(z.string().max(200)).max(100).optional(),
  }).strict().optional(),
  allowMultipleSelections: z.boolean(),
  required: z.boolean(),
}).strict();

const boardColumnSourceSchema = z.object({
  sourceType: z.literal('board_column'),
  columnId: id,
  sourceLabelSnapshot: label.optional(),
}).strict();
const templateFieldSourceSchema = z.object({
  sourceType: z.literal('template_field'),
  fieldId: id,
  sourceLabelSnapshot: label.optional(),
}).strict();
const boardLabelSourceSchema = z.object({
  sourceType: z.literal('board_label'),
  labelId: id,
  sourceLabelSnapshot: label.optional(),
}).strict();
const boardAssigneeSourceSchema = z.object({
  sourceType: z.literal('board_assignee'),
  assigneeEmail: z.string().email().max(254),
  sourceLabelSnapshot: label.optional(),
}).strict();
const templateSourceSchema = z.object({
  sourceType: z.literal('template'),
  templateId: id,
  sourceLabelSnapshot: label.optional(),
}).strict();
const systemFieldSourceSchema = z.object({
  sourceType: z.literal('system_field'),
  systemField: z.enum(SYSTEM_FIELD_KEYS),
}).strict();
const archivedStateSourceSchema = z.object({ sourceType: z.literal('board_archived_state') }).strict();
const dashboardVariableSourceSchema = z.object({
  sourceType: z.literal('dashboard_variable'),
  variableId: id,
}).strict();

const sourceFieldSchema = z.discriminatedUnion('sourceType', [
  boardColumnSourceSchema,
  templateFieldSourceSchema,
  boardLabelSourceSchema,
  boardAssigneeSourceSchema,
  templateSourceSchema,
  systemFieldSourceSchema,
  archivedStateSourceSchema,
  dashboardVariableSourceSchema,
]);

const filterConditionSchema = z.object({
  conditionType: z.literal('comparison'),
  sourceField: sourceFieldSchema,
  comparisonOperator: z.enum(FILTER_COMPARISON_OPERATORS),
  comparisonValue: z.unknown().optional(),
}).strict();

const filterGroupSchema = z.lazy(() => z.object({
  logicalOperator: z.enum(FILTER_LOGICAL_OPERATORS),
  filterConditions: z.array(filterConditionSchema).max(100).optional(),
  nestedFilterGroups: z.array(filterGroupSchema).max(20).optional(),
}).strict()) as unknown as z.ZodType<MetricFilterGroup>;

const groupByDimensionSchema = z.discriminatedUnion('dimensionType', [
  z.object({ dimensionType: z.literal('board_column'), dimensionLabel: label.optional() }).strict(),
  z.object({ dimensionType: z.literal('board_label'), dimensionLabel: label.optional() }).strict(),
  z.object({ dimensionType: z.literal('board_assignee'), dimensionLabel: label.optional() }).strict(),
  z.object({ dimensionType: z.literal('board_archived_state'), dimensionLabel: label.optional() }).strict(),
  z.object({ dimensionType: z.literal('template'), dimensionLabel: label.optional() }).strict(),
  z.object({ dimensionType: z.literal('template_field'), fieldId: id, dimensionLabel: label.optional() }).strict(),
  z.object({
    dimensionType: z.literal('time_bucket'),
    timeBucketSource: z.enum(['createdAt', 'updatedAt']),
    bucketSize: z.enum(TIME_BUCKET_SIZES),
    dimensionLabel: label.optional(),
  }).strict(),
]);

const groupingSchema = z.object({
  groupByDimensions: z.array(groupByDimensionSchema).max(3).optional(),
  having: z.object({
    comparisonOperator: z.enum(['greater_than', 'greater_than_or_equal', 'less_than', 'less_than_or_equal', 'equals']),
    comparisonValue: z.number(),
  }).strict().optional(),
  sorting: z.object({
    sortBy: z.enum(['value', 'label']),
    sortDirection: z.enum(['ascending', 'descending']),
  }).strict().optional(),
  maximumRows: z.number().int().min(1).max(500).optional(),
}).strict();

const weightDefinitionSchema = z.object({
  weightSourceType: z.literal('board_column'),
  columnWeights: z.array(z.object({
    columnId: id,
    columnLabelSnapshot: label.optional(),
    weight: z.number().min(0).max(1),
  }).strict()).min(1).max(100),
}).strict();

const measurementSchema = z.object({
  aggregationType: z.enum(METRIC_AGGREGATION_TYPES),
  numericField: z.object({
    sourceType: z.literal('template_field'),
    fieldId: id,
    sourceLabelSnapshot: label.optional(),
  }).strict().optional(),
  sourceField: sourceFieldSchema.optional(),
  weightDefinition: weightDefinitionSchema.optional(),
  nullValueHandling: z.enum(['ignore_nulls', 'treat_as_zero']),
}).strict();

const metricQuerySchema = z.object({
  queryDescription: description.optional(),
  filterGroup: filterGroupSchema.optional(),
  grouping: groupingSchema.optional(),
  measurement: measurementSchema,
}).strict();

const metricFormattingSchema = z.object({
  formatType: z.enum(METRIC_FORMAT_TYPES),
  decimalPlaces: z.number().int().min(0).max(6),
  currencyCode: z.string().trim().length(3).optional(),
  decimalSeparator: z.string().max(1).optional(),
  thousandsSeparator: z.string().max(1).optional(),
  prefix: z.string().max(20).optional(),
  suffix: z.string().max(20).optional(),
  nullDisplayValue: z.string().max(40).optional(),
}).strict();

const metricComparisonSchema = z.object({
  comparisonEnabled: z.boolean(),
  comparisonPeriodType: z.literal('previous_period'),
  comparisonDisplayType: z.enum(['absolute', 'percentage', 'absolute_and_percentage']),
}).strict();

const metricDefinitionSchema = z.object({
  metricId: id,
  metricName: label,
  metricDescription: description.optional(),
  metricCategory: z.string().trim().max(80).optional(),
  calculation: z.object({
    dataSource: z.object({
      dataSourceType: z.literal('board_cards'),
      includeArchivedCards: z.boolean(),
      applyDashboardVariables: z.boolean(),
      applyDashboardTimeRange: z.boolean(),
    }).strict(),
    namedQueries: z.record(z.string().trim().min(1).max(80), metricQuerySchema),
    resultFormula: z.object({
      formulaExpression: z.string().trim().min(1).max(2000),
      formulaDescription: description.optional(),
    }).strict().optional(),
    comparison: metricComparisonSchema.optional(),
    formatting: metricFormattingSchema,
  }).strict(),
}).strict();

const panelLayoutSchema = z.object({
  horizontalStartColumn: z.number().int().min(0).max(23),
  verticalStartRow: z.number().int().min(0).max(10000),
  horizontalSpanColumns: z.number().int().min(1).max(24),
  verticalSpanRows: z.number().int().min(1).max(100),
  minimumHorizontalSpanColumns: z.number().int().min(1).max(24),
  minimumVerticalSpanRows: z.number().int().min(1).max(100),
}).strict();

const dashboardPanelSchema = z.object({
  panelId: id,
  panelTitle: label,
  panelDescription: description.optional(),
  metricId: id,
  visualization: z.object({
    visualizationType: z.enum(PANEL_VISUALIZATION_TYPES),
    orientation: z.enum(['horizontal', 'vertical']).optional(),
    showLegend: z.boolean().optional(),
    showDataLabels: z.boolean().optional(),
    colorScheme: z.string().trim().max(40).optional(),
    thresholds: z.array(z.object({
      thresholdValue: z.number(),
      thresholdColor: z.enum(['success', 'warning', 'danger', 'neutral']),
      thresholdLabel: label.optional(),
    }).strict()).max(20).optional(),
  }).strict(),
  layout: panelLayoutSchema,
}).strict();

const dashboardSchema = z.object({
  schemaVersion: z.number().int().min(1).max(1),
  documentType: z.literal('boardMetricsDashboard'),
  dashboardMetadata: dashboardMetadataSchema,
  dashboardSettings: z.object({
    gridSettings: gridSettingsSchema,
    timeRangeSettings: timeRangeSettingsSchema,
    refreshSettings: refreshSettingsSchema,
  }).strict(),
  dashboardVariables: z.array(dashboardVariableSchema).max(30),
  metricDefinitions: z.array(metricDefinitionSchema).min(1).max(50),
  panelDefinitions: z.array(dashboardPanelSchema).min(1).max(20),
}).strict();

export function validateMetricsDashboard(value: unknown): BoardMetricsDashboard {
  return dashboardSchema.parse(value) as BoardMetricsDashboard;
}

export const metricsDashboardSchema = dashboardSchema;
export const metricsFilterGroupSchema = filterGroupSchema;

export function validateDashboardReferences(dashboard: BoardMetricsDashboard, view: import('../types.js').BoardView): void {
  const fields: { field: string; message: string }[] = [];
  const columnIds = new Set(view.columns.map((column) => column.columnId));
  const labelIds = new Set(view.labels.map((label) => label.labelId));
  const templateIds = new Set(view.templates.map((template) => template.templateId));
  const fieldTypes = new Map(view.templates.flatMap((template) => template.fields).map((field) => [field.fieldId, field.type]));
  const variableIds = new Set(dashboard.dashboardVariables.map((variable) => variable.variableId));
  const metricIds = new Set(dashboard.metricDefinitions.map((metric) => metric.metricId));
  const panelIds = new Set(dashboard.panelDefinitions.map((panel) => panel.panelId));

  if (metricIds.size !== dashboard.metricDefinitions.length) fields.push({ field: 'metricDefinitions', message: 'IDs de métricas duplicados' });
  if (panelIds.size !== dashboard.panelDefinitions.length) fields.push({ field: 'panelDefinitions', message: 'IDs de painéis duplicados' });
  if (new Set(dashboard.dashboardVariables.map((variable) => variable.variableId)).size !== dashboard.dashboardVariables.length) {
    fields.push({ field: 'dashboardVariables', message: 'IDs de variáveis duplicados' });
  }

  const checkSource = (source: MetricSourceField, path: string): void => {
    if (source.sourceType === 'board_column' && !columnIds.has(source.columnId)) fields.push({ field: path, message: 'Coluna não encontrada' });
    if (source.sourceType === 'board_label' && !labelIds.has(source.labelId)) fields.push({ field: path, message: 'Label não encontrada' });
    if (source.sourceType === 'template' && !templateIds.has(source.templateId)) fields.push({ field: path, message: 'Template não encontrado' });
    if (source.sourceType === 'template_field' && !fieldTypes.has(source.fieldId)) fields.push({ field: path, message: 'Campo não encontrado' });
    if (source.sourceType === 'dashboard_variable' && !variableIds.has(source.variableId)) fields.push({ field: path, message: 'Variável não encontrada' });
  };

  const checkFilterGroup = (group: MetricFilterGroup | undefined, path: string): void => {
    if (group === undefined) return;
    group.filterConditions?.forEach((condition, index) => checkSource(condition.sourceField, `${path}.filterConditions[${index}].sourceField`));
    group.nestedFilterGroups?.forEach((child, index) => checkFilterGroup(child, `${path}.nestedFilterGroups[${index}]`));
  };

  dashboard.metricDefinitions.forEach((metric, metricIndex) => {
    const metricPath = `metricDefinitions[${metricIndex}]`;
    const queryEntries = Object.entries(metric.calculation.namedQueries);
    if (queryEntries.length === 0) fields.push({ field: `${metricPath}.calculation.namedQueries`, message: 'A métrica precisa de ao menos uma query' });
    if (queryEntries.length > 1 && metric.calculation.resultFormula === undefined) {
      fields.push({ field: `${metricPath}.calculation.resultFormula`, message: 'Múltiplas queries exigem resultFormula' });
    }
    if (metric.calculation.resultFormula !== undefined && queryEntries.some(([, query]) => (query.grouping?.groupByDimensions?.length ?? 0) > 0)) {
      fields.push({ field: `${metricPath}.calculation.resultFormula`, message: 'Fórmula não pode ser usada com query agrupada' });
    }
    queryEntries.forEach(([queryName, query]) => {
      const queryPath = `${metricPath}.calculation.namedQueries.${queryName}`;
      checkFilterGroup(query.filterGroup, `${queryPath}.filterGroup`);
      query.grouping?.groupByDimensions?.forEach((dimension, index) => {
        if (dimension.dimensionType === 'template_field' && !fieldTypes.has(dimension.fieldId)) {
          fields.push({ field: `${queryPath}.grouping.groupByDimensions[${index}]`, message: 'Campo de agrupamento não encontrado' });
        }
      });
      const numericMeasures = ['sum', 'average', 'median', 'p90', 'minimum', 'maximum', 'weighted_sum'];
      if (numericMeasures.includes(query.measurement.aggregationType) && query.measurement.numericField === undefined) {
        fields.push({ field: `${queryPath}.measurement.numericField`, message: 'Esta medida exige um campo numérico' });
      }
      if (query.measurement.numericField !== undefined && fieldTypes.get(query.measurement.numericField.fieldId) !== 'number') {
        fields.push({ field: `${queryPath}.measurement.numericField`, message: 'Medida numérica exige campo do tipo number' });
      }
      if (query.measurement.aggregationType === 'weighted_sum' && query.measurement.weightDefinition === undefined) {
        fields.push({ field: `${queryPath}.measurement.weightDefinition`, message: 'weighted_sum exige weightDefinition' });
      }
      if (query.measurement.sourceField !== undefined) checkSource(query.measurement.sourceField, `${queryPath}.measurement.sourceField`);
      query.measurement.weightDefinition?.columnWeights.forEach((weight, index) => {
        if (!columnIds.has(weight.columnId)) fields.push({ field: `${queryPath}.measurement.weightDefinition.columnWeights[${index}]`, message: 'Coluna de peso não encontrada' });
      });
    });
    if (metric.calculation.resultFormula !== undefined) {
      try {
        validateFormulaExpression(metric.calculation.resultFormula.formulaExpression, Object.keys(metric.calculation.namedQueries));
      } catch (err) {
        fields.push({
          field: `${metricPath}.calculation.resultFormula.formulaExpression`,
          message: err instanceof Error ? err.message : 'Fórmula inválida',
        });
      }
    }
  });

  dashboard.panelDefinitions.forEach((panel, index) => {
    if (!metricIds.has(panel.metricId)) fields.push({ field: `panelDefinitions[${index}].metricId`, message: 'Métrica não encontrada' });
    if (panel.layout.horizontalStartColumn + panel.layout.horizontalSpanColumns > dashboard.dashboardSettings.gridSettings.columnCount) {
      fields.push({ field: `panelDefinitions[${index}].layout`, message: 'Painel excede a largura do grid' });
    }
  });

  if (fields.length > 0) throw new ValidationError(fields);
}
