import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, unauthorized, forbidden, serverError } from '../shared/http/response.js';
import { getUserId, requireAdminMaster, AuthError, ForbiddenError } from '../shared/http/auth.js';
import { listCatalogo } from '../shared/db/documento-catalogo.js';
import { createLogger } from '../shared/core/logger.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('adminDocumentoCatalogoListar');
  try {
    getUserId(event);
    requireAdminMaster(event);
    const items = await listCatalogo({ noCache: true });
    log.info('Document catalog listed', { count: items.length });
    return ok(event, { items });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof ForbiddenError) return forbidden(event);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
