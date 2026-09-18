import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, unauthorized, forbidden, notFound, conflict, serverError } from '../shared/http/response.js';
import { AuthError, ForbiddenError } from '../shared/http/auth.js';
import { createLogger } from '../shared/core/logger.js';
import { CronogramaNotFoundError, loadProjetoCronograma } from '../shared/obra/access.js';
import { deleteEtapaObra, getEtapaObra, listLancamentosByProjeto } from '../shared/db/cronograma.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('cronogramaEtapaRemover');
  try {
    const projetoId = event.pathParameters?.['id'];
    const etapaId = event.pathParameters?.['etapaId'];
    if (projetoId === undefined || projetoId === '' || etapaId === undefined || etapaId === '') {
      return notFound(event, 'Etapa não encontrada');
    }
    await loadProjetoCronograma(event, projetoId, 'owner');
    const current = await getEtapaObra(projetoId, etapaId);
    if (current === null) return notFound(event, 'Etapa não encontrada');
    const lancamentos = await listLancamentosByProjeto(projetoId);
    const vinculados = lancamentos.filter((item) => item.etapaId === etapaId && item.status === 'CONFIRMADO');
    if (vinculados.length > 0) {
      return conflict(event, 'Não é possível excluir etapa com lançamentos confirmados');
    }
    await deleteEtapaObra(projetoId, etapaId);
    log.info('Etapa removed', { projetoId, etapaId });
    return ok(event, { deleted: true });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof CronogramaNotFoundError) return notFound(event, err.message);
    if (err instanceof ForbiddenError) return forbidden(event);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
