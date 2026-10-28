import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { APIGatewayProxyEvent } from 'aws-lambda';
import { createAdminBoardsHandler } from './admin-boards.js';
import { BoardService } from '../shared/board/service.js';
import { MemoryBoardRepository } from '../shared/board/testing/memory-repository.js';

interface EventOptions {
  readonly body?: unknown;
  readonly params?: Record<string, string>;
  readonly groups?: readonly string[];
  readonly sub?: string | null;
  readonly email?: string;
  readonly query?: Record<string, string>;
}

const ADMINS = [
  { id: 'admin-1', nome: 'Admin Um', email: 'admin1@atlashub.com', perfil: 'ADMIN_MASTER', ativo: true, criadoPor: 'seed', criadoEm: '2026-01-01T00:00:00.000Z' },
  { id: 'admin-2', nome: 'Admin Dois', email: 'admin2@atlashub.com', perfil: 'ADMIN_MASTER', ativo: true, criadoPor: 'seed', criadoEm: '2026-01-01T00:00:00.000Z' },
  { id: 'admin-3', nome: 'Admin Três', email: 'admin3@atlashub.com', perfil: 'ANALISTA', ativo: true, criadoPor: 'seed', criadoEm: '2026-01-01T00:00:00.000Z' },
] as const;

function makeEvent(method: string, resource: string, options: EventOptions = {}): APIGatewayProxyEvent {
  const claims: Record<string, string> = {};
  const sub = options.sub ?? 'admin-1';
  if (options.sub !== null) claims['sub'] = sub;
  claims['email'] = options.email ?? `${sub}@atlashub.com`;
  claims['cognito:groups'] = (options.groups ?? ['ADMIN_MASTER']).join(',');
  return {
    httpMethod: method,
    resource,
    path: resource,
    headers: {},
    multiValueHeaders: {},
    queryStringParameters: options.query ?? null,
    multiValueQueryStringParameters: null,
    pathParameters: options.params ?? null,
    stageVariables: null,
    body: options.body === undefined ? null : JSON.stringify(options.body),
    isBase64Encoded: false,
    requestContext: {
      authorizer: { claims },
    } as unknown as APIGatewayProxyEvent['requestContext'],
  } as APIGatewayProxyEvent;
}

function makeHandler(): ReturnType<typeof createAdminBoardsHandler> {
  return createAdminBoardsHandler(
    new BoardService(new MemoryBoardRepository()),
    async () => [...ADMINS],
  );
}

function bodyOf(result: Awaited<ReturnType<ReturnType<typeof createAdminBoardsHandler>>>): Record<string, unknown> {
  return JSON.parse(result.body) as Record<string, unknown>;
}

test('creates, lists and reads boards through the handler', async () => {
  const handler = makeHandler();
  const created = await handler(makeEvent('POST', '/admin/boards', { body: { name: 'Leads' } }));
  assert.equal(created.statusCode, 201);
  const createdBody = bodyOf(created) as { board: { board: { boardId: string }; columns: unknown[] } };
  assert.equal(createdBody.board.board.boardId.length > 0, true);
  assert.equal(createdBody.board.columns.length, 6);

  const list = await handler(makeEvent('GET', '/admin/boards'));
  assert.equal(list.statusCode, 200);
  const listBody = bodyOf(list) as { boards: unknown[] };
  assert.equal(listBody.boards.length, 1);

  const detail = await handler(makeEvent('GET', '/admin/boards/{boardId}', {
    params: { boardId: createdBody.board.board.boardId },
  }));
  assert.equal(detail.statusCode, 200);
});

test('creates a card and moves it through the handler', async () => {
  const handler = makeHandler();
  const created = await handler(makeEvent('POST', '/admin/boards', { body: { name: 'Leads' } }));
  const board = bodyOf(created) as {
    board: {
      board: { boardId: string };
      columns: { columnId: string }[];
      templates: { templateId: string }[];
    };
  };
  const boardId = board.board.board.boardId;
  const columnId = board.board.columns[0]?.columnId;
  const targetColumnId = board.board.columns[1]?.columnId;
  assert.ok(columnId !== undefined && targetColumnId !== undefined);

  const cardResult = await handler(makeEvent('POST', '/admin/boards/{boardId}/cards', {
    params: { boardId },
    body: { columnId, title: 'Lead' },
  }));
  assert.equal(cardResult.statusCode, 201);
  const cardBody = bodyOf(cardResult) as { card: { cardId: string } };

  const move = await handler(makeEvent('PUT', '/admin/boards/{boardId}/cards/{cardId}/move', {
    params: { boardId, cardId: cardBody.card.cardId },
    body: { columnId: targetColumnId, position: 0 },
  }));
  assert.equal(move.statusCode, 200);
  const moved = bodyOf(move) as { card: { columnId: string } };
  assert.equal(moved.card.columnId, targetColumnId);
});

test('enforces admin authentication and validation', async () => {
  const handler = makeHandler();
  const unauthenticated = await handler(makeEvent('GET', '/admin/boards', { sub: null }));
  assert.equal(unauthenticated.statusCode, 401);

  const forbidden = await handler(makeEvent('GET', '/admin/boards', { groups: ['INCORPORADORA'] }));
  assert.equal(forbidden.statusCode, 403);

  const invalid = await handler(makeEvent('POST', '/admin/boards', { body: { name: '' } }));
  assert.equal(invalid.statusCode, 400);

  const missing = await handler(makeEvent('GET', '/admin/boards/{boardId}', {
    params: { boardId: '00000000-0000-4000-8000-000000000000' },
  }));
  assert.equal(missing.statusCode, 404);
});


test('restricts boards to the creator and explicitly added members', async () => {
  const handler = makeHandler();
  const created = await handler(makeEvent('POST', '/admin/boards', { body: { name: 'Privado' }, email: 'admin1@atlashub.com' }));
  const board = bodyOf(created) as {
    board: { board: { boardId: string }; columns: { columnId: string }[] };
  };
  const boardId = board.board.board.boardId;
  const columnId = board.board.columns[0]?.columnId;
  assert.ok(columnId !== undefined);

  const outsiderList = await handler(makeEvent('GET', '/admin/boards', { sub: 'admin-2', email: 'admin2@atlashub.com' }));
  assert.deepEqual((bodyOf(outsiderList) as { boards: unknown[] }).boards, []);
  const outsiderDetail = await handler(makeEvent('GET', '/admin/boards/{boardId}', {
    sub: 'admin-2',
    email: 'admin2@atlashub.com',
    params: { boardId },
  }));
  assert.equal(outsiderDetail.statusCode, 403);

  const addedRead = await handler(makeEvent('POST', '/admin/boards/{boardId}/members', {
    params: { boardId },
    email: 'admin1@atlashub.com',
    body: { email: 'admin2@atlashub.com', role: 'read' },
  }));
  assert.equal(addedRead.statusCode, 201);

  const readerList = await handler(makeEvent('GET', '/admin/boards', { sub: 'admin-2', email: 'admin2@atlashub.com' }));
  assert.equal((bodyOf(readerList) as { boards: unknown[] }).boards.length, 1);
  const readerDetail = await handler(makeEvent('GET', '/admin/boards/{boardId}', {
    sub: 'admin-2',
    email: 'admin2@atlashub.com',
    params: { boardId },
  }));
  assert.equal(readerDetail.statusCode, 200);
  assert.equal((bodyOf(readerDetail) as { board: { accessRole: string } }).board.accessRole, 'read');

  const readerCard = await handler(makeEvent('POST', '/admin/boards/{boardId}/cards', {
    sub: 'admin-2',
    email: 'admin2@atlashub.com',
    params: { boardId },
    body: { columnId, title: 'Não pode' },
  }));
  assert.equal(readerCard.statusCode, 403);

  const addedWrite = await handler(makeEvent('POST', '/admin/boards/{boardId}/members', {
    params: { boardId },
    email: 'admin1@atlashub.com',
    body: { email: 'admin3@atlashub.com', role: 'write' },
  }));
  assert.equal(addedWrite.statusCode, 201);

  const writerCard = await handler(makeEvent('POST', '/admin/boards/{boardId}/cards', {
    sub: 'admin-3',
    email: 'admin3@atlashub.com',
    params: { boardId },
    body: { columnId, title: 'Pode escrever' },
  }));
  assert.equal(writerCard.statusCode, 201);

  const writerColumn = await handler(makeEvent('POST', '/admin/boards/{boardId}/columns', {
    sub: 'admin-3',
    email: 'admin3@atlashub.com',
    params: { boardId },
    body: { name: 'Nova coluna' },
  }));
  assert.equal(writerColumn.statusCode, 403);

  const ownerList = await handler(makeEvent('GET', '/admin/boards', { email: 'admin1@atlashub.com' }));
  assert.equal((bodyOf(ownerList) as { boards: unknown[] }).boards.length, 1);
});

test('only admin master can create boards and manage members', async () => {
  const handler = makeHandler();
  const forbiddenCreate = await handler(makeEvent('POST', '/admin/boards', {
    sub: 'admin-3',
    email: 'admin3@atlashub.com',
    groups: ['ANALISTA'],
    body: { name: 'Bloqueado' },
  }));
  assert.equal(forbiddenCreate.statusCode, 403);

  const created = await handler(makeEvent('POST', '/admin/boards', { body: { name: 'Compartilhado' }, email: 'admin1@atlashub.com' }));
  const boardId = (bodyOf(created) as { board: { board: { boardId: string } } }).board.board.boardId;
  const ownerAdd = await handler(makeEvent('POST', '/admin/boards/{boardId}/members', {
    params: { boardId },
    email: 'admin1@atlashub.com',
    body: { email: 'admin2@atlashub.com', role: 'admin' },
  }));
  assert.equal(ownerAdd.statusCode, 201);

  const memberAdd = await handler(makeEvent('POST', '/admin/boards/{boardId}/members', {
    params: { boardId },
    sub: 'admin-2',
    email: 'admin2@atlashub.com',
    body: { email: 'admin3@atlashub.com', role: 'read' },
  }));
  assert.equal(memberAdd.statusCode, 201);

  const removeMember = await handler(makeEvent('DELETE', '/admin/boards/{boardId}/members/{email}', {
    params: { boardId, email: 'admin3@atlashub.com' },
    sub: 'admin-2',
    email: 'admin2@atlashub.com',
  }));
  assert.equal(removeMember.statusCode, 200);
});


test('assigns cards to none, one or multiple board participants', async () => {
  const handler = makeHandler();
  const created = await handler(makeEvent('POST', '/admin/boards', { body: { name: 'Atribuições' }, email: 'admin1@atlashub.com' }));
  const board = bodyOf(created) as {
    board: { board: { boardId: string }; columns: { columnId: string }[] };
  };
  const boardId = board.board.board.boardId;
  const columnId = board.board.columns[0]?.columnId;
  assert.ok(columnId !== undefined);

  await handler(makeEvent('POST', '/admin/boards/{boardId}/members', {
    params: { boardId },
    email: 'admin1@atlashub.com',
    body: { email: 'admin3@atlashub.com', role: 'write' },
  }));

  const assigned = await handler(makeEvent('POST', '/admin/boards/{boardId}/cards', {
    params: { boardId },
    email: 'admin1@atlashub.com',
    body: {
      columnId,
      title: 'Com responsáveis',
      assigneeEmails: ['admin1@atlashub.com', 'ADMIN3@atlashub.com'],
    },
  }));
  assert.equal(assigned.statusCode, 201);
  const card = bodyOf(assigned) as { card: { cardId: string; assigneeEmails: string[] } };
  assert.deepEqual(card.card.assigneeEmails, ['admin1@atlashub.com', 'admin3@atlashub.com']);

  const invalid = await handler(makeEvent('PUT', '/admin/boards/{boardId}/cards/{cardId}', {
    params: { boardId, cardId: card.card.cardId },
    email: 'admin1@atlashub.com',
    body: { assigneeEmails: ['admin2@atlashub.com'] },
  }));
  assert.equal(invalid.statusCode, 400);

  const cleared = await handler(makeEvent('PUT', '/admin/boards/{boardId}/cards/{cardId}', {
    params: { boardId, cardId: card.card.cardId },
    email: 'admin1@atlashub.com',
    body: { assigneeEmails: [] },
  }));
  assert.equal(cleared.statusCode, 200);
  assert.deepEqual((bodyOf(cleared) as { card: { assigneeEmails: string[] } }).card.assigneeEmails, []);
});


test('records a history entry for every card change', async () => {
  const handler = makeHandler();
  const created = await handler(makeEvent('POST', '/admin/boards', { body: { name: 'Histórico' }, email: 'admin1@atlashub.com' }));
  const board = bodyOf(created) as {
    board: { board: { boardId: string }; columns: { columnId: string }[] };
  };
  const boardId = board.board.board.boardId;
  const columnId = board.board.columns[0]?.columnId;
  const targetColumnId = board.board.columns[1]?.columnId;
  assert.ok(columnId !== undefined && targetColumnId !== undefined);

  const cardResult = await handler(makeEvent('POST', '/admin/boards/{boardId}/cards', {
    params: { boardId },
    email: 'admin1@atlashub.com',
    body: { columnId, title: 'Histórico inicial' },
  }));
  const card = bodyOf(cardResult) as { card: { cardId: string; history: { action: string }[] } };
  assert.equal(card.card.history.length, 1);
  assert.equal(card.card.history[0]?.action, 'created');

  const updated = await handler(makeEvent('PUT', '/admin/boards/{boardId}/cards/{cardId}', {
    params: { boardId, cardId: card.card.cardId },
    email: 'admin1@atlashub.com',
    body: { title: 'Título alterado' },
  }));
  const updatedCard = bodyOf(updated) as { card: { history: { action: string; description: string }[] } };
  assert.equal(updatedCard.card.history.length, 2);
  assert.match(updatedCard.card.history[1]?.description ?? '', /Título alterado/);

  const moved = await handler(makeEvent('PUT', '/admin/boards/{boardId}/cards/{cardId}/move', {
    params: { boardId, cardId: card.card.cardId },
    email: 'admin1@atlashub.com',
    body: { columnId: targetColumnId, position: 0 },
  }));
  const movedCard = bodyOf(moved) as { card: { history: { action: string }[] } };
  assert.equal(movedCard.card.history.length, 3);
  assert.equal(movedCard.card.history[2]?.action, 'moved');

  const archived = await handler(makeEvent('DELETE', '/admin/boards/{boardId}/cards/{cardId}', {
    params: { boardId, cardId: card.card.cardId },
    email: 'admin1@atlashub.com',
  }));
  const archivedCard = bodyOf(archived) as { card: { history: { action: string }[] } };
  assert.equal(archivedCard.card.history.length, 4);
  assert.equal(archivedCard.card.history[3]?.action, 'archived');
});


test('assigns sequential numbers to cards within a board', async () => {
  const handler = makeHandler();
  const created = await handler(makeEvent('POST', '/admin/boards', { body: { name: 'Numeração' }, email: 'admin1@atlashub.com' }));
  const board = bodyOf(created) as {
    board: { board: { boardId: string }; columns: { columnId: string }[] };
  };
  const boardId = board.board.board.boardId;
  const columnId = board.board.columns[0]?.columnId;
  assert.ok(columnId !== undefined);

  const first = await handler(makeEvent('POST', '/admin/boards/{boardId}/cards', {
    params: { boardId },
    email: 'admin1@atlashub.com',
    body: { columnId, title: 'Primeiro' },
  }));
  const second = await handler(makeEvent('POST', '/admin/boards/{boardId}/cards', {
    params: { boardId },
    email: 'admin1@atlashub.com',
    body: { columnId, title: 'Segundo' },
  }));

  assert.equal((bodyOf(first) as { card: { cardNumber: number } }).card.cardNumber, 1);
  assert.equal((bodyOf(second) as { card: { cardNumber: number } }).card.cardNumber, 2);
});


test('resolves board paths through the API Gateway proxy route', async () => {
  const handler = makeHandler();
  const created = await handler(makeEvent('POST', '/admin/boards', { body: { name: 'Proxy' }, email: 'admin1@atlashub.com' }));
  const boardId = (bodyOf(created) as { board: { board: { boardId: string } } }).board.board.boardId;
  const event = makeEvent('GET', '/admin/boards/{proxy+}', {
    params: { proxy: boardId },
    email: 'admin1@atlashub.com',
  });
  event.path = `/admin/boards/${boardId}`;
  const detail = await handler(event);
  assert.equal(detail.statusCode, 200);
});


test('returns board metrics through the existing board route', async () => {
  const handler = makeHandler();
  const created = await handler(makeEvent('POST', '/admin/boards', { body: { name: 'Métricas' } }));
  const boardId = (bodyOf(created) as { board: { board: { boardId: string } } }).board.board.boardId;
  const metrics = await handler(makeEvent('GET', '/admin/boards/{boardId}', {
    params: { boardId },
    query: { view: 'metrics', from: '2026-01-01', to: '2026-12-31' },
  }));
  assert.equal(metrics.statusCode, 200);
  const result = bodyOf(metrics) as { dashboard: { documentType: string }; panels: unknown[]; board: { accessRole: string } };
  assert.equal(result.dashboard.documentType, 'boardMetricsDashboard');
  assert.ok(result.panels.length > 0);
  assert.equal(result.board.accessRole, 'owner');
});

test('rejects invalid metrics date parameters', async () => {
  const handler = makeHandler();
  const created = await handler(makeEvent('POST', '/admin/boards', { body: { name: 'Métricas' } }));
  const boardId = (bodyOf(created) as { board: { board: { boardId: string } } }).board.board.boardId;
  const metrics = await handler(makeEvent('GET', '/admin/boards/{boardId}', {
    params: { boardId },
    query: { view: 'metrics', to: '2026-12-31T12:00:00Z' },
  }));
  assert.equal(metrics.statusCode, 400);
});
