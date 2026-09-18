import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, unauthorized, forbidden, notFound, serverError } from '../shared/http/response.js';
import { AuthError, ForbiddenError } from '../shared/http/auth.js';
import { createLogger } from '../shared/core/logger.js';
import { CronogramaNotFoundError, loadProjetoCronograma } from '../shared/obra/access.js';
import { listEtapasByProjeto, listLancamentosByProjeto } from '../shared/db/cronograma.js';
import { cronogramaPayload } from '../shared/obra/payload.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('adminCronogramaProjeto');
  try {
    const projetoId = event.pathParameters?.['projetoId'];
    if (projetoId === undefined || projetoId === '') return notFound(event, 'Projeto não encontrado');
    const projeto = await loadProjetoCronograma(event, projetoId, 'admin');
    const [etapas, lancamentos] = await Promise.all([
      listEtapasByProjeto(projetoId),
      listLancamentosByProjeto(projetoId),
    ]);
    log.info('Cronograma admin loaded', { projetoId, etapas: etapas.length });
    return ok(event, cronogramaPayload(projeto, etapas, lancamentos, 'admin'));
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof CronogramaNotFoundError) return notFound(event, err.message);
    if (err instanceof ForbiddenError) return forbidden(event);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
