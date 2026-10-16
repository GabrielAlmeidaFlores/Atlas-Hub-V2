import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, unauthorized, forbidden, created, badRequest, notFound, serverError } from '../shared/http/response.js';
import { getUserId, requireAdmin, AuthError, ForbiddenError } from '../shared/http/auth.js';
import { validate, analyticsAlertSchema, analyticsAlertUpdateSchema, ValidationError } from '../shared/http/validators.js';
import { listAlerts, putAlert, getAlert, deleteAlert, randomUUID } from '../shared/analytics/db.js';
import { createLogger } from '../shared/core/logger.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('analyticsAlerts');
  try {
    getUserId(event);
    requireAdmin(event);
    const method = event.httpMethod.toUpperCase();
    const id = event.pathParameters?.['id'];

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

    if (method === 'PUT') {
      if (id === undefined || id === '') return badRequest(event, 'ID do alerta é obrigatório');
      const existing = await getAlert(id);
      if (existing === null) return notFound(event, 'Alerta não encontrado');
      const body = validate(analyticsAlertUpdateSchema, JSON.parse(event.body ?? '{}'));
      const updated = {
        ...existing,
        name: body.name ?? existing.name,
        rule: body.rule ?? existing.rule,
        threshold: body.threshold ?? existing.threshold,
        active: body.active ?? existing.active,
        updatedAt: new Date().toISOString(),
      };
      await putAlert(updated);
      log.info('Alert updated', { id, active: updated.active });
      return ok(event, updated);
    }

    if (method === 'DELETE') {
      if (id === undefined || id === '') return badRequest(event, 'ID do alerta é obrigatório');
      const existing = await getAlert(id);
      if (existing === null) return notFound(event, 'Alerta não encontrado');
      await deleteAlert(id);
      log.info('Alert deleted', { id });
      return ok(event, { id, deleted: true });
    }

    return badRequest(event, 'Método não suportado');
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof ForbiddenError) return forbidden(event);
    if (err instanceof ValidationError) return badRequest(event, err.message, 'VALIDATION_ERROR', err.fields);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
