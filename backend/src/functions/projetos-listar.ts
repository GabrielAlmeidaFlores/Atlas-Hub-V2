import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, unauthorized, forbidden, serverError } from '../shared/http/response.js';
import { getUserId, AuthError, ForbiddenError, requirePerfil } from '../shared/http/auth.js';
import { listProjetosByIncorporadora } from '../shared/db/index.js';
import { createLogger } from '../shared/core/logger.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('projetosListar');
  try {
    const userId = getUserId(event);
    requirePerfil(event, 'INCORPORADORA');
    const cursor = (event.queryStringParameters?.['cursor'] ?? null) as string | null;
    const { items, cursor: nextCursor } = await listProjetosByIncorporadora(userId, cursor);
    log.info('Projects listed', { userId, count: items.length });
    return ok(event, { items, cursor: nextCursor, hasMore: nextCursor !== null });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof ForbiddenError) return forbidden(event);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
