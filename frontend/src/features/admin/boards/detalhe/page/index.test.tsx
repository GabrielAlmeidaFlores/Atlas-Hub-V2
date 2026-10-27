import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, test, vi } from "vitest";
import AdminBoardsDetalhePage from "./index";
import { boardsApi } from "@/services/boards";
import { makeBoardView } from "../../test-fixtures";

vi.mock("@/services/boards", () => ({
  boardsApi: {
    get: vi.fn(),
    moveCard: vi.fn(),
  },
}));

const mocked = vi.mocked(boardsApi);

describe("AdminBoardsDetalhePage", () => {
  beforeEach(() => {
    mocked.get.mockResolvedValue(makeBoardView());
  });

  test("mostra colunas, cards e labels", async () => {
    render(
      <MemoryRouter initialEntries={["/admin/boards/board-1"]}>
        <Routes>
          <Route path="/admin/boards/:boardId" element={<AdminBoardsDetalhePage />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByText("Novo")).toBeInTheDocument();
    expect(screen.getByText("Em contato")).toBeInTheDocument();
    expect(screen.getByText("Marivaldo")).toBeInTheDocument();
    expect(screen.getByText("Projeto 60 unidades")).toBeInTheDocument();
  });

  test("modo leitura esconde ações de edição e abre o card somente para visualização", async () => {
    const view = makeBoardView();
    mocked.get.mockResolvedValue({ ...view, accessRole: "read" });
    render(
      <MemoryRouter initialEntries={["/admin/boards/board-1"]}>
        <Routes>
          <Route path="/admin/boards/:boardId" element={<AdminBoardsDetalhePage />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByText("Novo")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Configurar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Novo card/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Marivaldo"));
    expect(await screen.findByText("Visualizar card")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Salvar" })).not.toBeInTheDocument();
  });

  test("abre a configuração do board", async () => {
    render(
      <MemoryRouter initialEntries={["/admin/boards/board-1"]}>
        <Routes>
          <Route path="/admin/boards/:boardId" element={<AdminBoardsDetalhePage />} />
        </Routes>
      </MemoryRouter>,
    );
    fireEvent.click(await screen.findByRole("button", { name: /Configurar/i }));
    expect(await screen.findByText("Configurar quadro")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Nova coluna")).toBeInTheDocument();
  });
});
