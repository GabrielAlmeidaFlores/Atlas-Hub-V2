import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, unauthorized, forbidden, badRequest, notFound, serverError } from '../shared/http/response.js';
import { getUserId, AuthError, ForbiddenError, requireAdmin, getUserEmail } from '../shared/http/auth.js';
import { validate, ajusteSchema, ValidationError } from '../shared/http/validators.js';
import { getProjeto, updateProjeto, putScorecard, putAuditoria, putNotificacao } from '../shared/db/index.js';
import { emailAjusteSolicitado } from '../shared/email/index.js';
import { createLogger } from '../shared/core/logger.js';
import { v4 as uuidv4 } from 'uuid';
import type { AuditoriaEntry, Notificacao, Scorecard } from '../shared/core/types/index.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('adminCuradoriaAjuste');
  try {
    const analistaId = getUserId(event);
    const analistaEmail = getUserEmail(event);
    requireAdmin(event);

    const id = event.pathParameters?.['id'];
    if (id === undefined || id === '') return notFound(event, 'Projeto não encontrado');

    const projeto = await getProjeto(id);
    if (projeto === null) return notFound(event, 'Projeto não encontrado');
    if (projeto.status !== 'EM_ANALISE') {
      return badRequest(event, 'Ajuste só pode ser solicitado durante a análise', 'INVALID_STATUS_TRANSITION');
    }

    const body = validate(ajusteSchema, JSON.parse(event.body ?? '{}'));
    const now = new Date().toISOString();
    const ttl = Math.floor(Date.now() / 1000) + 7_776_000;

    const scorecard: Scorecard = {
      projetoId: id,
      revisao: projeto.revisao,
      analistaId,
      analistaNome: analistaEmail,
      ...body.scorecard,
      decisao: 'AJUSTE_SOLICITADO',
      criadoEm: now,
      atualizadoEm: now,
    };

    const auditoria: AuditoriaEntry = {
      projetoId: id,
      criadoEm: now,
      acao: 'AJUSTE_SOLICITADO',
      userId: analistaId,
      userName: analistaEmail,
      descricao: `Ajuste solicitado: ${body.textoAjuste}`,
      statusAnterior: 'EM_ANALISE',
      statusNovo: 'AJUSTE_SOLICITADO',
    };

    const notificacao: Notificacao = {
      userId: projeto.incorporadoraId,
      criadoEm: now,
      id: uuidv4(),
      tipo: 'AJUSTE_SOLICITADO',
      titulo: 'Ajuste necessário',
      mensagem: `O analista solicitou ajustes no projeto "${projeto.nome}".`,
      lida: false,
      projetoId: id,
      projetoNome: projeto.nome,
      ttl,
    };

    await putScorecard(scorecard);
    await updateProjeto(id, { status: 'AJUSTE_SOLICITADO', textoAjuste: body.textoAjuste });
    await putAuditoria(auditoria);
    await putNotificacao(notificacao);

    try { await emailAjusteSolicitado('', projeto.nome, body.textoAjuste); } catch { /* email non-blocking */ }

    log.info('Adjustment requested', { projetoId: id, analistaId });
    return ok(event, { status: 'AJUSTE_SOLICITADO' });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof ForbiddenError) return forbidden(event);
    if (err instanceof ValidationError) return badRequest(event, err.message);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
