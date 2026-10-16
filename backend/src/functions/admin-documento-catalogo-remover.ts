import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, badRequest, notFound, unauthorized, forbidden, serverError } from '../shared/http/response.js';
import { getUserId, requireAdminMaster, AuthError, ForbiddenError } from '../shared/http/auth.js';
import { updateCatalogoItem } from '../shared/db/documento-catalogo.js';
import { createLogger } from '../shared/core/logger.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('adminDocumentoCatalogoRemover');
  try {
    getUserId(event);
    requireAdminMaster(event);

    const key = event.pathParameters?.['key'];
    if (key === undefined || key === '') return badRequest(event, 'Chave do item é obrigatória');

    const updated = await updateCatalogoItem(key, { ativo: false });
    if (updated === null) return notFound(event, 'Item não encontrado');

    log.info('Document catalog item deactivated', { key });
    return ok(event, { key, ativo: false });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof ForbiddenError) return forbidden(event);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
