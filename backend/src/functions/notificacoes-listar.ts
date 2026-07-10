import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, unauthorized, forbidden, serverError } from '../shared/http/response.js';
import { getUserId, AuthError, ForbiddenError } from '../shared/http/auth.js';
import { listNotificacoes } from '../shared/db/index.js';
import { createLogger } from '../shared/core/logger.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('notificacoesListar');
  try {
    const userId = getUserId(event);
    const notificacoes = await listNotificacoes(userId);
    const naoLidas = notificacoes.filter((n) => !n.lida).length;
    log.info('Notifications listed', { userId, count: notificacoes.length });
    return ok(event, { items: notificacoes, naoLidas });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof ForbiddenError) return forbidden(event);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
