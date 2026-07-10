import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, unauthorized, forbidden, serverError } from '../shared/http/response.js';
import { getUserId, AuthError, ForbiddenError, requireAdmin } from '../shared/http/auth.js';
import { listProjetosByStatus } from '../shared/db/index.js';
import { createLogger } from '../shared/core/logger.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('adminHistoricoListar');
  try {
    getUserId(event);
    requireAdmin(event);
    const cursor = (event.queryStringParameters?.['cursor'] ?? null) as string | null;
    const { items, cursor: nextCursor } = await listProjetosByStatus(['APROVADO', 'OFERTA_CRIADA', 'REPROVADO'], cursor);
    log.info('History listed', { count: items.length });
    return ok(event, { items, cursor: nextCursor, hasMore: nextCursor !== null });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof ForbiddenError) return forbidden(event);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
