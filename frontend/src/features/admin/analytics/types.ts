export interface AnalyticsDashboard {
  cards: {
    visitorsToday: number;
    activeUsers: number;
    newSignups: number;
    conversion: number;
    bounceRate: number;
    avgSessionMs: number;
    sessions: number;
    retentionD1: number;
  };
  visitorsByDay: { day: string; visitors: number; conversions: number }[];
  trafficSources: { key: string; count: number }[];
  devices: { key: string; count: number }[];
  browsers: { key: string; count: number }[];
  operatingSystems: { key: string; count: number }[];
  countries: { key: string; count: number }[];
  regions: { key: string; count: number }[];
  cities: { key: string; count: number }[];
  topEvents: { eventName: string; count: number; recent: number }[];
  rangeDays?: number;
  recentSessions: {
    sessionId: string;
    anonymousId: string;
    userId?: string;
    startedAt: string;
    lastSeenAt: string;
    device?: string;
    browser?: string;
    utmSource?: string;
  }[];
}

export interface AnalyticsFunnel {
  days: number;
  steps: {
    eventName: string;
    label: string;
    count: number;
    conversionFromPrev: number;
    dropOff: number;
    avgMsBetween: number | null;
  }[];
}

export interface AnalyticsHeatmap {
  path: string;
  day: string;
  pageKey: string;
  clicks: { x: number; y: number; count: number }[];
  scrolls: { band: string; count: number }[];
}

export interface AnalyticsUserProfile {
  profile: {
    userId: string;
    nome: string | null;
    email: string | null;
    empresa: string | null;
    firstSeenAt: string | null;
    lastSeenAt: string | null;
    totalSessions: number;
    totalEvents: number;
  };
  indicators: {
    avgEventsPerSession: number;
    activeDays: number;
    logins: number;
    projectsCreated: number;
    uploads: number;
    submissions: number;
    topFeatures: { name: string; count: number }[];
  };
  device: {
    browser: string | null;
    os: string | null;
    device: string | null;
    screen: string | null;
    country: string | null;
    region: string | null;
    city: string | null;
  };
  timeline: { id: string; ts: string; eventName: string; path: string | null; props: Record<string, unknown> }[];
}

export interface AnalyticsAlert {
  id: string;
  name: string;
  rule: string;
  threshold: number;
  active: boolean;
  lastTriggeredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsReplayMeta {
  id: string;
  sessionId: string;
  anonymousId: string;
  userId?: string;
  startedAt: string;
  endedAt?: string;
  chunkCount: number;
  location?: string;
  events?: unknown[];
}

export interface AnalyticsFilters {
  days: number;
  utm: string;
  device: string;
  os: string;
  browser: string;
  geo: string;
  userId: string;
}
