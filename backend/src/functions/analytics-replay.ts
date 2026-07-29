import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, unauthorized, forbidden, badRequest, created, serverError, notFound } from '../shared/http/response.js';
import { getUserId, requireAdmin, AuthError, ForbiddenError } from '../shared/http/auth.js';
import { validate, ValidationError } from '../shared/http/validators.js';
import { z } from 'zod';
import { getReplay, listReplays, putReplayMeta, randomUUID } from '../shared/analytics/db.js';
import { createLogger } from '../shared/core/logger.js';

const MAX_EVENTS_JSON = 350_000;

const replaySchema = z.object({
  sessionId: z.string().min(8).max(80),
  anonymousId: z.string().min(8).max(80),
  userId: z.string().optional(),
  chunkCount: z.number().int().min(0).default(0),
  location: z.string().url().optional(),
  startedAt: z.string().min(10).max(40).optional(),
  endedAt: z.string().min(10).max(40).optional(),
  events: z.array(z.unknown()).max(5000).optional(),
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('analyticsReplay');
  try {
    const method = event.httpMethod.toUpperCase();

    if (method === 'POST') {
      const body = validate(replaySchema, JSON.parse(event.body ?? '{}'));
      const now = new Date().toISOString();
      let eventsJson: string | undefined;
      if (body.events !== undefined && body.events.length > 0) {
        const raw = JSON.stringify(body.events);
        eventsJson = raw.length > MAX_EVENTS_JSON ? raw.slice(0, MAX_EVENTS_JSON) : raw;
      }
      const meta = {
        id: randomUUID(),
        sessionId: body.sessionId,
        anonymousId: body.anonymousId,
        ...(body.userId !== undefined && body.userId !== '' ? { userId: body.userId } : {}),
        startedAt: body.startedAt ?? now,
        ...(body.endedAt !== undefined ? { endedAt: body.endedAt } : {}),
        chunkCount: body.chunkCount ?? (body.events?.length ?? 0),
        ...(body.location !== undefined ? { location: body.location } : {}),
        ...(eventsJson !== undefined ? { eventsJson } : {}),
      };
      await putReplayMeta(meta);
      return created(event, { id: meta.id, sessionId: meta.sessionId, chunkCount: meta.chunkCount });
    }

    getUserId(event);
    requireAdmin(event);

    if (method === 'GET') {
      const replayId = event.pathParameters?.['id'] ?? event.pathParameters?.['replayId'];
      if (replayId !== undefined && replayId !== '') {
        const item = await getReplay(replayId);
        if (item === null) return notFound(event, 'Replay não encontrado');
        let events: unknown[] = [];
        if (item.eventsJson !== undefined && item.eventsJson !== '') {
          try {
            events = JSON.parse(item.eventsJson) as unknown[];
          } catch {
            events = [];
          }
        }
        const { eventsJson: _omit, ...rest } = item;
        return ok(event, { ...rest, events });
      }
      const items = await listReplays(50);
      return ok(event, {
        items: items.map(({ eventsJson: _e, ...rest }) => rest),
      });
    }

    return badRequest(event, 'Método não suportado');
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof ForbiddenError) return forbidden(event);
    if (err instanceof ValidationError) return badRequest(event, err.message);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
