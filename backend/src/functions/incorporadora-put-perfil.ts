import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, unauthorized, forbidden, badRequest, serverError } from '../shared/http/response.js';
import { getUserId, AuthError, ForbiddenError, requirePerfil } from '../shared/http/auth.js';
import { validate, perfilSchema } from '../shared/http/validators.js';
import type { Incorporadora } from '../shared/core/types/index.js';
import { updateIncorporadora } from '../shared/db/index.js';
import { ValidationError } from '../shared/http/validators.js';
import { createLogger } from '../shared/core/logger.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('incorporadoraPutPerfil');
  try {
    const userId = getUserId(event);
    requirePerfil(event, 'INCORPORADORA');
    const body = validate(perfilSchema, JSON.parse(event.body ?? '{}'));
    const patch: Record<string, unknown> = {};
    if (body.endereco !== undefined) patch['endereco'] = body.endereco;
    if (body.site !== undefined) patch['site'] = body.site;
    if (body.descricao !== undefined) patch['descricao'] = body.descricao;
    if (body.historicoAnterior !== undefined) patch['historicoAnterior'] = body.historicoAnterior;
    if (body.contratoSocialUrl !== undefined) patch['contratoSocialUrl'] = body.contratoSocialUrl;
    if (body.comprovanteCnpjUrl !== undefined) patch['comprovanteCnpjUrl'] = body.comprovanteCnpjUrl;
    await updateIncorporadora(userId, patch as Partial<Omit<Incorporadora, 'id' | 'cnpj' | 'email' | 'criadoEm'>>);
    log.info('Perfil updated', { userId });
    return ok(event, { updated: true });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof ForbiddenError) return forbidden(event);
    if (err instanceof ValidationError) return badRequest(event, err.message);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
