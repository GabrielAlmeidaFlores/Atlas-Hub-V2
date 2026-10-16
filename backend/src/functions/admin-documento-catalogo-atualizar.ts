import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, badRequest, notFound, unauthorized, forbidden, serverError } from '../shared/http/response.js';
import { getUserId, requireAdminMaster, AuthError, ForbiddenError } from '../shared/http/auth.js';
import { validate, documentoCatalogoAtualizarSchema, ValidationError } from '../shared/http/validators.js';
import { updateCatalogoItem } from '../shared/db/documento-catalogo.js';
import { createLogger } from '../shared/core/logger.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('adminDocumentoCatalogoAtualizar');
  try {
    getUserId(event);
    requireAdminMaster(event);

    const key = event.pathParameters?.['key'];
    if (key === undefined || key === '') return badRequest(event, 'Chave do item é obrigatória');

    const body = validate(documentoCatalogoAtualizarSchema, JSON.parse(event.body ?? '{}'));
    const updated = await updateCatalogoItem(key, body as Record<string, unknown>);
    if (updated === null) return notFound(event, 'Item não encontrado');

    log.info('Document catalog item updated', { key });
    return ok(event, updated);
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof ForbiddenError) return forbidden(event);
    if (err instanceof ValidationError) return badRequest(event, err.message, 'VALIDATION_ERROR', err.fields);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
