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

export function classifyCaptacaoTipo(raw: string): CaptacaoEventoTipo {
  const n = fold(raw);
  const investor = n.includes('investidor') || n.includes('investor');
  const purchase = n.includes('compra') || n.includes('purchase');
  if (investor && (n.includes('criad') || n.includes('created'))) return 'INVESTOR_CREATED';
  if (purchase && (n.includes('aprov') || n.includes('approved'))) return 'PURCHASE_APPROVED';
  if (purchase && (n.includes('expir') || n.includes('expired'))) return 'PURCHASE_EXPIRED';
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

function parseAmountCents(obj: Record<string, unknown>): number | undefined {
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
  const tipoOriginal = pickString(nested, ['event', 'type', 'tipo', 'evento', 'eventType', 'event_type', 'eventName', 'event_name', 'name']) ?? 'unknown';
  const tipo = classifyCaptacaoTipo(tipoOriginal);
  const ofertaId = pickString(nested, ['offerId', 'ofertaId', 'offer_id', 'oferta_id', 'offerID']);
  const purchaseId = pickString(nested, ['purchaseId', 'compraId', 'purchase_id', 'compra_id', 'purchaseID']);
  const investorId = pickString(nested, ['investorId', 'investidorId', 'investor_id', 'investidor_id', 'userId', 'user_id']);
  const occurredAt = pickString(nested, ['occurredAt', 'occurred_at', 'createdAt', 'created_at', 'date', 'timestamp']);
  const status = classifyStatus(pickString(nested, ['status']), tipo);
  const amountCents = parseAmountCents(nested);
  const explicitId = pickString(nested, ['eventId', 'event_id', 'webhookId', 'webhook_id']);
  const id = explicitId
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
