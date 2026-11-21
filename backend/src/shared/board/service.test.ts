import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BoardService } from './service.js';
import { BoardConflictError } from './errors.js';
import { ValidationError } from '../http/validators.js';
import { MemoryBoardRepository } from './testing/memory-repository.js';

function createService(): { service: BoardService; repository: MemoryBoardRepository } {
  const repository = new MemoryBoardRepository();
  return { service: new BoardService(repository), repository };
}

test('creates a board with default columns and lead template', async () => {
  const { service } = createService();
  const view = await service.createBoard({ name: 'Leads' }, 'admin-1');
  assert.equal(view.board.name, 'Leads');
  assert.deepEqual(view.columns.map((column) => column.name), ['Novo', 'Em contato', 'Reunião', 'Projeto', 'Ganho', 'Perdido']);
  assert.equal(view.templates.length, 1);
  assert.equal(view.templates[0]?.name, 'Lead');
  assert.equal(view.templates[0]?.fields.length, 13);
  assert.equal((await service.listBoards()).length, 1);
});

test('updates board name and label display mode', async () => {
  const { service } = createService();
  const view = await service.createBoard({ name: 'Antigo' }, 'admin-1');
  const updated = await service.updateBoard(view.board.boardId, {
    name: 'Novo nome',
    labelDisplayMode: 'expanded',
  });
  assert.equal(updated.name, 'Novo nome');
  assert.equal(updated.labelDisplayMode, 'expanded');
});

test('creates labels, cards, moves and updates them', async () => {
  const { service } = createService();
  const view = await service.createBoard({ name: 'Leads' }, 'admin-1');
  const boardId = view.board.boardId;
  const columnId = view.columns[0]?.columnId;
  const targetColumnId = view.columns[1]?.columnId;
  const template = view.templates[0];
  assert.ok(columnId !== undefined && targetColumnId !== undefined && template !== undefined);

  const label = await service.createLabel(boardId, { name: 'Quente', color: 'green' });
  const phoneField = template.fields.find((field) => field.label === 'Telefone');
  const emailField = template.fields.find((field) => field.label === 'E-mail');
  assert.ok(phoneField !== undefined && emailField !== undefined);

  const card = await service.createCard(boardId, {
    columnId,
    title: 'Marivaldo',
    templateId: template.templateId,
    fieldValues: {
      [phoneField.fieldId]: '11999999999',
      [emailField.fieldId]: 'marivaldo@example.com',
    },
    labelIds: [label.labelId],
  }, 'admin-1');

  assert.equal(card.title, 'Marivaldo');
  assert.deepEqual(card.labelIds, [label.labelId]);
  assert.equal(card.position, 0);

  const moved = await service.moveCard(boardId, card.cardId, { columnId: targetColumnId, position: 0 }, 'admin-1');
  assert.equal(moved.columnId, targetColumnId);
  assert.equal(moved.position, 0);

  const updated = await service.updateCard(boardId, card.cardId, { title: 'Marivaldo atualizado' }, 'admin-1');
  assert.equal(updated.title, 'Marivaldo atualizado');

  const after = await service.getBoard(boardId);
  assert.equal(after.cards.length, 1);
  assert.equal(after.cards[0]?.labelIds.length, 1);

  await service.deleteLabel(boardId, label.labelId);
  const afterLabel = await service.getBoard(boardId);
  assert.deepEqual(afterLabel.cards[0]?.labelIds, []);

  await service.archiveCard(boardId, card.cardId, 'admin-1');
  const afterArchive = await service.getBoard(boardId);
  assert.equal(afterArchive.cards.length, 0);
});

test('validates required template fields and label ownership', async () => {
  const { service } = createService();
  const first = await service.createBoard({ name: 'Leads' }, 'admin-1');
  const second = await service.createBoard({ name: 'Outro' }, 'admin-1');
  const template = first.templates[0];
  const column = first.columns[0];
  assert.ok(template !== undefined && column !== undefined);
  const requiredTemplate = await service.updateTemplate(first.board.boardId, template.templateId, {
    fields: template.fields.map((field, index) => ({
      fieldId: field.fieldId,
      label: field.label,
      type: field.type,
      required: index === 0,
      position: field.position,
      ...(field.options !== undefined ? { options: [...field.options] } : {}),
    })),
  });
  const requiredField = requiredTemplate.fields[0];
  assert.ok(requiredField !== undefined);

  await assert.rejects(
    () => service.createCard(first.board.boardId, {
      columnId: column.columnId,
      title: 'Sem campo',
      templateId: template.templateId,
      fieldValues: {},
    }, 'admin-1'),
    (error: unknown) => error instanceof ValidationError,
  );

  const foreignLabel = await service.createLabel(second.board.boardId, { name: 'Externa', color: 'blue' });
  await assert.rejects(
    () => service.createCard(first.board.boardId, {
      columnId: column.columnId,
      title: 'Label externa',
      labelIds: [foreignLabel.labelId],
    }, 'admin-1'),
    (error: unknown) => error instanceof ValidationError,
  );
});

test('protects columns and templates in use', async () => {
  const { service } = createService();
  const view = await service.createBoard({ name: 'Leads' }, 'admin-1');
  const column = view.columns[0];
  const template = view.templates[0];
  assert.ok(column !== undefined && template !== undefined);
  await service.createCard(view.board.boardId, {
    columnId: column.columnId,
    title: 'Card',
    templateId: template.templateId,
  }, 'admin-1');

  await assert.rejects(
    () => service.deleteColumn(view.board.boardId, column.columnId),
    (error: unknown) => error instanceof BoardConflictError,
  );
  await assert.rejects(
    () => service.deleteTemplate(view.board.boardId, template.templateId),
    (error: unknown) => error instanceof BoardConflictError,
  );
});

test('reorders columns and isolates boards', async () => {
  const { service } = createService();
  const first = await service.createBoard({ name: 'Primeiro' }, 'admin-1');
  const second = await service.createBoard({ name: 'Segundo' }, 'admin-1');
  const firstColumn = first.columns[0];
  assert.ok(firstColumn !== undefined);
  const moved = await service.updateColumn(first.board.boardId, firstColumn.columnId, { position: 2 });
  assert.equal(moved.position, 2);
  const after = await service.getBoard(first.board.boardId);
  assert.equal(after.columns[2]?.columnId, firstColumn.columnId);

  const foreignCard = await service.createCard(second.board.boardId, {
    columnId: second.columns[0]?.columnId ?? '',
    title: 'Outro board',
  }, 'admin-1');
  assert.notEqual(foreignCard.boardId, first.board.boardId);
  await assert.rejects(
    () => service.getBoard('board-inexistente'),
    (error: unknown) => error instanceof Error,
  );
});

test('creates custom templates and keeps board-scoped labels', async () => {
  const { service } = createService();
  const view = await service.createBoard({ name: 'Operação' }, 'admin-1');
  const green = await service.createLabel(view.board.boardId, { name: 'Verde', color: 'green' });
  const blue = await service.createLabel(view.board.boardId, { name: 'Azul', color: 'blue' });
  const template = await service.createTemplate(view.board.boardId, {
    name: 'Imóvel',
    fields: [
      { label: 'Endereço', type: 'text', required: true },
      { label: 'Tipo', type: 'select', required: false, options: ['Casa', 'Apartamento'] },
      { label: 'Visita', type: 'date', required: false },
    ],
  });
  assert.equal(template.fields.length, 3);
  assert.deepEqual(
    (await service.getBoard(view.board.boardId)).labels.map((label) => label.labelId).sort(),
    [green.labelId, blue.labelId].sort(),
  );
});

test('returns a default metrics dashboard for a board', async () => {
  const { service } = createService();
  const view = await service.createBoard({ name: 'Métricas' }, 'admin-1');
  const column = view.columns[0];
  assert.ok(column !== undefined);
  await service.createCard(view.board.boardId, { columnId: column.columnId, title: 'Lead' }, 'admin-1');
  const metrics = await service.getBoardMetrics(view.board.boardId, { userId: 'admin-1', email: '' }, {});
  assert.ok(metrics.dashboard.metricDefinitions.length > 0);
  assert.ok(metrics.panels.length > 0);
  assert.equal(metrics.metadata.totalCards, 1);
  assert.equal(metrics.board.accessRole, 'owner');
});


test('generates a default metrics dashboard and persists a custom dashboard', async () => {
  const { service } = createService();
  const view = await service.createBoard({ name: 'Métricas' }, 'admin-1');
  const metrics = await service.getBoardMetrics(view.board.boardId, { userId: 'admin-1', email: '' }, {});
  assert.ok(metrics.panels.length > 0);
  assert.equal(metrics.dashboard.documentType, 'boardMetricsDashboard');
  assert.equal(metrics.metadata.totalCards, 0);

  await service.updateBoard(view.board.boardId, {
    metricsDashboard: metrics.dashboard as unknown as Parameters<BoardService['updateBoard']>[1]['metricsDashboard'],
  });
  const saved = await service.getBoard(view.board.boardId);
  assert.equal(saved.board.metricsDashboard?.dashboardMetadata.dashboardName, 'Métricas');
});

test('updates notification rules with optimistic versioning', async () => {
  const { service } = createService();
  const actor = { userId: 'owner', email: 'owner@example.com' };
  const view = await service.createBoard({ name: 'Leads' }, actor);
  const rule = {
    id: '11111111-1111-4111-8111-111111111111',
    event: 'CARD_CREATED' as const,
    recipientEmails: ['owner@example.com'],
    enabled: true,
  };
  const updated = await service.updateBoard(view.board.boardId, {
    notificationRules: [rule],
    expectedNotificationRulesVersion: 0,
  });
  assert.equal(updated.notificationRulesVersion, 1);
  assert.equal(updated.notificationRules?.[0]?.recipientEmails[0], 'owner@example.com');

  const general = await service.updateBoard(view.board.boardId, { name: 'Leads atualizado' });
  assert.equal(general.notificationRulesVersion, 1);
  assert.equal(general.name, 'Leads atualizado');

  await assert.rejects(
    service.updateBoard(view.board.boardId, {
      notificationRules: [rule],
      expectedNotificationRulesVersion: 0,
    }),
    BoardConflictError,
  );
});

test('cleans notification rules when a column is deleted', async () => {
  const { service } = createService();
  const actor = { userId: 'owner', email: 'owner@example.com' };
  const view = await service.createBoard({ name: 'Leads' }, actor);
  const columnId = view.columns[0]?.columnId;
  assert.ok(columnId !== undefined);
  await service.updateBoard(view.board.boardId, {
    notificationRules: [{
      id: '22222222-2222-4222-8222-222222222222',
      event: 'CARD_MOVED_TO_COLUMN',
      columnId,
      recipientEmails: ['owner@example.com'],
      enabled: true,
    }],
    expectedNotificationRulesVersion: 0,
  });
  await service.deleteColumn(view.board.boardId, columnId);
  const after = await service.getBoard(view.board.boardId);
  assert.deepEqual(after.board.notificationRules, []);
  assert.equal(after.board.notificationRulesVersion, 2);
});

test('cleans notification recipients when a member is removed', async () => {
  const { service } = createService();
  const actor = { userId: 'owner', email: 'owner@example.com' };
  const view = await service.createBoard({ name: 'Leads' }, actor);
  await service.addMember(view.board.boardId, {
    email: 'member@example.com',
    name: 'Member',
    role: 'read',
    addedAt: new Date().toISOString(),
    addedBy: 'owner@example.com',
  }, actor);
  await service.updateBoard(view.board.boardId, {
    notificationRules: [{
      id: '33333333-3333-4333-8333-333333333333',
      event: 'CARD_CREATED',
      recipientEmails: ['member@example.com'],
      enabled: true,
    }],
    expectedNotificationRulesVersion: 0,
  });
  await service.removeMember(view.board.boardId, 'member@example.com', actor);
  const after = await service.getBoard(view.board.boardId);
  assert.deepEqual(after.board.notificationRules, []);
  assert.equal(after.board.notificationRulesVersion, 2);
});

test('accepts every notification event and removes a card from view while retaining the record', async () => {
  const { service, repository } = createService();
  const actor = { userId: 'owner', email: 'owner@example.com' };
  const view = await service.createBoard({ name: 'Leads' }, actor);
  const boardId = view.board.boardId;
  const columnId = view.columns[0]?.columnId;
  assert.ok(columnId !== undefined);
  const rules = [
    { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', event: 'CARD_CREATED' as const, recipientEmails: ['owner@example.com'], enabled: true },
    { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', event: 'CARD_UPDATED' as const, recipientEmails: ['owner@example.com'], enabled: true },
    { id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', event: 'CARD_ARCHIVED' as const, recipientEmails: ['owner@example.com'], enabled: true },
    { id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', event: 'CARD_REMOVED' as const, recipientEmails: ['owner@example.com'], enabled: true },
  ];
  await service.updateBoard(boardId, { notificationRules: rules, expectedNotificationRulesVersion: 0 });
  const card = await service.createCard(boardId, { columnId, title: 'Card removível' }, 'owner', 'owner@example.com');
  await service.deleteCardPermanent(boardId, card.cardId, 'owner', 'owner@example.com');
  const after = await service.getBoard(boardId);
  assert.equal(after.cards.some((item) => item.cardId === card.cardId), false);
  const stored = [...(repository.items.get(boardId)?.values() ?? [])].find((item) => 'cardId' in item && item.cardId === card.cardId);
  assert.ok(stored !== undefined && 'removedAt' in stored);
});

test('excludes removed cards from board metrics', async () => {
  const { service } = createService();
  const actor = { userId: 'owner', email: 'owner@example.com' };
  const view = await service.createBoard({ name: 'Leads' }, actor);
  const columnId = view.columns[0]?.columnId;
  assert.ok(columnId !== undefined);
  const card = await service.createCard(view.board.boardId, { columnId, title: 'Oculto' }, 'owner', 'owner@example.com');
  await service.deleteCardPermanent(view.board.boardId, card.cardId, 'owner', 'owner@example.com');
  const response = await service.getBoardMetrics(view.board.boardId, actor, {});
  assert.equal(response.metadata.totalCards, 0);
  assert.equal(response.board.cards.length, 0);
});
