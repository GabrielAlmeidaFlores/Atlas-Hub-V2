import assert from "node:assert/strict";
import { test } from "node:test";
import { funnelCsv, leadsCsv } from "./csv.js";
import type { BoardView } from "./types.js";

const view: BoardView = {
  board: {
    boardId: "board-1",
    name: "Leads",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    createdBy: "admin-1",
  },
  columns: [
    {
      boardId: "board-1",
      columnId: "novo",
      name: "Novo",
      position: 0,
      createdAt: "",
      updatedAt: "",
    },
    {
      boardId: "board-1",
      columnId: "ganho",
      name: "Ganho",
      position: 1,
      createdAt: "",
      updatedAt: "",
    },
    {
      boardId: "board-1",
      columnId: "perdido",
      name: "Perdido",
      position: 2,
      createdAt: "",
      updatedAt: "",
    },
  ],
  labels: [
    {
      boardId: "board-1",
      labelId: "quente",
      name: "Quente",
      color: "green",
      createdAt: "",
      updatedAt: "",
    },
  ],
  templates: [
    {
      boardId: "board-1",
      templateId: "lead",
      name: "Lead",
      createdAt: "",
      updatedAt: "",
      fields: [
        {
          fieldId: "phone",
          label: "Telefone",
          type: "phone",
          required: false,
          position: 0,
        },
      ],
    },
  ],
  cards: [
    {
      boardId: "board-1",
      cardId: "a",
      cardNumber: 1,
      columnId: "novo",
      position: 0,
      title: 'Lead, "A"',
      fieldValues: { phone: "11999999999" },
      labelIds: ["quente"],
      assigneeEmails: ["a@example.com"],
      createdAt: "",
      updatedAt: "",
      createdBy: "",
      updatedBy: "",
    },
    {
      boardId: "board-1",
      cardId: "b",
      cardNumber: 2,
      columnId: "ganho",
      position: 0,
      title: "=formula",
      fieldValues: {},
      labelIds: [],
      assigneeEmails: [],
      createdAt: "",
      updatedAt: "",
      createdBy: "",
      updatedBy: "",
    },
    {
      boardId: "board-1",
      cardId: "c",
      cardNumber: 3,
      columnId: "perdido",
      position: 0,
      title: "Perdido",
      fieldValues: {},
      labelIds: [],
      assigneeEmails: [],
      createdAt: "",
      updatedAt: "",
      createdBy: "",
      updatedBy: "",
    },
  ],
};

test("serializes leads with CSV escaping and formula protection", () => {
  const csv = leadsCsv(view);
  assert.match(csv, /"Lead, ""A"""/);
  assert.match(csv, /'=formula/);
  assert.match(csv, /Telefone/);
});

test("summarizes funnel and conversion", () => {
  const csv = funnelCsv(view);
  assert.match(csv, /Etapa,Ganho,1/);
  assert.match(csv, /Taxa de ganho \(%\),50/);
});

test("marks conversion as not configured for unknown column names", () => {
  const custom = {
    ...view,
    columns: view.columns.map((column) => column.name === "Ganho" ? { ...column, name: "Concluído" } : column.name === "Perdido" ? { ...column, name: "Descartado" } : column),
  };
  assert.match(funnelCsv(custom), /Conversão,Status,Não configurada/);
});
