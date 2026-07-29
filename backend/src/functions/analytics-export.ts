import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, unauthorized, forbidden, serverError } from '../shared/http/response.js';
import { getUserId, requireAdmin, AuthError, ForbiddenError } from '../shared/http/auth.js';
import { listEventsByDay, listEventsByName, listEventsByUser } from '../shared/analytics/db.js';
import { createLogger } from '../shared/core/logger.js';

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return 'empty\n';
  const keys = Object.keys(rows[0] ?? {});
  const lines = [keys.join(',')];
  for (const row of rows) {
    lines.push(keys.map((k) => JSON.stringify(row[k] ?? '')).join(','));
  }
  return `${lines.join('\n')}\n`;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('analyticsExport');
  try {
    getUserId(event);
    requireAdmin(event);

    const type = event.queryStringParameters?.['type'] ?? 'events';
    const day = event.queryStringParameters?.['day'] ?? new Date().toISOString().slice(0, 10);
    const eventName = event.queryStringParameters?.['event'];
    const userId = event.queryStringParameters?.['userId'];

    let rows: Record<string, unknown>[] = [];
    if (type === 'events' && userId !== undefined && userId !== '') {
      rows = (await listEventsByUser(userId, 500)).map((e) => ({
        id: e.id, ts: e.ts, eventName: e.eventName, sessionId: e.sessionId, path: e.context?.path ?? '',
      }));
    } else if (type === 'events' && eventName !== undefined && eventName !== '') {
      rows = (await listEventsByName(eventName, 500)).map((e) => ({
        id: e.id, ts: e.ts, eventName: e.eventName, anonymousId: e.anonymousId, userId: e.userId ?? '',
      }));
    } else {
      rows = (await listEventsByDay(day, 500)).map((e) => ({
        id: e.id, ts: e.ts, eventName: e.eventName, anonymousId: e.anonymousId, userId: e.userId ?? '',
        path: e.context?.path ?? '', device: e.context?.device ?? '',
      }));
    }

    const csv = toCsv(rows);
    log.info('Export generated', { rows: rows.length, type });
    return ok(event, { format: 'csv', filename: `atlas-analytics-${type}-${day}.csv`, csv, rowCount: rows.length });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof ForbiddenError) return forbidden(event);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
