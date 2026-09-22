import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, unauthorized, forbidden, notFound, badRequest, serverError } from '../shared/http/response.js';
import { getUserId, AuthError, ForbiddenError, requireAdmin } from '../shared/http/auth.js';
import { createLogger } from '../shared/core/logger.js';
import { getSpeConta } from '../shared/db/financeiro.js';
import { getCartaoObra } from '../shared/db/cartao.js';
import { getProjeto } from '../shared/db/index.js';
import { listEtapasByProjeto } from '../shared/db/cronograma.js';
import { cartaoObraPayload } from '../shared/financeiro/cartao-payload.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('adminFinanceiroCartaoGet');
  try {
    getUserId(event);
    requireAdmin(event);
    const projetoId = event.pathParameters?.['projetoId'];
    if (projetoId === undefined || projetoId === '') return notFound(event, 'Conta não encontrada');

    const conta = await getSpeConta(projetoId);
    if (conta === null) return notFound(event, 'Conta não encontrada');
    if (conta.tipo !== 'SPE') return badRequest(event, 'Cartão disponível apenas para conta da SPE');

    const [projeto, etapas, cartao] = await Promise.all([
      getProjeto(projetoId),
      listEtapasByProjeto(projetoId),
      getCartaoObra(projetoId),
    ]);

    log.info('Card proposal loaded', { projetoId, etapas: etapas.length });
    return ok(event, cartaoObraPayload(conta, projeto, etapas, cartao));
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof ForbiddenError) return forbidden(event);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
