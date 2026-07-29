import { createHash, randomUUID } from 'node:crypto';
import {
  BatchWriteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { db } from '../db/index.js';
import { Tables } from '../core/tables.js';
import type {
  AnalyticsAlertRecord,
  AnalyticsContext,
  AnalyticsDailyAggRecord,
  AnalyticsEventRecord,
  AnalyticsHeatCellRecord,
  AnalyticsReplayMeta,
  AnalyticsSessionRecord,
} from './types.js';

export function dayKeyFromIso(iso: string): string {
  return iso.slice(0, 10);
}

export function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex').slice(0, 16);
}

export async function putAnalyticsEvents(events: AnalyticsEventRecord[]): Promise<void> {
  for (let i = 0; i < events.length; i += 25) {
    const chunk = events.slice(i, i + 25);
    await db.send(new BatchWriteCommand({
      RequestItems: {
        [Tables.ANALYTICS_EVENTS]: chunk.map((Item) => ({ PutRequest: { Item } })),
      },
    }));
  }
}

export async function upsertAnalyticsSession(session: AnalyticsSessionRecord): Promise<void> {
  const existing = await db.send(new GetCommand({
    TableName: Tables.ANALYTICS_SESSIONS,
    Key: { sessionId: session.sessionId },
  }));
  if (existing.Item === undefined) {
    await db.send(new PutCommand({ TableName: Tables.ANALYTICS_SESSIONS, Item: session }));
    return;
  }
  const prev = existing.Item as AnalyticsSessionRecord;
  await db.send(new PutCommand({
    TableName: Tables.ANALYTICS_SESSIONS,
    Item: {
      ...prev,
      ...session,
      eventCount: (prev.eventCount ?? 0) + session.eventCount,
      pageViews: (prev.pageViews ?? 0) + session.pageViews,
      userId: session.userId ?? prev.userId,
      lastSeenAt: session.lastSeenAt,
    },
  }));
}

export async function mergeAnonymousToUser(anonymousId: string, userId: string): Promise<void> {
  const result = await db.send(new QueryCommand({
    TableName: Tables.ANALYTICS_SESSIONS,
    IndexName: 'anonymousId-startedAt-index',
    KeyConditionExpression: 'anonymousId = :a',
    ExpressionAttributeValues: { ':a': anonymousId },
    Limit: 50,
  }));
  for (const item of result.Items ?? []) {
    const session = item as AnalyticsSessionRecord;
    await db.send(new UpdateCommand({
      TableName: Tables.ANALYTICS_SESSIONS,
      Key: { sessionId: session.sessionId },
      UpdateExpression: 'SET userId = :u',
      ExpressionAttributeValues: { ':u': userId },
    }));
  }

  const events = await listEventsByAnonymous(anonymousId, 200);
  for (const ev of events) {
    if (ev.userId === userId) continue;
    await db.send(new UpdateCommand({
      TableName: Tables.ANALYTICS_EVENTS,
      Key: { id: ev.id },
      UpdateExpression: 'SET userId = :u, userEventKey = :k',
      ExpressionAttributeValues: {
        ':u': userId,
        ':k': `${userId}#${ev.ts}`,
      },
    }));
  }
}

export async function listEventsByAnonymous(anonymousId: string, limit = 200): Promise<AnalyticsEventRecord[]> {
  const items: AnalyticsEventRecord[] = [];
  let exclusiveStartKey: Record<string, unknown> | undefined;
  do {
    const result = await db.send(new ScanCommand({
      TableName: Tables.ANALYTICS_EVENTS,
      FilterExpression: 'anonymousId = :a',
      ExpressionAttributeValues: { ':a': anonymousId },
      ExclusiveStartKey: exclusiveStartKey,
    }));
    for (const item of result.Items ?? []) {
      items.push(item as AnalyticsEventRecord);
      if (items.length >= limit) return items;
    }
    exclusiveStartKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (exclusiveStartKey !== undefined);
  return items;
}

export async function incrementDailyAgg(dayKey: string, metricKey: string, by = 1, sumMs = 0): Promise<void> {
  await db.send(new UpdateCommand({
    TableName: Tables.ANALYTICS_DAILY,
    Key: { dayKey, metricKey },
    UpdateExpression: 'ADD #c :by' + (sumMs > 0 ? ', sumMs :ms' : '') + ' SET updatedAt = :ts',
    ExpressionAttributeNames: { '#c': 'count' },
    ExpressionAttributeValues: {
      ':by': by,
      ':ts': new Date().toISOString(),
      ...(sumMs > 0 ? { ':ms': sumMs } : {}),
    },
  }));
}

export async function incrementHeatCell(pageKey: string, cellKey: string, by = 1): Promise<void> {
  await db.send(new UpdateCommand({
    TableName: Tables.ANALYTICS_HEATMAPS,
    Key: { pageKey, cellKey },
    UpdateExpression: 'ADD #c :by SET updatedAt = :ts',
    ExpressionAttributeNames: { '#c': 'count' },
    ExpressionAttributeValues: { ':by': by, ':ts': new Date().toISOString() },
  }));
}

export async function listEventsByDay(dayKey: string, limit = 200): Promise<AnalyticsEventRecord[]> {
  const result = await db.send(new QueryCommand({
    TableName: Tables.ANALYTICS_EVENTS,
    IndexName: 'dayKey-ts-index',
    KeyConditionExpression: 'dayKey = :d',
    ExpressionAttributeValues: { ':d': dayKey },
    ScanIndexForward: false,
    Limit: limit,
  }));
  return (result.Items ?? []) as AnalyticsEventRecord[];
}

export async function listEventsByUser(userId: string, limit = 100): Promise<AnalyticsEventRecord[]> {
  const result = await db.send(new QueryCommand({
    TableName: Tables.ANALYTICS_EVENTS,
    IndexName: 'userId-ts-index',
    KeyConditionExpression: 'userId = :u',
    ExpressionAttributeValues: { ':u': userId },
    ScanIndexForward: false,
    Limit: limit,
  }));
  return (result.Items ?? []) as AnalyticsEventRecord[];
}

export async function listEventsByName(eventName: string, limit = 200): Promise<AnalyticsEventRecord[]> {
  const result = await db.send(new QueryCommand({
    TableName: Tables.ANALYTICS_EVENTS,
    IndexName: 'eventName-ts-index',
    KeyConditionExpression: 'eventName = :n',
    ExpressionAttributeValues: { ':n': eventName },
    ScanIndexForward: false,
    Limit: limit,
  }));
  return (result.Items ?? []) as AnalyticsEventRecord[];
}

export async function listDailyAggs(dayKey: string): Promise<AnalyticsDailyAggRecord[]> {
  const result = await db.send(new QueryCommand({
    TableName: Tables.ANALYTICS_DAILY,
    KeyConditionExpression: 'dayKey = :d',
    ExpressionAttributeValues: { ':d': dayKey },
  }));
  return (result.Items ?? []) as AnalyticsDailyAggRecord[];
}

export async function listHeatCells(pageKey: string): Promise<AnalyticsHeatCellRecord[]> {
  const result = await db.send(new QueryCommand({
    TableName: Tables.ANALYTICS_HEATMAPS,
    KeyConditionExpression: 'pageKey = :p',
    ExpressionAttributeValues: { ':p': pageKey },
  }));
  return (result.Items ?? []) as AnalyticsHeatCellRecord[];
}

export async function listSessions(limit = 50): Promise<AnalyticsSessionRecord[]> {
  const result = await db.send(new ScanCommand({
    TableName: Tables.ANALYTICS_SESSIONS,
    Limit: limit,
  }));
  return (result.Items ?? []) as AnalyticsSessionRecord[];
}

export async function getSession(sessionId: string): Promise<AnalyticsSessionRecord | null> {
  const result = await db.send(new GetCommand({
    TableName: Tables.ANALYTICS_SESSIONS,
    Key: { sessionId },
  }));
  return (result.Item as AnalyticsSessionRecord | undefined) ?? null;
}

export async function listAlerts(): Promise<AnalyticsAlertRecord[]> {
  const result = await db.send(new ScanCommand({ TableName: Tables.ANALYTICS_ALERTS }));
  return (result.Items ?? []) as AnalyticsAlertRecord[];
}

export async function putAlert(alert: AnalyticsAlertRecord): Promise<void> {
  await db.send(new PutCommand({ TableName: Tables.ANALYTICS_ALERTS, Item: alert }));
}

export async function putReplayMeta(meta: AnalyticsReplayMeta): Promise<void> {
  await db.send(new PutCommand({ TableName: Tables.ANALYTICS_REPLAYS, Item: meta }));
}

export async function getReplay(id: string): Promise<AnalyticsReplayMeta | null> {
  const result = await db.send(new GetCommand({
    TableName: Tables.ANALYTICS_REPLAYS,
    Key: { id },
  }));
  return (result.Item as AnalyticsReplayMeta | undefined) ?? null;
}

export async function listReplays(limit = 30): Promise<AnalyticsReplayMeta[]> {
  const result = await db.send(new ScanCommand({
    TableName: Tables.ANALYTICS_REPLAYS,
    Limit: limit,
  }));
  return (result.Items ?? []) as AnalyticsReplayMeta[];
}

export async function updateAlertTrigger(id: string, triggeredAt: string): Promise<void> {
  await db.send(new UpdateCommand({
    TableName: Tables.ANALYTICS_ALERTS,
    Key: { id },
    UpdateExpression: 'SET lastTriggeredAt = :t, updatedAt = :t',
    ExpressionAttributeValues: { ':t': triggeredAt },
  }));
}

export function buildEvent(input: {
  sessionId: string;
  anonymousId: string;
  userId?: string;
  eventName: string;
  ts?: string;
  props?: Record<string, unknown>;
  context?: AnalyticsContext;
  ipHash?: string;
}): AnalyticsEventRecord {
  const ts = input.ts ?? new Date().toISOString();
  const id = randomUUID();
  return {
    id,
    sessionId: input.sessionId,
    anonymousId: input.anonymousId,
    ...(input.userId !== undefined && input.userId !== '' ? { userId: input.userId } : {}),
    eventName: input.eventName,
    ts,
    dayKey: dayKeyFromIso(ts),
    ...(input.props !== undefined ? { props: input.props } : {}),
    ...(input.context !== undefined ? { context: input.context } : {}),
    ...(input.ipHash !== undefined ? { ipHash: input.ipHash } : {}),
    ...(input.userId !== undefined && input.userId !== ''
      ? { userEventKey: `${input.userId}#${ts}` }
      : {}),
    nameTsKey: `${input.eventName}#${ts}`,
  };
}

export { randomUUID };
