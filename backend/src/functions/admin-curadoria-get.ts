import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, unauthorized, forbidden, notFound, serverError } from '../shared/http/response.js';
import { getUserId, AuthError, ForbiddenError, requireAdmin } from '../shared/http/auth.js';
import { getProjeto, getIncorporadora, listScorecardsByProjeto, listAuditoriaProjeto, listNotasProjeto } from '../shared/db/index.js';
import { createLogger } from '../shared/core/logger.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('adminCuradoriaGet');
  try {
    getUserId(event);
    requireAdmin(event);

    const id = event.pathParameters?.['id'];
    if (id === undefined || id === '') return notFound(event, 'Projeto não encontrado');

    const projeto = await getProjeto(id);
    if (projeto === null) return notFound(event, 'Projeto não encontrado');

    const [incorporadora, scorecards, historico, notas] = await Promise.all([
      getIncorporadora(projeto.incorporadoraId),
      listScorecardsByProjeto(id),
      listAuditoriaProjeto(id),
      listNotasProjeto(id),
    ]);

    log.info('Project detail fetched for admin', { projetoId: id });
    return ok(event, { projeto, incorporadora, scorecards, historico, notas });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof ForbiddenError) return forbidden(event);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
