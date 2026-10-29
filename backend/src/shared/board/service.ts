import { v4 as uuidv4 } from 'uuid';
import { ValidationError } from '../http/validators.js';
import { buildDefaultDashboard, evaluateDashboard } from './metrics/engine.js';
import { validateDashboardReferences } from './metrics/validation.js';
import type { BoardMetricsDashboard, BoardMetricsQuery, BoardMetricsResponse } from './metrics/types.js';
import { BoardConflictError, BoardForbiddenError, BoardNotFoundError } from './errors.js';
import type {
  BoardRepository,
  BoardCardRecord,
  BoardColumnRecord,
  BoardItemRecord,
  BoardLabelRecord,
  BoardTemplateRecord,
} from './repository.js';
import type {
  Board,
  BoardAccessRole,
  BoardCard,
  BoardCardHistoryEntry,
  BoardColumn,
  BoardFieldValue,
  BoardFile,
  BoardLabel,
  BoardMember,
  BoardTemplate,
  BoardTemplateField,
  BoardView,
} from './types.js';
import type {
  BoardCreateInput,
  BoardUpdateInput,
  CardCreateInput,
  CardMoveInput,
  CardUpdateInput,
  ColumnCreateInput,
  ColumnUpdateInput,
  LabelCreateInput,
  LabelUpdateInput,
  TemplateCreateInput,
  TemplateFieldInput,
  TemplateUpdateInput,
} from './validation.js';

const DEFAULT_COLUMNS = [
  { name: 'Novo', color: 'blue' },
  { name: 'Em contato', color: 'amber' },
  { name: 'Reunião', color: 'violet' },
  { name: 'Projeto', color: 'teal' },
  { name: 'Ganho', color: 'green' },
  { name: 'Perdido', color: 'rose' },
] as const;
const DEFAULT_TEMPLATE_NAME = 'Lead';
const DEFAULT_TEMPLATE_FIELDS: readonly Omit<BoardTemplateField, 'fieldId'>[] = [
  { label: 'Empresa', type: 'text', required: false, position: 0 },
  { label: 'Telefone', type: 'phone', required: false, position: 1 },
  { label: 'E-mail', type: 'email', required: false, position: 2 },
  { label: 'Cidade', type: 'text', required: false, position: 3 },
  { label: 'Projeto/Terreno', type: 'text', required: false, position: 4 },
  { label: 'Valor de captação', type: 'number', required: false, position: 5 },
  { label: 'Prazo', type: 'date', required: false, position: 6 },
  { label: 'Observações', type: 'longText', required: false, position: 7 },
  { label: 'Site', type: 'url', required: false, position: 8 },
  { label: 'Etapa', type: 'select', required: false, options: ['Novo', 'Em andamento', 'Concluído'], position: 9 },
  { label: 'Aceite', type: 'checkbox', required: false, position: 10 },
  { label: 'Documento principal', type: 'file', required: false, position: 11 },
  { label: 'Documentos complementares', type: 'files', required: false, position: 12 },
];

export interface BoardActor {
  readonly userId: string;
  readonly email: string;
}

type BoardRequirement = 'view' | 'write' | 'manage' | 'owner';

function now(): string {
  return new Date().toISOString();
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function columnKey(columnId: string): string {
  return `COLUMN#${columnId}`;
}

function labelKey(labelId: string): string {
  return `LABEL#${labelId}`;
}

function templateKey(templateId: string): string {
  return `TEMPLATE#${templateId}`;
}

function cardKey(cardId: string): string {
  return `CARD#${cardId}`;
}

function isColumn(item: BoardItemRecord): item is BoardColumnRecord {
  return item.itemKey.startsWith('COLUMN#');
}

function isLabel(item: BoardItemRecord): item is BoardLabelRecord {
  return item.itemKey.startsWith('LABEL#');
}

function isTemplate(item: BoardItemRecord): item is BoardTemplateRecord {
  return item.itemKey.startsWith('TEMPLATE#');
}

function isCard(item: BoardItemRecord): item is BoardCardRecord {
  return item.itemKey.startsWith('CARD#');
}

function sortByPosition<T extends { readonly position: number }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => a.position - b.position);
}

function fieldError(field: string, message: string): ValidationError {
  return new ValidationError([{ field, message }]);
}

function historyEntry(
  action: BoardCardHistoryEntry['action'],
  description: string,
  userId: string,
  userEmail: string,
  createdAt: string,
): BoardCardHistoryEntry {
  return {
    historyId: uuidv4(),
    action,
    description,
    userId,
    ...(userEmail.trim().length > 0 ? { userEmail: normalizeEmail(userEmail) } : {}),
    createdAt,
  };
}

function withoutItemKey<T extends { readonly itemKey: string }>(record: T): Omit<T, 'itemKey'> {
  const next: Record<string, unknown> = { ...record };
  delete next['itemKey'];
  return next as Omit<T, 'itemKey'>;
}

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
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

export class BoardService {
  constructor(private readonly repository: BoardRepository) {}

  async listBoards(actor?: BoardActor): Promise<readonly Board[]> {
    const boards = await this.repository.listBoards();
    return [...boards]
      .filter((board) => board.archivedAt === undefined)
      .filter((board) => actor === undefined || this.accessRole(board, actor) !== null)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getBoard(boardId: string, actor?: BoardActor): Promise<BoardView> {
    const board = await this.requireBoard(boardId);
    if (actor !== undefined && this.accessRole(board, actor) === null) {
      throw new BoardForbiddenError();
    }
    const items = await this.repository.listItems(boardId);
    const role = actor === undefined ? undefined : this.accessRole(board, actor) ?? undefined;
    return this.toView(board, items, role);
  }

  async getBoardMetrics(boardId: string, actor: BoardActor, query: BoardMetricsQuery): Promise<BoardMetricsResponse> {
    const board = await this.requireBoard(boardId);
    if (this.accessRole(board, actor) === null) throw new BoardForbiddenError();
    const items = await this.repository.listItems(boardId);
    const view = this.toView(board, items, this.accessRole(board, actor) ?? undefined);
    const dashboard = board.metricsDashboard ?? buildDefaultDashboard(board, view);
    return evaluateDashboard(dashboard, view, items, query);
  }

  async createBoard(
    input: BoardCreateInput,
    userIdOrActor: string | BoardActor,
    email = '',
  ): Promise<BoardView> {
    const actor: BoardActor = typeof userIdOrActor === 'string'
      ? { userId: userIdOrActor, email }
      : userIdOrActor;
    const timestamp = now();
    const boardId = uuidv4();
    const board: Board = {
      boardId,
      name: input.name,
      icon: input.icon ?? 'layout-grid',
      ...(input.description !== undefined && input.description.length > 0 ? { description: input.description } : {}),
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: actor.userId,
      ...(actor.email.trim().length > 0 ? { createdByEmail: normalizeEmail(actor.email) } : {}),
      members: [],
    };
    const columns: BoardColumnRecord[] = DEFAULT_COLUMNS.map((column, position) => ({
      boardId,
      columnId: uuidv4(),
      name: column.name,
      color: column.color,
      position,
      createdAt: timestamp,
      updatedAt: timestamp,
      itemKey: '',
    })).map((column) => ({ ...column, itemKey: columnKey(column.columnId) }));

    const templateId = uuidv4();
    const template: BoardTemplateRecord = {
      boardId,
      templateId,
      name: DEFAULT_TEMPLATE_NAME,
      fields: DEFAULT_TEMPLATE_FIELDS.map((field, index) => ({
        ...field,
        fieldId: uuidv4(),
        position: index,
      })),
      createdAt: timestamp,
      updatedAt: timestamp,
      itemKey: templateKey(templateId),
    };

    await this.repository.putBoard(board);
    await Promise.all([
      ...columns.map((column) => this.repository.putItem(column)),
      this.repository.putItem(template),
    ]);
    return this.toView(board, [...columns, template], 'owner');
  }

  async updateBoard(boardId: string, input: BoardUpdateInput): Promise<Board> {
    const board = await this.requireBoard(boardId);
    if (input.metricsDashboard !== undefined) {
      const items = await this.repository.listItems(boardId);
      validateDashboardReferences(input.metricsDashboard as unknown as BoardMetricsDashboard, this.toView(board, items));
      if (Buffer.byteLength(JSON.stringify(input.metricsDashboard), 'utf8') > 64 * 1024) {
        throw new ValidationError([{ field: 'metricsDashboard', message: 'Dashboard excede o limite de 64 KB' }]);
      }
    }
    const patch: Partial<Board> = {
      updatedAt: now(),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description ?? '' } : {}),
      ...(input.labelDisplayMode !== undefined ? { labelDisplayMode: input.labelDisplayMode } : {}),
      ...(input.metricsDashboard !== undefined ? { metricsDashboard: input.metricsDashboard as unknown as BoardMetricsDashboard } : {}),
    };
    const updated = await this.repository.updateBoard(boardId, patch);
    if (updated === null) throw new BoardNotFoundError('Board não encontrado');
    return updated;
  }

  async archiveBoard(boardId: string): Promise<Board> {
    await this.requireBoard(boardId);
    const updated = await this.repository.updateBoard(boardId, {
      archivedAt: now(),
      updatedAt: now(),
    });
    if (updated === null) throw new BoardNotFoundError('Board não encontrado');
    return updated;
  }

  async createColumn(boardId: string, input: ColumnCreateInput): Promise<BoardColumn> {
    await this.requireBoard(boardId);
    const items = await this.repository.listItems(boardId);
    const columns = items.filter(isColumn);
    const timestamp = now();
    const column: BoardColumnRecord = {
      boardId,
      columnId: uuidv4(),
      name: input.name,
      color: input.color ?? 'slate',
      position: columns.reduce((max, column) => Math.max(max, column.position), -1) + 1,
      createdAt: timestamp,
      updatedAt: timestamp,
      itemKey: '',
    };
    const record = { ...column, itemKey: columnKey(column.columnId) };
    await this.repository.putItem(record);
    await this.touchBoard(boardId, timestamp);
    return record;
  }

  async updateColumn(boardId: string, columnId: string, input: ColumnUpdateInput): Promise<BoardColumn> {
    await this.requireBoard(boardId);
    const items = await this.repository.listItems(boardId);
    const columns = sortByPosition(items.filter(isColumn));
    const current = columns.find((column) => column.columnId === columnId);
    if (current === undefined) throw new BoardNotFoundError('Coluna não encontrada');

    const timestamp = now();
    if (input.position !== undefined) {
      const next = columns.filter((column) => column.columnId !== columnId);
      const index = Math.max(0, Math.min(input.position, next.length));
      next.splice(index, 0, current);
      await Promise.all(next.map((column, position) => {
        const isCurrent = column.columnId === columnId;
        const nameChanged = isCurrent && input.name !== undefined && column.name !== input.name;
        const colorChanged = isCurrent && input.color !== undefined && column.color !== input.color;
        if (column.position === position && !nameChanged && !colorChanged) return Promise.resolve();
        return this.repository.updateItem(boardId, column.itemKey, {
          position,
          ...(isCurrent && input.name !== undefined ? { name: input.name } : {}),
          ...(isCurrent && input.color !== undefined ? { color: input.color } : {}),
          updatedAt: timestamp,
        });
      }));
    } else if (input.name !== undefined || input.color !== undefined) {
      await this.repository.updateItem(boardId, current.itemKey, {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.color !== undefined ? { color: input.color } : {}),
        updatedAt: timestamp,
      });
    }

    await this.touchBoard(boardId, timestamp);
    const records = await this.repository.listItems(boardId);
    const result = records.filter(isColumn).find((column) => column.columnId === columnId);
    if (result === undefined) throw new BoardNotFoundError('Coluna não encontrada');
    return result;
  }

  async deleteColumn(boardId: string, columnId: string): Promise<void> {
    await this.requireBoard(boardId);
    const items = await this.repository.listItems(boardId);
    const column = items.filter(isColumn).find((item) => item.columnId === columnId);
    if (column === undefined) throw new BoardNotFoundError('Coluna não encontrada');
    const cards = items.filter(isCard).filter((card) => card.columnId === columnId && card.archivedAt === undefined);
    if (cards.length > 0) throw new BoardConflictError('Mova os cards antes de excluir esta coluna');
    await this.repository.deleteItem(boardId, column.itemKey);
    await this.touchBoard(boardId, now());
  }

  async createLabel(boardId: string, input: LabelCreateInput): Promise<BoardLabel> {
    await this.requireBoard(boardId);
    const timestamp = now();
    const label: BoardLabelRecord = {
      boardId,
      labelId: uuidv4(),
      name: input.name,
      color: input.color,
      createdAt: timestamp,
      updatedAt: timestamp,
      itemKey: '',
    };
    const record = { ...label, itemKey: labelKey(label.labelId) };
    await this.repository.putItem(record);
    await this.touchBoard(boardId, timestamp);
    return record;
  }

  async updateLabel(boardId: string, labelId: string, input: LabelUpdateInput): Promise<BoardLabel> {
    await this.requireBoard(boardId);
    const items = await this.repository.listItems(boardId);
    const label = items.filter(isLabel).find((item) => item.labelId === labelId);
    if (label === undefined) throw new BoardNotFoundError('Label não encontrada');
    const timestamp = now();
    const updated = await this.repository.updateItem(boardId, label.itemKey, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.color !== undefined ? { color: input.color } : {}),
      updatedAt: timestamp,
    });
    if (updated === null) throw new BoardNotFoundError('Label não encontrada');
    await this.touchBoard(boardId, timestamp);
    return updated as BoardLabelRecord;
  }

  async deleteLabel(boardId: string, labelId: string): Promise<void> {
    await this.requireBoard(boardId);
    const items = await this.repository.listItems(boardId);
    const label = items.filter(isLabel).find((item) => item.labelId === labelId);
    if (label === undefined) throw new BoardNotFoundError('Label não encontrada');
    const timestamp = now();
    const cards = items.filter(isCard).filter((card) => card.labelIds.includes(labelId));
    await Promise.all(cards.map((card) => this.repository.updateItem(boardId, card.itemKey, {
      labelIds: card.labelIds.filter((id) => id !== labelId),
      updatedAt: timestamp,
    })));
    await this.repository.deleteItem(boardId, label.itemKey);
    await this.touchBoard(boardId, timestamp);
  }

  async createTemplate(boardId: string, input: TemplateCreateInput): Promise<BoardTemplate> {
    await this.requireBoard(boardId);
    const timestamp = now();
    const templateId = uuidv4();
    const fields = this.normalizeFields(input.fields);
    const template: BoardTemplateRecord = {
      boardId,
      templateId,
      name: input.name,
      fields,
      createdAt: timestamp,
      updatedAt: timestamp,
      itemKey: '',
    };
    const record = { ...template, itemKey: templateKey(templateId) };
    await this.repository.putItem(record);
    await this.touchBoard(boardId, timestamp);
    return record;
  }

  async updateTemplate(boardId: string, templateId: string, input: TemplateUpdateInput): Promise<BoardTemplate> {
    await this.requireBoard(boardId);
    const items = await this.repository.listItems(boardId);
    const template = items.filter(isTemplate).find((item) => item.templateId === templateId);
    if (template === undefined) throw new BoardNotFoundError('Template não encontrado');
    const timestamp = now();
    const updated = await this.repository.updateItem(boardId, template.itemKey, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.fields !== undefined ? { fields: this.normalizeFields(input.fields) } : {}),
      updatedAt: timestamp,
    });
    if (updated === null) throw new BoardNotFoundError('Template não encontrado');
    await this.touchBoard(boardId, timestamp);
    return updated as BoardTemplateRecord;
  }

  async deleteTemplate(boardId: string, templateId: string): Promise<void> {
    await this.requireBoard(boardId);
    const items = await this.repository.listItems(boardId);
    const template = items.filter(isTemplate).find((item) => item.templateId === templateId);
    if (template === undefined) throw new BoardNotFoundError('Template não encontrado');
    if (items.filter(isCard).some((card) => card.templateId === templateId && card.archivedAt === undefined)) {
      throw new BoardConflictError('Template em uso por cards; edite-o ou remova o template dos cards');
    }
    await this.repository.deleteItem(boardId, template.itemKey);
    await this.touchBoard(boardId, now());
  }

  async createCard(boardId: string, input: CardCreateInput, userId: string, userEmail = ''): Promise<BoardCard> {
    const board = await this.requireBoard(boardId);
    const items = await this.repository.listItems(boardId);
    const column = items.filter(isColumn).find((item) => item.columnId === input.columnId);
    if (column === undefined) throw fieldError('columnId', 'Coluna inválida');
    const template = input.templateId === undefined
      ? undefined
      : items.filter(isTemplate).find((item) => item.templateId === input.templateId);
    if (input.templateId !== undefined && template === undefined) {
      throw fieldError('templateId', 'Template inválido');
    }
    const labels = this.validateLabels(items, input.labelIds ?? []);
    const fieldValues = this.validateFieldValues(template, input.fieldValues ?? {});
    const assigneeEmails = this.validateAssignees(board, input.assigneeEmails ?? []);
    const timestamp = now();
    const cardNumber = await this.repository.nextCardSequence(boardId);
    const cards = items.filter(isCard).filter((card) => card.columnId === input.columnId && card.archivedAt === undefined);
    const card: BoardCardRecord = {
      boardId,
      cardId: uuidv4(),
      cardNumber,
      columnId: input.columnId,
      position: cards.reduce((max, card) => Math.max(max, card.position), -1) + 1,
      title: input.title,
      ...(input.description !== undefined && input.description.length > 0 ? { description: input.description } : {}),
      ...(template !== undefined ? { templateId: template.templateId } : {}),
      fieldValues,
      labelIds: labels.map((label) => label.labelId),
      assigneeEmails,
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: userId,
      updatedBy: userId,
      history: [historyEntry('created', 'Card criado', userId, userEmail, timestamp)],
      itemKey: '',
    };
    const record = { ...card, itemKey: cardKey(card.cardId) };
    await this.repository.putItem(record);
    await this.touchBoard(boardId, timestamp);
    return record;
  }

  async updateCard(boardId: string, cardId: string, input: CardUpdateInput, userId: string, userEmail = ''): Promise<BoardCard> {
    const board = await this.requireBoard(boardId);
    const items = await this.repository.listItems(boardId);
    const card = items.filter(isCard).find((item) => item.cardId === cardId);
    if (card === undefined || card.archivedAt !== undefined) throw new BoardNotFoundError('Card não encontrado');

    const nextTemplateId = input.templateId !== undefined
      ? (input.templateId === null ? undefined : input.templateId)
      : (card.templateId ?? undefined);
    const template = nextTemplateId === undefined
      ? undefined
      : items.filter(isTemplate).find((item) => item.templateId === nextTemplateId);
    if (nextTemplateId !== undefined && template === undefined) {
      throw fieldError('templateId', 'Template inválido');
    }
    const labels = this.validateLabels(items, input.labelIds ?? card.labelIds);
    const fieldValues = this.validateFieldValues(
      template,
      input.fieldValues ?? (nextTemplateId === (card.templateId ?? undefined) ? card.fieldValues : {}),
    );
    const assigneeEmails = input.assigneeEmails === undefined
      ? undefined
      : this.validateAssignees(board, input.assigneeEmails);
    const changes: string[] = [];
    if (input.title !== undefined && input.title !== card.title) {
      changes.push(`Título alterado para “${input.title}”`);
    }
    if (input.description !== undefined && (input.description ?? '') !== (card.description ?? '')) {
      changes.push('Descrição atualizada');
    }
    if ((nextTemplateId ?? null) !== (card.templateId ?? null)) {
      changes.push('Template alterado');
    }
    const nextLabelIds = labels.map((label) => label.labelId);
    if ([...nextLabelIds].sort().join('|') !== [...card.labelIds].sort().join('|')) {
      changes.push('Labels atualizadas');
    }
    if (assigneeEmails !== undefined) {
      const previous = [...(card.assigneeEmails ?? [])].sort().join('|');
      if ([...assigneeEmails].sort().join('|') !== previous) {
        changes.push('Responsáveis atualizados');
      }
    }
    if (JSON.stringify(fieldValues) !== JSON.stringify(card.fieldValues)) {
      changes.push('Campos do template atualizados');
    }
    const timestamp = now();
    const history = changes.length === 0
      ? card.history
      : this.appendCardHistory(card, historyEntry('updated', changes.join('; '), userId, userEmail, timestamp));
    const updated = await this.repository.updateItem(boardId, card.itemKey, {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description ?? '' } : {}),
      templateId: nextTemplateId ?? null,
      fieldValues,
      labelIds: nextLabelIds,
      ...(assigneeEmails !== undefined ? { assigneeEmails } : {}),
      ...(history !== undefined ? { history } : {}),
      updatedAt: timestamp,
      updatedBy: userId,
    });
    if (updated === null) throw new BoardNotFoundError('Card não encontrado');
    await this.touchBoard(boardId, timestamp);
    return updated as BoardCardRecord;
  }

  async moveCard(boardId: string, cardId: string, input: CardMoveInput, userId: string, userEmail = ''): Promise<BoardCard> {
    await this.requireBoard(boardId);
    const items = await this.repository.listItems(boardId);
    const card = items.filter(isCard).find((item) => item.cardId === cardId);
    if (card === undefined || card.archivedAt !== undefined) throw new BoardNotFoundError('Card não encontrado');
    const column = items.filter(isColumn).find((item) => item.columnId === input.columnId);
    if (column === undefined) throw fieldError('columnId', 'Coluna inválida');
    const previousColumn = items.filter(isColumn).find((item) => item.columnId === card.columnId);
    const timestamp = now();
    const target = sortByPosition(
      items.filter(isCard).filter((item) => item.columnId === input.columnId && item.cardId !== cardId && item.archivedAt === undefined),
    );
    const index = Math.max(0, Math.min(input.position, target.length));
    target.splice(index, 0, card);
    await Promise.all(target.map((item, position) => {
      if (item.position === position) return Promise.resolve();
      return this.repository.updateItem(boardId, item.itemKey, {
        position,
        updatedAt: timestamp,
        updatedBy: userId,
      });
    }));
    await this.touchBoard(boardId, timestamp);
    const changedColumn = card.columnId !== input.columnId;
    const changedPosition = card.position !== index;
    const description = changedColumn
      ? `Card movido de “${previousColumn?.name ?? 'coluna anterior'}” para “${column.name}”`
      : changedPosition
        ? `Card reordenado na coluna “${column.name}”`
        : '';
    const history = description.length === 0
      ? card.history
      : this.appendCardHistory(card, historyEntry('moved', description, userId, userEmail, timestamp));
    const updated = await this.repository.updateItem(boardId, card.itemKey, {
      columnId: input.columnId,
      position: index,
      ...(history !== undefined ? { history } : {}),
      updatedAt: timestamp,
      updatedBy: userId,
    });
    if (updated === null) throw new BoardNotFoundError('Card não encontrado');
    return updated as BoardCardRecord;
  }

  async archiveCard(boardId: string, cardId: string, userId: string, userEmail = ''): Promise<BoardCard> {
    await this.requireBoard(boardId);
    const items = await this.repository.listItems(boardId);
    const card = items.filter(isCard).find((item) => item.cardId === cardId);
    if (card === undefined || card.archivedAt !== undefined) throw new BoardNotFoundError('Card não encontrado');
    const timestamp = now();
    const updated = await this.repository.updateItem(boardId, card.itemKey, {
      archivedAt: timestamp,
      history: this.appendCardHistory(card, historyEntry('archived', 'Card arquivado', userId, userEmail, timestamp)),
      updatedAt: timestamp,
      updatedBy: userId,
    });
    if (updated === null) throw new BoardNotFoundError('Card não encontrado');
    await this.touchBoard(boardId, timestamp);
    return updated as BoardCardRecord;
  }

  async assertBoardAccess(
    boardId: string,
    actor: BoardActor,
    requirement: BoardRequirement,
  ): Promise<Board> {
    const board = await this.requireBoard(boardId);
    const role = this.accessRole(board, actor);
    const allowed = requirement === 'view'
      ? role !== null
      : requirement === 'write'
        ? role === 'owner' || role === 'admin' || role === 'write'
        : requirement === 'manage'
          ? role === 'owner' || role === 'admin'
          : role === 'owner';
    if (!allowed) throw new BoardForbiddenError();
    return board;
  }

  async addMember(boardId: string, member: BoardMember, actor: BoardActor): Promise<BoardMember> {
    const board = await this.assertBoardAccess(boardId, actor, 'manage');
    const email = normalizeEmail(member.email);
    const ownerEmail = board.createdByEmail === undefined ? '' : normalizeEmail(board.createdByEmail);
    if (email === ownerEmail) {
      throw new BoardConflictError('O criador do quadro já é administrador');
    }
    const current = (board.members ?? []).filter((item) => normalizeEmail(item.email) !== email);
    const next: BoardMember = { ...member, email };
    const updated = await this.repository.updateBoard(boardId, {
      members: [...current, next],
      updatedAt: now(),
    });
    if (updated === null) throw new BoardNotFoundError('Board não encontrado');
    return next;
  }

  async removeMember(boardId: string, email: string, actor: BoardActor): Promise<void> {
    const board = await this.assertBoardAccess(boardId, actor, 'manage');
    const normalized = normalizeEmail(email);
    const ownerEmail = board.createdByEmail === undefined ? '' : normalizeEmail(board.createdByEmail);
    if (normalized === ownerEmail) {
      throw new BoardConflictError('Não é possível remover o criador do quadro');
    }
    const current = board.members ?? [];
    if (!current.some((item) => normalizeEmail(item.email) === normalized)) {
      throw new BoardNotFoundError('Membro não encontrado');
    }
    const timestamp = now();
    await this.repository.updateBoard(boardId, {
      members: current.filter((item) => normalizeEmail(item.email) !== normalized),
      updatedAt: timestamp,
    });
    const items = await this.repository.listItems(boardId);
    await Promise.all(items.filter(isCard).map((card) => {
      const assignees = card.assigneeEmails ?? [];
      if (!assignees.some((item) => normalizeEmail(item) === normalized)) return Promise.resolve();
      const nextAssignees = assignees.filter((item) => normalizeEmail(item) !== normalized);
      return this.repository.updateItem(boardId, card.itemKey, {
        assigneeEmails: nextAssignees,
        history: this.appendCardHistory(card, historyEntry(
          'updated',
          `Responsável ${normalized} removido do quadro`,
          actor.userId,
          actor.email,
          timestamp,
        )),
        updatedAt: timestamp,
        updatedBy: actor.userId,
      });
    }));
  }

  private accessRole(board: Board, actor: BoardActor): BoardAccessRole | null {
    const email = normalizeEmail(actor.email);
    if (
      board.createdBy === actor.userId
      || (email.length > 0 && board.createdByEmail !== undefined && normalizeEmail(board.createdByEmail) === email)
    ) {
      return 'owner';
    }
    const member = (board.members ?? []).find((item) => normalizeEmail(item.email) === email);
    return member?.role ?? null;
  }

  private appendCardHistory(card: BoardCardRecord, entry: BoardCardHistoryEntry): BoardCardHistoryEntry[] {
    const current = card.history ?? [];
    const next = current.length > 0
      ? [...current, entry]
      : [historyEntry('created', 'Card criado', card.createdBy, '', card.createdAt), entry];
    return next.slice(-100);
  }

  private async requireBoard(boardId: string): Promise<Board> {
    const board = await this.repository.getBoard(boardId);
    if (board === null || board.archivedAt !== undefined) throw new BoardNotFoundError('Board não encontrado');
    return board;
  }

  private async touchBoard(boardId: string, timestamp: string): Promise<void> {
    await this.repository.updateBoard(boardId, { updatedAt: timestamp });
  }

  private normalizeFields(fields: readonly TemplateFieldInput[]): BoardTemplateField[] {
    const seen = new Set<string>();
    return fields.map((field, index) => {
      const fieldId = field.fieldId ?? uuidv4();
      if (seen.has(fieldId)) throw fieldError('fields', 'Campo duplicado no template');
      seen.add(fieldId);
      if (field.type === 'select' && (field.options === undefined || field.options.length === 0)) {
        throw fieldError(field.label, 'Informe as opções do campo de seleção');
      }
      return {
        fieldId,
        label: field.label,
        type: field.type,
        required: field.required ?? false,
        ...(field.type === 'select' ? { options: field.options ?? [] } : {}),
        position: index,
      };
    });
  }

  private validateAssignees(board: Board, emails: readonly string[]): string[] {
    const allowed = new Set<string>();
    if (board.createdByEmail !== undefined && board.createdByEmail.trim().length > 0) {
      allowed.add(normalizeEmail(board.createdByEmail));
    }
    for (const member of board.members ?? []) allowed.add(normalizeEmail(member.email));
    const unique = [...new Set(emails.map(normalizeEmail))];
    for (const email of unique) {
      if (!allowed.has(email)) throw fieldError('assigneeEmails', 'Participante inválido');
    }
    return unique;
  }

  private validateLabels(items: readonly BoardItemRecord[], labelIds: readonly string[]): BoardLabelRecord[] {
    const labels = items.filter(isLabel);
    const unique = [...new Set(labelIds)];
    return unique.map((labelId) => {
      const label = labels.find((item) => item.labelId === labelId);
      if (label === undefined) throw fieldError('labelIds', 'Label inválida');
      return label;
    });
  }

  private validateFieldValues(
    template: BoardTemplateRecord | undefined,
    values: Readonly<Record<string, BoardFieldValue>>,
  ): Record<string, BoardFieldValue> {
    if (template === undefined) {
      return {};
    }
    const fields = sortByPosition(template.fields);
    const result: Record<string, BoardFieldValue> = {};
    for (const field of fields) {
      const value = values[field.fieldId];
      const empty = value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
      if (empty) {
        if (field.required) throw fieldError(field.label, 'Campo obrigatório');
        continue;
      }
      if (field.type === 'file') {
        if (!isBoardFile(value)) throw fieldError(field.label, 'Arquivo inválido');
        result[field.fieldId] = value;
        continue;
      }
      if (field.type === 'files') {
        if (!Array.isArray(value) || !value.every(isBoardFile)) throw fieldError(field.label, 'Arquivos inválidos');
        result[field.fieldId] = value;
        continue;
      }
      if (field.type === 'number' && typeof value !== 'number') {
        throw fieldError(field.label, 'Informe um número válido');
      }
      if (field.type === 'checkbox' && typeof value !== 'boolean') {
        throw fieldError(field.label, 'Informe verdadeiro ou falso');
      }
      if (field.type === 'select' && (typeof value !== 'string' || !(field.options ?? []).includes(value))) {
        throw fieldError(field.label, 'Selecione uma opção válida');
      }
      if (field.type === 'date' && (typeof value !== 'string' || !isValidIsoDate(value))) {
        throw fieldError(field.label, 'Informe uma data válida');
      }
      if (field.type === 'email' && (typeof value !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))) {
        throw fieldError(field.label, 'Informe um e-mail válido');
      }
      if (field.type === 'url') {
        if (typeof value !== 'string') throw fieldError(field.label, 'Informe uma URL válida');
        try {
          const parsed = new URL(value);
          if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            throw new Error('Protocolo inválido');
          }
        } catch {
          throw fieldError(field.label, 'Informe uma URL válida');
        }
      }
      if (['text', 'longText', 'phone', 'email', 'url', 'date', 'select'].includes(field.type) && typeof value !== 'string') {
        throw fieldError(field.label, 'Informe um texto válido');
      }
      result[field.fieldId] = value;
    }
    return result;
  }

  private toView(
    board: Board,
    items: readonly BoardItemRecord[],
    accessRole?: BoardAccessRole,
  ): BoardView {
    const columns = sortByPosition(items.filter(isColumn)).map(withoutItemKey);
    const labels = [...items.filter(isLabel)].sort((a, b) => a.name.localeCompare(b.name)).map(withoutItemKey);
    const templates = [...items.filter(isTemplate)].sort((a, b) => a.name.localeCompare(b.name)).map(withoutItemKey);
    const cards = sortByPosition(
      items.filter(isCard).filter((card) => card.archivedAt === undefined),
    ).map(withoutItemKey);
    return { board, columns, labels, templates, cards, ...(accessRole !== undefined ? { accessRole } : {}) };
  }
}
