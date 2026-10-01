import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, unauthorized, forbidden, notFound, serverError } from '../shared/http/response.js';
import { getUserId, AuthError, ForbiddenError, requireAdmin } from '../shared/http/auth.js';
import { createLogger } from '../shared/core/logger.js';
import { getSpeConta, listSolicitacoesByProjeto, listFinanceiroAuditoria } from '../shared/db/financeiro.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('adminFinanceiroMovimentos');
  try {
    getUserId(event);
    requireAdmin(event);
    const projetoId = event.pathParameters?.['projetoId'];
    if (projetoId === undefined || projetoId === '') return notFound(event, 'Conta não encontrada');
    const conta = await getSpeConta(projetoId);
    if (conta === null) return notFound(event, 'Conta não encontrada');

    const [solicitacoes, auditoria] = await Promise.all([
      listSolicitacoesByProjeto(projetoId),
      listFinanceiroAuditoria(projetoId),
    ]);
    log.info('Movements listed', { projetoId, solicitacoes: solicitacoes.length });
    return ok(event, { solicitacoes, auditoria });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof ForbiddenError) return forbidden(event);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
