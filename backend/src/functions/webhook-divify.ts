import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, badRequest, unauthorized, serverError, serviceUnavailable } from '../shared/http/response.js';
import { createLogger } from '../shared/core/logger.js';
import { getProjetoByOfertaId } from '../shared/db/index.js';
import { putCaptacaoEvento, upsertCaptacaoCompra } from '../shared/db/captacao.js';
import { isDivifyWebhookConfigured, verifyDivifyWebhook } from '../shared/divify/auth.js';
import {
  DivifyApiError,
  DivifyNotConfiguredError,
  getPurchaseDetailed,
  isDivifyApiConfigured,
} from '../shared/divify/client.js';
import { normalizeCaptacaoPayload } from '../shared/divify/normalize.js';
import type { CaptacaoCompra, CaptacaoCompraStatus, CaptacaoEvento } from '../shared/core/types/index.js';

function readBody(event: APIGatewayProxyEvent): string {
  const body = event.body ?? '';
  if (event.isBase64Encoded) return Buffer.from(body, 'base64').toString('utf8');
  return body;
}

async function enrichPurchase(params: {
  readonly ofertaId: string;
  readonly purchaseId: string;
  readonly status?: CaptacaoCompraStatus;
  readonly amountCents?: number;
  readonly investorId?: string;
}): Promise<{
  readonly status?: CaptacaoCompraStatus;
  readonly amountCents?: number;
  readonly investorId?: string;
  readonly enriched: boolean;
}> {
  const needsAmount = params.amountCents === undefined;
  const needsInvestor = params.investorId === undefined;
  const needsStatus = params.status === undefined || params.status === 'UNKNOWN';
  if (!needsAmount && !needsInvestor && !needsStatus) {
    return {
      enriched: false,
      ...(params.status !== undefined ? { status: params.status } : {}),
      ...(params.amountCents !== undefined ? { amountCents: params.amountCents } : {}),
      ...(params.investorId !== undefined ? { investorId: params.investorId } : {}),
    };
  }
  if (!isDivifyApiConfigured()) {
    return {
      enriched: false,
      ...(params.status !== undefined ? { status: params.status } : {}),
      ...(params.amountCents !== undefined ? { amountCents: params.amountCents } : {}),
      ...(params.investorId !== undefined ? { investorId: params.investorId } : {}),
    };
  }
  try {
    const detailed = await getPurchaseDetailed(params.ofertaId, params.purchaseId);
    const status = params.status ?? detailed.status;
    const amountCents = params.amountCents ?? detailed.amountCents;
    const investorId = params.investorId ?? detailed.investorId;
    return {
      enriched: true,
      ...(status !== undefined ? { status } : {}),
      ...(amountCents !== undefined ? { amountCents } : {}),
      ...(investorId !== undefined ? { investorId } : {}),
    };
  } catch (err) {
    if (err instanceof DivifyNotConfiguredError || err instanceof DivifyApiError) {
      return {
        enriched: false,
        ...(params.status !== undefined ? { status: params.status } : {}),
        ...(params.amountCents !== undefined ? { amountCents: params.amountCents } : {}),
        ...(params.investorId !== undefined ? { investorId: params.investorId } : {}),
      };
    }
    throw err;
  }
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

    let status = normalized.status;
    let amountCents = normalized.amountCents;
    let investorId = normalized.investorId;
    let enriched = false;

    if (
      (normalized.tipo === 'PURCHASE_APPROVED' || normalized.tipo === 'PURCHASE_EXPIRED')
      && normalized.ofertaId !== undefined
      && normalized.purchaseId !== undefined
    ) {
      const detail = await enrichPurchase({
        ofertaId: normalized.ofertaId,
        purchaseId: normalized.purchaseId,
        ...(status !== undefined ? { status } : {}),
        ...(amountCents !== undefined ? { amountCents } : {}),
        ...(investorId !== undefined ? { investorId } : {}),
      });
      status = detail.status;
      amountCents = detail.amountCents;
      investorId = detail.investorId;
      enriched = detail.enriched;
    }

    const stored: CaptacaoEvento & { readonly payload: Record<string, unknown> } = {
      id: normalized.id,
      tipo: normalized.tipo,
      tipoOriginal: normalized.tipoOriginal,
      recebidoEm,
      payload: normalized.payload,
      ...(normalized.occurredAt !== undefined ? { occurredAt: normalized.occurredAt } : {}),
      ...(normalized.ofertaId !== undefined ? { ofertaId: normalized.ofertaId } : {}),
      ...(normalized.purchaseId !== undefined ? { purchaseId: normalized.purchaseId } : {}),
      ...(investorId !== undefined ? { investorId } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(amountCents !== undefined ? { amountCents } : {}),
      ...(projeto !== null ? { projetoId: projeto.id, projetoNome: projeto.nome } : {}),
    };

    const inserted = await putCaptacaoEvento(stored);

    if (inserted && normalized.ofertaId !== undefined && normalized.purchaseId !== undefined) {
      const compra: CaptacaoCompra = {
        ofertaId: normalized.ofertaId,
        purchaseId: normalized.purchaseId,
        status: status ?? 'UNKNOWN',
        atualizadoEm: recebidoEm,
        recebidoEm,
        ...(investorId !== undefined ? { investorId } : {}),
        ...(amountCents !== undefined ? { amountCents } : {}),
        ...(projeto !== null ? { projetoId: projeto.id, projetoNome: projeto.nome } : {}),
      };
      await upsertCaptacaoCompra(compra);
    }

    log.info('Webhook processed', {
      eventId: normalized.id,
      tipo: normalized.tipo,
      inserted,
      enriched,
      linked: projeto !== null,
    });
    return ok(event, {
      received: true,
      id: normalized.id,
      tipo: normalized.tipo,
      duplicado: !inserted,
      enriched,
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
