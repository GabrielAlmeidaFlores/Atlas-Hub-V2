import type { AttributeValue, DynamoDBRecord } from 'aws-lambda';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import type { BoardNotificationEvent } from './types.js';

export interface CardStreamEvent {
  readonly eventId: string;
  readonly event: BoardNotificationEvent;
  readonly boardId: string;
  readonly cardId: string;
  readonly cardTitle: string;
  readonly cardDescription?: string;
  readonly columnId: string;
  readonly fromColumnId?: string;
  readonly changedFieldKeys?: readonly string[];
  readonly actorLabel?: string;
  readonly occurredAt?: string;
}

type Image = Record<string, AttributeValue>;

interface DecodedCard {
  readonly boardId: string;
  readonly cardId: string;
  readonly cardTitle: string;
  readonly cardDescription?: string;
  readonly columnId: string;
  readonly archivedAt?: string;
  readonly updatedAt?: string;
  readonly createdAt?: string;
  readonly actorLabel?: string;
  readonly image: Record<string, unknown>;
}

function decodeImage(image: Image | undefined): Record<string, unknown> | undefined {
  if (image === undefined) return undefined;
  return unmarshall(image as unknown as Parameters<typeof unmarshall>[0]) as Record<string, unknown>;
}

function imageString(image: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = image?.[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function stableValue(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'undefined';
  if (Array.isArray(value)) return `[${value.map(stableValue).join(',')}]`;
  return `{${Object.keys(value as Record<string, unknown>).sort().map((key) => `${key}:${stableValue((value as Record<string, unknown>)[key])}`).join(',')}}`;
}

function actorFromImage(image: Record<string, unknown>): string | undefined {
  const history = image['history'];
  if (!Array.isArray(history) || history.length === 0) return undefined;
  const last = history[history.length - 1];
  if (last === null || typeof last !== 'object') return undefined;
  const entry = last as Record<string, unknown>;
  const email = typeof entry['userEmail'] === 'string' ? entry['userEmail'] : undefined;
  const userId = typeof entry['userId'] === 'string' ? entry['userId'] : undefined;
  if (email === 'site@atlascomp.com.br') return 'Cadastro pelo site';
  return email ?? userId;
}

function cardFromImage(image: Record<string, unknown> | undefined): DecodedCard | undefined {
  if (image === undefined) return undefined;
  const itemKey = imageString(image, 'itemKey');
  if (itemKey === undefined || !itemKey.startsWith('CARD#')) return undefined;
  const boardId = imageString(image, 'boardId');
  const cardId = imageString(image, 'cardId');
  const cardTitle = imageString(image, 'title');
  const columnId = imageString(image, 'columnId');
  if (boardId === undefined || cardId === undefined || cardTitle === undefined || columnId === undefined) return undefined;
  const cardDescription = imageString(image, 'description');
  const archivedAt = imageString(image, 'archivedAt');
  const updatedAt = imageString(image, 'updatedAt');
  const createdAt = imageString(image, 'createdAt');
  const actorLabel = actorFromImage(image);
  return {
    boardId,
    cardId,
    cardTitle,
    columnId,
    ...(cardDescription !== undefined ? { cardDescription } : {}),
    ...(archivedAt !== undefined ? { archivedAt } : {}),
    ...(updatedAt !== undefined ? { updatedAt } : {}),
    ...(createdAt !== undefined ? { createdAt } : {}),
    ...(actorLabel !== undefined ? { actorLabel } : {}),
    image,
  };
}

function changedFieldKeys(previous: Record<string, unknown>, next: Record<string, unknown>): string[] {
  const keys: string[] = [];
  for (const key of ['title', 'description', 'templateId', 'labelIds', 'assigneeEmails']) {
    if (stableValue(previous[key]) !== stableValue(next[key])) keys.push(key);
  }
  const previousFields = previous['fieldValues'];
  const nextFields = next['fieldValues'];
  if (previousFields !== null && typeof previousFields === 'object' && !Array.isArray(previousFields)
    && nextFields !== null && typeof nextFields === 'object' && !Array.isArray(nextFields)) {
    const before = previousFields as Record<string, unknown>;
    const after = nextFields as Record<string, unknown>;
    for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
      if (stableValue(before[key]) !== stableValue(after[key])) keys.push(`field:${key}`);
    }
  }
  return keys;
}

function baseEvent(eventId: string, event: BoardNotificationEvent, card: DecodedCard): CardStreamEvent {
  return {
    eventId,
    event,
    boardId: card.boardId,
    cardId: card.cardId,
    cardTitle: card.cardTitle,
    ...(card.cardDescription !== undefined ? { cardDescription: card.cardDescription } : {}),
    columnId: card.columnId,
    ...(card.actorLabel !== undefined ? { actorLabel: card.actorLabel } : {}),
    ...(card.updatedAt !== undefined ? { occurredAt: card.updatedAt } : {}),
  };
}

export function extractCardStreamEvent(record: DynamoDBRecord): CardStreamEvent | null {
  if (typeof record.eventID !== 'string' || record.eventID.length === 0 || record.dynamodb === undefined) return null;
  const previous = cardFromImage(decodeImage(record.dynamodb.OldImage as Image | undefined));
  const next = cardFromImage(decodeImage(record.dynamodb.NewImage as Image | undefined));
  if (record.eventName === 'INSERT') {
    return next === undefined ? null : baseEvent(record.eventID, 'CARD_CREATED', next);
  }
  if (record.eventName === 'REMOVE') {
    if (previous === undefined) return null;
    return {
      ...baseEvent(record.eventID, 'CARD_REMOVED', previous),
      fromColumnId: previous.columnId,
    };
  }
  if (record.eventName !== 'MODIFY' || previous === undefined || next === undefined) return null;
  if (previous.archivedAt === undefined && next.archivedAt !== undefined) {
    return {
      ...baseEvent(record.eventID, 'CARD_ARCHIVED', next),
      fromColumnId: previous.columnId,
      ...(next.archivedAt !== undefined ? { occurredAt: next.archivedAt } : {}),
    };
  }
  if (previous.archivedAt !== undefined) return null;
  if (previous.columnId !== next.columnId) {
    return {
      ...baseEvent(record.eventID, 'CARD_MOVED_TO_COLUMN', next),
      fromColumnId: previous.columnId,
    };
  }
  const changed = changedFieldKeys(previous.image, next.image);
  if (changed.length === 0) return null;
  return {
    ...baseEvent(record.eventID, 'CARD_UPDATED', next),
    changedFieldKeys: changed,
  };
}
