import { createHash, timingSafeEqual } from 'node:crypto';
import { DIVIFY_TENANT_ID, DIVIFY_WEBHOOK_SECRET } from '../core/env.js';

export function isDivifyWebhookConfigured(): boolean {
  return DIVIFY_WEBHOOK_SECRET.trim().length >= 16;
}

function headerValue(headers: Record<string, string | undefined> | null, name: string): string {
  if (headers === null) return '';
  const lower = name.toLowerCase();
  const found = Object.entries(headers).find(([key]) => key.toLowerCase() === lower);
  return found?.[1]?.trim() ?? '';
}

function secretsEqual(provided: string, expected: string): boolean {
  const left = createHash('sha256').update(provided).digest();
  const right = createHash('sha256').update(expected).digest();
  return timingSafeEqual(left, right);
}

export function readWebhookSecret(headers: Record<string, string | undefined> | null): string {
  const direct = headerValue(headers, 'X-Webhook-Secret');
  if (direct.length > 0) return direct;
  const token = headerValue(headers, 'X-Webhook-Token');
  if (token.length > 0) return token;
  const auth = headerValue(headers, 'Authorization');
  if (auth.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim();
  return '';
}

export function verifyDivifyWebhook(headers: Record<string, string | undefined> | null): boolean {
  if (!isDivifyWebhookConfigured()) return false;
  const provided = readWebhookSecret(headers);
  if (provided.length === 0) return false;
  if (!secretsEqual(provided, DIVIFY_WEBHOOK_SECRET.trim())) return false;
  const expectedTenant = DIVIFY_TENANT_ID.trim();
  if (expectedTenant.length === 0) return true;
  const tenant = headerValue(headers, 'x-tenant-id');
  return secretsEqual(tenant, expectedTenant);
}
