import { DIVIFY_API_BASE_URL, DIVIFY_API_TOKEN, DIVIFY_TENANT_ID } from '../core/env.js';
import type { CaptacaoCompraStatus } from '../core/types/index.js';
import { parseAmountCents } from './normalize.js';

export class DivifyNotConfiguredError extends Error {
  constructor() {
    super('API da plataforma ainda não configurada');
    this.name = 'DivifyNotConfiguredError';
  }
}

export class DivifyApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'DivifyApiError';
    this.status = status;
  }
}

export interface DivifyPurchaseDetailed {
  readonly offerId: string;
  readonly purchaseId: string;
  readonly status?: CaptacaoCompraStatus;
  readonly amountCents?: number;
  readonly investorId?: string;
  readonly raw: Record<string, unknown>;
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

function mapStatus(raw: string | undefined): CaptacaoCompraStatus | undefined {
  if (raw === undefined) return undefined;
  const upper = raw.trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (COMPRA_STATUS.has(upper)) return upper as CaptacaoCompraStatus;
  return undefined;
}

export function isDivifyApiConfigured(): boolean {
  return DIVIFY_API_BASE_URL.trim().length > 0
    && DIVIFY_TENANT_ID.trim().length > 0
    && DIVIFY_API_TOKEN.trim().length > 0;
}

function requireConfigured(): void {
  if (!isDivifyApiConfigured()) throw new DivifyNotConfiguredError();
}

function baseUrl(): string {
  return DIVIFY_API_BASE_URL.trim().replace(/\/+$/, '');
}

async function divifyFetch(path: string, init?: RequestInit): Promise<Response> {
  requireConfigured();
  const headers = new Headers(init?.headers);
  headers.set('Accept', 'application/json');
  headers.set('x-tenant-id', DIVIFY_TENANT_ID.trim());
  headers.set('Authorization', `Bearer ${DIVIFY_API_TOKEN.trim()}`);
  if (init?.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(`${baseUrl()}${path.startsWith('/') ? path : `/${path}`}`, {
    ...init,
    headers,
  });
}

export async function getPurchaseDetailed(
  offerId: string,
  purchaseId: string,
): Promise<DivifyPurchaseDetailed> {
  const encodedOffer = encodeURIComponent(offerId);
  const encodedPurchase = encodeURIComponent(purchaseId);
  const response = await divifyFetch(`/balance/offer/${encodedOffer}/purchase/${encodedPurchase}/detailed`);
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new DivifyApiError(response.status, text.slice(0, 300) || `HTTP ${String(response.status)}`);
  }
  const json: unknown = await response.json();
  const root = asRecord(json) ?? {};
  const nested: Record<string, unknown> = {
    ...root,
    ...(asRecord(root['data']) ?? {}),
    ...(asRecord(root['purchase']) ?? {}),
  };
  const status = mapStatus(pickString(nested, ['status']));
  const amountCents = parseAmountCents(nested);
  const investorId = pickString(nested, ['investorId', 'userId', 'user_id', 'investidorId']);
  return {
    offerId,
    purchaseId,
    raw: root,
    ...(status !== undefined ? { status } : {}),
    ...(amountCents !== undefined ? { amountCents } : {}),
    ...(investorId !== undefined ? { investorId } : {}),
  };
}
