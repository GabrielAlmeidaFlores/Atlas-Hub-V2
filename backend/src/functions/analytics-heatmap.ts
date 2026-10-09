import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, badRequest, unauthorized, forbidden, serverError } from '../shared/http/response.js';
import { getUserId, requireAdmin, AuthError, ForbiddenError } from '../shared/http/auth.js';
import { listHeatCells } from '../shared/analytics/db.js';
import { createLogger } from '../shared/core/logger.js';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DAYS = 92;

function eachDay(from: string, to: string): string[] {
  const out: string[] = [];
  const end = new Date(`${to}T00:00:00.000Z`).getTime();
  for (let t = new Date(`${from}T00:00:00.000Z`).getTime(); t <= end; t += 86_400_000) {
    out.push(new Date(t).toISOString().slice(0, 10));
  }
  return out;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('analyticsHeatmap');
  try {
    getUserId(event);
    requireAdmin(event);

    const path = event.queryStringParameters?.['path'] ?? '/';
    const today = new Date().toISOString().slice(0, 10);
    let from = event.queryStringParameters?.['from'] || event.queryStringParameters?.['day'] || today;
    let to = event.queryStringParameters?.['to'] || from;
    if (!DATE_RE.test(from) || !DATE_RE.test(to)) {
      return badRequest(event, 'Datas inválidas', 'VALIDATION_ERROR');
    }
    if (from > to) {
      const swap = from;
      from = to;
      to = swap;
    }
    const days = eachDay(from, to);
    if (days.length > MAX_DAYS) {
      return badRequest(event, `Intervalo máximo de ${String(MAX_DAYS)} dias`, 'VALIDATION_ERROR');
    }

    const clickCells = new Map<string, number>();
    const scrollCells = new Map<string, number>();
    for (const day of days) {
      const cells = await listHeatCells(`${path}#${day}`);
      for (const c of cells) {
        if (c.cellKey.startsWith('click:')) {
          clickCells.set(c.cellKey, (clickCells.get(c.cellKey) ?? 0) + c.count);
        } else if (c.cellKey.startsWith('scroll:')) {
          scrollCells.set(c.cellKey, (scrollCells.get(c.cellKey) ?? 0) + c.count);
        }
      }
    }

    const clicks = [...clickCells.entries()].map(([key, count]) => {
      const [, x, y] = key.split(':');
      return { x: Number(x), y: Number(y), count };
    });
    const scrolls = [...scrollCells.entries()].map(([key, count]) => ({
      band: key.replace('scroll:', ''),
      count,
    }));

    log.info('Heatmap loaded', { path, from, to, days: days.length, clicks: clicks.length });
    return ok(event, { path, from, to, days: days.length, clicks, scrolls });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof ForbiddenError) return forbidden(event);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
