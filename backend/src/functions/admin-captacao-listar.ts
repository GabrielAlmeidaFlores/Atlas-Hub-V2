import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, unauthorized, forbidden, serverError } from '../shared/http/response.js';
import { getUserId, AuthError, ForbiddenError, requireAdmin } from '../shared/http/auth.js';
import { createLogger } from '../shared/core/logger.js';
import { listAllProjetosByStatus } from '../shared/db/index.js';
import { listCaptacaoCompras, listCaptacaoEventos } from '../shared/db/captacao.js';
import { isDivifyWebhookConfigured } from '../shared/divify/auth.js';
import { isDivifyApiConfigured } from '../shared/divify/client.js';
import type { CaptacaoOfertaEncerramento } from '../shared/core/types/index.js';

interface OfertaResumo {
  readonly ofertaId: string;
  readonly projetoId?: string;
  readonly projetoNome?: string;
  readonly valorCaptar?: number;
  readonly valorAprovadoCents: number;
  readonly comprasAprovadas: number;
  readonly comprasExpiradas: number;
  readonly investidores: number;
  readonly atualizadoEm?: string;
  readonly vinculada: boolean;
  readonly encerramento?: CaptacaoOfertaEncerramento;
  readonly encerradaEm?: string;
}

function encerramentoFromTipo(tipo: string): CaptacaoOfertaEncerramento | null {
  if (tipo === 'OFFER_FINISHED_SUCCESS') return 'FINISHED_SUCCESS';
  if (tipo === 'OFFER_FINISHED_UNSUCCESS') return 'FINISHED_UNSUCCESS';
  return null;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('adminCaptacaoListar');
  try {
    getUserId(event);
    requireAdmin(event);

    const [publicados, compras, eventosAll] = await Promise.all([
      listAllProjetosByStatus('OFERTA_CRIADA'),
      listCaptacaoCompras(),
      listCaptacaoEventos(400),
    ]);

    const byOferta = new Map<string, OfertaResumo>();

    for (const projeto of publicados) {
      if (projeto.ofertaId === undefined || projeto.ofertaId.length === 0) continue;
      byOferta.set(projeto.ofertaId, {
        ofertaId: projeto.ofertaId,
        projetoId: projeto.id,
        projetoNome: projeto.nome,
        ...(projeto.valorCaptar !== undefined ? { valorCaptar: projeto.valorCaptar } : {}),
        valorAprovadoCents: 0,
        comprasAprovadas: 0,
        comprasExpiradas: 0,
        investidores: 0,
        vinculada: true,
      });
    }

    const investidoresPorOferta = new Map<string, Set<string>>();

    for (const compra of compras) {
      const current = byOferta.get(compra.ofertaId) ?? {
        ofertaId: compra.ofertaId,
        valorAprovadoCents: 0,
        comprasAprovadas: 0,
        comprasExpiradas: 0,
        investidores: 0,
        vinculada: false,
        ...(compra.projetoId !== undefined ? { projetoId: compra.projetoId } : {}),
        ...(compra.projetoNome !== undefined ? { projetoNome: compra.projetoNome } : {}),
      };
      const aprovada = compra.status === 'APPROVED' || compra.status === 'COMPLETED';
      const expirada = compra.status === 'EXPIRED';
      const valorAprovadoCents = current.valorAprovadoCents + (aprovada ? (compra.amountCents ?? 0) : 0);
      const atualizadoEm = current.atualizadoEm === undefined || compra.atualizadoEm > current.atualizadoEm
        ? compra.atualizadoEm
        : current.atualizadoEm;
      byOferta.set(compra.ofertaId, {
        ...current,
        valorAprovadoCents,
        comprasAprovadas: current.comprasAprovadas + (aprovada ? 1 : 0),
        comprasExpiradas: current.comprasExpiradas + (expirada ? 1 : 0),
        atualizadoEm,
        ...(current.projetoId === undefined && compra.projetoId !== undefined ? { projetoId: compra.projetoId } : {}),
        ...(current.projetoNome === undefined && compra.projetoNome !== undefined ? { projetoNome: compra.projetoNome } : {}),
      });
      if (compra.investorId !== undefined && compra.investorId.length > 0) {
        const set = investidoresPorOferta.get(compra.ofertaId) ?? new Set<string>();
        set.add(compra.investorId);
        investidoresPorOferta.set(compra.ofertaId, set);
      }
    }

    for (const evento of eventosAll) {
      if (evento.ofertaId === undefined) continue;

      const enc = encerramentoFromTipo(evento.tipo);
      if (enc !== null) {
        const current = byOferta.get(evento.ofertaId) ?? {
          ofertaId: evento.ofertaId,
          valorAprovadoCents: 0,
          comprasAprovadas: 0,
          comprasExpiradas: 0,
          investidores: 0,
          vinculada: false,
          ...(evento.projetoId !== undefined ? { projetoId: evento.projetoId } : {}),
          ...(evento.projetoNome !== undefined ? { projetoNome: evento.projetoNome } : {}),
        };
        const when = evento.occurredAt ?? evento.recebidoEm;
        const keepExisting = current.encerradaEm !== undefined && current.encerradaEm >= when;
        byOferta.set(evento.ofertaId, {
          ...current,
          ...(keepExisting
            ? {}
            : { encerramento: enc, encerradaEm: when }),
          atualizadoEm: current.atualizadoEm === undefined || when > current.atualizadoEm
            ? when
            : current.atualizadoEm,
        });
      }

      if (evento.investorId === undefined) continue;
      if (evento.tipo !== 'INVESTOR_CREATED' && evento.tipo !== 'USER_ACTIVE') continue;
      const set = investidoresPorOferta.get(evento.ofertaId) ?? new Set<string>();
      set.add(evento.investorId);
      investidoresPorOferta.set(evento.ofertaId, set);
    }

    const ofertas = [...byOferta.values()].map((item) => ({
      ...item,
      investidores: investidoresPorOferta.get(item.ofertaId)?.size ?? 0,
    }));
    ofertas.sort((a, b) => (b.atualizadoEm ?? '').localeCompare(a.atualizadoEm ?? ''));

    log.info('Captacao listed', { ofertas: ofertas.length, eventos: eventosAll.length });
    return ok(event, {
      configured: isDivifyWebhookConfigured(),
      apiConfigured: isDivifyApiConfigured(),
      ofertas,
      eventos: eventosAll.slice(0, 60),
    });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof ForbiddenError) return forbidden(event);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
