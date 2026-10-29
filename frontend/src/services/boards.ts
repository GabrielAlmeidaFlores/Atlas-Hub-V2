import { api } from "./api";
import type {
  Board,
  BoardCard,
  BoardColumnColor,
  BoardMember,
  BoardMemberRole,
  BoardIcon,
  BoardColumn,
  BoardFieldValue,
  BoardLabel,
  BoardLabelColor,
  BoardLabelDisplayMode,
  BoardTemplate,
  BoardTemplateField,
  BoardView,
} from "@/types";
import type { BoardMetricsDashboard, BoardMetricsRequest, BoardMetricsResponse } from "@/features/admin/boards/metrics/types";

export interface BoardCreateInput {
  readonly name: string;
  readonly description?: string;
  readonly icon?: BoardIcon;
}

export interface BoardUpdateInput {
  readonly name?: string;
  readonly description?: string | null;
  readonly labelDisplayMode?: BoardLabelDisplayMode;
  readonly metricsDashboard?: BoardMetricsDashboard;
}

export interface BoardMemberCandidate {
  readonly id: string;
  readonly email: string;
  readonly nome: string;
  readonly perfil: "ANALISTA" | "ADMIN_MASTER";
}

export interface BoardMemberInput {
  readonly email: string;
  readonly role: BoardMemberRole;
}

export interface ColumnCreateInput {
  readonly name: string;
  readonly color?: BoardColumnColor;
}

export interface ColumnUpdateInput {
  readonly name?: string;
  readonly color?: BoardColumnColor;
  readonly position?: number;
}

export interface LabelInput {
  readonly name: string;
  readonly color: BoardLabelColor;
}

export interface TemplateFieldInput {
  readonly fieldId?: string;
  readonly label: string;
  readonly type: BoardTemplateField["type"];
  readonly required?: boolean;
  readonly options?: string[];
  readonly position?: number;
}

export interface TemplateInput {
  readonly name: string;
  readonly fields: readonly TemplateFieldInput[];
}

export interface CardInput {
  readonly columnId: string;
  readonly title: string;
  readonly description?: string;
  readonly templateId?: string;
  readonly fieldValues?: Readonly<Record<string, BoardFieldValue>>;
  readonly labelIds?: readonly string[];
  readonly assigneeEmails?: readonly string[];
}

export interface CardUpdateInput {
  readonly title?: string;
  readonly description?: string | null;
  readonly templateId?: string | null;
  readonly fieldValues?: Readonly<Record<string, BoardFieldValue>>;
  readonly labelIds?: readonly string[];
  readonly assigneeEmails?: readonly string[];
}

export interface CardMoveInput {
  readonly columnId: string;
  readonly position: number;
}

function boardPath(boardId: string, suffix = ""): string {
  return `/admin/boards/${boardId}${suffix}`;
}

export const boardsApi = {
  list: async (): Promise<readonly Board[]> => {
    const response = await api.get<{ boards: readonly Board[] }>("/admin/boards");
    return response.boards;
  },
  create: async (input: BoardCreateInput): Promise<BoardView> => {
    const response = await api.post<{ board: BoardView }>("/admin/boards", input);
    return response.board;
  },
  get: async (boardId: string): Promise<BoardView> => {
    const response = await api.get<{ board: BoardView }>(boardPath(boardId));
    return response.board;
  },
  update: async (boardId: string, input: BoardUpdateInput): Promise<Board> => {
    const response = await api.put<{ board: Board }>(boardPath(boardId), input);
    return response.board;
  },
  getMetrics: async (boardId: string, request: BoardMetricsRequest = {}): Promise<BoardMetricsResponse> => {
    const params = new URLSearchParams({ view: "metrics" });
    if (request.from !== undefined) params.set("from", request.from);
    if (request.to !== undefined) params.set("to", request.to);
    if (request.variableValues !== undefined && Object.keys(request.variableValues).length > 0) {
      params.set("variables", JSON.stringify(request.variableValues));
    }
    return api.get<BoardMetricsResponse>(`${boardPath(boardId)}?${params.toString()}`);
  },
  saveMetricsDashboard: async (boardId: string, dashboard: BoardMetricsDashboard): Promise<Board> => {
    const response = await api.put<{ board: Board }>(boardPath(boardId), { metricsDashboard: dashboard });
    return response.board;
  },
  archive: async (boardId: string): Promise<Board> => {
    const response = await api.delete<{ board: Board }>(boardPath(boardId));
    return response.board;
  },
  listMemberCandidates: async (boardId: string): Promise<readonly BoardMemberCandidate[]> => {
    const response = await api.get<{ users: readonly BoardMemberCandidate[] }>(boardPath(boardId, "/members/candidates"));
    return response.users;
  },
  addMember: async (boardId: string, input: BoardMemberInput): Promise<BoardMember> => {
    const response = await api.post<{ member: BoardMember }>(boardPath(boardId, "/members"), input);
    return response.member;
  },
  removeMember: async (boardId: string, email: string): Promise<void> => {
    await api.delete(boardPath(boardId, `/members/${encodeURIComponent(email)}`));
  },
  createColumn: async (boardId: string, input: ColumnCreateInput): Promise<BoardColumn> => {
    const response = await api.post<{ column: BoardColumn }>(boardPath(boardId, "/columns"), input);
    return response.column;
  },
  updateColumn: async (boardId: string, columnId: string, input: ColumnUpdateInput): Promise<BoardColumn> => {
    const response = await api.put<{ column: BoardColumn }>(boardPath(boardId, `/columns/${columnId}`), input);
    return response.column;
  },
  deleteColumn: async (boardId: string, columnId: string): Promise<void> => {
    await api.delete(boardPath(boardId, `/columns/${columnId}`));
  },
  createLabel: async (boardId: string, input: LabelInput): Promise<BoardLabel> => {
    const response = await api.post<{ label: BoardLabel }>(boardPath(boardId, "/labels"), input);
    return response.label;
  },
  updateLabel: async (boardId: string, labelId: string, input: LabelInput): Promise<BoardLabel> => {
    const response = await api.put<{ label: BoardLabel }>(boardPath(boardId, `/labels/${labelId}`), input);
    return response.label;
  },
  deleteLabel: async (boardId: string, labelId: string): Promise<void> => {
    await api.delete(boardPath(boardId, `/labels/${labelId}`));
  },
  createTemplate: async (boardId: string, input: TemplateInput): Promise<BoardTemplate> => {
    const response = await api.post<{ template: BoardTemplate }>(boardPath(boardId, "/templates"), input);
    return response.template;
  },
  updateTemplate: async (boardId: string, templateId: string, input: TemplateInput): Promise<BoardTemplate> => {
    const response = await api.put<{ template: BoardTemplate }>(boardPath(boardId, `/templates/${templateId}`), input);
    return response.template;
  },
  deleteTemplate: async (boardId: string, templateId: string): Promise<void> => {
    await api.delete(boardPath(boardId, `/templates/${templateId}`));
  },
  createCard: async (boardId: string, input: CardInput): Promise<BoardCard> => {
    const response = await api.post<{ card: BoardCard }>(boardPath(boardId, "/cards"), input);
    return response.card;
  },
  updateCard: async (boardId: string, cardId: string, input: CardUpdateInput): Promise<BoardCard> => {
    const response = await api.put<{ card: BoardCard }>(boardPath(boardId, `/cards/${cardId}`), input);
    return response.card;
  },
  moveCard: async (boardId: string, cardId: string, input: CardMoveInput): Promise<BoardCard> => {
    const response = await api.put<{ card: BoardCard }>(boardPath(boardId, `/cards/${cardId}/move`), input);
    return response.card;
  },
  archiveCard: async (boardId: string, cardId: string): Promise<BoardCard> => {
    const response = await api.delete<{ card: BoardCard }>(boardPath(boardId, `/cards/${cardId}`));
    return response.card;
  },
};
