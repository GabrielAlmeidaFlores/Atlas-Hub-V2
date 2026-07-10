import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, unauthorized, forbidden, badRequest, notFound, serverError } from '../shared/http/response.js';
import { getUserId, AuthError, ForbiddenError, requireAdmin, getUserEmail } from '../shared/http/auth.js';
import { validate, reprovarSchema, ValidationError } from '../shared/http/validators.js';
import { getProjeto, updateProjeto, putScorecard, putAuditoria, putNotificacao } from '../shared/db/index.js';
import { emailReprovado } from '../shared/email/index.js';
import { createLogger } from '../shared/core/logger.js';
import { v4 as uuidv4 } from 'uuid';
import type { AuditoriaEntry, Notificacao, Scorecard } from '../shared/core/types/index.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('adminCuradoriaReprovar');
  try {
    const analistaId = getUserId(event);
    const analistaEmail = getUserEmail(event);
    requireAdmin(event);

    const id = event.pathParameters?.['id'];
    if (id === undefined || id === '') return notFound(event, 'Projeto não encontrado');

    const projeto = await getProjeto(id);
    if (projeto === null) return notFound(event, 'Projeto não encontrado');
    if (projeto.status !== 'EM_ANALISE') {
      return badRequest(event, 'Projeto só pode ser reprovado durante a análise', 'INVALID_STATUS_TRANSITION');
    }

    const body = validate(reprovarSchema, JSON.parse(event.body ?? '{}'));
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
      decisao: 'REPROVADO',
      criadoEm: now,
      atualizadoEm: now,
    };

    const auditoria: AuditoriaEntry = {
      projetoId: id,
      criadoEm: now,
      acao: 'REPROVADO',
      userId: analistaId,
      userName: analistaEmail,
      descricao: `Projeto reprovado. Justificativa: ${body.justificativa}`,
      statusAnterior: 'EM_ANALISE',
      statusNovo: 'REPROVADO',
    };

    const notificacao: Notificacao = {
      userId: projeto.incorporadoraId,
      criadoEm: now,
      id: uuidv4(),
      tipo: 'REPROVADO',
      titulo: 'Projeto reprovado',
      mensagem: `O projeto "${projeto.nome}" foi reprovado.`,
      lida: false,
      projetoId: id,
      projetoNome: projeto.nome,
      ttl,
    };

    await putScorecard(scorecard);
    await updateProjeto(id, { status: 'REPROVADO', reprovadoEm: now, justificativaReprovacao: body.justificativa });
    await putAuditoria(auditoria);
    await putNotificacao(notificacao);

    try { await emailReprovado('', projeto.nome, body.justificativa); } catch { /* email non-blocking */ }

    log.info('Project rejected', { projetoId: id, analistaId, notaGeral });
    return ok(event, { status: 'REPROVADO', notaGeral });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof ForbiddenError) return forbidden(event);
    if (err instanceof ValidationError) return badRequest(event, err.message);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
