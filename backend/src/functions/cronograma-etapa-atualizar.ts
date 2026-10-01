import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, unauthorized, forbidden, notFound, badRequest, serverError } from '../shared/http/response.js';
import { AuthError, ForbiddenError } from '../shared/http/auth.js';
import { validate, atualizarEtapaObraSchema, ValidationError } from '../shared/http/validators.js';
import { createLogger } from '../shared/core/logger.js';
import { CronogramaNotFoundError, loadProjetoCronograma } from '../shared/obra/access.js';
import { getEtapaObra, putEtapaObra } from '../shared/db/cronograma.js';
import type { EtapaObra } from '../shared/core/types/index.js';

function textOrDrop(value: string | undefined): string | undefined {
  if (value === undefined || value === '') return undefined;
  return value;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('cronogramaEtapaAtualizar');
  try {
    const projetoId = event.pathParameters?.['id'];
    const etapaId = event.pathParameters?.['etapaId'];
    if (projetoId === undefined || projetoId === '' || etapaId === undefined || etapaId === '') {
      return notFound(event, 'Etapa não encontrada');
    }
    await loadProjetoCronograma(event, projetoId, 'owner');
    const current = await getEtapaObra(projetoId, etapaId);
    if (current === null) return notFound(event, 'Etapa não encontrada');
    const body = validate(atualizarEtapaObraSchema, JSON.parse(event.body ?? '{}'));
    const inicioPrevisto = body.inicioPrevisto ?? current.inicioPrevisto;
    const fimPrevisto = body.fimPrevisto ?? current.fimPrevisto;
    if (inicioPrevisto > fimPrevisto) return badRequest(event, 'Término previsto deve ser posterior ao início');
    const inicioReal = body.inicioReal !== undefined ? textOrDrop(body.inicioReal) : current.inicioReal;
    const fimReal = body.fimReal !== undefined ? textOrDrop(body.fimReal) : current.fimReal;
    if (inicioReal !== undefined && fimReal !== undefined && inicioReal > fimReal) {
      return badRequest(event, 'Término real deve ser posterior ao início real');
    }
    const etapa: EtapaObra = {
      projetoId,
      etapaId,
      nome: body.nome ?? current.nome,
      ordem: current.ordem,
      inicioPrevisto,
      fimPrevisto,
      percentualExecucao: body.percentualExecucao ?? current.percentualExecucao,
      valorOrcado: body.valorOrcado ?? current.valorOrcado,
      criadoEm: current.criadoEm,
      atualizadoEm: new Date().toISOString(),
      ...(inicioReal !== undefined ? { inicioReal } : {}),
      ...(fimReal !== undefined ? { fimReal } : {}),
    };
    await putEtapaObra(etapa);
    log.info('Etapa updated', { projetoId, etapaId });
    return ok(event, etapa);
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
