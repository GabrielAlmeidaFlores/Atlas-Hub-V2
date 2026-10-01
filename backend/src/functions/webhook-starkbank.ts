import { v4 as uuidv4 } from 'uuid';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, badRequest, serverError } from '../shared/http/response.js';
import { createLogger } from '../shared/core/logger.js';
import { getSpeContaByWorkspace, putFinanceiroAuditoria, upsertLedgerEntry } from '../shared/db/financeiro.js';
import { parseStarkWebhook, StarkNotConfiguredError, StarkOperationError } from '../shared/starkbank/index.js';

function header(event: APIGatewayProxyEvent, name: string): string {
  const lower = name.toLowerCase();
  const entries = Object.entries(event.headers ?? {});
  const found = entries.find(([key]) => key.toLowerCase() === lower);
  return found?.[1] ?? '';
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('webhookStarkbank');
  try {
    const signature = header(event, 'Digital-Signature');
    const content = event.body ?? '';
    if (signature.length === 0 || content.length === 0) {
      return badRequest(event, 'Assinatura ou payload ausente');
    }

    const parsed = parseStarkWebhook(content, signature);
    const workspaceId = parsed.workspaceId;
    if (workspaceId === undefined || workspaceId.length === 0) {
      log.warn('Webhook without workspace', { eventId: parsed.id, subscription: parsed.subscription });
      return ok(event, { received: true });
    }

    const conta = await getSpeContaByWorkspace(workspaceId);
    if (conta === null) {
      log.warn('Webhook for unknown workspace', { workspaceId, eventId: parsed.id });
      return ok(event, { received: true });
    }

    const starkId = parsed.operationId ?? parsed.id;
    const created = parsed.created ?? new Date().toISOString();
    const inserted = await upsertLedgerEntry({
      projetoId: conta.projetoId,
      starkId,
      workspaceId,
      tipo: parsed.tipo,
      amount: parsed.amount ?? 0,
      description: parsed.description ?? parsed.subscription,
      criadoEm: created,
      conciliado: true,
      source: 'webhook',
      ...(parsed.tags !== undefined ? { tags: parsed.tags } : {}),
    });

    if (inserted) {
      await putFinanceiroAuditoria({
        projetoId: conta.projetoId,
        criadoEm: new Date().toISOString(),
        id: uuidv4(),
        acao: 'WEBHOOK_CONCILIADO',
        userId: 'starkbank',
        userName: 'webhook',
        descricao: `Evento ${parsed.subscription} conciliado (${starkId})`,
        workspaceId,
      });
    }

    log.info('Webhook processed', { eventId: parsed.id, projetoId: conta.projetoId, inserted });
    return ok(event, { received: true });
  } catch (err) {
    if (err instanceof StarkNotConfiguredError || err instanceof StarkOperationError) {
      return badRequest(event, err.message);
    }
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
