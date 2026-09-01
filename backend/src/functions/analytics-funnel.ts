import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, unauthorized, forbidden, serverError } from '../shared/http/response.js';
import { getUserId, requireAdmin, AuthError, ForbiddenError } from '../shared/http/auth.js';
import { FUNNEL_STEPS, FUNNEL_STEP_LABELS } from '../shared/analytics/catalog.js';
import { listEventsByName } from '../shared/analytics/db.js';
import { eventMatchesFilters, parseSegmentFilters } from '../shared/analytics/filters.js';
import { createLogger } from '../shared/core/logger.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('analyticsFunnel');
  try {
    getUserId(event);
    requireAdmin(event);

    const days = Math.min(Math.max(Number(event.queryStringParameters?.['days'] ?? '14'), 1), 60);
    const filters = parseSegmentFilters(event);
    const since = Date.now() - days * 24 * 60 * 60 * 1000;

    const stepData = [];
    let previousCount: number | null = null;

    for (const step of FUNNEL_STEPS) {
      const events = await listEventsByName(step, 500);
      const filtered = events.filter(
        (e) => new Date(e.ts).getTime() >= since && eventMatchesFilters(e, filters),
      );
      const unique = new Set(filtered.map((e) => e.userId ?? e.anonymousId));
      const count = unique.size;
      const conversionFromPrev = previousCount !== null && previousCount > 0
        ? Math.round((count / previousCount) * 1000) / 10
        : 100;
      const dropOff = previousCount !== null && previousCount > 0
        ? Math.round(((previousCount - count) / previousCount) * 1000) / 10
        : 0;

      const times: number[] = [];
      if (previousCount !== null && stepData.length > 0) {
        const prevStep = FUNNEL_STEPS[stepData.length - 1];
        const prevEvents = (await listEventsByName(prevStep ?? step, 200))
          .filter((e) => eventMatchesFilters(e, filters));
        for (const cur of filtered.slice(0, 50)) {
          const identity = cur.userId ?? cur.anonymousId;
          const prev = prevEvents.find((p) => (p.userId ?? p.anonymousId) === identity && p.ts < cur.ts);
          if (prev !== undefined) {
            times.push(new Date(cur.ts).getTime() - new Date(prev.ts).getTime());
          }
        }
      }
      const avgMsBetween = times.length > 0
        ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
        : null;

      stepData.push({
        eventName: step,
        label: FUNNEL_STEP_LABELS[step] ?? step,
        count,
        conversionFromPrev,
        dropOff,
        avgMsBetween,
      });
      previousCount = count;
    }

    log.info('Funnel computed', { steps: stepData.length });
    return ok(event, { days, steps: stepData });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof ForbiddenError) return forbidden(event);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
