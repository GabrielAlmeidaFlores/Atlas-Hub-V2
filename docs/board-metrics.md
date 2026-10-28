# Métricas de quadros

A dashboard de métricas é salva no próprio quadro (`metricsDashboard`) e consultada pela rota existente:

```txt
GET /admin/boards/{boardId}?view=metrics&from=YYYY-MM-DD&to=YYYY-MM-DD
```

A configuração é salva com:

```txt
PUT /admin/boards/{boardId}
```

Todos os membros do quadro podem visualizar. Apenas `owner` e `admin` podem editar.

## Estrutura do documento

```json
{
  "schemaVersion": 1,
  "documentType": "boardMetricsDashboard",
  "dashboardMetadata": {
    "dashboardId": "dashboard-captacao",
    "dashboardName": "Captação",
    "dashboardDescription": "Indicadores do processo comercial.",
    "createdAt": "2026-10-28T00:00:00.000Z",
    "updatedAt": "2026-10-28T00:00:00.000Z",
    "metricsDataSince": "2026-10-28T00:00:00.000Z",
    "documentStatus": "active"
  },
  "dashboardSettings": {
    "gridSettings": {
      "columnCount": 12,
      "rowHeightPixels": 88,
      "horizontalGapPixels": 16,
      "verticalGapPixels": 16,
      "allowPanelOverlap": false,
      "compactVerticalLayout": true
    },
    "timeRangeSettings": {
      "defaultRelativeDays": 30
    },
    "refreshSettings": {
      "automaticRefreshEnabled": false,
      "refreshIntervalSeconds": 60
    }
  },
  "dashboardVariables": [],
  "metricDefinitions": [
    {
      "metricId": "cards-ativos",
      "metricName": "Cards ativos",
      "metricDescription": "Cards ainda não arquivados.",
      "calculation": {
        "dataSource": {
          "dataSourceType": "board_cards",
          "includeArchivedCards": false,
          "applyDashboardVariables": true,
          "applyDashboardTimeRange": false
        },
        "namedQueries": {
          "value": {
            "queryDescription": "Contagem de cards ativos.",
            "filterGroup": {
              "logicalOperator": "and",
              "filterConditions": [
                {
                  "conditionType": "comparison",
                  "sourceField": { "sourceType": "board_archived_state" },
                  "comparisonOperator": "is_not_archived"
                }
              ],
              "nestedFilterGroups": []
            },
            "measurement": {
              "aggregationType": "count",
              "nullValueHandling": "ignore_nulls"
            }
          }
        },
        "formatting": {
          "formatType": "number",
          "decimalPlaces": 0
        }
      }
    }
  ],
  "panelDefinitions": [
    {
      "panelId": "cards-ativos-panel",
      "panelTitle": "Cards ativos",
      "metricId": "cards-ativos",
      "visualization": { "visualizationType": "stat" },
      "layout": {
        "horizontalStartColumn": 0,
        "verticalStartRow": 0,
        "horizontalSpanColumns": 3,
        "verticalSpanRows": 2,
        "minimumHorizontalSpanColumns": 2,
        "minimumVerticalSpanRows": 2
      }
    }
  ]
}
```

## Filtros

Filtros podem ser compostos com `and`, `or` e grupos aninhados. As condições usam:

- `sourceField`: coluna, label, responsável, template, campo do template, campo de sistema, estado arquivado ou variável.
- `comparisonOperator`: igualdade, pertinência, existência, comparação numérica, intervalo, período relativo e estado arquivado.
- `comparisonValue`: valor comparado.

## Medidas e fórmulas

Medidas disponíveis: `count`, `distinct_count`, `sum`, `average`, `median`, `p90`, `minimum`, `maximum`, `weighted_sum` e `completeness`.

Uma métrica pode ter várias queries nomeadas e uma fórmula:

```json
{
  "namedQueries": {
    "ganhos": {
      "filterGroup": {
        "logicalOperator": "and",
        "filterConditions": [
          {
            "conditionType": "comparison",
            "sourceField": { "sourceType": "board_column", "columnId": "<coluna-ganho>" },
            "comparisonOperator": "equals",
            "comparisonValue": "<coluna-ganho>"
          }
        ]
      },
      "measurement": { "aggregationType": "count", "nullValueHandling": "ignore_nulls" }
    },
    "perdidos": {
      "filterGroup": {
        "logicalOperator": "and",
        "filterConditions": [
          {
            "conditionType": "comparison",
            "sourceField": { "sourceType": "board_column", "columnId": "<coluna-perdido>" },
            "comparisonOperator": "equals",
            "comparisonValue": "<coluna-perdido>"
          }
        ]
      },
      "measurement": { "aggregationType": "count", "nullValueHandling": "ignore_nulls" }
    }
  },
  "resultFormula": {
    "formulaExpression": "ganhos / (ganhos + perdidos) * 100"
  },
  "formatting": { "formatType": "percentage", "decimalPlaces": 1 }
}
```

Funções suportadas: `min`, `max`, `abs`, `round`, `coalesce`, além de `+`, `-`, `*`, `/` e parênteses.

## Validação

O backend valida estrutura, referências do quadro, tipos de campos, variáveis, fórmulas, colunas de peso e limites do grid. Um painel inválido retorna erro no salvamento; referências removidas posteriormente aparecem como erro no painel, sem derrubar os demais.

## Limitações atuais

- O editor avançado está disponível dentro da dashboard; import/export externo fica para uma próxima etapa.
- Métricas de transição histórica dependem dos dados disponíveis desde a implantação; não há backfill.
- O drill-down por painel ainda não está implementado.
- A comparação com período anterior está disponível para métricas com `comparisonEnabled`.
