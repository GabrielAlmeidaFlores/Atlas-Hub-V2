import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, unauthorized, forbidden, serverError } from '../shared/http/response.js';
import { getUserId, requireAdmin, AuthError, ForbiddenError } from '../shared/http/auth.js';
import { listHeatCells } from '../shared/analytics/db.js';
import { createLogger } from '../shared/core/logger.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('analyticsHeatmap');
  try {
    getUserId(event);
    requireAdmin(event);

    const path = event.queryStringParameters?.['path'] ?? '/';
    const day = event.queryStringParameters?.['day'] ?? new Date().toISOString().slice(0, 10);
    const pageKey = `${path}#${day}`;
    const cells = await listHeatCells(pageKey);

    const clicks = cells
      .filter((c) => c.cellKey.startsWith('click:'))
      .map((c) => {
        const [, x, y] = c.cellKey.split(':');
        return { x: Number(x), y: Number(y), count: c.count };
      });
    const scrolls = cells
      .filter((c) => c.cellKey.startsWith('scroll:'))
      .map((c) => ({ band: c.cellKey.replace('scroll:', ''), count: c.count }));

    log.info('Heatmap loaded', { pageKey, clicks: clicks.length });
    return ok(event, { path, day, pageKey, clicks, scrolls });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof ForbiddenError) return forbidden(event);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
