import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, unauthorized, forbidden, created, badRequest, serverError } from '../shared/http/response.js';
import { getUserId, requireAdmin, AuthError, ForbiddenError } from '../shared/http/auth.js';
import { validate, analyticsAlertSchema, ValidationError } from '../shared/http/validators.js';
import { listAlerts, putAlert, randomUUID } from '../shared/analytics/db.js';
import { createLogger } from '../shared/core/logger.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('analyticsAlerts');
  try {
    getUserId(event);
    requireAdmin(event);
    const method = event.httpMethod.toUpperCase();

    if (method === 'GET') {
      const items = await listAlerts();
      return ok(event, { items });
    }

    if (method === 'POST') {
      const body = validate(analyticsAlertSchema, JSON.parse(event.body ?? '{}'));
      const now = new Date().toISOString();
      const alert = {
        id: randomUUID(),
        name: body.name,
        rule: body.rule,
        threshold: body.threshold,
        active: body.active ?? true,
        createdAt: now,
        updatedAt: now,
      };
      await putAlert(alert);
      log.info('Alert created', { id: alert.id });
      return created(event, alert);
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
