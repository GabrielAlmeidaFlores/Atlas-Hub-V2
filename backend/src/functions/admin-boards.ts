import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { BoardService } from '../shared/board/service.js';
import { DynamoBoardRepository } from '../shared/board/dynamo-repository.js';
import { presignBoardFileDownload, presignBoardFileUpload } from '../shared/board/files.js';
import { BoardConflictError, BoardForbiddenError, BoardNotFoundError } from '../shared/board/errors.js';
import {
  boardCreateSchema,
  boardMemberAddSchema,
  boardUpdateSchema,
  cardCreateSchema,
  cardMoveSchema,
  cardUpdateSchema,
  columnCreateSchema,
  fileDownloadSchema,
  filePresignSchema,
  columnUpdateSchema,
  labelCreateSchema,
  labelUpdateSchema,
  templateCreateSchema,
  templateUpdateSchema,
} from '../shared/board/validation.js';
import {
  AuthError,
  ForbiddenError,
  getUserEmail,
  getUserId,
  requireAdmin,
  requireAdminMaster,
} from '../shared/http/auth.js';
import { listAdmins } from '../shared/db/index.js';
import type { Admin } from '../shared/core/types/index.js';
import {
  badRequest,
  conflict,
  created,
  forbidden,
  notFound,
  ok,
  serverError,
  unauthorized,
} from '../shared/http/response.js';
import { validate, ValidationError } from '../shared/http/validators.js';
import { createLogger } from '../shared/core/logger.js';

function parseBody(event: APIGatewayProxyEvent): unknown {
  if (event.body === null || event.body === undefined || event.body === '') return {};
  return JSON.parse(event.body) as unknown;
}

function decodeParam(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function pathParam(event: APIGatewayProxyEvent, key: string): string | undefined {
  const parts = event.path.split('/').filter(Boolean);
  if (parts[0] !== 'admin' || parts[1] !== 'boards') return undefined;
  const boardId = parts[2];
  const rest = parts.slice(3);
  if (key === 'boardId') {
    return boardId !== undefined && boardId !== 'files' ? decodeParam(boardId) : undefined;
  }
  if (key === 'columnId' && rest[0] === 'columns' && rest[1] !== undefined) return decodeParam(rest[1]);
  if (key === 'labelId' && rest[0] === 'labels' && rest[1] !== undefined) return decodeParam(rest[1]);
  if (key === 'templateId' && rest[0] === 'templates' && rest[1] !== undefined) return decodeParam(rest[1]);
  if (key === 'cardId' && rest[0] === 'cards' && rest[1] !== undefined) return decodeParam(rest[1]);
  if (key === 'email' && rest[0] === 'members' && rest[1] !== undefined && rest[1] !== 'candidates') {
    return decodeParam(rest[1]);
  }
  return undefined;
}

function optionalParam(event: APIGatewayProxyEvent, key: string): string | undefined {
  const direct = event.pathParameters?.[key];
  if (direct !== undefined && direct !== '') return direct;
  return pathParam(event, key);
}

function param(event: APIGatewayProxyEvent, key: string): string {
  const value = optionalParam(event, key);
  if (value === undefined || value === '') throw new ValidationError([{ field: key, message: 'Parâmetro obrigatório' }]);
  return value;
}

function routeKey(event: APIGatewayProxyEvent): string {
  const method = event.httpMethod;
  const path = event.path;
  if (path === '/admin/boards') return `${method} /admin/boards`;
  if (path === '/admin/boards/files/download-url') return `${method} /admin/boards/files/download-url`;
  const parts = path.split('/').filter(Boolean);
  if (parts[0] !== 'admin' || parts[1] !== 'boards' || parts[2] === undefined) {
    return `${method} ${event.resource ?? path}`;
  }
  const rest = parts.slice(3);
  const base = '/admin/boards/{boardId}';
  if (rest.length === 0) return `${method} ${base}`;
  if (rest[0] === 'columns') {
    return rest[1] === undefined ? `${method} ${base}/columns` : `${method} ${base}/columns/{columnId}`;
  }
  if (rest[0] === 'labels') {
    return rest[1] === undefined ? `${method} ${base}/labels` : `${method} ${base}/labels/{labelId}`;
  }
  if (rest[0] === 'templates') {
    return rest[1] === undefined ? `${method} ${base}/templates` : `${method} ${base}/templates/{templateId}`;
  }
  if (rest[0] === 'files' && rest[1] === 'presign') return `${method} ${base}/files/presign`;
  if (rest[0] === 'cards') {
    if (rest[1] === undefined) return `${method} ${base}/cards`;
    return rest[2] === 'move' ? `${method} ${base}/cards/{cardId}/move` : `${method} ${base}/cards/{cardId}`;
  }
  if (rest[0] === 'members') {
    if (rest[1] === undefined) return `${method} ${base}/members`;
    return rest[1] === 'candidates' ? `${method} ${base}/members/candidates` : `${method} ${base}/members/{email}`;
  }
  return `${method} ${event.resource ?? path}`;
}

function boardRequirement(event: APIGatewayProxyEvent): 'view' | 'write' | 'manage' | 'owner' {
  const resource = event.path;
  if (resource.includes('/members')) return 'manage';
  if (event.httpMethod === 'GET') return 'view';
  if (resource.includes('/cards') || resource.endsWith('/files/presign')) return 'write';
  return 'manage';
}

type UserDirectory = () => Promise<readonly Admin[]>;

export function createAdminBoardsHandler(
  service: BoardService,
  userDirectory: UserDirectory = listAdmins,
) {
  return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const log = createLogger('adminBoards');
    try {
      const userId = getUserId(event);
      const email = getUserEmail(event).trim().toLowerCase();
      requireAdmin(event);
      const actor = { userId, email };
      const boardId = optionalParam(event, 'boardId');
      if (boardId !== undefined) {
        await service.assertBoardAccess(boardId, actor, boardRequirement(event));
      }

      switch (routeKey(event)) {
        case 'GET /admin/boards': {
          const boards = await service.listBoards(actor);
          return ok(event, { boards });
        }
        case 'POST /admin/boards': {
          requireAdminMaster(event);
          const body = validate(boardCreateSchema, parseBody(event));
          const board = await service.createBoard(body, actor);
          log.info('Board created', { boardId: board.board.boardId });
          return created(event, { board });
        }
        case 'GET /admin/boards/{boardId}': {
          const boardId = param(event, 'boardId');
          if (event.queryStringParameters?.['view'] === 'metrics') {
            let variableValues: Record<string, readonly string[]> = {};
            const rawVariables = event.queryStringParameters['variables'];
            if (rawVariables !== undefined && rawVariables !== '') {
              try {
                const parsed = JSON.parse(rawVariables) as unknown;
                if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
                  variableValues = Object.fromEntries(
                    Object.entries(parsed as Record<string, unknown>).map(([key, value]) => [
                      key,
                      Array.isArray(value) ? value.map(String) : [String(value)],
                    ]),
                  );
                }
              } catch {
                return badRequest(event, 'Parâmetro variables inválido');
              }
            }
            const from = event.queryStringParameters['from'];
            const to = event.queryStringParameters['to'];
            const isDateOnly = (value: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
            if (from !== undefined && from !== '' && !isDateOnly(from)) return badRequest(event, 'Parâmetro from deve usar YYYY-MM-DD');
            if (to !== undefined && to !== '' && !isDateOnly(to)) return badRequest(event, 'Parâmetro to deve usar YYYY-MM-DD');
            if (from !== undefined && to !== undefined && from !== '' && to !== '' && from > to) return badRequest(event, 'from não pode ser posterior a to');
            const metrics = await service.getBoardMetrics(boardId, actor, {
              ...(from !== undefined && from !== '' ? { from } : {}),
              ...(to !== undefined && to !== '' ? { to } : {}),
              variableValues,
            });
            return ok(event, metrics);
          }
          const board = await service.getBoard(boardId, actor);
          return ok(event, { board });
        }
        case 'GET /admin/boards/{boardId}/members/candidates': {
          const users = await userDirectory();
          return ok(event, {
            users: users
              .filter((user) => user.ativo)
              .map(({ id, email: userEmail, nome, perfil }) => ({ id, email: userEmail, nome, perfil })),
          });
        }
        case 'POST /admin/boards/{boardId}/members': {
          const body = validate(boardMemberAddSchema, parseBody(event));
          const users = await userDirectory();
          const target = users.find((user) => user.ativo && user.email.trim().toLowerCase() === body.email);
          if (target === undefined) {
            throw new ValidationError([{ field: 'email', message: 'Usuário não encontrado ou inativo' }]);
          }
          const member = await service.addMember(param(event, 'boardId'), {
            email: target.email,
            name: target.nome,
            role: body.role,
            addedAt: new Date().toISOString(),
            addedBy: email.length > 0 ? email : userId,
          }, actor);
          return created(event, { member });
        }
        case 'DELETE /admin/boards/{boardId}/members/{email}': {
          await service.removeMember(param(event, 'boardId'), param(event, 'email'), actor);
          return ok(event, { ok: true });
        }
        case 'PUT /admin/boards/{boardId}': {
          const body = validate(boardUpdateSchema, parseBody(event));
          const board = await service.updateBoard(param(event, 'boardId'), body);
          return ok(event, { board });
        }
        case 'DELETE /admin/boards/{boardId}': {
          const board = await service.archiveBoard(param(event, 'boardId'));
          return ok(event, { board });
        }
        case 'POST /admin/boards/{boardId}/columns': {
          const body = validate(columnCreateSchema, parseBody(event));
          const column = await service.createColumn(param(event, 'boardId'), body);
          return created(event, { column });
        }
        case 'PUT /admin/boards/{boardId}/columns/{columnId}': {
          const body = validate(columnUpdateSchema, parseBody(event));
          const column = await service.updateColumn(
            param(event, 'boardId'),
            param(event, 'columnId'),
            body,
          );
          return ok(event, { column });
        }
        case 'DELETE /admin/boards/{boardId}/columns/{columnId}': {
          await service.deleteColumn(param(event, 'boardId'), param(event, 'columnId'));
          return ok(event, { ok: true });
        }
        case 'POST /admin/boards/{boardId}/labels': {
          const body = validate(labelCreateSchema, parseBody(event));
          const label = await service.createLabel(param(event, 'boardId'), body);
          return created(event, { label });
        }
        case 'PUT /admin/boards/{boardId}/labels/{labelId}': {
          const body = validate(labelUpdateSchema, parseBody(event));
          const label = await service.updateLabel(
            param(event, 'boardId'),
            param(event, 'labelId'),
            body,
          );
          return ok(event, { label });
        }
        case 'DELETE /admin/boards/{boardId}/labels/{labelId}': {
          await service.deleteLabel(param(event, 'boardId'), param(event, 'labelId'));
          return ok(event, { ok: true });
        }
        case 'POST /admin/boards/{boardId}/templates': {
          const body = validate(templateCreateSchema, parseBody(event));
          const template = await service.createTemplate(param(event, 'boardId'), body);
          return created(event, { template });
        }
        case 'PUT /admin/boards/{boardId}/templates/{templateId}': {
          const body = validate(templateUpdateSchema, parseBody(event));
          const template = await service.updateTemplate(
            param(event, 'boardId'),
            param(event, 'templateId'),
            body,
          );
          return ok(event, { template });
        }
        case 'DELETE /admin/boards/{boardId}/templates/{templateId}': {
          await service.deleteTemplate(param(event, 'boardId'), param(event, 'templateId'));
          return ok(event, { ok: true });
        }
        case 'POST /admin/boards/{boardId}/files/presign': {
          const boardId = param(event, 'boardId');
          await service.getBoard(boardId, actor);
          const body = validate(filePresignSchema, parseBody(event));
          const result = await presignBoardFileUpload(boardId, userId, body);
          return created(event, result);
        }
        case 'POST /admin/boards/files/download-url': {
          const body = validate(fileDownloadSchema, parseBody(event));
          const match = /^boards\/([^/]+)\//.exec(body.key);
          if (match === null) throw new ValidationError([{ field: 'key', message: 'Arquivo inválido' }]);
          await service.assertBoardAccess(match[1] as string, actor, 'view');
          const url = await presignBoardFileDownload(body.key);
          return ok(event, { url });
        }
        case 'POST /admin/boards/{boardId}/cards': {
          const body = validate(cardCreateSchema, parseBody(event));
          const card = await service.createCard(param(event, 'boardId'), body, userId, email);
          return created(event, { card });
        }
        case 'PUT /admin/boards/{boardId}/cards/{cardId}': {
          const body = validate(cardUpdateSchema, parseBody(event));
          const card = await service.updateCard(
            param(event, 'boardId'),
            param(event, 'cardId'),
            body,
            userId,
            email,
          );
          return ok(event, { card });
        }
        case 'PUT /admin/boards/{boardId}/cards/{cardId}/move': {
          const body = validate(cardMoveSchema, parseBody(event));
          const card = await service.moveCard(
            param(event, 'boardId'),
            param(event, 'cardId'),
            body,
            userId,
            email,
          );
          return ok(event, { card });
        }
        case 'DELETE /admin/boards/{boardId}/cards/{cardId}': {
          const card = await service.archiveCard(
            param(event, 'boardId'),
            param(event, 'cardId'),
            userId,
            email,
          );
          return ok(event, { card });
        }
        default:
          return badRequest(event, 'Rota não encontrada');
      }
    } catch (err) {
      if (err instanceof AuthError) return unauthorized(event);
      if (err instanceof ForbiddenError) return forbidden(event);
      if (err instanceof ValidationError) return badRequest(event, err.message, 'VALIDATION_ERROR', err.fields);
      if (err instanceof BoardNotFoundError) return notFound(event, err.message);
      if (err instanceof BoardForbiddenError) return forbidden(event);
      if (err instanceof BoardConflictError) return conflict(event, err.message);
      if (err instanceof SyntaxError) return badRequest(event, 'JSON inválido');
      log.error('Unexpected error', err);
      return serverError(event, err);
    }
  };
}

export const handler = createAdminBoardsHandler(new BoardService(new DynamoBoardRepository()));
