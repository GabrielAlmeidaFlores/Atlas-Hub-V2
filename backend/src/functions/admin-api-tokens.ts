import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ApiTokenNotFoundError } from '../shared/api-token/errors.js';
import { DynamoApiTokenRepository } from '../shared/api-token/dynamo-repository.js';
import { ApiTokenService } from '../shared/api-token/service.js';
import { apiTokenCreateSchema } from '../shared/api-token/validation.js';
import { createLogger } from '../shared/core/logger.js';
import {
  AuthError,
  ForbiddenError,
  getUserId,
  getUserEmail,
  requireAdmin,
  requireCognito,
} from '../shared/http/auth.js';
import {
  badRequest,
  created,
  forbidden,
  notFound,
  ok,
  serverError,
  unauthorized,
} from '../shared/http/response.js';
import { validate, ValidationError } from '../shared/http/validators.js';

function parseBody(event: APIGatewayProxyEvent): unknown {
  if (event.body === null || event.body === undefined || event.body === '') return {};
  return JSON.parse(event.body) as unknown;
}

function routeKey(event: APIGatewayProxyEvent): string {
  const resource = event.resource ?? event.path;
  return `${event.httpMethod} ${resource}`;
}

export function createAdminApiTokensHandler(service: ApiTokenService) {
  return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const log = createLogger('adminApiTokens');
    try {
      const actor = { userId: getUserId(event), email: getUserEmail(event) };
      requireAdmin(event);
      requireCognito(event);

      switch (routeKey(event)) {
        case 'GET /admin/api-tokens': {
          const items = await service.list(actor.userId);
          return ok(event, { items });
        }
        case 'POST /admin/api-tokens': {
          const body = validate(apiTokenCreateSchema, parseBody(event));
          const token = await service.create(actor, {
            ...body,
            expiresInDays: body.expiresInDays === undefined ? 90 : body.expiresInDays,
          });
          log.info('API token created', { tokenId: token.tokenId, ownerId: actor.userId });
          return created(event, { token });
        }
        case 'DELETE /admin/api-tokens/{tokenId}': {
          const tokenId = event.pathParameters?.['tokenId'];
          if (tokenId === undefined || tokenId === '') {
            throw new ValidationError([{ field: 'tokenId', message: 'Parâmetro obrigatório' }]);
          }
          await service.revoke(actor.userId, tokenId);
          return ok(event, { ok: true });
        }
        default:
          return badRequest(event, 'Rota não encontrada');
      }
    } catch (err) {
      if (err instanceof AuthError) return unauthorized(event);
      if (err instanceof ForbiddenError) return forbidden(event);
      if (err instanceof ValidationError) return badRequest(event, err.message, 'VALIDATION_ERROR', err.fields);
      if (err instanceof ApiTokenNotFoundError) return notFound(event, err.message);
      if (err instanceof SyntaxError) return badRequest(event, 'JSON inválido');
      log.error('Unexpected error', err);
      return serverError(event, err);
    }
  };
}

export const handler = createAdminApiTokensHandler(new ApiTokenService(new DynamoApiTokenRepository()));
