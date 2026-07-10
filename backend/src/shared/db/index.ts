import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { AWS_REGION } from '../core/env.js';
import { Tables } from '../core/tables.js';
import type {
  Incorporadora,
  Admin,
  Projeto,
  Scorecard,
  Notificacao,
  AuditoriaEntry,
  NotaInterna,
  StatusProjeto,
} from '../core/types/index.js';

export { ConditionalCheckFailedException };

const client = new DynamoDBClient({ region: AWS_REGION });
export const db = DynamoDBDocumentClient.from(client);

function encodeCursor(key: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(key)).toString('base64');
}

function decodeCursor(cursor: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8')) as Record<string, unknown>;
}

// ── Incorporadoras ──────────────────────────────────────────────────

export async function getIncorporadora(id: string): Promise<Incorporadora | null> {
  const result = await db.send(new GetCommand({ TableName: Tables.INCORPORADORAS, Key: { id } }));
  return (result.Item as Incorporadora | undefined) ?? null;
}

export async function putIncorporadora(item: Incorporadora): Promise<void> {
  await db.send(new PutCommand({ TableName: Tables.INCORPORADORAS, Item: item }));
}

export async function updateIncorporadora(
  id: string,
  patch: Partial<Omit<Incorporadora, 'id' | 'cnpj' | 'email' | 'criadoEm'>>,
): Promise<void> {
  const sets: string[] = ['atualizadoEm = :ts'];
  const names: Record<string, string> = {};
  const values: Record<string, unknown> = { ':ts': new Date().toISOString() };
  let idx = 0;
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    const placeholder = `#f${String(idx)}`;
    const valuePlaceholder = `:v${String(idx)}`;
    sets.push(`${placeholder} = ${valuePlaceholder}`);
    names[placeholder] = k;
    values[valuePlaceholder] = v;
    idx++;
  }
  await db.send(new UpdateCommand({
    TableName: Tables.INCORPORADORAS,
    Key: { id },
    UpdateExpression: `SET ${sets.join(', ')}`,
    ...(Object.keys(names).length > 0 && { ExpressionAttributeNames: names }),
    ExpressionAttributeValues: values,
  }));
}

export async function listIncorporadoras(): Promise<Incorporadora[]> {
  const result = await db.send(new ScanCommand({ TableName: Tables.INCORPORADORAS }));
  return (result.Items ?? []) as Incorporadora[];
}

// ── Admins ──────────────────────────────────────────────────────────

export async function getAdmin(id: string): Promise<Admin | null> {
  const result = await db.send(new GetCommand({ TableName: Tables.ADMINS, Key: { id } }));
  return (result.Item as Admin | undefined) ?? null;
}

export async function putAdmin(item: Admin): Promise<void> {
  await db.send(new PutCommand({ TableName: Tables.ADMINS, Item: item }));
}

export async function updateAdminAtivo(id: string, ativo: boolean): Promise<void> {
  await db.send(new UpdateCommand({
    TableName: Tables.ADMINS,
    Key: { id },
    UpdateExpression: 'SET ativo = :a',
    ExpressionAttributeValues: { ':a': ativo },
  }));
}

export async function listAdmins(): Promise<Admin[]> {
  const result = await db.send(new ScanCommand({ TableName: Tables.ADMINS }));
  return (result.Items ?? []) as Admin[];
}

// ── Projetos ────────────────────────────────────────────────────────

export async function getProjeto(id: string): Promise<Projeto | null> {
  const result = await db.send(new GetCommand({ TableName: Tables.PROJETOS, Key: { id } }));
  return (result.Item as Projeto | undefined) ?? null;
}

export async function putProjeto(item: Projeto): Promise<void> {
  await db.send(new PutCommand({ TableName: Tables.PROJETOS, Item: item }));
}

export async function updateProjeto(
  id: string,
  patch: Partial<Omit<Projeto, 'id' | 'incorporadoraId' | 'criadoEm'>>,
): Promise<void> {
  const sets: string[] = ['atualizadoEm = :ts'];
  const names: Record<string, string> = {};
  const values: Record<string, unknown> = { ':ts': new Date().toISOString() };
  let idx = 0;
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    const placeholder = `#f${String(idx)}`;
    const valuePlaceholder = `:v${String(idx)}`;
    sets.push(`${placeholder} = ${valuePlaceholder}`);
    names[placeholder] = k;
    values[valuePlaceholder] = v;
    idx++;
  }
  await db.send(new UpdateCommand({
    TableName: Tables.PROJETOS,
    Key: { id },
    UpdateExpression: `SET ${sets.join(', ')}`,
    ...(Object.keys(names).length > 0 && { ExpressionAttributeNames: names }),
    ExpressionAttributeValues: values,
  }));
}

export async function listProjetosByIncorporadora(
  incorporadoraId: string,
  cursor: string | null = null,
  limit = 20,
): Promise<{ items: Projeto[]; cursor: string | null }> {
  const result = await db.send(new QueryCommand({
    TableName: Tables.PROJETOS,
    IndexName: 'incorporadoraId-criadoEm-index',
    KeyConditionExpression: 'incorporadoraId = :id',
    ExpressionAttributeValues: { ':id': incorporadoraId },
    ScanIndexForward: false,
    Limit: limit,
    ...(cursor !== null && { ExclusiveStartKey: decodeCursor(cursor) }),
  }));
  const nextCursor = result.LastEvaluatedKey !== undefined ? encodeCursor(result.LastEvaluatedKey) : null;
  return { items: (result.Items ?? []) as Projeto[], cursor: nextCursor };
}

export async function listProjetosByStatus(
  status: StatusProjeto[],
  cursor: string | null = null,
  limit = 30,
): Promise<{ items: Projeto[]; cursor: string | null }> {
  const allItems: Projeto[] = [];
  for (const s of status) {
    const result = await db.send(new QueryCommand({
      TableName: Tables.PROJETOS,
      IndexName: 'status-criadoEm-index',
      KeyConditionExpression: '#s = :s',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':s': s },
      ScanIndexForward: true,
      Limit: limit,
      ...(cursor !== null && { ExclusiveStartKey: decodeCursor(cursor) }),
    }));
    allItems.push(...((result.Items ?? []) as Projeto[]));
  }
  allItems.sort((a, b) => a.criadoEm.localeCompare(b.criadoEm));
  return { items: allItems.slice(0, limit), cursor: null };
}

// ── Scorecard ───────────────────────────────────────────────────────

export async function putScorecard(item: Scorecard): Promise<void> {
  await db.send(new PutCommand({ TableName: Tables.SCORECARD, Item: item }));
}

export async function listScorecardsByProjeto(projetoId: string): Promise<Scorecard[]> {
  const result = await db.send(new QueryCommand({
    TableName: Tables.SCORECARD,
    KeyConditionExpression: 'projetoId = :id',
    ExpressionAttributeValues: { ':id': projetoId },
    ScanIndexForward: false,
  }));
  return (result.Items ?? []) as Scorecard[];
}

// ── Notificações ────────────────────────────────────────────────────

export async function putNotificacao(item: Notificacao): Promise<void> {
  await db.send(new PutCommand({ TableName: Tables.NOTIFICACOES, Item: item }));
}

export async function listNotificacoes(
  userId: string,
  limit = 30,
): Promise<Notificacao[]> {
  const result = await db.send(new QueryCommand({
    TableName: Tables.NOTIFICACOES,
    KeyConditionExpression: 'userId = :id',
    ExpressionAttributeValues: { ':id': userId },
    ScanIndexForward: false,
    Limit: limit,
  }));
  return (result.Items ?? []) as Notificacao[];
}

export async function marcarNotificacaoLida(userId: string, criadoEm: string): Promise<void> {
  await db.send(new UpdateCommand({
    TableName: Tables.NOTIFICACOES,
    Key: { userId, criadoEm },
    UpdateExpression: 'SET lida = :l',
    ExpressionAttributeValues: { ':l': true },
  }));
}

// ── Auditoria ───────────────────────────────────────────────────────

export async function putAuditoria(entry: AuditoriaEntry): Promise<void> {
  await db.send(new PutCommand({ TableName: Tables.AUDITORIA, Item: entry }));
}

export async function listAuditoriaProjeto(projetoId: string): Promise<AuditoriaEntry[]> {
  const result = await db.send(new QueryCommand({
    TableName: Tables.AUDITORIA,
    KeyConditionExpression: 'projetoId = :id',
    ExpressionAttributeValues: { ':id': projetoId },
    ScanIndexForward: true,
  }));
  return (result.Items ?? []) as AuditoriaEntry[];
}

// ── Notas Internas ──────────────────────────────────────────────────

export async function putNota(nota: NotaInterna): Promise<void> {
  await db.send(new PutCommand({ TableName: Tables.NOTAS, Item: nota }));
}

export async function listNotasProjeto(projetoId: string): Promise<NotaInterna[]> {
  const result = await db.send(new QueryCommand({
    TableName: Tables.NOTAS,
    KeyConditionExpression: 'projetoId = :id',
    ExpressionAttributeValues: { ':id': projetoId },
    ScanIndexForward: false,
  }));
  return (result.Items ?? []) as NotaInterna[];
}
