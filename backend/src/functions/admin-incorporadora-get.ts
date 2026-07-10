import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, unauthorized, forbidden, notFound, serverError } from '../shared/http/response.js';
import { getUserId, AuthError, ForbiddenError, requireAdmin } from '../shared/http/auth.js';
import { getIncorporadora, listProjetosByIncorporadora } from '../shared/db/index.js';
import { createLogger } from '../shared/core/logger.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('adminIncorporadoraGet');
  try {
    getUserId(event);
    requireAdmin(event);

    const id = event.pathParameters?.['id'];
    if (id === undefined || id === '') return notFound(event, 'Incorporadora não encontrada');

    const incorporadora = await getIncorporadora(id);
    if (incorporadora === null) return notFound(event, 'Incorporadora não encontrada');

    const { items: projetos } = await listProjetosByIncorporadora(id);
    log.info('Incorporadora detail fetched', { incorporadoraId: id });
    return ok(event, { incorporadora, projetos });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof ForbiddenError) return forbidden(event);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
