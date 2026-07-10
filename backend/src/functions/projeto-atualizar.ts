import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, unauthorized, forbidden, badRequest, notFound, serverError } from '../shared/http/response.js';
import { getUserId, AuthError, ForbiddenError, requirePerfil } from '../shared/http/auth.js';
import { validate, atualizarProjetoSchema, ValidationError } from '../shared/http/validators.js';
import { getProjeto, updateProjeto, putAuditoria } from '../shared/db/index.js';
import { createLogger } from '../shared/core/logger.js';
import type { AuditoriaEntry } from '../shared/core/types/index.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('projetoAtualizar');
  try {
    const userId = getUserId(event);
    requirePerfil(event, 'INCORPORADORA');
    const id = event.pathParameters?.['id'];
    if (id === undefined || id === '') return notFound(event, 'Projeto não encontrado');

    const projeto = await getProjeto(id);
    if (projeto === null) return notFound(event, 'Projeto não encontrado');
    if (projeto.incorporadoraId !== userId) return forbidden(event);
    if (projeto.status !== 'RASCUNHO' && projeto.status !== 'AJUSTE_SOLICITADO') {
      return badRequest(event, 'Projeto só pode ser editado quando está em Rascunho ou Ajuste Solicitado', 'INVALID_STATUS_TRANSITION');
    }

    const body = validate(atualizarProjetoSchema, JSON.parse(event.body ?? '{}'));
    await updateProjeto(id, body as Parameters<typeof updateProjeto>[1]);

    const auditoria: AuditoriaEntry = {
      projetoId: id,
      criadoEm: new Date().toISOString(),
      acao: 'ATUALIZADO',
      userId,
      userName: 'Incorporadora',
      descricao: 'Projeto atualizado',
    };
    await putAuditoria(auditoria);

    log.info('Project updated', { projetoId: id, userId });
    return ok(event, { updated: true });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof ForbiddenError) return forbidden(event);
    if (err instanceof ValidationError) return badRequest(event, err.message);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
