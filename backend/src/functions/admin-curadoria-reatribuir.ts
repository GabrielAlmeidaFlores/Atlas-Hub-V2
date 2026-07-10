import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, unauthorized, forbidden, badRequest, notFound, serverError } from '../shared/http/response.js';
import { getUserId, AuthError, ForbiddenError, requireAdminMaster, getUserEmail } from '../shared/http/auth.js';
import { validate, reatribuirSchema, ValidationError } from '../shared/http/validators.js';
import { getProjeto, updateProjeto, putAuditoria } from '../shared/db/index.js';
import { createLogger } from '../shared/core/logger.js';
import type { AuditoriaEntry } from '../shared/core/types/index.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('adminCuradoriaReatribuir');
  try {
    const adminId = getUserId(event);
    const adminEmail = getUserEmail(event);
    requireAdminMaster(event);

    const id = event.pathParameters?.['id'];
    if (id === undefined || id === '') return notFound(event, 'Projeto não encontrado');

    const projeto = await getProjeto(id);
    if (projeto === null) return notFound(event, 'Projeto não encontrado');
    if (projeto.status !== 'EM_ANALISE') {
      return badRequest(event, 'Reatribuição só é possível durante a análise', 'INVALID_STATUS_TRANSITION');
    }

    const body = validate(reatribuirSchema, JSON.parse(event.body ?? '{}'));
    const now = new Date().toISOString();

    await updateProjeto(id, { analistaId: body.analistaId });

    const auditoria: AuditoriaEntry = {
      projetoId: id,
      criadoEm: now,
      acao: 'REATRIBUIDO',
      userId: adminId,
      userName: adminEmail,
      descricao: `Projeto reatribuído para analista ${body.analistaId}. Motivo: ${body.motivo}`,
    };
    await putAuditoria(auditoria);

    log.info('Project reassigned', { projetoId: id, novoAnalistaId: body.analistaId, adminId });
    return ok(event, { updated: true });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof ForbiddenError) return forbidden(event);
    if (err instanceof ValidationError) return badRequest(event, err.message);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
