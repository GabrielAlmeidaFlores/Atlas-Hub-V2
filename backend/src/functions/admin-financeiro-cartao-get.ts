import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, unauthorized, forbidden, notFound, badRequest, serverError } from '../shared/http/response.js';
import { getUserId, getUserEmail, AuthError, ForbiddenError, requireAdmin } from '../shared/http/auth.js';
import { createLogger } from '../shared/core/logger.js';
import { getSpeConta } from '../shared/db/financeiro.js';
import { getCartaoObra } from '../shared/db/cartao.js';
import { getProjeto } from '../shared/db/index.js';
import { listEtapasByProjeto } from '../shared/db/cronograma.js';
import { carregarDetalheCartao } from '../shared/financeiro/cartao-payload.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('adminFinanceiroCartaoGet');
  try {
    const userId = getUserId(event);
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

    const detalhe = await carregarDetalheCartao(conta, projeto, etapas, cartao, userId, getUserEmail(event));
    log.info('Card proposal loaded', { projetoId, etapas: etapas.length, limiteRecalculado: detalhe.limiteRecalculado });
    return ok(event, detalhe);
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof ForbiddenError) return forbidden(event);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
