import { v4 as uuidv4 } from 'uuid';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { created, unauthorized, forbidden, notFound, badRequest, serverError } from '../shared/http/response.js';
import { AuthError, ForbiddenError, getUserId } from '../shared/http/auth.js';
import { validate, criarLancamentoObraSchema, ValidationError } from '../shared/http/validators.js';
import { createLogger } from '../shared/core/logger.js';
import { CronogramaNotFoundError, loadProjetoCronograma } from '../shared/obra/access.js';
import { getEtapaObra, putLancamentoObra } from '../shared/db/cronograma.js';
import { podeLancarGastos } from '../shared/obra/resumo.js';
import type { LancamentoObra } from '../shared/core/types/index.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('cronogramaLancamentoCriar');
  try {
    const projetoId = event.pathParameters?.['id'];
    if (projetoId === undefined || projetoId === '') return notFound(event, 'Projeto não encontrado');
    const userId = getUserId(event);
    const projeto = await loadProjetoCronograma(event, projetoId, 'owner');
    if (!podeLancarGastos(projeto.status)) {
      return forbidden(event);
    }
    const body = validate(criarLancamentoObraSchema, JSON.parse(event.body ?? '{}'));
    const etapa = await getEtapaObra(projetoId, body.etapaId);
    if (etapa === null) return badRequest(event, 'Etapa informada não existe neste projeto');
    const now = new Date().toISOString();
    const lancamento: LancamentoObra = {
      projetoId,
      lancamentoId: uuidv4(),
      etapaId: body.etapaId,
      descricao: body.descricao,
      valor: body.valor,
      dataLancamento: body.dataLancamento,
      status: 'CONFIRMADO',
      criadoPor: userId,
      criadoEm: now,
      atualizadoEm: now,
      ...(body.comprovanteUrl !== undefined ? { comprovanteUrl: body.comprovanteUrl } : {}),
    };
    await putLancamentoObra(lancamento);
    log.info('Lancamento created', { projetoId, lancamentoId: lancamento.lancamentoId });
    return created(event, lancamento);
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
