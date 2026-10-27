import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { CardModal } from "./card-modal";
import { boardsApi } from "@/services/boards";
import { makeBoardView } from "../test-fixtures";

vi.mock("@/services/boards", () => ({
  boardsApi: {
    createCard: vi.fn(),
    updateCard: vi.fn(),
    archiveCard: vi.fn(),
    createLabel: vi.fn(),
  },
}));

const mocked = vi.mocked(boardsApi);

describe("CardModal", () => {
  beforeEach(() => {
    mocked.createCard.mockResolvedValue(makeBoardView().cards[0]!);
    mocked.updateCard.mockResolvedValue(makeBoardView().cards[0]!);
    mocked.createLabel.mockResolvedValue({ boardId: "board-1", labelId: "label-2", name: "Nova", color: "blue", createdAt: "2026-10-27T10:00:00.000Z", updatedAt: "2026-10-27T10:00:00.000Z" });
  });

  test("cria card com template e label", async () => {
    const onSaved = vi.fn(async () => {});
    const onClose = vi.fn();
    render(
      <CardModal
        open
        board={makeBoardView()}
        initialColumnId="col-1"
        onClose={onClose}
        onSaved={onSaved}
      />,
    );
    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Novo lead" } });
    fireEvent.change(screen.getByLabelText("Empresa"), { target: { value: "Atlas" } });
    fireEvent.focus(screen.getByPlaceholderText(/Buscar ou criar label/));
    fireEvent.click(screen.getByRole("button", { name: /Quente/i }));
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(mocked.createCard).toHaveBeenCalledWith("board-1", expect.objectContaining({
      title: "Novo lead",
      columnId: "col-1",
      templateId: "template-1",
      labelIds: ["label-1"],
      fieldValues: { "field-1": "Atlas" },
    })));
    expect(onSaved).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  test("edita título de card existente", async () => {
    const onSaved = vi.fn(async () => {});
    render(
      <CardModal
        open
        board={makeBoardView()}
        card={makeBoardView().cards[0]!}
        onClose={() => {}}
        onSaved={onSaved}
      />,
    );
    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Marivaldo editado" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(mocked.updateCard).toHaveBeenCalledWith("board-1", "card-1", expect.objectContaining({
      title: "Marivaldo editado",
    })));
    expect(onSaved).toHaveBeenCalled();
  });

  test("mostra erro abaixo do salvar e destaca o título", async () => {
    render(
      <CardModal
        open
        board={makeBoardView()}
        initialColumnId="col-1"
        onClose={() => {}}
        onSaved={async () => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(screen.getByLabelText("Título")).toHaveClass("border-status-danger");
    expect(screen.getByRole("alert")).toHaveTextContent("Corrija os campos destacados");
    expect(screen.getByText("Informe o título do card")).toBeInTheDocument();
  });

  test("cria uma label nova dentro do card", async () => {
    const onSaved = vi.fn(async () => {});
    render(
      <CardModal
        open
        board={makeBoardView()}
        initialColumnId="col-1"
        onClose={() => {}}
        onSaved={onSaved}
      />,
    );
    fireEvent.change(screen.getByPlaceholderText(/Buscar ou criar label/), { target: { value: "Nova" } });
    fireEvent.click(screen.getByRole("button", { name: /Criar e selecionar/i }));
    await waitFor(() => expect(mocked.createLabel).toHaveBeenCalledWith("board-1", { name: "Nova", color: "blue" }));
    expect((await screen.findAllByText("Nova")).length).toBeGreaterThan(0);
    expect(onSaved).toHaveBeenCalled();
  });
});
