import { http, HttpResponse } from "msw";
import type {
  Board,
  BoardCard,
  BoardIcon,
  BoardColumn,
  BoardFieldValue,
  BoardLabel,
  BoardLabelColor,
  BoardTemplate,
  BoardTemplateField,
  BoardView,
  BoardMember,
  BoardCardHistoryEntry,
  BoardMemberRole,
  BoardAccessRole,
} from "@/types";

const DEFAULT_COLUMNS = [
  { name: "Novo", color: "blue" },
  { name: "Em contato", color: "amber" },
  { name: "Reunião", color: "violet" },
  { name: "Projeto", color: "teal" },
  { name: "Ganho", color: "green" },
  { name: "Perdido", color: "rose" },
] as const;
const DEFAULT_TEMPLATE_NAME = "Lead";
const DEFAULT_FIELDS: readonly Omit<BoardTemplateField, "fieldId">[] = [
  { label: "Empresa", type: "text", required: false, position: 0 },
  { label: "Telefone", type: "phone", required: false, position: 1 },
  { label: "E-mail", type: "email", required: false, position: 2 },
  { label: "Cidade", type: "text", required: false, position: 3 },
  { label: "Projeto/Terreno", type: "text", required: false, position: 4 },
  { label: "Valor de captação", type: "number", required: false, position: 5 },
  { label: "Prazo", type: "date", required: false, position: 6 },
  { label: "Observações", type: "longText", required: false, position: 7 },
  { label: "Site", type: "url", required: false, position: 8 },
  { label: "Etapa", type: "select", required: false, options: ["Novo", "Em andamento", "Concluído"], position: 9 },
  { label: "Aceite", type: "checkbox", required: false, position: 10 },
  { label: "Documento principal", type: "file", required: false, position: 11 },
  { label: "Documentos complementares", type: "files", required: false, position: 12 },
];

const MOCK_ADMINS = [
  { id: "mock-admin", nome: "Admin Master", email: "admin@atlashub.com", perfil: "ADMIN_MASTER" as const, ativo: true },
  { id: "mock-master2", nome: "Outro Master", email: "master2@atlashub.com", perfil: "ADMIN_MASTER" as const, ativo: true },
  { id: "mock-analista", nome: "Analista", email: "analista@atlashub.com", perfil: "ANALISTA" as const, ativo: true },
  { id: "mock-leitor", nome: "Leitor Convidado", email: "leitor@atlashub.com", perfil: "ANALISTA" as const, ativo: true },
];

interface BoardStore {
  boards: Board[];
  columns: BoardColumn[];
  labels: BoardLabel[];
  templates: BoardTemplate[];
  cards: BoardCard[];
}

const store: BoardStore = {
  boards: [],
  columns: [],
  labels: [],
  templates: [],
  cards: [],
};

function iso(): string {
  return new Date().toISOString();
}

function id(): string {
  return crypto.randomUUID();
}

function normalizedEmail(request?: Request): string {
  return (request?.headers.get("x-mock-user-email") ?? "admin@atlashub.com").trim().toLowerCase();
}

function userIdFor(email: string): string {
  return `mock-${email.split("@")[0] ?? "user"}`;
}

function accessRoleFor(board: Board, email: string): BoardAccessRole | null {
  const normalized = email.trim().toLowerCase();
  if (board.createdByEmail === normalized || board.createdBy === userIdFor(normalized)) return "owner";
  const member = (board.members ?? []).find((item) => item.email.trim().toLowerCase() === normalized);
  return member?.role ?? null;
}

function nowUser(): string {
  return "mock-admin";
}

function defaultColumns(boardId: string, timestamp: string): BoardColumn[] {
  return DEFAULT_COLUMNS.map((column, position) => ({
    boardId,
    columnId: id(),
    name: column.name,
    color: column.color,
    position,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));
}

function defaultTemplate(boardId: string, timestamp: string): BoardTemplate {
  return {
    boardId,
    templateId: id(),
    name: DEFAULT_TEMPLATE_NAME,
    fields: DEFAULT_FIELDS.map((field, index) => ({
      ...field,
      fieldId: id(),
      position: index,
    })),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function createBoard(
  name: string,
  description?: string,
  icon: BoardIcon = "layout-grid",
  email = "admin@atlashub.com",
): BoardView {
  const timestamp = iso();
  const boardId = id();
  const board: Board = {
    boardId,
    name,
    icon,
    ...(description !== undefined && description.length > 0 ? { description } : {}),
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: userIdFor(email),
    createdByEmail: email,
    members: [],
  };
  const columns = defaultColumns(boardId, timestamp);
  const template = defaultTemplate(boardId, timestamp);
  store.boards.push(board);
  store.columns.push(...columns);
  store.templates.push(template);
  return { board, columns, labels: [], templates: [template], cards: [], accessRole: "owner" };
}

function createSeed(): void {
  if (store.boards.length > 0) return;
  const view = createBoard("Leads", "Acompanhamento comercial — dados de demonstração", "layout-grid", "admin@atlashub.com");
  const boardId = view.board.boardId;
  const board = store.boards.find((item) => item.boardId === boardId);
  const template = view.templates[0];
  if (board === undefined || template === undefined) return;

  const timestamp = iso();
  board.members = [
    { email: "master2@atlashub.com", name: "Outro Master", role: "admin", addedAt: timestamp, addedBy: "admin@atlashub.com" },
    { email: "analista@atlashub.com", name: "Analista", role: "write", addedAt: timestamp, addedBy: "admin@atlashub.com" },
    { email: "leitor@atlashub.com", name: "Leitor Convidado", role: "read", addedAt: timestamp, addedBy: "admin@atlashub.com" },
  ];

  const labelSeed = [
    { name: "Quente", color: "green" as const },
    { name: "Investidor", color: "blue" as const },
    { name: "Urgente", color: "red" as const },
    { name: "Visita agendada", color: "purple" as const },
    { name: "Aguardando docs", color: "orange" as const },
  ];
  const labels = labelSeed.map((label) => ({
    boardId,
    labelId: id(),
    name: label.name,
    color: label.color,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));
  store.labels.push(...labels);
  const labelId = (name: string): string => labels.find((label) => label.name === name)?.labelId ?? "";

  function fields(values: Readonly<Record<string, BoardFieldValue>>): Record<string, BoardFieldValue> {
    const result: Record<string, BoardFieldValue> = {};
    for (const [label, value] of Object.entries(values)) {
      const field = template.fields.find((item) => item.label === label);
      if (field !== undefined) result[field.fieldId] = value;
    }
    return result;
  }

  const columns = view.columns;
  const columnId = (name: string): string => columns.find((column) => column.name === name)?.columnId ?? columns[0]?.columnId ?? "";
  const cards: BoardCard[] = [
    {
      boardId, cardId: id(), columnId: columnId("Novo"), position: 0,
      title: "Residencial Jardim das Acácias",
      description: "Incorporadora com terreno em Campinas. Busca captação de R$ 4,2 mi para 32 unidades.",
      templateId: template.templateId,
      fieldValues: fields({
        Empresa: "Acácias Empreendimentos",
        Telefone: "(19) 99812-4455",
        "E-mail": "contato@acacias.com.br",
        Cidade: "Campinas",
        "Projeto/Terreno": "Jardim das Acácias",
        "Valor de captação": 4200000,
        Prazo: "2026-12-15",
        Observações: "Primeiro contato pelo site. Cliente pediu retorno ainda esta semana e enviou a documentação inicial.",
        Site: "https://acaciasempreendimentos.com.br",
        Etapa: "Em andamento",
        Aceite: true,
        "Documento principal": { key: `boards/${boardId}/demo-contrato-social.pdf`, name: "Contrato social.pdf", size: 248000, contentType: "application/pdf" },
        "Documentos complementares": [
          { key: `boards/${boardId}/demo-matricula.pdf`, name: "Matrícula do terreno.pdf", size: 512000, contentType: "application/pdf" },
          { key: `boards/${boardId}/demo-viabilidade.pdf`, name: "Estudo de viabilidade.pdf", size: 730000, contentType: "application/pdf" },
        ],
      }),
      labelIds: [labelId("Quente"), labelId("Investidor")],
      assigneeEmails: ["admin@atlashub.com", "analista@atlashub.com"],
      createdAt: timestamp, updatedAt: timestamp, createdBy: "mock-admin", updatedBy: "mock-admin",
    },
    {
      boardId, cardId: id(), columnId: columnId("Novo"), position: 1,
      title: "Studio Vila Mariana",
      description: "Projeto compacto próximo ao metrô. Lead ainda sem documentação.",
      templateId: template.templateId,
      fieldValues: fields({ Empresa: "Vila Nova Incorporações", Telefone: "(11) 98765-1200", "E-mail": "diretoria@vilanova.com.br", Cidade: "São Paulo", "Projeto/Terreno": "Studio Vila Mariana", "Valor de captação": 1800000, Prazo: "2027-03-01" }),
      labelIds: [labelId("Aguardando docs")],
      assigneeEmails: [],
      createdAt: timestamp, updatedAt: timestamp, createdBy: "mock-admin", updatedBy: "mock-admin",
    },
    {
      boardId, cardId: id(), columnId: columnId("Em contato"), position: 0,
      title: "Edifício Horizonte",
      description: "Reunião inicial feita. Cliente pediu proposta para SCP com prazo de 24 meses.",
      templateId: template.templateId,
      fieldValues: fields({ Empresa: "Horizonte Participações", Telefone: "(41) 99123-7788", "E-mail": "marcos@horizonte.com.br", Cidade: "Curitiba", "Projeto/Terreno": "Edifício Horizonte", "Valor de captação": 7500000, Prazo: "2027-06-30", Observações: "Decisor: Marcos Vieira." }),
      labelIds: [labelId("Quente"), labelId("Urgente")],
      assigneeEmails: ["master2@atlashub.com"],
      createdAt: timestamp, updatedAt: timestamp, createdBy: "mock-admin", updatedBy: "mock-admin",
    },
    {
      boardId, cardId: id(), columnId: columnId("Em contato"), position: 1,
      title: "Condomínio Bosque Verde",
      description: "Aguardando retorno sobre viabilidade e documentação da matrícula.",
      templateId: template.templateId,
      fieldValues: fields({ Empresa: "Bosque Verde Empreendimentos", Telefone: "(31) 98870-5544", "E-mail": "financeiro@bosqueverde.com.br", Cidade: "Belo Horizonte", "Projeto/Terreno": "Bosque Verde", "Valor de captação": 2600000, Prazo: "2027-09-20" }),
      labelIds: [labelId("Aguardando docs")],
      assigneeEmails: ["analista@atlashub.com", "leitor@atlashub.com"],
      createdAt: timestamp, updatedAt: timestamp, createdBy: "mock-admin", updatedBy: "mock-admin",
    },
    {
      boardId, cardId: id(), columnId: columnId("Reunião"), position: 0,
      title: "Torres do Atlântico",
      description: "Visita ao terreno confirmada. Preparar apresentação de estrutura de captação.",
      templateId: template.templateId,
      fieldValues: fields({ Empresa: "Atlântico Sul Real Estate", Telefone: "(48) 99654-3300", "E-mail": "paulo@atlanticosul.com.br", Cidade: "Florianópolis", "Projeto/Terreno": "Torres do Atlântico", "Valor de captação": 12000000, Prazo: "2027-04-10", Observações: "Visita agendada com sócios." }),
      labelIds: [labelId("Investidor"), labelId("Visita agendada")],
      assigneeEmails: ["admin@atlashub.com", "master2@atlashub.com", "analista@atlashub.com"],
      createdAt: timestamp, updatedAt: timestamp, createdBy: "mock-admin", updatedBy: "mock-admin",
    },
    {
      boardId, cardId: id(), columnId: columnId("Reunião"), position: 1,
      title: "Vila Olímpia Offices",
      description: "Reunião técnica para alinhar cronograma de obra e garantias.",
      templateId: template.templateId,
      fieldValues: fields({ Empresa: "Olimpia Business", Telefone: "(11) 97711-8080", "E-mail": "contato@olimpiabusiness.com", Cidade: "São Paulo", "Projeto/Terreno": "Vila Olímpia Offices", "Valor de captação": 9800000, Prazo: "2027-02-28" }),
      labelIds: [labelId("Quente")],
      assigneeEmails: ["master2@atlashub.com"],
      createdAt: timestamp, updatedAt: timestamp, createdBy: "mock-admin", updatedBy: "mock-admin",
    },
    {
      boardId, cardId: id(), columnId: columnId("Projeto"), position: 0,
      title: "Parque das Águas",
      description: "Proposta aprovada. Estruturação jurídica da SPE em andamento.",
      templateId: template.templateId,
      fieldValues: fields({ Empresa: "Águas Desenvolvimento", Telefone: "(62) 99500-1122", "E-mail": "juridico@parquedasaguas.com", Cidade: "Goiânia", "Projeto/Terreno": "Parque das Águas", "Valor de captação": 6300000, Prazo: "2027-08-15" }),
      labelIds: [labelId("Investidor")],
      assigneeEmails: ["analista@atlashub.com"],
      createdAt: timestamp, updatedAt: timestamp, createdBy: "mock-admin", updatedBy: "mock-admin",
    },
    {
      boardId, cardId: id(), columnId: columnId("Ganho"), position: 0,
      title: "Residencial Aurora",
      description: "Contrato assinado. Captação de R$ 5,5 mi concluída com investidores.",
      templateId: template.templateId,
      fieldValues: fields({ Empresa: "Aurora Incorporadora", Telefone: "(85) 98111-2233", "E-mail": "ceo@aurora.com.br", Cidade: "Fortaleza", "Projeto/Terreno": "Residencial Aurora", "Valor de captação": 5500000, Prazo: "2026-11-30" }),
      labelIds: [labelId("Quente")],
      assigneeEmails: ["admin@atlashub.com"],
      createdAt: timestamp, updatedAt: timestamp, createdBy: "mock-admin", updatedBy: "mock-admin",
    },
    {
      boardId, cardId: id(), columnId: columnId("Perdido"), position: 0,
      title: "Loteamento Serra Azul",
      description: "Lead optou por financiamento bancário neste momento.",
      templateId: template.templateId,
      fieldValues: fields({ Empresa: "Serra Azul Loteamentos", Telefone: "(35) 99777-1010", "E-mail": "contato@serraazul.com", Cidade: "Poços de Caldas", "Projeto/Terreno": "Serra Azul", "Valor de captação": 900000 }),
      labelIds: [labelId("Aguardando docs")],
      assigneeEmails: [],
      createdAt: timestamp, updatedAt: timestamp, createdBy: "mock-admin", updatedBy: "mock-admin",
    },
  ];
  cards.forEach((card, index) => Object.assign(card, { cardNumber: index + 1 }));

  type SeedHistoryEntry = {
    readonly action: BoardCardHistoryEntry["action"];
    readonly description: string;
    readonly email: string;
    readonly daysAgo: number;
  };

  function applySeedHistory(card: BoardCard | undefined, entries: readonly SeedHistoryEntry[]): void {
    if (card === undefined || entries.length === 0) return;
    const sorted = [...entries].sort((a, b) => b.daysAgo - a.daysAgo);
    const history = sorted.map((entry) => ({
      historyId: id(),
      action: entry.action,
      description: entry.description,
      userId: userIdFor(entry.email),
      userEmail: entry.email,
      createdAt: new Date(Date.now() - entry.daysAgo * 86_400_000).toISOString(),
    }));
    Object.assign(card, {
      history,
      createdAt: history[0]?.createdAt ?? card.createdAt,
      updatedAt: history[history.length - 1]?.createdAt ?? card.updatedAt,
    });
  }

  applySeedHistory(cards[0], [
    { action: "created", description: "Card criado", email: "admin@atlashub.com", daysAgo: 18 },
    { action: "updated", description: "Título alterado para “Residencial Jardim das Acácias”", email: "admin@atlashub.com", daysAgo: 17 },
    { action: "updated", description: "Descrição atualizada", email: "analista@atlashub.com", daysAgo: 16 },
    { action: "updated", description: "Labels atualizadas", email: "master2@atlashub.com", daysAgo: 15 },
    { action: "updated", description: "Responsáveis atualizados", email: "admin@atlashub.com", daysAgo: 14 },
    { action: "updated", description: "Campos do template atualizados", email: "analista@atlashub.com", daysAgo: 12 },
    { action: "moved", description: "Card movido de “Novo” para “Em contato”", email: "admin@atlashub.com", daysAgo: 11 },
    { action: "updated", description: "Responsáveis atualizados", email: "master2@atlashub.com", daysAgo: 10 },
    { action: "moved", description: "Card movido de “Em contato” para “Reunião”", email: "analista@atlashub.com", daysAgo: 8 },
    { action: "updated", description: "Campos do template atualizados", email: "admin@atlashub.com", daysAgo: 7 },
    { action: "moved", description: "Card reordenado na coluna “Reunião”", email: "admin@atlashub.com", daysAgo: 6 },
    { action: "updated", description: "Título alterado para “Residencial Jardim das Acácias — Campinas”", email: "analista@atlashub.com", daysAgo: 5 },
    { action: "updated", description: "Labels atualizadas", email: "master2@atlashub.com", daysAgo: 4 },
    { action: "moved", description: "Card movido de “Reunião” para “Novo”", email: "admin@atlashub.com", daysAgo: 3 },
    { action: "updated", description: "Descrição atualizada", email: "analista@atlashub.com", daysAgo: 2 },
    { action: "updated", description: "Responsáveis atualizados", email: "admin@atlashub.com", daysAgo: 1 },
    { action: "updated", description: "Título alterado para “Residencial Jardim das Acácias”", email: "admin@atlashub.com", daysAgo: 0.4 },
    { action: "updated", description: "Campos do template atualizados", email: "admin@atlashub.com", daysAgo: 0.1 },
  ]);

  applySeedHistory(cards[2], [
    { action: "created", description: "Card criado", email: "master2@atlashub.com", daysAgo: 12 },
    { action: "updated", description: "Descrição atualizada", email: "master2@atlashub.com", daysAgo: 10 },
    { action: "updated", description: "Responsáveis atualizados", email: "admin@atlashub.com", daysAgo: 9 },
    { action: "moved", description: "Card movido de “Novo” para “Em contato”", email: "analista@atlashub.com", daysAgo: 7 },
    { action: "updated", description: "Campos do template atualizados", email: "master2@atlashub.com", daysAgo: 5 },
    { action: "updated", description: "Labels atualizadas", email: "admin@atlashub.com", daysAgo: 3 },
    { action: "moved", description: "Card reordenado na coluna “Em contato”", email: "master2@atlashub.com", daysAgo: 1 },
    { action: "updated", description: "Descrição atualizada", email: "analista@atlashub.com", daysAgo: 0.3 },
  ]);

  applySeedHistory(cards[4], [
    { action: "created", description: "Card criado", email: "admin@atlashub.com", daysAgo: 14 },
    { action: "updated", description: "Campos do template atualizados", email: "analista@atlashub.com", daysAgo: 12 },
    { action: "moved", description: "Card movido de “Em contato” para “Reunião”", email: "master2@atlashub.com", daysAgo: 9 },
    { action: "updated", description: "Responsáveis atualizados", email: "admin@atlashub.com", daysAgo: 6 },
    { action: "updated", description: "Descrição atualizada", email: "admin@atlashub.com", daysAgo: 4 },
    { action: "moved", description: "Card reordenado na coluna “Reunião”", email: "analista@atlashub.com", daysAgo: 2 },
    { action: "updated", description: "Labels atualizadas", email: "master2@atlashub.com", daysAgo: 0.8 },
    { action: "updated", description: "Título alterado para “Torres do Atlântico”", email: "admin@atlashub.com", daysAgo: 0.2 },
  ]);

  store.cards.push(...cards);
  board.updatedAt = timestamp;
}

createSeed();

function listView(boardId: string, email = "admin@atlashub.com"): BoardView | null {
  const board = store.boards.find((item) => item.boardId === boardId && item.archivedAt === undefined);
  if (board === undefined) return null;
  const accessRole = accessRoleFor(board, email);
  if (accessRole === null) return null;
  return {
    board,
    accessRole,
    columns: store.columns.filter((item) => item.boardId === boardId).sort((a, b) => a.position - b.position),
    labels: store.labels.filter((item) => item.boardId === boardId).sort((a, b) => a.name.localeCompare(b.name)),
    templates: store.templates.filter((item) => item.boardId === boardId).sort((a, b) => a.name.localeCompare(b.name)),
    cards: store.cards.filter((item) => item.boardId === boardId && item.archivedAt === undefined).sort((a, b) => a.position - b.position),
  };
}

function jsonError(message: string, status = 400): HttpResponse {
  return HttpResponse.json({ code: "VALIDATION_ERROR", message }, { status });
}

function bodyOf<T>(request: Request): Promise<T> {
  return request.json() as Promise<T>;
}

function cardHistory(
  action: BoardCardHistoryEntry["action"],
  description: string,
  email: string,
): BoardCardHistoryEntry {
  return {
    historyId: id(),
    action,
    description,
    userId: userIdFor(email),
    userEmail: email,
    createdAt: iso(),
  };
}

function appendCardHistory(card: BoardCard, action: BoardCardHistoryEntry["action"], description: string, email: string): void {
  const current = card.history ?? [];
  const base: BoardCardHistoryEntry[] = current.length > 0
    ? [...current]
    : [{
        historyId: id(),
        action: "created",
        description: "Card criado",
        userId: card.createdBy,
        createdAt: card.createdAt,
      }];
  card.history = [...base, cardHistory(action, description, email)];
}

function touch(boardId: string): void {
  const board = store.boards.find((item) => item.boardId === boardId);
  if (board !== undefined) board.updatedAt = iso();
}

function findCard(boardId: string, cardId: string): BoardCard | undefined {
  return store.cards.find((item) => item.boardId === boardId && item.cardId === cardId && item.archivedAt === undefined);
}

function findColumn(boardId: string, columnId: string): BoardColumn | undefined {
  return store.columns.find((item) => item.boardId === boardId && item.columnId === columnId);
}

function labelAssign(boardId: string, labelIds: readonly string[]): BoardLabel[] {
  return labelIds.map((labelId) => {
    const label = store.labels.find((item) => item.boardId === boardId && item.labelId === labelId);
    if (label === undefined) throw new Error("Label inválida");
    return label;
  });
}

function isBoardFile(value: unknown): value is BoardFile {
  return value !== null
    && typeof value === "object"
    && !Array.isArray(value)
    && typeof (value as BoardFile).key === "string"
    && typeof (value as BoardFile).name === "string"
    && typeof (value as BoardFile).size === "number"
    && typeof (value as BoardFile).contentType === "string";
}

function validateAssignees(view: BoardView, emails: readonly string[]): string[] {
  const allowed = new Set<string>();
  if (view.board.createdByEmail !== undefined) allowed.add(view.board.createdByEmail.toLowerCase());
  for (const member of view.board.members ?? []) allowed.add(member.email.toLowerCase());
  const unique = [...new Set(emails.map((email) => email.trim().toLowerCase()))];
  if (unique.some((email) => !allowed.has(email))) throw new Error("Responsável inválido");
  return unique;
}

function validateCardFields(templateId: string | undefined, values: Readonly<Record<string, BoardFieldValue>>): void {
  if (templateId === undefined) {
    return;
  }
  const template = store.templates.find((item) => item.templateId === templateId);
  if (template === undefined) throw new Error("Template inválido");
  const fields = template.fields;
  for (const field of fields) {
    const value = values[field.fieldId];
    if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
      if (field.required) throw new Error(`${field.label} é obrigatório`);
      continue;
    }
    if (field.type === "file" && !isBoardFile(value)) throw new Error(`${field.label} inválido`);
    if (field.type === "files" && (!Array.isArray(value) || !value.every(isBoardFile))) throw new Error(`${field.label} inválido`);
    if (field.type === "number" && typeof value !== "number") throw new Error(`${field.label} inválido`);
    if (field.type === "checkbox" && typeof value !== "boolean") throw new Error(`${field.label} inválido`);
    if (field.type === "select" && (typeof value !== "string" || !(field.options ?? []).includes(value))) throw new Error(`${field.label} inválido`);
    if (field.type === "date" && (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value)) throw new Error(`${field.label} inválido`);
    if (field.type === "email" && (typeof value !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))) throw new Error(`${field.label} inválido`);
    if (field.type === "url" && typeof value === "string") {
      const parsed = new URL(value);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error(`${field.label} inválido`);
    }
  }
}

export const boardsHandlers = [
  http.get("/admin/boards", ({ request }) => {
    const email = normalizedEmail(request);
    return HttpResponse.json({
      boards: store.boards
        .filter((board) => board.archivedAt === undefined && accessRoleFor(board, email) !== null)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    });
  }),

  http.post("/admin/boards", async ({ request }) => {
    const input = await bodyOf<{ name?: string; description?: string; icon?: BoardIcon }>(request);
    if (input.name === undefined || input.name.trim().length === 0) return jsonError("Informe o nome do board");
    return HttpResponse.json({ board: createBoard(input.name.trim(), input.description, input.icon, normalizedEmail(request)) }, { status: 201 });
  }),

  http.get("/admin/boards/:boardId/members/candidates", ({ params, request }) => {
    const view = listView(String(params.boardId), normalizedEmail(request));
    if (view === null) return HttpResponse.json({ message: "Quadro não encontrado" }, { status: 404 });
    if (view.accessRole !== "owner" && view.accessRole !== "admin") return HttpResponse.json({ message: "Acesso negado" }, { status: 403 });
    return HttpResponse.json({ users: MOCK_ADMINS.filter((user) => user.ativo) });
  }),

  http.post("/admin/boards/:boardId/members", async ({ params, request }) => {
    const boardId = String(params.boardId);
    const view = listView(boardId, normalizedEmail(request));
    if (view === null) return HttpResponse.json({ message: "Quadro não encontrado" }, { status: 404 });
    if (view.accessRole !== "owner" && view.accessRole !== "admin") return HttpResponse.json({ message: "Acesso negado" }, { status: 403 });
    const input = await bodyOf<{ email?: string; role?: BoardMemberRole }>(request);
    const target = MOCK_ADMINS.find((user) => user.email === input.email?.trim().toLowerCase() && user.ativo);
    if (target === undefined) return jsonError("Usuário não encontrado ou inativo");
    if (input.role === undefined) return jsonError("Informe a permissão");
    if (view.board.createdByEmail === target.email) return HttpResponse.json({ message: "O criador já é administrador" }, { status: 409 });
    const member: BoardMember = {
      email: target.email,
      name: target.nome,
      role: input.role,
      addedAt: iso(),
      addedBy: normalizedEmail(request),
    };
    Object.assign(view.board, {
      members: [...(view.board.members ?? []).filter((item) => item.email !== member.email), member],
    });
    touch(boardId);
    return HttpResponse.json({ member }, { status: 201 });
  }),

  http.delete("/admin/boards/:boardId/members/:email", ({ params, request }) => {
    const boardId = String(params.boardId);
    const view = listView(boardId, normalizedEmail(request));
    if (view === null) return HttpResponse.json({ message: "Quadro não encontrado" }, { status: 404 });
    if (view.accessRole !== "owner" && view.accessRole !== "admin") return HttpResponse.json({ message: "Acesso negado" }, { status: 403 });
    const email = decodeURIComponent(String(params.email)).toLowerCase();
    if (view.board.createdByEmail === email) return HttpResponse.json({ message: "Não é possível remover o criador" }, { status: 409 });
    Object.assign(view.board, {
      members: (view.board.members ?? []).filter((item) => item.email !== email),
    });
    touch(boardId);
    return HttpResponse.json({ ok: true });
  }),

  http.get("/admin/boards/:boardId", ({ params, request }) => {
    const view = listView(String(params.boardId), normalizedEmail(request));
    if (view === null) return HttpResponse.json({ message: "Board não encontrado" }, { status: 404 });
    return HttpResponse.json({ board: view });
  }),

  http.put("/admin/boards/:boardId", async ({ params, request }) => {
    const board = store.boards.find((item) => item.boardId === params.boardId);
    if (board === undefined) return HttpResponse.json({ message: "Board não encontrado" }, { status: 404 });
    const input = await bodyOf<{ name?: string; description?: string | null }>(request);
    if (input.name !== undefined) board.name = input.name;
    if (input.description !== undefined) board.description = input.description ?? "";
    board.updatedAt = iso();
    return HttpResponse.json({ board });
  }),

  http.delete("/admin/boards/:boardId", ({ params }) => {
    const board = store.boards.find((item) => item.boardId === params.boardId);
    if (board === undefined) return HttpResponse.json({ message: "Board não encontrado" }, { status: 404 });
    board.archivedAt = iso();
    board.updatedAt = board.archivedAt;
    return HttpResponse.json({ board });
  }),

  http.post("/admin/boards/:boardId/columns", async ({ params, request }) => {
    const boardId = String(params.boardId);
    if (listView(boardId) === null) return HttpResponse.json({ message: "Board não encontrado" }, { status: 404 });
    const input = await bodyOf<{ name?: string; color?: BoardColumn["color"] }>(request);
    if (input.name === undefined || input.name.trim().length === 0) return jsonError("Informe o nome da coluna");
    const timestamp = iso();
    const column: BoardColumn = {
      boardId,
      columnId: id(),
      name: input.name.trim(),
      color: input.color ?? "slate",
      position: store.columns
        .filter((item) => item.boardId === boardId)
        .reduce((max, item) => Math.max(max, item.position), -1) + 1,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    store.columns.push(column);
    touch(boardId);
    return HttpResponse.json({ column }, { status: 201 });
  }),

  http.put("/admin/boards/:boardId/columns/:columnId", async ({ params, request }) => {
    const boardId = String(params.boardId);
    const column = findColumn(boardId, String(params.columnId));
    if (column === undefined) return HttpResponse.json({ message: "Coluna não encontrada" }, { status: 404 });
    const input = await bodyOf<{ name?: string; color?: BoardColumn["color"]; position?: number }>(request);
    if (input.position !== undefined) {
      const columns = store.columns.filter((item) => item.boardId === boardId).sort((a, b) => a.position - b.position);
      const next = columns.filter((item) => item.columnId !== column.columnId);
      next.splice(Math.max(0, Math.min(input.position, next.length)), 0, column);
      next.forEach((item, position) => {
        item.position = position;
        item.updatedAt = iso();
      });
    }
    if (input.name !== undefined) column.name = input.name;
    if (input.color !== undefined) column.color = input.color;
    column.updatedAt = iso();
    touch(boardId);
    return HttpResponse.json({ column });
  }),

  http.delete("/admin/boards/:boardId/columns/:columnId", ({ params }) => {
    const boardId = String(params.boardId);
    const column = findColumn(boardId, String(params.columnId));
    if (column === undefined) return HttpResponse.json({ message: "Coluna não encontrada" }, { status: 404 });
    if (store.cards.some((card) => card.columnId === column.columnId && card.archivedAt === undefined)) {
      return HttpResponse.json({ message: "Mova os cards antes de excluir esta coluna" }, { status: 409 });
    }
    store.columns = store.columns.filter((item) => item.columnId !== column.columnId);
    touch(boardId);
    return HttpResponse.json({ ok: true });
  }),

  http.post("/admin/boards/:boardId/labels", async ({ params, request }) => {
    const boardId = String(params.boardId);
    if (listView(boardId) === null) return HttpResponse.json({ message: "Board não encontrado" }, { status: 404 });
    const input = await bodyOf<{ name?: string; color?: BoardLabelColor }>(request);
    if (input.name === undefined || input.color === undefined) return jsonError("Informe nome e cor da label");
    const timestamp = iso();
    const label: BoardLabel = {
      boardId,
      labelId: id(),
      name: input.name.trim(),
      color: input.color,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    store.labels.push(label);
    touch(boardId);
    return HttpResponse.json({ label }, { status: 201 });
  }),

  http.put("/admin/boards/:boardId/labels/:labelId", async ({ params, request }) => {
    const boardId = String(params.boardId);
    const label = store.labels.find((item) => item.boardId === boardId && item.labelId === params.labelId);
    if (label === undefined) return HttpResponse.json({ message: "Label não encontrada" }, { status: 404 });
    const input = await bodyOf<{ name?: string; color?: BoardLabelColor }>(request);
    if (input.name !== undefined) label.name = input.name;
    if (input.color !== undefined) label.color = input.color;
    label.updatedAt = iso();
    touch(boardId);
    return HttpResponse.json({ label });
  }),

  http.delete("/admin/boards/:boardId/labels/:labelId", ({ params }) => {
    const boardId = String(params.boardId);
    const label = store.labels.find((item) => item.boardId === boardId && item.labelId === params.labelId);
    if (label === undefined) return HttpResponse.json({ message: "Label não encontrada" }, { status: 404 });
    store.labels = store.labels.filter((item) => item.labelId !== label.labelId);
    store.cards = store.cards.map((card) => ({
      ...card,
      labelIds: card.labelIds.filter((labelId) => labelId !== label.labelId),
    }));
    touch(boardId);
    return HttpResponse.json({ ok: true });
  }),

  http.post("/admin/boards/:boardId/templates", async ({ params, request }) => {
    const boardId = String(params.boardId);
    if (listView(boardId) === null) return HttpResponse.json({ message: "Board não encontrado" }, { status: 404 });
    const input = await bodyOf<{ name?: string; fields?: Omit<BoardTemplateField, "fieldId">[] }>(request);
    if (input.name === undefined || input.fields === undefined || input.fields.length === 0) return jsonError("Informe nome e campos do template");
    const fields = input.fields.map((field, position) => ({ ...field, fieldId: id(), position }));
    const timestamp = iso();
    const template: BoardTemplate = {
      boardId,
      templateId: id(),
      name: input.name.trim(),
      fields,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    store.templates.push(template);
    touch(boardId);
    return HttpResponse.json({ template }, { status: 201 });
  }),

  http.put("/admin/boards/:boardId/templates/:templateId", async ({ params, request }) => {
    const boardId = String(params.boardId);
    const template = store.templates.find((item) => item.boardId === boardId && item.templateId === params.templateId);
    if (template === undefined) return HttpResponse.json({ message: "Template não encontrado" }, { status: 404 });
    const input = await bodyOf<{ name?: string; fields?: Omit<BoardTemplateField, "fieldId">[] }>(request);
    if (input.name !== undefined) template.name = input.name;
    if (input.fields !== undefined) {
      template.fields = input.fields.map((field, position) => ({ ...field, fieldId: id(), position }));
    }
    template.updatedAt = iso();
    touch(boardId);
    return HttpResponse.json({ template });
  }),

  http.delete("/admin/boards/:boardId/templates/:templateId", ({ params }) => {
    const boardId = String(params.boardId);
    const template = store.templates.find((item) => item.boardId === boardId && item.templateId === params.templateId);
    if (template === undefined) return HttpResponse.json({ message: "Template não encontrado" }, { status: 404 });
    if (store.cards.some((card) => card.templateId === template.templateId && card.archivedAt === undefined)) {
      return HttpResponse.json({ message: "Template em uso por cards" }, { status: 409 });
    }
    store.templates = store.templates.filter((item) => item.templateId !== template.templateId);
    touch(boardId);
    return HttpResponse.json({ ok: true });
  }),

  http.post("/admin/boards/:boardId/files/presign", async ({ params, request }) => {
    const boardId = String(params.boardId);
    if (listView(boardId) === null) return HttpResponse.json({ message: "Board não encontrado" }, { status: 404 });
    const input = await bodyOf<{ fileName?: string; contentType?: string; size?: number }>(request);
    if (input.fileName === undefined || input.contentType === undefined || input.size === undefined) {
      return jsonError("Dados do arquivo inválidos");
    }
    if (input.size > 25 * 1024 * 1024) return jsonError("Arquivo maior que 25 MB");
    const key = `boards/${boardId}/${crypto.randomUUID()}-${input.fileName.replace(/[^a-zA-Z0-9._-]+/g, "-")}`;
    return HttpResponse.json({
      uploadUrl: `/mock-uploads/${encodeURIComponent(key)}`,
      file: { key, name: input.fileName, size: input.size, contentType: input.contentType },
    }, { status: 201 });
  }),

  http.post("/admin/boards/files/download-url", async ({ request }) => {
    const input = await bodyOf<{ key?: string }>(request);
    if (input.key === undefined || !input.key.startsWith("boards/")) return jsonError("Arquivo inválido");
    return HttpResponse.json({ url: `/mock-uploads/${encodeURIComponent(input.key)}` });
  }),

  http.put("/mock-uploads/*", () => new HttpResponse(null, { status: 200 })),

  http.get("/mock-uploads/*", () => new HttpResponse("mock file", { headers: { "Content-Type": "text/plain" } })),

  http.post("/admin/boards/:boardId/cards", async ({ params, request }) => {
    const boardId = String(params.boardId);
    const view = listView(boardId);
    if (view === null) return HttpResponse.json({ message: "Board não encontrado" }, { status: 404 });
    const input = await bodyOf<{
      columnId?: string;
      title?: string;
      description?: string;
      templateId?: string;
      fieldValues?: Record<string, BoardFieldValue>;
      labelIds?: string[];
      assigneeEmails?: string[];
    }>(request);
    if (input.columnId === undefined || input.title === undefined || input.title.trim().length === 0) {
      return jsonError("Informe coluna e título");
    }
    if (!view.columns.some((column) => column.columnId === input.columnId)) return jsonError("Coluna inválida");
    let assigneeEmails: string[] = [];
    try {
      labelAssign(boardId, input.labelIds ?? []);
      validateCardFields(input.templateId, input.fieldValues ?? {});
      assigneeEmails = validateAssignees(view, input.assigneeEmails ?? []);
    } catch (error) {
      return jsonError(error instanceof Error ? error.message : "Dados inválidos");
    }
    const timestamp = iso();
    const card: BoardCard = {
      boardId,
      cardId: id(),
      cardNumber: store.cards.filter((item) => item.boardId === boardId).reduce((max, item) => Math.max(max, item.cardNumber ?? 0), 0) + 1,
      columnId: input.columnId,
      position: view.cards.filter((item) => item.columnId === input.columnId).reduce((max, item) => Math.max(max, item.position), -1) + 1,
      title: input.title.trim(),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.templateId !== undefined ? { templateId: input.templateId } : {}),
      fieldValues: input.fieldValues ?? {},
      labelIds: input.labelIds ?? [],
      assigneeEmails,
      ...( { history: [cardHistory("created", "Card criado", normalizedEmail(request))] } ),
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: nowUser(),
      updatedBy: nowUser(),
    };
    store.cards.push(card);
    touch(boardId);
    return HttpResponse.json({ card }, { status: 201 });
  }),

  http.put("/admin/boards/:boardId/cards/:cardId/move", async ({ params, request }) => {
    const boardId = String(params.boardId);
    const card = findCard(boardId, String(params.cardId));
    if (card === undefined) return HttpResponse.json({ message: "Card não encontrado" }, { status: 404 });
    const input = await bodyOf<{ columnId?: string; position?: number }>(request);
    if (input.columnId === undefined || input.position === undefined) return jsonError("Informe coluna e posição");
    if (!store.columns.some((item) => item.boardId === boardId && item.columnId === input.columnId)) return jsonError("Coluna inválida");
    const previousColumn = store.columns.find((item) => item.boardId === boardId && item.columnId === card.columnId);
    const targetColumn = store.columns.find((item) => item.boardId === boardId && item.columnId === input.columnId);
    const target = store.cards
      .filter((item) => item.boardId === boardId && item.columnId === input.columnId && item.cardId !== card.cardId && item.archivedAt === undefined)
      .sort((a, b) => a.position - b.position);
    const index = Math.max(0, Math.min(input.position, target.length));
    target.splice(index, 0, card);
    target.forEach((item, position) => {
      item.columnId = input.columnId ?? item.columnId;
      item.position = position;
      item.updatedAt = iso();
    });
    if (card.columnId !== input.columnId || card.position !== index) {
      const description = card.columnId !== input.columnId
        ? `Card movido de “${previousColumn?.name ?? "coluna anterior"}” para “${targetColumn?.name ?? "nova coluna"}”`
        : `Card reordenado na coluna “${targetColumn?.name ?? "coluna"}”`;
      appendCardHistory(card, "moved", description, normalizedEmail(request));
    }
    touch(boardId);
    return HttpResponse.json({ card });
  }),

  http.put("/admin/boards/:boardId/cards/:cardId", async ({ params, request }) => {
    const boardId = String(params.boardId);
    const card = findCard(boardId, String(params.cardId));
    if (card === undefined) return HttpResponse.json({ message: "Card não encontrado" }, { status: 404 });
    const input = await bodyOf<{
      title?: string;
      description?: string | null;
      templateId?: string | null;
      fieldValues?: Record<string, BoardFieldValue>;
      labelIds?: string[];
      assigneeEmails?: string[];
    }>(request);
    const view = listView(boardId);
    if (view === null) return HttpResponse.json({ message: "Board não encontrado" }, { status: 404 });
    let assigneeEmails: string[] | undefined;
    try {
      if (input.labelIds !== undefined) labelAssign(boardId, input.labelIds);
      if (input.assigneeEmails !== undefined) assigneeEmails = validateAssignees(view, input.assigneeEmails);
      validateCardFields(input.templateId === null ? undefined : (input.templateId ?? card.templateId), input.fieldValues ?? card.fieldValues);
    } catch (error) {
      return jsonError(error instanceof Error ? error.message : "Dados inválidos");
    }
    const changes: string[] = [];
    if (input.title !== undefined && input.title !== card.title) changes.push(`Título alterado para “${input.title}”`);
    if (input.description !== undefined && (input.description ?? "") !== (card.description ?? "")) changes.push("Descrição atualizada");
    if (input.templateId !== undefined && (input.templateId ?? undefined) !== (card.templateId ?? undefined)) changes.push("Template alterado");
    if (input.labelIds !== undefined && [...input.labelIds].sort().join("|") !== [...card.labelIds].sort().join("|")) changes.push("Labels atualizadas");
    if (assigneeEmails !== undefined && [...assigneeEmails].sort().join("|") !== [...(card.assigneeEmails ?? [])].sort().join("|")) changes.push("Responsáveis atualizados");
    if (input.fieldValues !== undefined && JSON.stringify(input.fieldValues) !== JSON.stringify(card.fieldValues)) changes.push("Campos do template atualizados");
    if (input.title !== undefined) card.title = input.title;
    if (input.description !== undefined) card.description = input.description ?? "";
    if (input.templateId !== undefined) {
      if (input.templateId === null) delete card.templateId;
      else card.templateId = input.templateId;
    }
    if (input.fieldValues !== undefined) card.fieldValues = input.fieldValues;
    if (input.labelIds !== undefined) card.labelIds = input.labelIds;
    if (assigneeEmails !== undefined) card.assigneeEmails = assigneeEmails;
    if (changes.length > 0) appendCardHistory(card, "updated", changes.join("; "), normalizedEmail(request));
    card.updatedAt = iso();
    card.updatedBy = nowUser();
    touch(boardId);
    return HttpResponse.json({ card });
  }),

  http.delete("/admin/boards/:boardId/cards/:cardId", ({ params }) => {
    const boardId = String(params.boardId);
    const card = findCard(boardId, String(params.cardId));
    if (card === undefined) return HttpResponse.json({ message: "Card não encontrado" }, { status: 404 });
    card.archivedAt = iso();
    card.updatedAt = card.archivedAt;
    card.updatedBy = nowUser();
    appendCardHistory(card, "archived", "Card arquivado", normalizedEmail(request));
    touch(boardId);
    return HttpResponse.json({ card });
  }),
];
