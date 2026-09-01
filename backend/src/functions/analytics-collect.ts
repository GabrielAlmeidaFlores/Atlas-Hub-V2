import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, badRequest, serverError } from '../shared/http/response.js';
import { validate, analyticsCollectSchema, ValidationError } from '../shared/http/validators.js';
import { EVENT_CATALOG } from '../shared/analytics/catalog.js';
import {
  buildEvent,
  hashIp,
  incrementDailyAgg,
  incrementHeatCell,
  putAnalyticsEvents,
  upsertAnalyticsSession,
  mergeAnonymousToUser,
} from '../shared/analytics/db.js';
import type { AnalyticsContext } from '../shared/analytics/types.js';
import { approxGeoFromTimezone } from '../shared/analytics/filters.js';
import { createLogger } from '../shared/core/logger.js';
import { getUserId, AuthError } from '../shared/http/auth.js';

const allowed = new Set<string>(EVENT_CATALOG);

function clientIp(event: APIGatewayProxyEvent): string {
  const fwd = event.headers['X-Forwarded-For'] ?? event.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length > 0) return fwd.split(',')[0]?.trim() ?? '0.0.0.0';
  return event.requestContext.identity?.sourceIp ?? '0.0.0.0';
}

function headerValue(event: APIGatewayProxyEvent, name: string): string | undefined {
  const lower = name.toLowerCase();
  for (const [key, value] of Object.entries(event.headers ?? {})) {
    if (key.toLowerCase() === lower && typeof value === 'string' && value.trim() !== '') {
      return value.trim();
    }
  }
  return undefined;
}

function sanitizeContext(
  raw: Record<string, unknown> | undefined,
  edgeCountry: string | undefined,
): AnalyticsContext | undefined {
  const out: Record<string, string | number> = {};
  if (raw !== undefined) {
    for (const [key, value] of Object.entries(raw)) {
      if (value === undefined || value === null) continue;
      if (typeof value === 'string' || typeof value === 'number') out[key] = value;
    }
  }
  if (out['country'] === undefined && edgeCountry !== undefined) {
    out['country'] = edgeCountry.toUpperCase();
  }
  if (out['country'] === undefined) {
    const language = typeof out['language'] === 'string' ? out['language'] : '';
    const timeZone = typeof raw?.['timeZone'] === 'string' ? raw['timeZone'] : '';
    const approx = approxGeoFromTimezone(timeZone, language);
    if (approx.country !== undefined) out['country'] = approx.country;
    if (approx.region !== undefined && out['region'] === undefined) out['region'] = approx.region;
    if (approx.city !== undefined && out['city'] === undefined) out['city'] = approx.city;
  }
  return Object.keys(out).length > 0 ? (out as AnalyticsContext) : undefined;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('analyticsCollect');
  try {
    const body = validate(analyticsCollectSchema, JSON.parse(event.body ?? '{}'));
    let userId = body.userId;
    try {
      userId = getUserId(event);
    } catch (err) {
      if (!(err instanceof AuthError)) throw err;
    }

    if (userId !== undefined && userId !== '' && body.anonymousId !== '') {
      await mergeAnonymousToUser(body.anonymousId, userId);
    }

    const ipHash = hashIp(clientIp(event));
    const edgeCountry = headerValue(event, 'CloudFront-Viewer-Country');
    const now = new Date().toISOString();
    const records = [];
    let pageViews = 0;
    const daily = new Map<string, number>();
    const heat = new Map<string, number>();

    function bumpDaily(day: string, key: string, by = 1): void {
      const k = `${day}||${key}`;
      daily.set(k, (daily.get(k) ?? 0) + by);
    }

    for (const item of body.events) {
      if (!allowed.has(item.eventName)) {
        return badRequest(event, `Evento não permitido: ${item.eventName}`);
      }
      const ctx = sanitizeContext(item.context as Record<string, unknown> | undefined, edgeCountry);
      const record = buildEvent({
        sessionId: body.sessionId,
        anonymousId: body.anonymousId,
        ...(userId !== undefined && userId !== '' ? { userId } : {}),
        eventName: item.eventName,
        ...(item.ts !== undefined ? { ts: item.ts } : {}),
        ...(item.props !== undefined ? { props: item.props } : {}),
        ...(ctx !== undefined ? { context: ctx } : {}),
        ipHash,
      });
      records.push(record);
      if (item.eventName === 'page_view') pageViews += 1;

      const day = record.dayKey;
      bumpDaily(day, `event:${item.eventName}`);
      bumpDaily(day, 'events_total');
      if (ctx?.device !== undefined) bumpDaily(day, `device:${ctx.device}`);
      if (ctx?.browser !== undefined) bumpDaily(day, `browser:${ctx.browser}`);
      if (ctx?.os !== undefined) bumpDaily(day, `os:${ctx.os}`);
      if (ctx?.utmSource !== undefined) bumpDaily(day, `utm:${ctx.utmSource}`);
      if (ctx?.country !== undefined) bumpDaily(day, `country:${ctx.country}`);
      if (ctx?.region !== undefined) bumpDaily(day, `region:${ctx.region}`);
      if (ctx?.city !== undefined) bumpDaily(day, `city:${ctx.city}`);

      if (item.eventName === 'heatmap_click') {
        const x = Number(item.props?.['xNorm'] ?? 0);
        const y = Number(item.props?.['yNorm'] ?? 0);
        const path = String(ctx?.path ?? item.props?.['path'] ?? '/');
        const cellX = Math.min(19, Math.max(0, Math.floor(x * 20)));
        const cellY = Math.min(29, Math.max(0, Math.floor(y * 30)));
        const hk = `${path}#${day}||click:${String(cellX)}:${String(cellY)}`;
        heat.set(hk, (heat.get(hk) ?? 0) + 1);
      }
      if (item.eventName === 'heatmap_scroll' || item.eventName.startsWith('scroll_')) {
        const path = String(ctx?.path ?? '/');
        const band = String(item.props?.['band'] ?? item.eventName.replace('scroll_', ''));
        const hk = `${path}#${day}||scroll:${band}`;
        heat.set(hk, (heat.get(hk) ?? 0) + 1);
      }
    }

    await putAnalyticsEvents(records);

    await Promise.all([
      ...[...daily.entries()].map(([k, by]) => {
        const [day, metric] = k.split('||');
        return incrementDailyAgg(day ?? '', metric ?? '', by);
      }),
      ...[...heat.entries()].map(([k, by]) => {
        const [pageKey, cellKey] = k.split('||');
        return incrementHeatCell(pageKey ?? '', cellKey ?? '', by);
      }),
    ]);

    const first = body.events[0];
    const firstCtx = sanitizeContext(first?.context as Record<string, unknown> | undefined, edgeCountry);
    await upsertAnalyticsSession({
      sessionId: body.sessionId,
      anonymousId: body.anonymousId,
      ...(userId !== undefined && userId !== '' ? { userId } : {}),
      startedAt: first?.ts ?? now,
      lastSeenAt: now,
      ...(firstCtx?.path !== undefined ? { landingPath: firstCtx.path } : {}),
      ...(firstCtx?.referrer !== undefined ? { referrer: firstCtx.referrer } : {}),
      ...(firstCtx?.utmSource !== undefined ? { utmSource: firstCtx.utmSource } : {}),
      ...(firstCtx?.device !== undefined ? { device: firstCtx.device } : {}),
      ...(firstCtx?.browser !== undefined ? { browser: firstCtx.browser } : {}),
      ...(firstCtx?.os !== undefined ? { os: firstCtx.os } : {}),
      ...(firstCtx?.country !== undefined ? { country: firstCtx.country } : {}),
      ...(firstCtx?.region !== undefined ? { region: firstCtx.region } : {}),
      ...(firstCtx?.city !== undefined ? { city: firstCtx.city } : {}),
      eventCount: body.events.length,
      pageViews,
    });

    bumpDaily(now.slice(0, 10), 'sessions_touch');
    await incrementDailyAgg(now.slice(0, 10), 'sessions_touch', 1);

    log.info('Analytics batch collected', { count: records.length, sessionId: body.sessionId });
    return ok(event, { accepted: records.length });
  } catch (err) {
    if (err instanceof ValidationError) return badRequest(event, err.message);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
