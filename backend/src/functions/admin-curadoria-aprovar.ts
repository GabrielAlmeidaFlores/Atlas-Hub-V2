import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, unauthorized, forbidden, badRequest, notFound, serverError } from '../shared/http/response.js';
import { getUserId, AuthError, ForbiddenError, requireAdmin, getUserEmail } from '../shared/http/auth.js';
import { validate, aprovarSchema, ValidationError } from '../shared/http/validators.js';
import { getProjeto, updateProjeto, putScorecard, putAuditoria, putNotificacao } from '../shared/db/index.js';
import { emailAprovado } from '../shared/email/index.js';
import { createLogger } from '../shared/core/logger.js';
import { v4 as uuidv4 } from 'uuid';
import type { AuditoriaEntry, Notificacao, Scorecard } from '../shared/core/types/index.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('adminCuradoriaAprovar');
  try {
    const analistaId = getUserId(event);
    const analistaEmail = getUserEmail(event);
    requireAdmin(event);

    const id = event.pathParameters?.['id'];
    if (id === undefined || id === '') return notFound(event, 'Projeto não encontrado');

    const projeto = await getProjeto(id);
    if (projeto === null) return notFound(event, 'Projeto não encontrado');
    if (projeto.status !== 'EM_ANALISE') {
      return badRequest(event, 'Projeto só pode ser aprovado durante a análise', 'INVALID_STATUS_TRANSITION');
    }

    const body = validate(aprovarSchema, JSON.parse(event.body ?? '{}'));
    const now = new Date().toISOString();
    const ttl = Math.floor(Date.now() / 1000) + 7_776_000;

    const notas = [body.scorecard.localizacaoNota, body.scorecard.financeiraNota, body.scorecard.documentacaoNota, body.scorecard.equipeNota, body.scorecard.riscoNota];
    const pesos = [0.25, 0.25, 0.20, 0.15, 0.15];
    const notaGeral = Math.round(notas.reduce((acc, n, i) => acc + (n ?? 0) * (pesos[i] ?? 0), 0) * 10) / 10;

    const scorecard: Scorecard = {
      projetoId: id,
      revisao: projeto.revisao,
      analistaId,
      analistaNome: analistaEmail,
      ...body.scorecard,
      notaGeral,
      decisao: 'APROVADO',
      criadoEm: now,
      atualizadoEm: now,
    };

    const auditoria: AuditoriaEntry = {
      projetoId: id,
      criadoEm: now,
      acao: 'APROVADO',
      userId: analistaId,
      userName: analistaEmail,
      descricao: `Projeto aprovado. Nota geral: ${String(notaGeral)}`,
      statusAnterior: 'EM_ANALISE',
      statusNovo: 'APROVADO',
    };

    const notificacao: Notificacao = {
      userId: projeto.incorporadoraId,
      criadoEm: now,
      id: uuidv4(),
      tipo: 'APROVADO',
      titulo: 'Projeto aprovado!',
      mensagem: `Parabéns! O projeto "${projeto.nome}" foi aprovado pela curadoria Atlas Hub.`,
      lida: false,
      projetoId: id,
      projetoNome: projeto.nome,
      ttl,
    };

    await putScorecard(scorecard);
    await updateProjeto(id, { status: 'APROVADO', aprovadoEm: now });
    await putAuditoria(auditoria);
    await putNotificacao(notificacao);

    try { await emailAprovado('', projeto.nome); } catch { void 0; }

    log.info('Project approved', { projetoId: id, analistaId, notaGeral });
    return ok(event, { status: 'APROVADO', notaGeral });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof ForbiddenError) return forbidden(event);
    if (err instanceof ValidationError) return badRequest(event, err.message);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
