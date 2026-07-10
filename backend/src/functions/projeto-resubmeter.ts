import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, unauthorized, forbidden, badRequest, notFound, serverError } from '../shared/http/response.js';
import { getUserId, AuthError, ForbiddenError, requirePerfil } from '../shared/http/auth.js';
import { getProjeto, updateProjeto, putAuditoria } from '../shared/db/index.js';
import { createLogger } from '../shared/core/logger.js';
import type { AuditoriaEntry } from '../shared/core/types/index.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('projetoResubmeter');
  try {
    const userId = getUserId(event);
    requirePerfil(event, 'INCORPORADORA');

    const id = event.pathParameters?.['id'];
    if (id === undefined || id === '') return notFound(event, 'Projeto não encontrado');

    const projeto = await getProjeto(id);
    if (projeto === null) return notFound(event, 'Projeto não encontrado');
    if (projeto.incorporadoraId !== userId) return forbidden(event);
    if (projeto.status !== 'AJUSTE_SOLICITADO' && projeto.status !== 'REPROVADO') {
      return badRequest(event, 'Projeto não pode ser resubmetido no status atual', 'INVALID_STATUS_TRANSITION');
    }

    const now = new Date().toISOString();

    await updateProjeto(id, {
      status: 'SUBMETIDO',
      revisao: projeto.revisao + 1,
      submetidoEm: now,
    });

    const auditoria: AuditoriaEntry = {
      projetoId: id,
      criadoEm: now,
      acao: 'RESUBMETIDO',
      userId,
      userName: 'Incorporadora',
      descricao: `Projeto resubmetido (revisão ${projeto.revisao + 1})`,
      statusAnterior: projeto.status,
      statusNovo: 'SUBMETIDO',
    };

    await putAuditoria(auditoria);
    log.info('Project resubmitted', { projetoId: id, userId, revisao: projeto.revisao + 1 });
    return ok(event, { status: 'SUBMETIDO', revisao: projeto.revisao + 1 });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof ForbiddenError) return forbidden(event);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
