export interface AnalyticsContext {
  readonly path?: string;
  readonly referrer?: string;
  readonly utmSource?: string;
  readonly utmMedium?: string;
  readonly utmCampaign?: string;
  readonly utmContent?: string;
  readonly utmTerm?: string;
  readonly browser?: string;
  readonly os?: string;
  readonly device?: string;
  readonly screenWidth?: number;
  readonly screenHeight?: number;
  readonly language?: string;
  readonly timeZone?: string;
  readonly country?: string;
  readonly region?: string;
  readonly city?: string;
}

export interface AnalyticsEventRecord {
  readonly id: string;
  readonly sessionId: string;
  readonly anonymousId: string;
  readonly userId?: string;
  readonly eventName: string;
  readonly ts: string;
  readonly dayKey: string;
  readonly props?: Record<string, unknown>;
  readonly context?: AnalyticsContext;
  readonly ipHash?: string;
  readonly userEventKey?: string;
  readonly nameTsKey?: string;
}

export interface AnalyticsSessionRecord {
  readonly sessionId: string;
  readonly anonymousId: string;
  readonly userId?: string;
  readonly startedAt: string;
  readonly lastSeenAt: string;
  readonly landingPath?: string;
  readonly referrer?: string;
  readonly utmSource?: string;
  readonly device?: string;
  readonly browser?: string;
  readonly os?: string;
  readonly country?: string;
  readonly region?: string;
  readonly city?: string;
  readonly eventCount: number;
  readonly pageViews: number;
}

export interface AnalyticsDailyAggRecord {
  readonly dayKey: string;
  readonly metricKey: string;
  readonly count: number;
  readonly sumMs?: number;
}

export interface AnalyticsHeatCellRecord {
  readonly pageKey: string;
  readonly cellKey: string;
  readonly count: number;
  readonly updatedAt: string;
}

export interface AnalyticsAlertRecord {
  readonly id: string;
  readonly name: string;
  readonly rule: string;
  readonly threshold: number;
  readonly active: boolean;
  readonly lastTriggeredAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AnalyticsReplayMeta {
  readonly id: string;
  readonly sessionId: string;
  readonly anonymousId: string;
  readonly userId?: string;
  readonly startedAt: string;
  readonly endedAt?: string;
  readonly chunkCount: number;
  readonly location?: string;
  readonly eventsJson?: string;
}
