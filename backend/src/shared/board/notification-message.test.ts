import assert from 'node:assert/strict';
import { test } from 'node:test';
import { boardNotificationMessageSchema, buildBoardNotificationMessage, notificationIdFor } from './notification-message.js';

test('builds a deterministic, minimal notification message', () => {
  const message = buildBoardNotificationMessage({
    eventId: 'event-1',
    event: 'CARD_CREATED',
    boardId: 'board-1',
    boardName: 'Leads',
    cardId: 'card-1',
    cardTitle: 'Lead',
    cardDescription: 'Descrição',
    columnId: 'column-1',
    columnName: 'Novo',
    recipientEmail: 'owner@example.com',
  });
  assert.equal(message.notificationId, notificationIdFor('event-1', 'owner@example.com'));
  assert.equal(boardNotificationMessageSchema.safeParse(message).success, true);
  assert.equal('actor' in message, false);
  assert.equal('occurredAt' in message, false);
});
