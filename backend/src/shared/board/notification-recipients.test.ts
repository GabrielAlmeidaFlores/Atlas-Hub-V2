import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Board, BoardNotificationRule } from './types.js';
import { notificationRecipients } from './notification-recipients.js';

const rule = (overrides: Partial<BoardNotificationRule>): BoardNotificationRule => ({
  id: 'rule-1',
  event: 'CARD_CREATED',
  recipientEmails: ['Owner@Example.com'],
  enabled: true,
  ...overrides,
});

const board = (rules: readonly BoardNotificationRule[]): Board => ({
  boardId: 'board-1',
  name: 'Leads',
  createdAt: '',
  updatedAt: '',
  createdBy: 'owner',
  createdByEmail: 'owner@example.com',
  members: [
    { email: 'member@example.com', name: 'Member', role: 'read', addedAt: '', addedBy: 'owner' },
  ],
  notificationRules: rules,
});

test('resolves current participants and deduplicates recipients', () => {
  assert.deepEqual(notificationRecipients(board([
    rule({ recipientEmails: ['owner@example.com', 'member@example.com'] }),
    rule({ id: 'rule-2', recipientEmails: ['OWNER@example.com', 'removed@example.com'] }),
  ]), 'CARD_CREATED', 'column-1'), ['owner@example.com', 'member@example.com']);
});

test('filters event, column and disabled rules', () => {
  assert.deepEqual(notificationRecipients(board([
    rule({ event: 'CARD_MOVED_TO_COLUMN', columnId: 'column-1' }),
    rule({ id: 'rule-2', event: 'CARD_MOVED_TO_COLUMN', columnId: 'column-2', recipientEmails: ['member@example.com'] }),
    rule({ id: 'rule-3', enabled: false }),
  ]), 'CARD_MOVED_TO_COLUMN', 'column-1'), ['owner@example.com']);
});
