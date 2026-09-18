import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, unauthorized, forbidden, notFound, serverError } from '../shared/http/response.js';
import { getUserId, AuthError, ForbiddenError, requireAdmin } from '../shared/http/auth.js';
import { createLogger } from '../shared/core/logger.js';
import { getSpeConta } from '../shared/db/financeiro.js';
import { getWorkspaceBalance, isStarkConfigured, StarkNotConfiguredError, StarkOperationError } from '../shared/starkbank/index.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('adminFinanceiroContasGet');
  try {
    getUserId(event);
    requireAdmin(event);
    const projetoId = event.pathParameters?.['projetoId'];
    if (projetoId === undefined || projetoId === '') return notFound(event, 'Conta não encontrada');

    const conta = await getSpeConta(projetoId);
    if (conta === null) return notFound(event, 'Conta não encontrada');

    let saldoCents: number | null = null;
    if (isStarkConfigured() && conta.status === 'ATIVA') {
      try {
        saldoCents = await getWorkspaceBalance(conta.workspaceId);
      } catch (err) {
        if (!(err instanceof StarkNotConfiguredError) && !(err instanceof StarkOperationError)) throw err;
      }
    }

    log.info('Finance account loaded', { projetoId });
    return ok(event, { conta, saldoCents, configured: isStarkConfigured() });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof ForbiddenError) return forbidden(event);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
