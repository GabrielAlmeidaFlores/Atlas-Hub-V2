import type { DynamoDBStreamEvent } from 'aws-lambda';
import { SQSClient, SendMessageBatchCommand } from '@aws-sdk/client-sqs';
import { BoardService } from '../shared/board/service.js';
import { DynamoBoardRepository } from '../shared/board/dynamo-repository.js';
import { BoardNotFoundError } from '../shared/board/errors.js';
import { extractCardStreamEvent } from '../shared/board/notification-event.js';
import { notificationRecipients } from '../shared/board/notification-recipients.js';
import { buildBoardNotificationMessage, type BoardNotificationMessage } from '../shared/board/notification-message.js';
import type { BoardView } from '../shared/board/types.js';
import { BOARD_NOTIFICATION_QUEUE_URL } from '../shared/core/env.js';
import { createLogger } from '../shared/core/logger.js';

const sqs = new SQSClient({ region: process.env['AWS_REGION'] ?? 'sa-east-1' });

async function loadBoard(service: BoardService, boardId: string): Promise<BoardView | null> {
  try {
    return await service.getBoard(boardId);
  } catch (err) {
    if (err instanceof BoardNotFoundError) return null;
    throw err;
  }
}

function changedFieldLabel(key: string, board: BoardView): string {
  if (key.startsWith('field:')) {
    const fieldId = key.slice('field:'.length);
    for (const template of board.templates) {
      const field = template.fields.find((item) => item.fieldId === fieldId);
      if (field !== undefined) return field.label;
    }
    return 'Campo personalizado';
  }
  const labels: Record<string, string> = {
    title: 'Título',
    description: 'Descrição',
    templateId: 'Template',
    labelIds: 'Labels',
    assigneeEmails: 'Responsáveis',
  };
  return labels[key] ?? key;
}

async function sendMessages(messages: readonly BoardNotificationMessage[]): Promise<void> {
  for (let offset = 0; offset < messages.length; offset += 10) {
    const chunk = messages.slice(offset, offset + 10);
    const result = await sqs.send(new SendMessageBatchCommand({
      QueueUrl: BOARD_NOTIFICATION_QUEUE_URL,
      Entries: chunk.map((message) => ({
        Id: message.notificationId,
        MessageBody: JSON.stringify(message),
        MessageGroupId: message.cardId,
        MessageDeduplicationId: message.notificationId,
      })),
    }));
    if ((result.Failed ?? []).length > 0) {
      throw new Error('Falha ao enfileirar notificações de quadro');
    }
  }
}

export const handler = async (event: DynamoDBStreamEvent): Promise<void> => {
  const log = createLogger('boardNotificationDispatcher');
  if (BOARD_NOTIFICATION_QUEUE_URL.length === 0) throw new Error('BOARD_NOTIFICATION_QUEUE_URL não configurada');
  const service = new BoardService(new DynamoBoardRepository());
  const boards = new Map<string, BoardView | null>();
  const messages: BoardNotificationMessage[] = [];
  for (const record of event.Records) {
    const cardEvent = extractCardStreamEvent(record);
    if (cardEvent === null) continue;
    let board = boards.get(cardEvent.boardId);
    if (board === undefined) {
      board = await loadBoard(service, cardEvent.boardId);
      boards.set(cardEvent.boardId, board);
    }
    if (board === null) {
      log.warn('Quadro não encontrado para notificação', { boardId: cardEvent.boardId, cardId: cardEvent.cardId });
      continue;
    }
    const column = board.columns.find((item) => item.columnId === cardEvent.columnId);
    if (column === undefined) {
      log.warn('Coluna não encontrada para notificação', { boardId: cardEvent.boardId, cardId: cardEvent.cardId });
      continue;
    }
    const previousColumn = cardEvent.fromColumnId === undefined
      ? undefined
      : board.columns.find((item) => item.columnId === cardEvent.fromColumnId);
    const changedFields = cardEvent.changedFieldKeys?.map((key) => changedFieldLabel(key, board));
    const recipients = notificationRecipients(board.board, cardEvent.event, cardEvent.columnId);
    for (const recipientEmail of recipients) {
      messages.push(buildBoardNotificationMessage({
        eventId: cardEvent.eventId,
        event: cardEvent.event,
        boardId: cardEvent.boardId,
        boardName: board.board.name,
        cardId: cardEvent.cardId,
        cardTitle: cardEvent.cardTitle,
        ...(cardEvent.cardDescription !== undefined ? { cardDescription: cardEvent.cardDescription } : {}),
        columnId: cardEvent.columnId,
        columnName: column.name,
        ...(previousColumn !== undefined ? { fromColumnName: previousColumn.name } : {}),
        ...(cardEvent.event === 'CARD_MOVED_TO_COLUMN' ? { toColumnName: column.name } : {}),
        ...(changedFields !== undefined && changedFields.length > 0 ? { changedFields } : {}),
        ...(cardEvent.actorLabel !== undefined ? { actorLabel: cardEvent.actorLabel } : {}),
        ...(cardEvent.occurredAt !== undefined ? { occurredAt: cardEvent.occurredAt } : {}),
        recipientEmail,
      }));
    }
  }
  if (messages.length === 0) return;
  await sendMessages(messages);
  log.info('Notificações enfileiradas', { count: messages.length });
};
