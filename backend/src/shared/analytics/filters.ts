import type { APIGatewayProxyEvent } from 'aws-lambda';
import type { AnalyticsContext, AnalyticsEventRecord, AnalyticsSessionRecord } from './types.js';

export interface AnalyticsSegmentFilters {
  readonly utm?: string;
  readonly device?: string;
  readonly os?: string;
  readonly browser?: string;
  readonly geo?: string;
  readonly userId?: string;
}

export function parseSegmentFilters(event: APIGatewayProxyEvent): AnalyticsSegmentFilters {
  const q = event.queryStringParameters ?? {};
  const pick = (key: string): string | undefined => {
    const v = q[key]?.trim();
    return v !== undefined && v !== '' ? v : undefined;
  };
  const utm = pick('utm');
  const device = pick('device');
  const os = pick('os');
  const browser = pick('browser');
  const geo = pick('geo');
  const userId = pick('userId');
  return {
    ...(utm !== undefined ? { utm } : {}),
    ...(device !== undefined ? { device } : {}),
    ...(os !== undefined ? { os } : {}),
    ...(browser !== undefined ? { browser } : {}),
    ...(geo !== undefined ? { geo } : {}),
    ...(userId !== undefined ? { userId } : {}),
  };
}

export function hasSegmentFilters(f: AnalyticsSegmentFilters): boolean {
  return (
    f.utm !== undefined
    || f.device !== undefined
    || f.os !== undefined
    || f.browser !== undefined
    || f.geo !== undefined
    || f.userId !== undefined
  );
}

function matchesContext(ctx: AnalyticsContext | undefined, f: AnalyticsSegmentFilters): boolean {
  if (f.utm !== undefined) {
    const utm = (ctx?.utmSource ?? '').toLowerCase();
    if (!utm.includes(f.utm.toLowerCase())) return false;
  }
  if (f.device !== undefined && (ctx?.device ?? '').toLowerCase() !== f.device.toLowerCase()) return false;
  if (f.os !== undefined && !(ctx?.os ?? '').toLowerCase().includes(f.os.toLowerCase())) return false;
  if (f.browser !== undefined && !(ctx?.browser ?? '').toLowerCase().includes(f.browser.toLowerCase())) return false;
  if (f.geo !== undefined) {
    const geo = f.geo.toLowerCase();
    const hay = `${ctx?.country ?? ''} ${ctx?.region ?? ''} ${ctx?.city ?? ''}`.toLowerCase();
    if (!hay.includes(geo)) return false;
  }
  return true;
}

export function eventMatchesFilters(e: AnalyticsEventRecord, f: AnalyticsSegmentFilters): boolean {
  if (f.userId !== undefined && e.userId !== f.userId) return false;
  return matchesContext(e.context, f);
}

export function sessionMatchesFilters(s: AnalyticsSessionRecord, f: AnalyticsSegmentFilters): boolean {
  if (f.userId !== undefined && s.userId !== f.userId) return false;
  const ctx: AnalyticsContext = {
    ...(s.utmSource !== undefined ? { utmSource: s.utmSource } : {}),
    ...(s.device !== undefined ? { device: s.device } : {}),
    ...(s.os !== undefined ? { os: s.os } : {}),
    ...(s.browser !== undefined ? { browser: s.browser } : {}),
    ...(s.country !== undefined ? { country: s.country } : {}),
    ...(s.region !== undefined ? { region: s.region } : {}),
    ...(s.city !== undefined ? { city: s.city } : {}),
  };
  return matchesContext(ctx, f);
}

export function approxGeoFromTimezone(timeZone: string, language: string): Pick<AnalyticsContext, 'country' | 'region' | 'city'> {
  const tz = timeZone.toLowerCase();
  const lang = language.toLowerCase();
  if (tz.includes('sao_paulo') || tz.includes('fortaleza') || tz.includes('bahia') || tz.includes('manaus') || lang.startsWith('pt-br')) {
    return {
      country: 'BR',
      ...(tz.includes('sao_paulo') ? { region: 'SP' } : {}),
    };
  }
  if (tz.includes('lisbon') || lang.startsWith('pt-pt')) return { country: 'PT' };
  if (tz.includes('new_york') || tz.includes('chicago') || tz.includes('los_angeles')) return { country: 'US' };
  if (tz.includes('buenos_aires')) return { country: 'AR' };
  if (tz.includes('santiago')) return { country: 'CL' };
  if (tz.includes('bogota')) return { country: 'CO' };
  if (tz.includes('mexico')) return { country: 'MX' };
  if (lang.includes('-')) {
    const region = lang.split('-')[1];
    if (region !== undefined && region.length === 2) return { country: region.toUpperCase() };
  }
  return {};
}
