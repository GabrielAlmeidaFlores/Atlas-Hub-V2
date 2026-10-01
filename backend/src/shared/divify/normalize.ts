import { createHash } from 'node:crypto';
import type { CaptacaoCompraStatus, CaptacaoEventoTipo } from '../core/types/index.js';

export interface CaptacaoPayloadNormalizado {
  readonly id: string;
  readonly tipo: CaptacaoEventoTipo;
  readonly tipoOriginal: string;
  readonly occurredAt?: string;
  readonly ofertaId?: string;
  readonly purchaseId?: string;
  readonly investorId?: string;
  readonly status?: CaptacaoCompraStatus;
  readonly amountCents?: number;
  readonly payload: Record<string, unknown>;
}

const COMPRA_STATUS: ReadonlySet<string> = new Set([
  'PENDING',
  'CANCELED',
  'FAILED',
  'FAILED_REFUND',
  'APPROVED',
  'EXPIRED',
  'REFUNDED',
  'COMPLETED',
]);

const EVENT_ALIASES: ReadonlyArray<{ readonly match: RegExp; readonly tipo: CaptacaoEventoTipo }> = [
  { match: /^useractive(event)?$/, tipo: 'USER_ACTIVE' },
  { match: /^user[.\s_-]?active$/, tipo: 'USER_ACTIVE' },
  { match: /^investorcreated(event)?$/, tipo: 'INVESTOR_CREATED' },
  { match: /^investor[.\s_-]?created$/, tipo: 'INVESTOR_CREATED' },
  { match: /^investidorcriado(event)?$/, tipo: 'INVESTOR_CREATED' },
  { match: /^purchaseapproved(event)?$/, tipo: 'PURCHASE_APPROVED' },
  { match: /^purchase[.\s_-]?approved$/, tipo: 'PURCHASE_APPROVED' },
  { match: /^compraaprovada(event)?$/, tipo: 'PURCHASE_APPROVED' },
  { match: /^purchaseexpired(event)?$/, tipo: 'PURCHASE_EXPIRED' },
  { match: /^purchase[.\s_-]?expired$/, tipo: 'PURCHASE_EXPIRED' },
  { match: /^compraexpirada(event)?$/, tipo: 'PURCHASE_EXPIRED' },
  { match: /^offerfinishedsuccess(event)?$/, tipo: 'OFFER_FINISHED_SUCCESS' },
  { match: /^finishedsuccess(event)?$/, tipo: 'OFFER_FINISHED_SUCCESS' },
  { match: /^offer[.\s_-]?finished[.\s_-]?success$/, tipo: 'OFFER_FINISHED_SUCCESS' },
  { match: /^offerfinishedunsuccess(event)?$/, tipo: 'OFFER_FINISHED_UNSUCCESS' },
  { match: /^finishedunsuccess(event)?$/, tipo: 'OFFER_FINISHED_UNSUCCESS' },
  { match: /^offer[.\s_-]?finished[.\s_-]?unsuccess$/, tipo: 'OFFER_FINISHED_UNSUCCESS' },
];

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function pickString(obj: Record<string, unknown>, keys: readonly string[]): string | undefined {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'string' && value.trim().length > 0) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return undefined;
}

function fold(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[_./-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function compactEventKey(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function classifyFromOfferStatus(raw: string | undefined): CaptacaoEventoTipo | null {
  if (raw === undefined) return null;
  const key = compactEventKey(raw);
  if (key === 'finishedsuccess' || key === 'concluded') return 'OFFER_FINISHED_SUCCESS';
  if (key === 'finishedunsuccess') return 'OFFER_FINISHED_UNSUCCESS';
  return null;
}

export function classifyCaptacaoTipo(raw: string, offerStatus?: string): CaptacaoEventoTipo {
  const key = compactEventKey(raw);
  for (const alias of EVENT_ALIASES) {
    if (alias.match.test(key)) return alias.tipo;
  }
  const fromStatus = classifyFromOfferStatus(offerStatus);
  if (fromStatus !== null) {
    const n = fold(raw);
    if (n.includes('offer') || n.includes('oferta') || n.includes('finished') || n.includes('encerr') || n.includes('status')) {
      return fromStatus;
    }
  }
  const n = fold(raw);
  const investor = n.includes('investidor') || n.includes('investor');
  const purchase = n.includes('compra') || n.includes('purchase');
  const user = n.includes('user') || n.includes('usuario');
  const offer = n.includes('offer') || n.includes('oferta');
  if (user && n.includes('active')) return 'USER_ACTIVE';
  if (investor && (n.includes('criad') || n.includes('created'))) return 'INVESTOR_CREATED';
  if (purchase && (n.includes('aprov') || n.includes('approved'))) return 'PURCHASE_APPROVED';
  if (purchase && (n.includes('expir') || n.includes('expired'))) return 'PURCHASE_EXPIRED';
  if (offer && n.includes('success') && !n.includes('unsuccess')) return 'OFFER_FINISHED_SUCCESS';
  if (offer && (n.includes('unsuccess') || n.includes('insucesso'))) return 'OFFER_FINISHED_UNSUCCESS';
  if (fromStatus !== null) return fromStatus;
  return 'OUTRO';
}

function classifyStatus(raw: string | undefined, tipo: CaptacaoEventoTipo): CaptacaoCompraStatus | undefined {
  if (raw !== undefined) {
    const upper = raw.trim().toUpperCase().replace(/[\s-]+/g, '_');
    if (COMPRA_STATUS.has(upper)) return upper as CaptacaoCompraStatus;
    const n = fold(raw);
    if (n.includes('aprov') || n === 'approved') return 'APPROVED';
    if (n.includes('expir') || n === 'expired') return 'EXPIRED';
    if (n.includes('pend')) return 'PENDING';
    if (n.includes('cancel')) return 'CANCELED';
    if (n.includes('reembols') || n.includes('refund')) return 'REFUNDED';
    if (n.includes('conclu') || n.includes('complete')) return 'COMPLETED';
    if (n.includes('fail') || n.includes('falh')) return 'FAILED';
  }
  if (tipo === 'PURCHASE_APPROVED') return 'APPROVED';
  if (tipo === 'PURCHASE_EXPIRED') return 'EXPIRED';
  return undefined;
}

export function parseAmountCents(obj: Record<string, unknown>): number | undefined {
  const centsRaw = obj['amountCents'] ?? obj['amount_cents'] ?? obj['valorCentavos'];
  if (typeof centsRaw === 'number' && Number.isFinite(centsRaw)) return Math.round(centsRaw);
  if (typeof centsRaw === 'string' && centsRaw.trim() !== '') {
    const parsed = Number(centsRaw.replace(',', '.'));
    if (Number.isFinite(parsed)) return Math.round(parsed);
  }
  const reaisRaw = obj['amount'] ?? obj['total'] ?? obj['value'] ?? obj['valor'] ?? obj['valorTotal'];
  if (typeof reaisRaw === 'number' && Number.isFinite(reaisRaw)) return Math.round(reaisRaw * 100);
  if (typeof reaisRaw === 'string' && reaisRaw.trim() !== '') {
    const parsed = Number(reaisRaw.replace(',', '.'));
    if (Number.isFinite(parsed)) return Math.round(parsed * 100);
  }
  return undefined;
}

function pickOfertaId(nested: Record<string, unknown>): string | undefined {
  const direct = pickString(nested, ['offerId', 'ofertaId', 'offer_id', 'oferta_id', 'offerID']);
  if (direct !== undefined) return direct;
  const offer = asRecord(nested['offer']) ?? asRecord(nested['oferta']);
  if (offer !== null) {
    return pickString(offer, ['id', 'offerId', 'ofertaId', 'offer_id']);
  }
  return undefined;
}

export function normalizeCaptacaoPayload(raw: unknown, rawBody: string): CaptacaoPayloadNormalizado {
  const root = asRecord(raw);
  if (root === null) {
    throw new Error('Payload deve ser um objeto JSON');
  }
  const nested: Record<string, unknown> = {
    ...root,
    ...(asRecord(root['attributes']) ?? {}),
    ...(asRecord(root['payload']) ?? {}),
    ...(asRecord(root['data']) ?? {}),
  };
  const tipoOriginal = pickString(nested, [
    'event',
    'type',
    'tipo',
    'evento',
    'eventType',
    'event_type',
    'eventName',
    'event_name',
    'name',
    '$type',
  ]) ?? 'unknown';
  const offerStatus = pickString(nested, ['offerStatus', 'ofertaStatus', 'status']);
  const tipo = classifyCaptacaoTipo(tipoOriginal, offerStatus);
  const ofertaId = pickOfertaId(nested);
  const purchaseId = pickString(nested, ['purchaseId', 'compraId', 'purchase_id', 'compra_id', 'purchaseID']);
  const investorId = pickString(nested, [
    'investorId',
    'investidorId',
    'investor_id',
    'investidor_id',
    'userId',
    'user_id',
    'userID',
  ]);
  const occurredAt = pickString(nested, ['occurredAt', 'occurred_at', 'createdAt', 'created_at', 'date', 'timestamp']);
  const status = classifyStatus(pickString(nested, ['status', 'purchaseStatus']), tipo);
  const amountCents = parseAmountCents(nested);
  const explicitId = pickString(nested, ['eventId', 'event_id', 'webhookId', 'webhook_id']);
  const id = explicitId
    ?? (tipo === 'OFFER_FINISHED_SUCCESS' && ofertaId !== undefined ? `${tipo}:${ofertaId}` : undefined)
    ?? (tipo === 'OFFER_FINISHED_UNSUCCESS' && ofertaId !== undefined ? `${tipo}:${ofertaId}` : undefined)
    ?? (tipo === 'USER_ACTIVE' && investorId !== undefined
      ? (ofertaId !== undefined ? `${tipo}:${ofertaId}:${investorId}` : `${tipo}:${investorId}`)
      : undefined)
    ?? (tipo === 'INVESTOR_CREATED' && investorId !== undefined
      ? (ofertaId !== undefined ? `${tipo}:${ofertaId}:${investorId}` : `${tipo}:${investorId}`)
      : undefined)
    ?? (tipo !== 'OUTRO' && purchaseId !== undefined ? `${tipo}:${purchaseId}` : undefined)
    ?? `evt_${createHash('sha256').update(rawBody).digest('hex').slice(0, 32)}`;

  return {
    id,
    tipo,
    tipoOriginal,
    payload: root,
    ...(occurredAt !== undefined ? { occurredAt } : {}),
    ...(ofertaId !== undefined ? { ofertaId } : {}),
    ...(purchaseId !== undefined ? { purchaseId } : {}),
    ...(investorId !== undefined ? { investorId } : {}),
    ...(status !== undefined ? { status } : {}),
    ...(amountCents !== undefined ? { amountCents } : {}),
  };
}

export function compraStatusRank(status: CaptacaoCompraStatus): number {
  switch (status) {
    case 'UNKNOWN': return 0;
    case 'PENDING': return 1;
    case 'EXPIRED': return 2;
    case 'CANCELED': return 2;
    case 'FAILED': return 2;
    case 'FAILED_REFUND': return 3;
    case 'REFUNDED': return 3;
    case 'APPROVED': return 4;
    case 'COMPLETED': return 5;
  }
}
