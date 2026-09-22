import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, unauthorized, forbidden, notFound, serverError } from '../shared/http/response.js';
import { getUserId, getUserEmail, AuthError, ForbiddenError } from '../shared/http/auth.js';
import { createLogger } from '../shared/core/logger.js';
import { CronogramaNotFoundError, loadProjetoCronograma } from '../shared/obra/access.js';
import { getSpeConta } from '../shared/db/financeiro.js';
import { getCartaoObra } from '../shared/db/cartao.js';
import { listEtapasByProjeto } from '../shared/db/cronograma.js';
import { carregarDetalheCartao } from '../shared/financeiro/cartao-payload.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('cronogramaCartaoObter');
  try {
    const userId = getUserId(event);
    const projetoId = event.pathParameters?.['id'];
    if (projetoId === undefined || projetoId === '') return notFound(event, 'Projeto não encontrado');
    const projeto = await loadProjetoCronograma(event, projetoId, 'owner');
    const conta = await getSpeConta(projetoId);
    if (conta === null || conta.tipo !== 'SPE') return notFound(event, 'Conta da SPE ainda não foi aberta');

    const [etapas, cartao] = await Promise.all([
      listEtapasByProjeto(projetoId),
      getCartaoObra(projetoId),
    ]);
    const detalhe = await carregarDetalheCartao(conta, projeto, etapas, cartao, userId, getUserEmail(event));
    log.info('Originator card loaded', { projetoId });
    return ok(event, detalhe);
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof CronogramaNotFoundError) return notFound(event, err.message);
    if (err instanceof ForbiddenError) return forbidden(event);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
