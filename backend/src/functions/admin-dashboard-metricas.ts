import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, unauthorized, forbidden, serverError } from '../shared/http/response.js';
import { getUserId, AuthError, ForbiddenError, requireAdmin } from '../shared/http/auth.js';
import { listProjetosByStatus } from '../shared/db/index.js';
import { createLogger } from '../shared/core/logger.js';
import type { StatusProjeto } from '../shared/core/types/index.js';

const ALL_STATUSES: StatusProjeto[] = ['RASCUNHO', 'SUBMETIDO', 'EM_ANALISE', 'AJUSTE_SOLICITADO', 'REPROVADO', 'APROVADO', 'OFERTA_CRIADA'];

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('adminDashboardMetricas');
  try {
    getUserId(event);
    requireAdmin(event);

    const metricas: Record<string, number> = {};
    await Promise.all(ALL_STATUSES.map(async (status) => {
      const { items } = await listProjetosByStatus([status]);
      metricas[status] = items.length;
    }));

    const total = Object.values(metricas).reduce((a, b) => a + b, 0);
    log.info('Dashboard metrics computed', { total });
    return ok(event, { metricas, total });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof ForbiddenError) return forbidden(event);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
