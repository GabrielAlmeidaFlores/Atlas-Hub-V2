import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, unauthorized, forbidden, badRequest, notFound, serverError } from '../shared/http/response.js';
import { getUserId, AuthError, ForbiddenError, requireAdmin, getUserEmail } from '../shared/http/auth.js';
import { validate, scorecardSchema, ValidationError } from '../shared/http/validators.js';
import { getProjeto, putScorecard } from '../shared/db/index.js';
import { createLogger } from '../shared/core/logger.js';
import type { Scorecard } from '../shared/core/types/index.js';

function calcNotaGeral(s: Partial<Scorecard>): number | undefined {
  const notas = [s.localizacaoNota, s.financeiraNota, s.documentacaoNota, s.equipeNota, s.riscoNota];
  const pesos = [0.25, 0.25, 0.20, 0.15, 0.15];
  let soma = 0;
  let pesosAplicados = 0;
  for (let i = 0; i < notas.length; i++) {
    const nota = notas[i];
    const peso = pesos[i];
    if (nota !== undefined && peso !== undefined) {
      soma += nota * peso;
      pesosAplicados += peso;
    }
  }
  if (pesosAplicados === 0) return undefined;
  return Math.round((soma / pesosAplicados) * 10) / 10;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('adminCuradoriaScorecard');
  try {
    const analistaId = getUserId(event);
    const analistaEmail = getUserEmail(event);
    requireAdmin(event);

    const id = event.pathParameters?.['id'];
    if (id === undefined || id === '') return notFound(event, 'Projeto não encontrado');

    const projeto = await getProjeto(id);
    if (projeto === null) return notFound(event, 'Projeto não encontrado');
    if (projeto.status !== 'EM_ANALISE') {
      return badRequest(event, 'Scorecard só pode ser salvo durante a análise', 'INVALID_STATUS_TRANSITION');
    }

    const body = validate(scorecardSchema, JSON.parse(event.body ?? '{}'));
    const now = new Date().toISOString();
    const notaGeral = calcNotaGeral(body);

    const scorecard: Scorecard = {
      projetoId: id,
      revisao: projeto.revisao,
      analistaId,
      analistaNome: analistaEmail,
      ...body,
      ...(notaGeral !== undefined && { notaGeral }),
      decisao: 'RASCUNHO',
      criadoEm: now,
      atualizadoEm: now,
    };

    await putScorecard(scorecard);
    log.info('Scorecard saved', { projetoId: id, analistaId });
    return ok(event, { saved: true, notaGeral });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof ForbiddenError) return forbidden(event);
    if (err instanceof ValidationError) return badRequest(event, err.message);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
