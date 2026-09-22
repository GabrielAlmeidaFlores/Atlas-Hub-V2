import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, unauthorized, forbidden, notFound, badRequest, serverError } from '../shared/http/response.js';
import { AuthError, ForbiddenError } from '../shared/http/auth.js';
import { validate, atualizarLancamentoObraSchema, ValidationError } from '../shared/http/validators.js';
import { createLogger } from '../shared/core/logger.js';
import { CronogramaNotFoundError, loadProjetoCronograma } from '../shared/obra/access.js';
import { getLancamentoObra, putLancamentoObra } from '../shared/db/cronograma.js';
import { podeLancarGastos } from '../shared/obra/resumo.js';
import type { LancamentoObra } from '../shared/core/types/index.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('cronogramaLancamentoAtualizar');
  try {
    const projetoId = event.pathParameters?.['id'];
    const lancamentoId = event.pathParameters?.['lancamentoId'];
    if (projetoId === undefined || projetoId === '' || lancamentoId === undefined || lancamentoId === '') {
      return notFound(event, 'Lançamento não encontrado');
    }
    const projeto = await loadProjetoCronograma(event, projetoId, 'owner');
    if (!podeLancarGastos(projeto.status)) {
      return forbidden(event);
    }
    const current = await getLancamentoObra(projetoId, lancamentoId);
    if (current === null) return notFound(event, 'Lançamento não encontrado');
    validate(atualizarLancamentoObraSchema, JSON.parse(event.body ?? '{}'));
    const lancamento: LancamentoObra = {
      ...current,
      status: 'CANCELADO',
      atualizadoEm: new Date().toISOString(),
    };
    await putLancamentoObra(lancamento);
    log.info('Lancamento cancelled', { projetoId, lancamentoId });
    return ok(event, lancamento);
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof CronogramaNotFoundError) return notFound(event, err.message);
    if (err instanceof ForbiddenError) return forbidden(event);
    if (err instanceof ValidationError) return badRequest(event, err.message);
    if (err instanceof SyntaxError) return badRequest(event, 'JSON inválido');
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
