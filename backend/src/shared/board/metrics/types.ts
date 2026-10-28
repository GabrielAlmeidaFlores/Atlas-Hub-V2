export const METRIC_AGGREGATION_TYPES = [
  'count',
  'distinct_count',
  'sum',
  'average',
  'median',
  'p90',
  'minimum',
  'maximum',
  'weighted_sum',
  'completeness',
] as const;

export type MetricAggregationType = (typeof METRIC_AGGREGATION_TYPES)[number];

export const METRIC_FORMAT_TYPES = ['number', 'percentage', 'currency', 'duration_days', 'text'] as const;
export type MetricFormatType = (typeof METRIC_FORMAT_TYPES)[number];

export const PANEL_VISUALIZATION_TYPES = ['stat', 'bar_chart', 'line_chart', 'donut_chart', 'table', 'gauge', 'card_list'] as const;
export type PanelVisualizationType = (typeof PANEL_VISUALIZATION_TYPES)[number];

export const FILTER_LOGICAL_OPERATORS = ['and', 'or'] as const;
export type FilterLogicalOperator = (typeof FILTER_LOGICAL_OPERATORS)[number];

export const FILTER_COMPARISON_OPERATORS = [
  'equals',
  'not_equals',
  'in',
  'not_in',
  'contains',
  'not_contains',
  'exists',
  'not_exists',
  'greater_than',
  'greater_than_or_equal',
  'less_than',
  'less_than_or_equal',
  'between',
  'older_than_days',
  'within_last_days',
  'is_true',
  'is_false',
  'is_archived',
  'is_not_archived',
] as const;

export type FilterComparisonOperator = (typeof FILTER_COMPARISON_OPERATORS)[number];

export const SYSTEM_FIELD_KEYS = [
  'cardId',
  'cardNumber',
  'cardTitle',
  'cardDescription',
  'columnId',
  'templateId',
  'createdAt',
  'updatedAt',
  'archivedAt',
] as const;
export type SystemFieldKey = (typeof SYSTEM_FIELD_KEYS)[number];

export const TIME_BUCKET_SIZES = ['hour', 'day', 'week', 'month'] as const;
export type TimeBucketSize = (typeof TIME_BUCKET_SIZES)[number];

export const DASHBOARD_VARIABLE_TYPES = [
  'period',
  'board_assignee',
  'board_label',
  'board_column',
  'template',
  'template_field',
  'text',
  'number',
  'multi_select',
] as const;
export type DashboardVariableType = (typeof DASHBOARD_VARIABLE_TYPES)[number];

export interface DashboardGridSettings {
  readonly columnCount: number;
  readonly rowHeightPixels: number;
  readonly horizontalGapPixels: number;
  readonly verticalGapPixels: number;
  readonly allowPanelOverlap: boolean;
  readonly compactVerticalLayout: boolean;
}

export interface DashboardTimeRangeSettings {
  readonly defaultRelativeDays: number;
}

export interface DashboardRefreshSettings {
  readonly automaticRefreshEnabled: boolean;
  readonly refreshIntervalSeconds: number;
}

export interface DashboardMetadata {
  readonly dashboardId: string;
  readonly dashboardName: string;
  readonly dashboardDescription?: string;
  readonly dashboardOwnerUserId?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly metricsDataSince: string;
  readonly documentStatus: 'active' | 'draft';
}

export interface DashboardVariable {
  readonly variableId: string;
  readonly variableName: string;
  readonly variableDescription?: string;
  readonly variableType: DashboardVariableType;
  readonly valueSource?: {
    readonly sourceType: 'board_assignees' | 'board_labels' | 'board_columns' | 'templates' | 'template_fields' | 'static';
    readonly templateId?: string;
  };
  readonly defaultSelection?: {
    readonly selectionType: 'all' | 'none' | 'values';
    readonly selectedValues?: readonly string[];
  };
  readonly allowMultipleSelections: boolean;
  readonly required: boolean;
}

export type MetricSourceField =
  | { readonly sourceType: 'board_column'; readonly columnId: string; readonly sourceLabelSnapshot?: string }
  | { readonly sourceType: 'template_field'; readonly fieldId: string; readonly sourceLabelSnapshot?: string }
  | { readonly sourceType: 'board_label'; readonly labelId: string; readonly sourceLabelSnapshot?: string }
  | { readonly sourceType: 'board_assignee'; readonly assigneeEmail: string; readonly sourceLabelSnapshot?: string }
  | { readonly sourceType: 'template'; readonly templateId: string; readonly sourceLabelSnapshot?: string }
  | { readonly sourceType: 'system_field'; readonly systemField: SystemFieldKey }
  | { readonly sourceType: 'board_archived_state' }
  | { readonly sourceType: 'dashboard_variable'; readonly variableId: string };

export interface MetricFilterCondition {
  readonly conditionType: 'comparison';
  readonly sourceField: MetricSourceField;
  readonly comparisonOperator: FilterComparisonOperator;
  readonly comparisonValue?: unknown;
}

export interface MetricFilterGroup {
  readonly logicalOperator: FilterLogicalOperator;
  readonly filterConditions?: readonly MetricFilterCondition[];
  readonly nestedFilterGroups?: readonly MetricFilterGroup[];
}

export type MetricGroupByDimension =
  | { readonly dimensionType: 'board_column'; readonly dimensionLabel?: string }
  | { readonly dimensionType: 'board_label'; readonly dimensionLabel?: string }
  | { readonly dimensionType: 'board_assignee'; readonly dimensionLabel?: string }
  | { readonly dimensionType: 'board_archived_state'; readonly dimensionLabel?: string }
  | { readonly dimensionType: 'template'; readonly dimensionLabel?: string }
  | { readonly dimensionType: 'template_field'; readonly fieldId: string; readonly dimensionLabel?: string }
  | { readonly dimensionType: 'time_bucket'; readonly timeBucketSource: 'createdAt' | 'updatedAt'; readonly bucketSize: TimeBucketSize; readonly dimensionLabel?: string };

export interface MetricGrouping {
  readonly groupByDimensions?: readonly MetricGroupByDimension[];
  readonly having?: {
    readonly comparisonOperator: 'greater_than' | 'greater_than_or_equal' | 'less_than' | 'less_than_or_equal' | 'equals';
    readonly comparisonValue: number;
  };
  readonly sorting?: {
    readonly sortBy: 'value' | 'label';
    readonly sortDirection: 'ascending' | 'descending';
  };
  readonly maximumRows?: number;
}

export interface MetricWeightDefinition {
  readonly weightSourceType: 'board_column';
  readonly columnWeights: readonly {
    readonly columnId: string;
    readonly columnLabelSnapshot?: string;
    readonly weight: number;
  }[];
}

export interface MetricMeasurement {
  readonly aggregationType: MetricAggregationType;
  readonly numericField?: {
    readonly sourceType: 'template_field';
    readonly fieldId: string;
    readonly sourceLabelSnapshot?: string;
  };
  readonly sourceField?: MetricSourceField;
  readonly weightDefinition?: MetricWeightDefinition;
  readonly nullValueHandling: 'ignore_nulls' | 'treat_as_zero';
}

export interface MetricQuery {
  readonly queryDescription?: string;
  readonly filterGroup?: MetricFilterGroup;
  readonly grouping?: MetricGrouping;
  readonly measurement: MetricMeasurement;
}

export interface MetricFormatting {
  readonly formatType: MetricFormatType;
  readonly decimalPlaces: number;
  readonly currencyCode?: string;
  readonly decimalSeparator?: string;
  readonly thousandsSeparator?: string;
  readonly prefix?: string;
  readonly suffix?: string;
  readonly nullDisplayValue?: string;
}

export interface MetricComparison {
  readonly comparisonEnabled: boolean;
  readonly comparisonPeriodType: 'previous_period';
  readonly comparisonDisplayType: 'absolute' | 'percentage' | 'absolute_and_percentage';
}

export interface MetricDefinition {
  readonly metricId: string;
  readonly metricName: string;
  readonly metricDescription?: string;
  readonly metricCategory?: string;
  readonly calculation: {
    readonly dataSource: {
      readonly dataSourceType: 'board_cards';
      readonly includeArchivedCards: boolean;
      readonly applyDashboardVariables: boolean;
      readonly applyDashboardTimeRange: boolean;
    };
    readonly namedQueries: Readonly<Record<string, MetricQuery>>;
    readonly resultFormula?: {
      readonly formulaExpression: string;
      readonly formulaDescription?: string;
    };
    readonly comparison?: MetricComparison;
    readonly formatting: MetricFormatting;
  };
}

export interface DashboardPanel {
  readonly panelId: string;
  readonly panelTitle: string;
  readonly panelDescription?: string;
  readonly metricId: string;
  readonly visualization: {
    readonly visualizationType: PanelVisualizationType;
    readonly orientation?: 'horizontal' | 'vertical';
    readonly showLegend?: boolean;
    readonly showDataLabels?: boolean;
    readonly colorScheme?: string;
    readonly thresholds?: readonly {
      readonly thresholdValue: number;
      readonly thresholdColor: 'success' | 'warning' | 'danger' | 'neutral';
      readonly thresholdLabel?: string;
    }[];
  };
  readonly layout: {
    readonly horizontalStartColumn: number;
    readonly verticalStartRow: number;
    readonly horizontalSpanColumns: number;
    readonly verticalSpanRows: number;
    readonly minimumHorizontalSpanColumns: number;
    readonly minimumVerticalSpanRows: number;
  };
}

export interface BoardMetricsDashboard {
  readonly schemaVersion: number;
  readonly documentType: 'boardMetricsDashboard';
  readonly dashboardMetadata: DashboardMetadata;
  readonly dashboardSettings: {
    readonly gridSettings: DashboardGridSettings;
    readonly timeRangeSettings: DashboardTimeRangeSettings;
    readonly refreshSettings: DashboardRefreshSettings;
  };
  readonly dashboardVariables: readonly DashboardVariable[];
  readonly metricDefinitions: readonly MetricDefinition[];
  readonly panelDefinitions: readonly DashboardPanel[];
}

export interface MetricGroupResult {
  readonly dimensionValues: Readonly<Record<string, string>>;
  readonly value: number;
}

export interface MetricEvaluationResult {
  readonly metricId: string;
  readonly metricName: string;
  readonly formatType: MetricFormatType;
  readonly value: number | null;
  readonly groups: readonly MetricGroupResult[];
  readonly sampleSize: number;
  readonly comparisonValue?: number | null;
  readonly comparisonPercentage?: number | null;
  readonly error?: string;
}

export interface DashboardPanelResult {
  readonly panelId: string;
  readonly panelTitle: string;
  readonly visualizationType: PanelVisualizationType;
  readonly metric: MetricEvaluationResult;
  readonly error?: string;
}

export interface BoardMetricsFilterOptions {
  readonly columns: readonly { readonly columnId: string; readonly columnName: string }[];
  readonly labels: readonly { readonly labelId: string; readonly labelName: string }[];
  readonly assignees: readonly { readonly assigneeEmail: string; readonly assigneeName: string }[];
  readonly templates: readonly { readonly templateId: string; readonly templateName: string }[];
}

export interface BoardMetricsQuery {
  readonly from?: string;
  readonly to?: string;
  readonly variableValues?: Readonly<Record<string, readonly string[]>>;
}

export interface BoardMetricsResponse {
  readonly board: import('../types.js').BoardView;
  readonly dashboard: BoardMetricsDashboard;
  readonly panels: readonly DashboardPanelResult[];
  readonly filterOptions: BoardMetricsFilterOptions;
  readonly metadata: {
    readonly generatedAt: string;
    readonly metricsDataSince: string;
    readonly requestedFrom?: string;
    readonly requestedTo?: string;
    readonly totalCards: number;
    readonly archivedCards: number;
    readonly historyTruncated: boolean;
  };
}
