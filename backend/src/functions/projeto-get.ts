import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, unauthorized, forbidden, notFound, serverError } from '../shared/http/response.js';
import { getUserId, AuthError, ForbiddenError, getUserPerfil } from '../shared/http/auth.js';
import { getProjeto, listAuditoriaProjeto } from '../shared/db/index.js';
import { createLogger } from '../shared/core/logger.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('projetoGet');
  try {
    const userId = getUserId(event);
    const perfil = getUserPerfil(event);
    if (perfil === null) return forbidden(event);
    const id = event.pathParameters?.['id'];
    if (id === undefined || id === '') return notFound(event, 'Projeto não encontrado');

    const projeto = await getProjeto(id);
    if (projeto === null) return notFound(event, 'Projeto não encontrado');

    if (perfil === 'INCORPORADORA' && projeto.incorporadoraId !== userId) {
      return forbidden(event);
    }

    const historico = await listAuditoriaProjeto(id);
    log.info('Project fetched', { projetoId: id, userId });
    return ok(event, { ...projeto, historico });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof ForbiddenError) return forbidden(event);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
