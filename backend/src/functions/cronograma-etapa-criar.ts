import { v4 as uuidv4 } from 'uuid';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { created, unauthorized, forbidden, notFound, badRequest, serverError } from '../shared/http/response.js';
import { AuthError, ForbiddenError } from '../shared/http/auth.js';
import { validate, criarEtapaObraSchema, ValidationError } from '../shared/http/validators.js';
import { createLogger } from '../shared/core/logger.js';
import { CronogramaNotFoundError, loadProjetoCronograma } from '../shared/obra/access.js';
import { listEtapasByProjeto, putEtapaObra } from '../shared/db/cronograma.js';
import type { EtapaObra } from '../shared/core/types/index.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('cronogramaEtapaCriar');
  try {
    const projetoId = event.pathParameters?.['id'];
    if (projetoId === undefined || projetoId === '') return notFound(event, 'Projeto não encontrado');
    await loadProjetoCronograma(event, projetoId, 'owner');
    const body = validate(criarEtapaObraSchema, JSON.parse(event.body ?? '{}'));
    const existing = await listEtapasByProjeto(projetoId);
    const now = new Date().toISOString();
    const etapa: EtapaObra = {
      projetoId,
      etapaId: uuidv4(),
      nome: body.nome,
      ordem: existing.length + 1,
      inicioPrevisto: body.inicioPrevisto,
      fimPrevisto: body.fimPrevisto,
      percentualExecucao: body.percentualExecucao ?? 0,
      valorOrcado: body.valorOrcado,
      criadoEm: now,
      atualizadoEm: now,
      ...(body.inicioReal !== undefined ? { inicioReal: body.inicioReal } : {}),
      ...(body.fimReal !== undefined ? { fimReal: body.fimReal } : {}),
    };
    await putEtapaObra(etapa);
    log.info('Etapa created', { projetoId, etapaId: etapa.etapaId });
    return created(event, etapa);
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
