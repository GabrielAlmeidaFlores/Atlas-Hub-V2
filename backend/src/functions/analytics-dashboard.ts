import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, unauthorized, forbidden, serverError } from '../shared/http/response.js';
import { getUserId, requireAdmin, AuthError, ForbiddenError } from '../shared/http/auth.js';
import {
  listDailyAggs,
  listEventsByDay,
  listEventsByName,
  listSessions,
} from '../shared/analytics/db.js';
import {
  eventMatchesFilters,
  hasSegmentFilters,
  parseSegmentFilters,
  sessionMatchesFilters,
} from '../shared/analytics/filters.js';
import type { AnalyticsEventRecord } from '../shared/analytics/types.js';
import { createLogger } from '../shared/core/logger.js';

function daysBack(n: number): string[] {
  const out: string[] = [];
  const d = new Date();
  for (let i = 0; i < n; i += 1) {
    const x = new Date(d);
    x.setUTCDate(d.getUTCDate() - i);
    out.push(x.toISOString().slice(0, 10));
  }
  return out.reverse();
}

function identityOf(e: AnalyticsEventRecord): string {
  return e.userId ?? e.anonymousId;
}

function countMetric(items: { metricKey: string; count: number }[], key: string): number {
  return items.find((a) => a.metricKey === key)?.count ?? 0;
}

function breakdownFromAggs(items: { metricKey: string; count: number }[], kind: string) {
  return items
    .filter((a) => a.metricKey.startsWith(`${kind}:`))
    .map((a) => ({ key: a.metricKey.slice(kind.length + 1), count: a.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function breakdownFromEvents(events: AnalyticsEventRecord[], pick: (e: AnalyticsEventRecord) => string | undefined) {
  const map = new Map<string, number>();
  for (const e of events) {
    const key = pick(e);
    if (key === undefined || key === '') continue;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function avgSessionMsFromSessions(
  sessions: Awaited<ReturnType<typeof listSessions>>,
  sinceMs: number,
): number {
  const durations = sessions
    .filter((s) => new Date(s.lastSeenAt).getTime() >= sinceMs)
    .map((s) => new Date(s.lastSeenAt).getTime() - new Date(s.startedAt).getTime())
    .filter((ms) => ms > 0 && ms < 4 * 60 * 60 * 1000);
  if (durations.length === 0) return 0;
  return Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
}

function retentionD1(yesterday: AnalyticsEventRecord[], today: AnalyticsEventRecord[]): number {
  const yIds = new Set(yesterday.map(identityOf));
  if (yIds.size === 0) return 0;
  const tIds = new Set(today.map(identityOf));
  let hit = 0;
  for (const id of yIds) {
    if (tIds.has(id)) hit += 1;
  }
  return Math.round((hit / yIds.size) * 1000) / 10;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('analyticsDashboard');
  try {
    getUserId(event);
    requireAdmin(event);

    const range = Math.min(Math.max(Number(event.queryStringParameters?.['days'] ?? '7'), 1), 30);
    const filters = parseSegmentFilters(event);
    const segmented = hasSegmentFilters(filters);
    const days = daysBack(range);
    const today = days[days.length - 1] ?? new Date().toISOString().slice(0, 10);
    const yesterday = days.length >= 2 ? days[days.length - 2] : undefined;
    const sinceMs = Date.now() - range * 24 * 60 * 60 * 1000;

    const eventsByDay = await Promise.all(
      days.map(async (day) => {
        const items = await listEventsByDay(day, segmented ? 500 : 200);
        return {
          day,
          items: segmented ? items.filter((e) => eventMatchesFilters(e, filters)) : items,
        };
      }),
    );

    const todayEvents = eventsByDay.find((d) => d.day === today)?.items ?? [];
    const yesterdayEvents = yesterday !== undefined
      ? (eventsByDay.find((d) => d.day === yesterday)?.items ?? [])
      : [];

    let visitorsToday: number;
    let sessionsToday: number;
    let signupsToday: number;
    let loginsToday: number;
    let formViews: number;
    let formStarts: number;
    let visitorsByDay: { day: string; visitors: number; conversions: number }[];
    let trafficSources: { key: string; count: number }[];
    let devices: { key: string; count: number }[];
    let browsers: { key: string; count: number }[];
    let operatingSystems: { key: string; count: number }[];
    let countries: { key: string; count: number }[];
    let regions: { key: string; count: number }[];
    let cities: { key: string; count: number }[];
    let topEvents: { eventName: string; count: number; recent: number }[];

    if (segmented) {
      const pageViews = todayEvents.filter((e) => e.eventName === 'page_view');
      visitorsToday = new Set(pageViews.map(identityOf)).size;
      sessionsToday = new Set(todayEvents.map((e) => e.sessionId)).size;
      signupsToday = todayEvents.filter((e) => e.eventName === 'signup' || e.eventName === 'form_submit').length;
      loginsToday = todayEvents.filter((e) => e.eventName === 'login').length;
      formViews = todayEvents.filter((e) => e.eventName === 'form_view').length;
      formStarts = todayEvents.filter((e) => e.eventName === 'form_start').length;

      visitorsByDay = eventsByDay.map(({ day, items }) => ({
        day,
        visitors: new Set(items.filter((e) => e.eventName === 'page_view').map(identityOf)).size,
        conversions: items.filter((e) => e.eventName === 'form_submit' || e.eventName === 'signup').length,
      }));

      trafficSources = breakdownFromEvents(todayEvents, (e) => e.context?.utmSource);
      devices = breakdownFromEvents(todayEvents, (e) => e.context?.device);
      browsers = breakdownFromEvents(todayEvents, (e) => e.context?.browser);
      operatingSystems = breakdownFromEvents(todayEvents, (e) => e.context?.os);
      countries = breakdownFromEvents(todayEvents, (e) => e.context?.country);
      regions = breakdownFromEvents(todayEvents, (e) => e.context?.region);
      cities = breakdownFromEvents(todayEvents, (e) => e.context?.city);

      const topEventNames = [
        'cta_click', 'whatsapp_click', 'form_submit', 'login', 'signup', 'project_created', 'project_submitted',
      ] as const;
      topEvents = topEventNames.map((name) => ({
        eventName: name,
        count: todayEvents.filter((e) => e.eventName === name).length,
        recent: todayEvents.filter((e) => e.eventName === name).slice(0, 5).length,
      }));
    } else {
      const aggsByDay = await Promise.all(days.map(async (day) => ({ day, items: await listDailyAggs(day) })));
      const todayAggs = aggsByDay.find((d) => d.day === today)?.items ?? [];

      visitorsToday = countMetric(todayAggs, 'event:page_view');
      sessionsToday = countMetric(todayAggs, 'sessions_touch');
      signupsToday = countMetric(todayAggs, 'event:signup') + countMetric(todayAggs, 'event:form_submit');
      loginsToday = countMetric(todayAggs, 'event:login');
      formViews = countMetric(todayAggs, 'event:form_view');
      formStarts = countMetric(todayAggs, 'event:form_start');

      visitorsByDay = aggsByDay.map(({ day, items }) => ({
        day,
        visitors: countMetric(items, 'event:page_view'),
        conversions: countMetric(items, 'event:form_submit') + countMetric(items, 'event:signup'),
      }));

      trafficSources = breakdownFromAggs(todayAggs, 'utm');
      devices = breakdownFromAggs(todayAggs, 'device');
      browsers = breakdownFromAggs(todayAggs, 'browser');
      operatingSystems = breakdownFromAggs(todayAggs, 'os');
      countries = breakdownFromAggs(todayAggs, 'country');
      regions = breakdownFromAggs(todayAggs, 'region');
      cities = breakdownFromAggs(todayAggs, 'city');

      const topEventNames = [
        'cta_click', 'whatsapp_click', 'form_submit', 'login', 'signup', 'project_created', 'project_submitted',
      ] as const;
      topEvents = await Promise.all(topEventNames.map(async (name) => ({
        eventName: name,
        count: countMetric(todayAggs, `event:${name}`),
        recent: (await listEventsByName(name, 5)).length,
      })));
    }

    const bounceRate = formViews > 0 ? Math.round(((formViews - formStarts) / formViews) * 1000) / 10 : 0;
    const conversion = visitorsToday > 0 ? Math.round((signupsToday / visitorsToday) * 1000) / 10 : 0;

    const allSessions = await listSessions(100);
    const sessions = allSessions.filter((s) => sessionMatchesFilters(s, filters));
    const avgSessionMs = avgSessionMsFromSessions(sessions, sinceMs);
    const retention = retentionD1(yesterdayEvents, todayEvents);

    log.info('Analytics dashboard loaded', { segmented, days: range });
    return ok(event, {
      cards: {
        visitorsToday,
        activeUsers: loginsToday,
        newSignups: signupsToday,
        conversion,
        bounceRate,
        avgSessionMs,
        sessions: sessionsToday,
        retentionD1: retention,
      },
      visitorsByDay,
      trafficSources,
      devices,
      browsers,
      operatingSystems,
      countries,
      regions,
      cities,
      topEvents,
      recentSessions: sessions.slice(0, 10),
    });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof ForbiddenError) return forbidden(event);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
