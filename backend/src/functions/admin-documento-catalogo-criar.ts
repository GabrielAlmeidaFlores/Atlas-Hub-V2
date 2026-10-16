import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { created, conflict, badRequest, unauthorized, forbidden, serverError } from '../shared/http/response.js';
import { getUserId, requireAdminMaster, AuthError, ForbiddenError } from '../shared/http/auth.js';
import { validate, documentoCatalogoCriarSchema, ValidationError } from '../shared/http/validators.js';
import { getCatalogoItem, putCatalogoItem } from '../shared/db/documento-catalogo.js';
import { createLogger } from '../shared/core/logger.js';
import type { DocumentoCatalogoItem } from '../shared/core/types/index.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('adminDocumentoCatalogoCriar');
  try {
    getUserId(event);
    requireAdminMaster(event);

    const body = validate(documentoCatalogoCriarSchema, JSON.parse(event.body ?? '{}'));

    const existing = await getCatalogoItem(body.key);
    if (existing !== null) return conflict(event, 'Já existe um item com esta chave');

    const now = new Date().toISOString();
    const item: DocumentoCatalogoItem = {
      key: body.key,
      categoria: body.categoria,
      scope: body.scope,
      label: body.label,
      obrigatorio: body.obrigatorio ?? false,
      ordem: body.ordem ?? 0,
      ativo: body.ativo ?? true,
      criadoEm: now,
      atualizadoEm: now,
      ...(body.condicional !== undefined ? { condicional: body.condicional } : {}),
      ...(body.validadeDias !== undefined ? { validadeDias: body.validadeDias } : {}),
    };

    await putCatalogoItem(item);
    log.info('Document catalog item created', { key: item.key });
    return created(event, item);
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof ForbiddenError) return forbidden(event);
    if (err instanceof ValidationError) return badRequest(event, err.message, 'VALIDATION_ERROR', err.fields);
    if ((err as { name?: string }).name === 'ConditionalCheckFailedException') return conflict(event, 'Já existe um item com esta chave');
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
