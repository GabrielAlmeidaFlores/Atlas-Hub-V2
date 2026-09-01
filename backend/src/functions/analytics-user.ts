import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, unauthorized, forbidden, notFound, serverError } from '../shared/http/response.js';
import { getUserId, requireAdmin, AuthError, ForbiddenError } from '../shared/http/auth.js';
import { listEventsByUser, listSessions } from '../shared/analytics/db.js';
import { getIncorporadora } from '../shared/db/index.js';
import { createLogger } from '../shared/core/logger.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('analyticsUser');
  try {
    getUserId(event);
    requireAdmin(event);

    const userId = event.pathParameters?.['userId'];
    if (userId === undefined || userId === '') return notFound(event, 'Usuário não encontrado');

    const incorporadora = await getIncorporadora(userId);
    const events = await listEventsByUser(userId, 200);
    const sessions = (await listSessions(100)).filter((s) => s.userId === userId);

    const eventName = event.queryStringParameters?.['event'];
    const from = event.queryStringParameters?.['from'];
    const to = event.queryStringParameters?.['to'];

    let timeline = events;
    if (eventName !== undefined && eventName !== '') {
      timeline = timeline.filter((e) => e.eventName === eventName);
    }
    if (from !== undefined && from !== '') {
      timeline = timeline.filter((e) => e.ts >= from);
    }
    if (to !== undefined && to !== '') {
      timeline = timeline.filter((e) => e.ts <= to);
    }

    const featureCounts = new Map<string, number>();
    for (const e of events) {
      featureCounts.set(e.eventName, (featureCounts.get(e.eventName) ?? 0) + 1);
    }
    const topFeatures = [...featureCounts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const first = events[events.length - 1];
    const last = events[0];
    const lastSession = sessions.sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt))[0];

    log.info('User analytics loaded', { userId, events: events.length });
    return ok(event, {
      profile: {
        userId,
        nome: incorporadora?.razaoSocial ?? null,
        email: incorporadora?.email ?? null,
        empresa: incorporadora?.razaoSocial ?? null,
        plano: null,
        firstSeenAt: first?.ts ?? sessions[0]?.startedAt ?? null,
        lastSeenAt: last?.ts ?? lastSession?.lastSeenAt ?? null,
        totalSessions: sessions.length,
        totalEvents: events.length,
      },
      indicators: {
        avgEventsPerSession: sessions.length > 0 ? Math.round(events.length / sessions.length) : 0,
        activeDays: new Set(events.map((e) => e.dayKey)).size,
        logins: featureCounts.get('login') ?? 0,
        projectsCreated: featureCounts.get('project_created') ?? 0,
        uploads: (featureCounts.get('project_doc_uploaded') ?? 0)
          + (featureCounts.get('project_photo_uploaded') ?? 0)
          + (featureCounts.get('company_doc_uploaded') ?? 0),
        submissions: (featureCounts.get('project_submitted') ?? 0)
          + (featureCounts.get('project_resubmitted') ?? 0),
        topFeatures,
      },
      device: {
        browser: lastSession?.browser ?? last?.context?.browser ?? null,
        os: lastSession?.os ?? last?.context?.os ?? null,
        device: lastSession?.device ?? last?.context?.device ?? null,
        screen: last?.context?.screenWidth !== undefined && last.context.screenHeight !== undefined
          ? `${String(last.context.screenWidth)}x${String(last.context.screenHeight)}`
          : null,
        country: lastSession?.country ?? last?.context?.country ?? null,
        region: lastSession?.region ?? last?.context?.region ?? null,
        city: lastSession?.city ?? last?.context?.city ?? null,
      },
      timeline: timeline.slice(0, 100).map((e) => ({
        id: e.id,
        ts: e.ts,
        eventName: e.eventName,
        path: e.context?.path ?? null,
        props: e.props ?? {},
      })),
    });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof ForbiddenError) return forbidden(event);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
