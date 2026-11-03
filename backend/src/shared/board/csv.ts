import type { BoardView, BoardCard } from './types.js';
import { csvCell } from '../core/csv.js';

function fieldText(value: unknown): string {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (Array.isArray(value)) return value.map((item) => (typeof item === 'object' && item !== null && 'name' in item ? String((item as { name: unknown }).name) : '')).filter(Boolean).join('; ');
  if (typeof value === 'object' && 'name' in value) return String((value as { name: unknown }).name);
  return String(value);
}

function cardLabels(board: BoardView, card: BoardCard): string {
  return card.labelIds
    .map((labelId) => board.labels.find((label) => label.labelId === labelId)?.name ?? '')
    .filter(Boolean)
    .join('; ');
}

function cardAssignees(card: BoardCard): string {
  return (card.assigneeEmails ?? []).join('; ');
}

export function leadsCsv(board: BoardView): string {
  const fields = [...new Set(board.templates.flatMap((template) => template.fields.map((field) => field.label)))];
  const header = ['Número', 'Título', 'Descrição', 'Etapa', 'Labels', 'Responsáveis', ...fields, 'Criado em', 'Atualizado em'];
  const columnOrder = new Map(board.columns.map((column) => [column.columnId, column.position]));
  const rows = board.cards
    .slice()
    .sort((a, b) => {
      const byColumn = (columnOrder.get(a.columnId) ?? 0) - (columnOrder.get(b.columnId) ?? 0);
      return byColumn === 0 ? a.position - b.position : byColumn;
    })
    .map((card) => {
      const template = board.templates.find((item) => item.templateId === card.templateId);
      const values = fields.map((label) => {
        const field = template?.fields.find((item) => item.label === label);
        return field === undefined ? '' : fieldText(card.fieldValues[field.fieldId]);
      });
      return [
        card.cardNumber,
        card.title,
        card.description,
        board.columns.find((column) => column.columnId === card.columnId)?.name ?? '',
        cardLabels(board, card),
        cardAssignees(card),
        ...values,
        card.createdAt,
        card.updatedAt,
      ].map((value) => csvCell(value)).join(',');
    });
  return [header.map((value) => csvCell(value)).join(','), ...rows].join('\r\n');
}

function normalizedColumnName(name: string): string {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

const WON_COLUMN_NAMES = new Set(['ganho', 'ganhos', 'ganhou', 'ganha', 'fechado', 'fechou', 'fechado ganho', 'won', 'closed won', 'convertido']);
const LOST_COLUMN_NAMES = new Set(['perdido', 'perdidos', 'perdeu', 'perdida', 'perdidas', 'fechado perdido', 'lost', 'closed lost', 'nao convertido']);

export function funnelCsv(board: BoardView): string {
  const rows: string[] = ['Grupo,Valor,Quantidade'];
  const add = (group: string, value: string, count: string | number): void => {
    rows.push([group, value, String(count)].map((value) => csvCell(value)).join(','));
  };
  for (const column of board.columns) {
    add('Etapa', column.name, board.cards.filter((card) => card.columnId === column.columnId).length);
  }
  for (const label of board.labels) {
    add('Origem/label', label.name, board.cards.filter((card) => card.labelIds.includes(label.labelId)).length);
  }
  for (const assignee of [...new Set(board.cards.flatMap((card) => card.assigneeEmails ?? []))]) {
    add('Responsável', assignee, board.cards.filter((card) => (card.assigneeEmails ?? []).includes(assignee)).length);
  }
  const wonColumn = board.columns.find((column) => WON_COLUMN_NAMES.has(normalizedColumnName(column.name)));
  const lostColumn = board.columns.find((column) => LOST_COLUMN_NAMES.has(normalizedColumnName(column.name)));
  if (wonColumn === undefined || lostColumn === undefined) {
    add('Conversão', 'Status', 'Não configurada');
  } else {
    const won = board.cards.filter((card) => card.columnId === wonColumn.columnId).length;
    const lost = board.cards.filter((card) => card.columnId === lostColumn.columnId).length;
    add('Conversão', 'Ganhos', won);
    add('Conversão', 'Perdidos', lost);
    add('Conversão', 'Taxa de ganho (%)', won + lost === 0 ? 0 : Math.round((won / (won + lost)) * 1000) / 10);
  }
  add('Total', 'Leads', board.cards.length);
  return rows.join('\r\n');
}
