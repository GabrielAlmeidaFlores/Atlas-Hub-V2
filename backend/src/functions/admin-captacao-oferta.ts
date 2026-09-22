import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, unauthorized, forbidden, notFound, serverError } from '../shared/http/response.js';
import { getUserId, AuthError, ForbiddenError, requireAdmin } from '../shared/http/auth.js';
import { createLogger } from '../shared/core/logger.js';
import { getProjetoByOfertaId } from '../shared/db/index.js';
import { listCaptacaoComprasByOferta, listCaptacaoEventosByOferta } from '../shared/db/captacao.js';
import { isDivifyWebhookConfigured } from '../shared/divify/auth.js';
import { isDivifyApiConfigured } from '../shared/divify/client.js';
import type { CaptacaoOfertaEncerramento } from '../shared/core/types/index.js';

function resolveEncerramento(eventos: ReadonlyArray<{ tipo: string; occurredAt?: string; recebidoEm: string }>): {
  readonly encerramento?: CaptacaoOfertaEncerramento;
  readonly encerradaEm?: string;
} {
  let best: { encerramento: CaptacaoOfertaEncerramento; encerradaEm: string } | null = null;
  for (const evento of eventos) {
    const enc: CaptacaoOfertaEncerramento | null =
      evento.tipo === 'OFFER_FINISHED_SUCCESS' ? 'FINISHED_SUCCESS'
        : evento.tipo === 'OFFER_FINISHED_UNSUCCESS' ? 'FINISHED_UNSUCCESS'
          : null;
    if (enc === null) continue;
    const when = evento.occurredAt ?? evento.recebidoEm;
    if (best === null || when > best.encerradaEm) {
      best = { encerramento: enc, encerradaEm: when };
    }
  }
  return best ?? {};
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('adminCaptacaoOferta');
  try {
    getUserId(event);
    requireAdmin(event);
    const ofertaId = event.pathParameters?.['ofertaId'];
    if (ofertaId === undefined || ofertaId === '') return notFound(event, 'Oferta não encontrada');
    const decoded = decodeURIComponent(ofertaId);

    const [projeto, compras, eventos] = await Promise.all([
      getProjetoByOfertaId(decoded),
      listCaptacaoComprasByOferta(decoded),
      listCaptacaoEventosByOferta(decoded),
    ]);

    if (projeto === null && compras.length === 0 && eventos.length === 0) {
      return notFound(event, 'Oferta não encontrada');
    }

    const aprovadas = compras.filter((c) => c.status === 'APPROVED' || c.status === 'COMPLETED');
    const valorAprovadoCents = aprovadas.reduce((sum, c) => sum + (c.amountCents ?? 0), 0);
    const enc = resolveEncerramento(eventos);

    log.info('Captacao offer loaded', { ofertaId: decoded, compras: compras.length, encerramento: enc.encerramento ?? null });
    return ok(event, {
      configured: isDivifyWebhookConfigured(),
      apiConfigured: isDivifyApiConfigured(),
      ofertaId: decoded,
      projeto: projeto === null ? null : {
        id: projeto.id,
        nome: projeto.nome,
        cidade: projeto.cidade,
        estado: projeto.estado,
        valorCaptar: projeto.valorCaptar ?? null,
        ofertaLink: projeto.ofertaLink ?? null,
      },
      valorAprovadoCents,
      comprasAprovadas: aprovadas.length,
      ...enc,
      compras,
      eventos,
    });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof ForbiddenError) return forbidden(event);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
