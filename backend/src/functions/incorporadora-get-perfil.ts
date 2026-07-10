import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, unauthorized, forbidden, serverError, notFound } from '../shared/http/response.js';
import { getUserId, AuthError, ForbiddenError, requirePerfil } from '../shared/http/auth.js';
import { getIncorporadora } from '../shared/db/index.js';
import { createLogger } from '../shared/core/logger.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('incorporadoraGetPerfil');
  try {
    const userId = getUserId(event);
    requirePerfil(event, 'INCORPORADORA');
    const incorporadora = await getIncorporadora(userId);
    if (incorporadora === null) {
      return notFound(event, 'Incorporadora não encontrada');
    }
    log.info('Perfil returned', { userId });
    return ok(event, incorporadora);
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof ForbiddenError) return forbidden(event);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
