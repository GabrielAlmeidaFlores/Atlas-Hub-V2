import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { DynamoDBRecord } from 'aws-lambda';
import { extractCardStreamEvent } from './notification-event.js';

function record(eventName: string, newImage: Record<string, unknown>, oldImage?: Record<string, unknown>): DynamoDBRecord {
  const image = (values: Record<string, unknown>): Record<string, { S: string }> => Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, { S: String(value) }]),
  );
  return {
    eventID: 'event-1',
    eventName,
    dynamodb: {
      Keys: {},
      NewImage: image(newImage),
      ...(oldImage !== undefined ? { OldImage: image(oldImage) } : {}),
      SequenceNumber: '1',
      SizeBytes: 1,
      StreamViewType: 'NEW_AND_OLD_IMAGES',
    },
  } as unknown as DynamoDBRecord;
}

const base = {
  itemKey: 'CARD#card-1',
  boardId: 'board-1',
  cardId: 'card-1',
  title: 'Lead',
  description: 'Descrição',
  columnId: 'column-1',
};

test('extracts a card created event', () => {
  const result = extractCardStreamEvent(record('INSERT', base));
  assert.deepEqual(result, {
    eventId: 'event-1',
    event: 'CARD_CREATED',
    boardId: 'board-1',
    cardId: 'card-1',
    cardTitle: 'Lead',
    cardDescription: 'Descrição',
    columnId: 'column-1',
  });
});

test('extracts a card moved event', () => {
  const result = extractCardStreamEvent(record('MODIFY', { ...base, columnId: 'column-2' }, base));
  assert.equal(result?.event, 'CARD_MOVED_TO_COLUMN');
  assert.equal(result?.columnId, 'column-2');
});

test('classifies update, archive and removal events', () => {
  const updated = extractCardStreamEvent(record('MODIFY', { ...base, title: 'Novo título' }, base));
  assert.equal(updated?.event, 'CARD_UPDATED');
  assert.deepEqual(updated?.changedFieldKeys, ['title']);

  const archived = extractCardStreamEvent(record('MODIFY', { ...base, archivedAt: '2026-01-01' }, base));
  assert.equal(archived?.event, 'CARD_ARCHIVED');
  assert.equal(archived?.fromColumnId, 'column-1');

  const softRemoved = extractCardStreamEvent(record('MODIFY', { ...base, removedAt: '2026-01-02' }, base));
  assert.equal(softRemoved?.event, 'CARD_REMOVED');
  assert.equal(softRemoved?.fromColumnId, 'column-1');

  const removed = extractCardStreamEvent(record('REMOVE', base, base));
  assert.equal(removed?.event, 'CARD_REMOVED');
  assert.equal(removed?.fromColumnId, 'column-1');
});

test('ignores reordering and non-card items', () => {
  assert.equal(extractCardStreamEvent(record('MODIFY', { ...base, position: '2' }, base)), null);
  assert.equal(extractCardStreamEvent(record('INSERT', { ...base, itemKey: 'COLUMN#column-1' })), null);
});

test('does not notify a change after the card was removed', () => {
  const result = extractCardStreamEvent(record('MODIFY', { ...base, removedAt: '2026-01-02', title: 'Alterado' }, { ...base, removedAt: '2026-01-02' }));
  assert.equal(result, null);
});

test('classifies removal of an archived card as removal, not archive', () => {
  const result = extractCardStreamEvent(record(
    'MODIFY',
    { ...base, archivedAt: '2026-01-01', removedAt: '2026-01-02' },
    { ...base, archivedAt: '2026-01-01' },
  ));
  assert.equal(result?.event, 'CARD_REMOVED');
});
