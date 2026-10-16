import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, unauthorized, serverError } from '../shared/http/response.js';
import { getUserId, AuthError } from '../shared/http/auth.js';
import { listCatalogo } from '../shared/db/documento-catalogo.js';
import { createLogger } from '../shared/core/logger.js';
import type { DocumentoScope } from '../shared/core/types/index.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('documentoCatalogoListar');
  try {
    getUserId(event);
    const scopeParam = event.queryStringParameters?.['scope'];
    const scope = scopeParam === 'EMPRESA' || scopeParam === 'PROJETO' ? (scopeParam as DocumentoScope) : undefined;
    const items = await listCatalogo({ onlyActive: true, ...(scope !== undefined ? { scope } : {}) });
    log.info('Document catalog listed', { count: items.length });
    return ok(event, { items });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
