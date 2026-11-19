import { createHash } from 'node:crypto';
import { z } from 'zod';
import { BOARD_NOTIFICATION_EVENTS } from './types.js';

export const boardNotificationMessageSchema = z.object({
  schemaVersion: z.literal(1),
  notificationId: z.string().min(1).max(256),
  event: z.enum(BOARD_NOTIFICATION_EVENTS),
  boardId: z.string().min(1),
  boardName: z.string().min(1),
  cardId: z.string().min(1),
  cardTitle: z.string().min(1).max(160),
  cardDescription: z.string().max(2000).optional(),
  columnId: z.string().min(1),
  columnName: z.string().min(1),
  fromColumnName: z.string().min(1).optional(),
  toColumnName: z.string().min(1).optional(),
  changedFields: z.array(z.string().min(1)).max(100).optional(),
  actorLabel: z.string().min(1).optional(),
  occurredAt: z.string().min(1).optional(),
  recipientEmail: z.string().email().max(254),
}).strict();

export type BoardNotificationMessage = z.infer<typeof boardNotificationMessageSchema>;

export function notificationIdFor(eventId: string, recipientEmail: string): string {
  return createHash('sha256').update(`${eventId}|${recipientEmail}`).digest('hex');
}

export function buildBoardNotificationMessage(params: {
  readonly eventId: string;
  readonly event: BoardNotificationMessage['event'];
  readonly boardId: string;
  readonly boardName: string;
  readonly cardId: string;
  readonly cardTitle: string;
  readonly cardDescription?: string;
  readonly columnId: string;
  readonly columnName: string;
  readonly fromColumnName?: string;
  readonly toColumnName?: string;
  readonly changedFields?: readonly string[];
  readonly actorLabel?: string;
  readonly occurredAt?: string;
  readonly recipientEmail: string;
}): BoardNotificationMessage {
  return {
    schemaVersion: 1,
    notificationId: notificationIdFor(params.eventId, params.recipientEmail),
    event: params.event,
    boardId: params.boardId,
    boardName: params.boardName,
    cardId: params.cardId,
    cardTitle: params.cardTitle,
    ...(params.cardDescription !== undefined ? { cardDescription: params.cardDescription } : {}),
    columnId: params.columnId,
    columnName: params.columnName,
    ...(params.fromColumnName !== undefined ? { fromColumnName: params.fromColumnName } : {}),
    ...(params.toColumnName !== undefined ? { toColumnName: params.toColumnName } : {}),
    ...(params.changedFields !== undefined ? { changedFields: [...params.changedFields] } : {}),
    ...(params.actorLabel !== undefined ? { actorLabel: params.actorLabel } : {}),
    ...(params.occurredAt !== undefined ? { occurredAt: params.occurredAt } : {}),
    recipientEmail: params.recipientEmail,
  };
}
