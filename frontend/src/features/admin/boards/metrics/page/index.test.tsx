import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, test, vi } from "vitest";
import BoardMetricsPage from "./index";
import { boardsApi } from "@/services/boards";
import { makeBoardView } from "../../test-fixtures";
import type { BoardMetricsDashboard, BoardMetricsResponse, DashboardPanel } from "../types";

vi.mock("@/services/boards", () => ({
  boardsApi: {
    getMetrics: vi.fn(),
    saveMetricsDashboard: vi.fn(),
  },
}));

vi.mock("react-grid-layout", () => ({
  Responsive: ({ children, layouts, onLayoutChange }: { readonly children: ReactNode; readonly layouts?: { readonly lg?: readonly { readonly i: string; readonly x: number; readonly y: number; readonly w: number; readonly h: number; readonly minW?: number; readonly minH?: number }[] }; readonly onLayoutChange?: (layout: readonly { readonly i: string; readonly x: number; readonly y: number; readonly w: number; readonly h: number; readonly minW?: number; readonly minH?: number }[]) => void }) => (
    <div>
      <button type="button" onClick={() => onLayoutChange?.((layouts?.lg ?? []).map((item) => item.i === "active-panel" ? { ...item, x: 4, y: 2 } : item))}>Simular layout</button>
      {children}
    </div>
  ),
  WidthProvider: (component: unknown) => component,
}));

vi.mock("recharts", () => {
  const Container = ({ children }: { readonly children?: ReactNode }) => <div>{children}</div>;
  return {
    Bar: Container, BarChart: Container, CartesianGrid: Container, Cell: Container,
    LabelList: Container, Legend: Container, Line: Container, LineChart: Container,
    Pie: Container, PieChart: Container, ResponsiveContainer: Container,
    Tooltip: Container, XAxis: Container, YAxis: Container,
  };
});

const mocked = vi.mocked(boardsApi);

function panel(panelId: string, panelTitle: string, metricId: string, visualizationType: DashboardPanel["visualization"]["visualizationType"]): DashboardPanel {
  return {
    panelId, panelTitle, metricId,
    visualization: { visualizationType },
    layout: { horizontalStartColumn: 0, verticalStartRow: 0, horizontalSpanColumns: 3, verticalSpanRows: 2, minimumHorizontalSpanColumns: 2, minimumVerticalSpanRows: 2 },
  };
}

function makeDashboard(): BoardMetricsDashboard {
  return {
    schemaVersion: 1,
    documentType: "boardMetricsDashboard",
    dashboardMetadata: {
      dashboardId: "dashboard-board-1", dashboardName: "Dashboard de teste",
      dashboardDescription: "Métricas do quadro", createdAt: "2026-10-27T10:00:00.000Z",
      updatedAt: "2026-10-27T10:00:00.000Z", metricsDataSince: "2026-10-27T00:00:00.000Z", documentStatus: "active",
    },
    dashboardSettings: {
      gridSettings: { columnCount: 12, rowHeightPixels: 88, horizontalGapPixels: 16, verticalGapPixels: 16, allowPanelOverlap: false, compactVerticalLayout: true },
      timeRangeSettings: { defaultRelativeDays: 30 },
      refreshSettings: { automaticRefreshEnabled: false, refreshIntervalSeconds: 60 },
    },
    dashboardVariables: [],
    metricDefinitions: [
      {
        metricId: "active", metricName: "Cards ativos",
        calculation: {
          dataSource: { dataSourceType: "board_cards", includeArchivedCards: false, applyDashboardVariables: false, applyDashboardTimeRange: false },
          namedQueries: { value: { measurement: { aggregationType: "count", nullValueHandling: "ignore_nulls" } } },
          formatting: { formatType: "number", decimalPlaces: 0 },
        },
      },
      {
        metricId: "by-column", metricName: "Cards por coluna",
        calculation: {
          dataSource: { dataSourceType: "board_cards", includeArchivedCards: false, applyDashboardVariables: false, applyDashboardTimeRange: false },
          namedQueries: { value: { grouping: { groupByDimensions: [{ dimensionType: "board_column" }] }, measurement: { aggregationType: "count", nullValueHandling: "ignore_nulls" } } },
          formatting: { formatType: "number", decimalPlaces: 0 },
        },
      },
    ],
    panelDefinitions: [panel("active-panel", "Cards ativos", "active", "stat"), panel("column-panel", "Cards por coluna", "by-column", "bar_chart")],
  };
}

function makeResponse(): BoardMetricsResponse {
  return {
    board: makeBoardView(),
    dashboard: makeDashboard(),
    panels: [
      { panelId: "active-panel", panelTitle: "Cards ativos", visualizationType: "stat", metric: { metricId: "active", metricName: "Cards ativos", formatType: "number", value: 1, groups: [], sampleSize: 1 } },
      { panelId: "column-panel", panelTitle: "Cards por coluna", visualizationType: "bar_chart", metric: { metricId: "by-column", metricName: "Cards por coluna", formatType: "number", value: null, groups: [{ dimensionValues: { "board_column-0": "Novo" }, value: 1 }], sampleSize: 1 } },
    ],
    filterOptions: { columns: [{ columnId: "col-1", columnName: "Novo" }], labels: [{ labelId: "label-1", labelName: "Quente" }], assignees: [], templates: [{ templateId: "template-1", templateName: "Lead" }] },
    metadata: { generatedAt: "2026-10-27T10:00:00.000Z", metricsDataSince: "2026-10-27T00:00:00.000Z", totalCards: 1, archivedCards: 0, historyTruncated: false },
  };
}

describe("BoardMetricsPage", () => {
  beforeEach(() => {
    mocked.getMetrics.mockResolvedValue(makeResponse());
    mocked.saveMetricsDashboard.mockResolvedValue(makeBoardView().board);
  });

  function renderPage(): void {
    render(
      <MemoryRouter initialEntries={["/admin/boards/board-1/metrics"]}>
        <Routes>
          <Route path="/admin/boards/:boardId/metrics" element={<BoardMetricsPage />} />
        </Routes>
      </MemoryRouter>,
    );
  }

  test("renderiza painéis, métricas e filtros do dashboard", async () => {
    renderPage();
    expect(await screen.findByText("Dashboard de teste")).toBeInTheDocument();
    expect(screen.getByText("Cards ativos")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText(/Dados desde/)).toBeInTheDocument();
  });

  test("modo leitura não exibe ações de edição", async () => {
    const response = makeResponse();
    mocked.getMetrics.mockResolvedValue({ ...response, board: { ...response.board, accessRole: "read" } });
    renderPage();
    expect(await screen.findByText("Dashboard de teste")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Editar$/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Painel/ })).not.toBeInTheDocument();
  });

  test("salva o layout alterado pelo grid", async () => {
    renderPage();
    await screen.findByText("Dashboard de teste");
    fireEvent.click(screen.getByRole("button", { name: /^Editar$/ }));
    fireEvent.click(screen.getByRole("button", { name: "Simular layout" }));
    fireEvent.click(screen.getByRole("button", { name: /Salvar/ }));
    await waitFor(() => expect(mocked.saveMetricsDashboard).toHaveBeenCalled());
    const saved = mocked.saveMetricsDashboard.mock.calls[0]?.[1] as BoardMetricsDashboard;
    expect(saved.panelDefinitions.find((item) => item.panelId === "active-panel")?.layout).toMatchObject({ horizontalStartColumn: 4, verticalStartRow: 2 });
  });

  test("editor JSON salva um documento válido", async () => {
    renderPage();
    await screen.findByText("Dashboard de teste");
    fireEvent.click(screen.getByRole("button", { name: /^Editar$/ }));
    fireEvent.click(screen.getByRole("button", { name: "JSON" }));
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: JSON.stringify(makeResponse().dashboard) } });
    fireEvent.click(screen.getByRole("button", { name: /Validar e salvar/ }));
    await waitFor(() => expect(mocked.saveMetricsDashboard).toHaveBeenCalled());
    expect(screen.queryByText("Erro ao salvar")).not.toBeInTheDocument();
  });

  test("cria um painel visual simples e persiste no dashboard", async () => {
    renderPage();
    await screen.findByText("Dashboard de teste");
    fireEvent.click(screen.getByRole("button", { name: /^Editar$/ }));
    fireEvent.click(screen.getByRole("button", { name: /Painel/ }));
    expect(await screen.findByRole("heading", { name: "Novo painel" })).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("Ex.: Pipeline por etapa"), { target: { value: "Total de cards" } });
    fireEvent.click(screen.getByRole("button", { name: /Salvar e visualizar/ }));
    await waitFor(() => expect(mocked.saveMetricsDashboard).toHaveBeenCalled());
    const saved = mocked.saveMetricsDashboard.mock.calls[0]?.[1] as BoardMetricsDashboard;
    expect(saved.metricDefinitions).toHaveLength(3);
    expect(saved.panelDefinitions).toHaveLength(3);
    expect(saved.panelDefinitions[2]?.panelTitle).toBe("Total de cards");
  });

  test("editor JSON exibe erro para documento incompleto", async () => {
    renderPage();
    await screen.findByText("Dashboard de teste");
    fireEvent.click(screen.getByRole("button", { name: /^Editar$/ }));
    fireEvent.click(screen.getByRole("button", { name: "JSON" }));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "{}" } });
    fireEvent.click(screen.getByRole("button", { name: /Validar e salvar/ }));
    expect(await screen.findByText(/documentType incorreto/)).toBeInTheDocument();
  });
});
