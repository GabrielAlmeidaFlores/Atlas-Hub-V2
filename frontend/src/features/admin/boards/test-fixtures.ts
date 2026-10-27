import type { BoardView } from "@/types";

export function makeBoardView(): BoardView {
  return {
    board: {
      boardId: "board-1",
      name: "Leads",
      description: "Acompanhamento comercial",
      createdAt: "2026-10-27T10:00:00.000Z",
      updatedAt: "2026-10-27T10:00:00.000Z",
      createdBy: "admin-1",
    },
    columns: [
      { boardId: "board-1", columnId: "col-1", name: "Novo", position: 0, createdAt: "2026-10-27T10:00:00.000Z", updatedAt: "2026-10-27T10:00:00.000Z" },
      { boardId: "board-1", columnId: "col-2", name: "Em contato", position: 1, createdAt: "2026-10-27T10:00:00.000Z", updatedAt: "2026-10-27T10:00:00.000Z" },
    ],
    labels: [
      { boardId: "board-1", labelId: "label-1", name: "Quente", color: "green", createdAt: "2026-10-27T10:00:00.000Z", updatedAt: "2026-10-27T10:00:00.000Z" },
    ],
    templates: [
      {
        boardId: "board-1",
        templateId: "template-1",
        name: "Lead",
        fields: [
          { fieldId: "field-1", label: "Empresa", type: "text", required: false, position: 0 },
          { fieldId: "field-2", label: "Telefone", type: "phone", required: false, position: 1 },
        ],
        createdAt: "2026-10-27T10:00:00.000Z",
        updatedAt: "2026-10-27T10:00:00.000Z",
      },
    ],
    accessRole: "owner",
    cards: [
      {
        boardId: "board-1",
        cardId: "card-1",
        columnId: "col-1",
        position: 0,
        title: "Marivaldo",
        description: "Projeto 60 unidades",
        templateId: "template-1",
        fieldValues: { "field-1": "Marivaldo Incorporadora", "field-2": "11999999999" },
        labelIds: ["label-1"],
        createdAt: "2026-10-27T10:00:00.000Z",
        updatedAt: "2026-10-27T10:00:00.000Z",
        createdBy: "admin-1",
        updatedBy: "admin-1",
      },
    ],
  };
}
