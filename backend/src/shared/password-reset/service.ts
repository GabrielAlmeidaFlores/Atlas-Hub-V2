import { createHmac, randomBytes, randomInt } from 'node:crypto';
import { DeleteCommand, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { db } from '../db/index.js';
import { Tables } from '../core/tables.js';
import { PASSWORD_RESET_SECRET } from '../core/env.js';

const CODE_TTL_SECONDS = 10 * 60;
const TOKEN_TTL_SECONDS = 10 * 60;
const MAX_ATTEMPTS = 5;
const REQUEST_WINDOW_SECONDS = 60 * 60;
const MAX_REQUESTS_PER_WINDOW = 5;
const RESEND_COOLDOWN_SECONDS = 60;

export interface PasswordResetRecord {
  readonly email: string;
  readonly codeHash?: string;
  readonly expiresAt: number;
  readonly attempts: number;
  readonly createdAt: string;
  readonly lastSentAt: number;
  readonly requestCount: number;
  readonly windowStart: number;
  readonly resetTokenHash?: string;
  readonly resetTokenExpiresAt?: number;
  readonly validatedAt?: string;
  readonly codeUsedAt?: string;
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

function hash(value: string): string {
  return createHmac('sha256', PASSWORD_RESET_SECRET).update(value).digest('hex');
}

function gerarCodigo(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

function gerarToken(): string {
  return randomBytes(32).toString('hex');
}

export function resetConfigurado(): boolean {
  return PASSWORD_RESET_SECRET.length > 0 && PASSWORD_RESET_SECRET.length >= 16;
}

export async function getReset(email: string): Promise<PasswordResetRecord | null> {
  const result = await db.send(new GetCommand({ TableName: Tables.PASSWORD_RESETS, Key: { email } }));
  return (result.Item as PasswordResetRecord | undefined) ?? null;
}

export async function solicitarCodigo(email: string): Promise<string | null> {
  const now = nowSeconds();
  const atual = await getReset(email);
  const windowExpired = atual === null || now - atual.windowStart >= REQUEST_WINDOW_SECONDS;
  if (!windowExpired && atual.requestCount >= MAX_REQUESTS_PER_WINDOW) return null;
  if (!windowExpired && now - atual.lastSentAt < RESEND_COOLDOWN_SECONDS) return null;

  const codigo = gerarCodigo();
  const item: PasswordResetRecord = {
    email,
    codeHash: hash(codigo),
    expiresAt: now + CODE_TTL_SECONDS,
    attempts: 0,
    createdAt: atual?.createdAt ?? new Date().toISOString(),
    lastSentAt: now,
    requestCount: windowExpired ? 1 : atual.requestCount + 1,
    windowStart: windowExpired ? now : atual.windowStart,
  };
  await db.send(new PutCommand({ TableName: Tables.PASSWORD_RESETS, Item: item }));
  return codigo;
}

export async function validarCodigo(email: string, codigo: string): Promise<string | null> {
  const item = await getReset(email);
  if (item === null || item.codeHash === undefined || item.codeHash === '') return null;

  const now = nowSeconds();
  if (item.codeUsedAt !== undefined || item.expiresAt < now || item.attempts >= MAX_ATTEMPTS) return null;

  if (hash(codigo) !== item.codeHash) {
    await db.send(new UpdateCommand({
      TableName: Tables.PASSWORD_RESETS,
      Key: { email },
      UpdateExpression: 'SET attempts = attempts + :one',
      ExpressionAttributeValues: { ':one': 1 },
    }));
    return null;
  }

  const token = gerarToken();
  const tokenExpiresAt = now + TOKEN_TTL_SECONDS;
  const validatedAt = new Date().toISOString();
  await db.send(new UpdateCommand({
    TableName: Tables.PASSWORD_RESETS,
    Key: { email },
    UpdateExpression: 'SET resetTokenHash = :hash, resetTokenExpiresAt = :expires, validatedAt = :validated, codeUsedAt = :used, codeHash = :empty, expiresAt = :expires',
    ExpressionAttributeValues: {
      ':hash': hash(token),
      ':expires': tokenExpiresAt,
      ':validated': validatedAt,
      ':used': validatedAt,
      ':empty': '',
    },
  }));
  return token;
}

export async function validarToken(email: string, token: string): Promise<boolean> {
  const item = await getReset(email);
  if (item === null || item.resetTokenHash === undefined || item.resetTokenExpiresAt === undefined) return false;
  if (item.resetTokenExpiresAt < nowSeconds()) return false;
  return hash(token) === item.resetTokenHash;
}

export async function limparReset(email: string): Promise<void> {
  await db.send(new DeleteCommand({ TableName: Tables.PASSWORD_RESETS, Key: { email } }));
}
