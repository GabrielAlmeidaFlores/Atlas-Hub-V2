import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, unauthorized, forbidden, badRequest, notFound, serverError } from '../shared/http/response.js';
import { getUserId, AuthError, ForbiddenError, requireAdmin, getUserEmail } from '../shared/http/auth.js';
import { validate, notaInternaSchema, ValidationError } from '../shared/http/validators.js';
import { getProjeto, putNota } from '../shared/db/index.js';
import { createLogger } from '../shared/core/logger.js';
import type { NotaInterna } from '../shared/core/types/index.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('adminCuradoriaNota');
  try {
    const analistaId = getUserId(event);
    const analistaEmail = getUserEmail(event);
    requireAdmin(event);

    const id = event.pathParameters?.['id'];
    if (id === undefined || id === '') return notFound(event, 'Projeto não encontrado');

    const projeto = await getProjeto(id);
    if (projeto === null) return notFound(event, 'Projeto não encontrado');

    const body = validate(notaInternaSchema, JSON.parse(event.body ?? '{}'));
    const now = new Date().toISOString();

    const nota: NotaInterna = {
      projetoId: id,
      criadoEm: now,
      analistaId,
      analistaNome: analistaEmail,
      texto: body.texto,
    };

    await putNota(nota);
    log.info('Internal note added', { projetoId: id, analistaId });
    return ok(event, nota);
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof ForbiddenError) return forbidden(event);
    if (err instanceof ValidationError) return badRequest(event, err.message);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
