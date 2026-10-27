import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, test, vi } from "vitest";
import AdminBoardsListaPage from "./index";
import { boardsApi } from "@/services/boards";
import { makeBoardView } from "../../test-fixtures";

vi.mock("@/services/boards", () => ({
  boardsApi: {
    list: vi.fn(),
    create: vi.fn(),
  },
}));

const mocked = vi.mocked(boardsApi);

describe("AdminBoardsListaPage", () => {
  beforeEach(() => {
    mocked.list.mockResolvedValue([
      { boardId: "board-1", name: "Leads", description: "Comercial", createdAt: "2026-10-27T10:00:00.000Z", updatedAt: "2026-10-27T10:00:00.000Z", createdBy: "admin-1" },
    ]);
    mocked.create.mockResolvedValue(makeBoardView());
  });

  test("lista boards existentes", async () => {
    render(
      <MemoryRouter>
        <AdminBoardsListaPage />
      </MemoryRouter>,
    );
    expect(await screen.findByText("Leads")).toBeInTheDocument();
    expect(screen.getByText("Comercial")).toBeInTheDocument();
  });

  test("cria um board e navega para ele", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<AdminBoardsListaPage />} />
          <Route path="/admin/boards/:boardId" element={<div>Board aberto</div>} />
        </Routes>
      </MemoryRouter>,
    );
    fireEvent.click(await screen.findByRole("button", { name: /Novo quadro/i }));
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Novo funil" } });
    fireEvent.click(screen.getByRole("button", { name: "Criar quadro" }));
    await waitFor(() => expect(mocked.create).toHaveBeenCalledWith(expect.objectContaining({ name: "Novo funil", icon: "layout-grid" })));
    expect(await screen.findByText("Board aberto")).toBeInTheDocument();
  });
});
