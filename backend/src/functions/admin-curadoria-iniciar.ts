import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, unauthorized, forbidden, badRequest, notFound, serverError } from '../shared/http/response.js';
import { getUserId, AuthError, ForbiddenError, requireAdmin, getUserEmail } from '../shared/http/auth.js';
import { getProjeto, updateProjeto, putAuditoria, putNotificacao } from '../shared/db/index.js';
import { createLogger } from '../shared/core/logger.js';
import { v4 as uuidv4 } from 'uuid';
import type { AuditoriaEntry, Notificacao } from '../shared/core/types/index.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('adminCuradoriaIniciar');
  try {
    const analistaId = getUserId(event);
    const analistaEmail = getUserEmail(event);
    requireAdmin(event);

    const id = event.pathParameters?.['id'];
    if (id === undefined || id === '') return notFound(event, 'Projeto não encontrado');

    const projeto = await getProjeto(id);
    if (projeto === null) return notFound(event, 'Projeto não encontrado');
    if (projeto.status !== 'SUBMETIDO') {
      return badRequest(event, 'Análise só pode ser iniciada em projetos com status SUBMETIDO', 'INVALID_STATUS_TRANSITION');
    }

    const now = new Date().toISOString();
    const ttl = Math.floor(Date.now() / 1000) + 7_776_000;

    await updateProjeto(id, {
      status: 'EM_ANALISE',
      analistaId,
      analistaNome: analistaEmail,
    });

    const auditoria: AuditoriaEntry = {
      projetoId: id,
      criadoEm: now,
      acao: 'ANALISE_INICIADA',
      userId: analistaId,
      userName: analistaEmail,
      descricao: 'Análise iniciada pelo analista',
      statusAnterior: 'SUBMETIDO',
      statusNovo: 'EM_ANALISE',
    };

    const notificacao: Notificacao = {
      userId: projeto.incorporadoraId,
      criadoEm: now,
      id: uuidv4(),
      tipo: 'ANALISE_INICIADA',
      titulo: 'Análise iniciada',
      mensagem: `Um analista iniciou a revisão do projeto "${projeto.nome}".`,
      lida: false,
      projetoId: id,
      projetoNome: projeto.nome,
      ttl,
    };

    await putAuditoria(auditoria);
    await putNotificacao(notificacao);

    log.info('Analysis started', { projetoId: id, analistaId });
    return ok(event, { status: 'EM_ANALISE' });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof ForbiddenError) return forbidden(event);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
