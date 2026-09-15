import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, badRequest, unauthorized, serverError, serviceUnavailable } from '../shared/http/response.js';
import { createLogger } from '../shared/core/logger.js';
import { getProjetoByOfertaId } from '../shared/db/index.js';
import { putCaptacaoEvento, upsertCaptacaoCompra } from '../shared/db/captacao.js';
import { isDivifyWebhookConfigured, verifyDivifyWebhook } from '../shared/divify/auth.js';
import { normalizeCaptacaoPayload } from '../shared/divify/normalize.js';
import type { CaptacaoCompra, CaptacaoEvento } from '../shared/core/types/index.js';

function readBody(event: APIGatewayProxyEvent): string {
  const body = event.body ?? '';
  if (event.isBase64Encoded) return Buffer.from(body, 'base64').toString('utf8');
  return body;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('webhookDivify');
  try {
    if (!isDivifyWebhookConfigured()) {
      return serviceUnavailable(event, 'Webhook da plataforma ainda não configurado');
    }
    if (!verifyDivifyWebhook(event.headers)) {
      return unauthorized(event);
    }

    const rawBody = readBody(event);
    if (rawBody.trim().length === 0) return badRequest(event, 'Payload ausente');

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawBody) as unknown;
    } catch {
      return badRequest(event, 'JSON inválido');
    }

    const normalized = normalizeCaptacaoPayload(parsed, rawBody);
    const recebidoEm = new Date().toISOString();
    const projeto = normalized.ofertaId !== undefined ? await getProjetoByOfertaId(normalized.ofertaId) : null;

    const stored: CaptacaoEvento & { readonly payload: Record<string, unknown> } = {
      id: normalized.id,
      tipo: normalized.tipo,
      tipoOriginal: normalized.tipoOriginal,
      recebidoEm,
      payload: normalized.payload,
      ...(normalized.occurredAt !== undefined ? { occurredAt: normalized.occurredAt } : {}),
      ...(normalized.ofertaId !== undefined ? { ofertaId: normalized.ofertaId } : {}),
      ...(normalized.purchaseId !== undefined ? { purchaseId: normalized.purchaseId } : {}),
      ...(normalized.investorId !== undefined ? { investorId: normalized.investorId } : {}),
      ...(normalized.status !== undefined ? { status: normalized.status } : {}),
      ...(normalized.amountCents !== undefined ? { amountCents: normalized.amountCents } : {}),
      ...(projeto !== null ? { projetoId: projeto.id, projetoNome: projeto.nome } : {}),
    };

    const inserted = await putCaptacaoEvento(stored);

    if (inserted && normalized.ofertaId !== undefined && normalized.purchaseId !== undefined) {
      const compra: CaptacaoCompra = {
        ofertaId: normalized.ofertaId,
        purchaseId: normalized.purchaseId,
        status: normalized.status ?? 'UNKNOWN',
        atualizadoEm: recebidoEm,
        recebidoEm,
        ...(normalized.investorId !== undefined ? { investorId: normalized.investorId } : {}),
        ...(normalized.amountCents !== undefined ? { amountCents: normalized.amountCents } : {}),
        ...(projeto !== null ? { projetoId: projeto.id, projetoNome: projeto.nome } : {}),
      };
      await upsertCaptacaoCompra(compra);
    }

    log.info('Webhook processed', {
      eventId: normalized.id,
      tipo: normalized.tipo,
      inserted,
      linked: projeto !== null,
    });
    return ok(event, {
      received: true,
      id: normalized.id,
      tipo: normalized.tipo,
      duplicado: !inserted,
      projetoId: projeto?.id ?? null,
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'Payload deve ser um objeto JSON') {
      return badRequest(event, err.message);
    }
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
