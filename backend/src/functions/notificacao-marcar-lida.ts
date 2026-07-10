import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, unauthorized, forbidden, notFound, serverError } from '../shared/http/response.js';
import { getUserId, AuthError, ForbiddenError } from '../shared/http/auth.js';
import { marcarNotificacaoLida } from '../shared/db/index.js';
import { createLogger } from '../shared/core/logger.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('notificacaoMarcarLida');
  try {
    const userId = getUserId(event);
    const criadoEm = event.pathParameters?.['id'];
    if (criadoEm === undefined || criadoEm === '') return notFound(event, 'Notificação não encontrada');
    await marcarNotificacaoLida(userId, decodeURIComponent(criadoEm));
    log.info('Notification marked as read', { userId, criadoEm });
    return ok(event, { updated: true });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof ForbiddenError) return forbidden(event);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
