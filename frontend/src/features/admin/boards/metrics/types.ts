import type { BoardView } from "@/types";

export type MetricFormatType = "number" | "percentage" | "currency" | "duration_days" | "text";
export type PanelVisualizationType = "stat" | "bar_chart" | "line_chart" | "donut_chart" | "table" | "gauge" | "card_list";
export type FilterLogicalOperator = "and" | "or";
export type FilterComparisonOperator =
  | "equals" | "not_equals" | "in" | "not_in" | "contains" | "not_contains"
  | "exists" | "not_exists" | "greater_than" | "greater_than_or_equal"
  | "less_than" | "less_than_or_equal" | "between" | "older_than_days"
  | "within_last_days" | "is_true" | "is_false" | "is_archived" | "is_not_archived";

export type MetricSourceField =
  | { readonly sourceType: "board_column"; readonly columnId: string; readonly sourceLabelSnapshot?: string }
  | { readonly sourceType: "template_field"; readonly fieldId: string; readonly sourceLabelSnapshot?: string }
  | { readonly sourceType: "board_label"; readonly labelId: string; readonly sourceLabelSnapshot?: string }
  | { readonly sourceType: "board_assignee"; readonly assigneeEmail: string; readonly sourceLabelSnapshot?: string }
  | { readonly sourceType: "template"; readonly templateId: string; readonly sourceLabelSnapshot?: string }
  | { readonly sourceType: "system_field"; readonly systemField: "cardId" | "cardNumber" | "cardTitle" | "cardDescription" | "columnId" | "templateId" | "createdAt" | "updatedAt" | "archivedAt" }
  | { readonly sourceType: "board_archived_state" }
  | { readonly sourceType: "dashboard_variable"; readonly variableId: string };

export interface MetricFilterCondition {
  readonly conditionType: "comparison";
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
  | { readonly dimensionType: "board_column"; readonly dimensionLabel?: string }
  | { readonly dimensionType: "board_label"; readonly dimensionLabel?: string }
  | { readonly dimensionType: "board_assignee"; readonly dimensionLabel?: string }
  | { readonly dimensionType: "board_archived_state"; readonly dimensionLabel?: string }
  | { readonly dimensionType: "template"; readonly dimensionLabel?: string }
  | { readonly dimensionType: "template_field"; readonly fieldId: string; readonly dimensionLabel?: string }
  | { readonly dimensionType: "time_bucket"; readonly timeBucketSource: "createdAt" | "updatedAt"; readonly bucketSize: "hour" | "day" | "week" | "month"; readonly dimensionLabel?: string };

export interface MetricQuery {
  readonly queryDescription?: string;
  readonly filterGroup?: MetricFilterGroup;
  readonly grouping?: {
    readonly groupByDimensions?: readonly MetricGroupByDimension[];
    readonly having?: {
      readonly comparisonOperator: "greater_than" | "greater_than_or_equal" | "less_than" | "less_than_or_equal" | "equals";
      readonly comparisonValue: number;
    };
    readonly sorting?: { readonly sortBy: "value" | "label"; readonly sortDirection: "ascending" | "descending" };
    readonly maximumRows?: number;
  };
  readonly measurement: {
    readonly aggregationType: "count" | "distinct_count" | "sum" | "average" | "median" | "p90" | "minimum" | "maximum" | "weighted_sum" | "completeness";
    readonly numericField?: { readonly sourceType: "template_field"; readonly fieldId: string; readonly sourceLabelSnapshot?: string };
    readonly sourceField?: MetricSourceField;
    readonly weightDefinition?: {
      readonly weightSourceType: "board_column";
      readonly columnWeights: readonly { readonly columnId: string; readonly columnLabelSnapshot?: string; readonly weight: number }[];
    };
    readonly nullValueHandling: "ignore_nulls" | "treat_as_zero";
  };
}

export interface MetricDefinition {
  readonly metricId: string;
  readonly metricName: string;
  readonly metricDescription?: string;
  readonly metricCategory?: string;
  readonly calculation: {
    readonly dataSource: {
      readonly dataSourceType: "board_cards";
      readonly includeArchivedCards: boolean;
      readonly applyDashboardVariables: boolean;
      readonly applyDashboardTimeRange: boolean;
    };
    readonly namedQueries: Readonly<Record<string, MetricQuery>>;
    readonly resultFormula?: {
      readonly formulaExpression: string;
      readonly formulaDescription?: string;
    };
    readonly comparison?: {
      readonly comparisonEnabled: boolean;
      readonly comparisonPeriodType: "previous_period";
      readonly comparisonDisplayType: "absolute" | "percentage" | "absolute_and_percentage";
    };
    readonly formatting: {
      readonly formatType: MetricFormatType;
      readonly decimalPlaces: number;
      readonly currencyCode?: string;
      readonly decimalSeparator?: string;
      readonly thousandsSeparator?: string;
      readonly prefix?: string;
      readonly suffix?: string;
      readonly nullDisplayValue?: string;
    };
  };
}

export interface DashboardPanel {
  readonly panelId: string;
  readonly panelTitle: string;
  readonly panelDescription?: string;
  readonly metricId: string;
  readonly visualization: {
    readonly visualizationType: PanelVisualizationType;
    readonly orientation?: "horizontal" | "vertical";
    readonly showLegend?: boolean;
    readonly showDataLabels?: boolean;
    readonly colorScheme?: string;
    readonly thresholds?: readonly { readonly thresholdValue: number; readonly thresholdColor: "success" | "warning" | "danger" | "neutral"; readonly thresholdLabel?: string }[];
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
  readonly documentType: "boardMetricsDashboard";
  readonly dashboardMetadata: {
    readonly dashboardId: string;
    readonly dashboardName: string;
    readonly dashboardDescription?: string;
    readonly dashboardOwnerUserId?: string;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly metricsDataSince: string;
    readonly documentStatus: "active" | "draft";
  };
  readonly dashboardSettings: {
    readonly gridSettings: {
      readonly columnCount: number;
      readonly rowHeightPixels: number;
      readonly horizontalGapPixels: number;
      readonly verticalGapPixels: number;
      readonly allowPanelOverlap: boolean;
      readonly compactVerticalLayout: boolean;
    };
    readonly timeRangeSettings: {
      readonly defaultRelativeDays: number;
    };
    readonly refreshSettings: {
      readonly automaticRefreshEnabled: boolean;
      readonly refreshIntervalSeconds: number;
    };
  };
  readonly dashboardVariables: readonly {
    readonly variableId: string;
    readonly variableName: string;
    readonly variableDescription?: string;
    readonly variableType: "period" | "board_assignee" | "board_label" | "board_column" | "template" | "template_field" | "text" | "number" | "multi_select";
    readonly valueSource?: { readonly sourceType: "board_assignees" | "board_labels" | "board_columns" | "templates" | "template_fields" | "static"; readonly templateId?: string };
    readonly defaultSelection?: { readonly selectionType: "all" | "none" | "values"; readonly selectedValues?: readonly string[] };
    readonly allowMultipleSelections: boolean;
    readonly required: boolean;
  }[];
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

export interface BoardMetricsResponse {
  readonly board: BoardView;
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

export interface BoardMetricsRequest {
  readonly from?: string;
  readonly to?: string;
  readonly variableValues?: Readonly<Record<string, readonly string[]>>;
}
