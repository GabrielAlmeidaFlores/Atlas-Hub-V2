import {
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { Tables } from '../core/tables.js';
import { TESOURARIA_CONTA_ID } from '../core/types/index.js';
import type {
  SpeConta,
  FinanceiroLedgerEntry,
  FinanceiroSolicitacao,
  FinanceiroAuditoriaEntry,
  SolicitacaoStatus,
} from '../core/types/index.js';
import { db } from './index.js';

export async function getSpeConta(projetoId: string): Promise<SpeConta | null> {
  const result = await db.send(new GetCommand({ TableName: Tables.SPE_CONTAS, Key: { projetoId } }));
  return (result.Item as SpeConta | undefined) ?? null;
}

export async function getSpeContaByWorkspace(workspaceId: string): Promise<SpeConta | null> {
  const result = await db.send(new QueryCommand({
    TableName: Tables.SPE_CONTAS,
    IndexName: 'workspaceId-index',
    KeyConditionExpression: 'workspaceId = :w',
    ExpressionAttributeValues: { ':w': workspaceId },
    Limit: 1,
  }));
  const item = result.Items?.[0];
  return (item as SpeConta | undefined) ?? null;
}

export async function putSpeConta(item: SpeConta): Promise<void> {
  await db.send(new PutCommand({
    TableName: Tables.SPE_CONTAS,
    Item: item,
    ConditionExpression: 'attribute_not_exists(projetoId)',
  }));
}

export async function updateSpeConta(
  projetoId: string,
  patch: Partial<Omit<SpeConta, 'projetoId' | 'criadoEm' | 'criadoPor'>>,
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
    idx += 1;
  }
  await db.send(new UpdateCommand({
    TableName: Tables.SPE_CONTAS,
    Key: { projetoId },
    UpdateExpression: `SET ${sets.join(', ')}`,
    ...(Object.keys(names).length > 0 && { ExpressionAttributeNames: names }),
    ExpressionAttributeValues: values,
  }));
}

export async function listSpeContas(): Promise<SpeConta[]> {
  const result = await db.send(new ScanCommand({ TableName: Tables.SPE_CONTAS }));
  return (result.Items ?? []) as SpeConta[];
}

export async function getTesouraria(): Promise<SpeConta | null> {
  return getSpeConta(TESOURARIA_CONTA_ID);
}

export async function putLedgerEntry(entry: FinanceiroLedgerEntry): Promise<void> {
  await db.send(new PutCommand({
    TableName: Tables.FINANCEIRO_LEDGER,
    Item: entry,
    ConditionExpression: 'attribute_not_exists(projetoId) AND attribute_not_exists(starkId)',
  }));
}

export async function upsertLedgerEntry(entry: FinanceiroLedgerEntry): Promise<boolean> {
  try {
    await putLedgerEntry(entry);
    return true;
  } catch (err) {
    if (err instanceof Error && err.name === 'ConditionalCheckFailedException') return false;
    throw err;
  }
}

export async function listLedgerByProjeto(
  projetoId: string,
  limit = 50,
): Promise<FinanceiroLedgerEntry[]> {
  const result = await db.send(new QueryCommand({
    TableName: Tables.FINANCEIRO_LEDGER,
    KeyConditionExpression: 'projetoId = :id',
    ExpressionAttributeValues: { ':id': projetoId },
    ScanIndexForward: false,
    Limit: limit,
  }));
  return (result.Items ?? []) as FinanceiroLedgerEntry[];
}

export async function putSolicitacao(item: FinanceiroSolicitacao): Promise<void> {
  await db.send(new PutCommand({ TableName: Tables.FINANCEIRO_SOLICITACOES, Item: item }));
}

export async function getSolicitacao(id: string): Promise<FinanceiroSolicitacao | null> {
  const result = await db.send(new GetCommand({ TableName: Tables.FINANCEIRO_SOLICITACOES, Key: { id } }));
  return (result.Item as FinanceiroSolicitacao | undefined) ?? null;
}

export async function updateSolicitacaoStatus(
  id: string,
  status: SolicitacaoStatus,
  extra: Partial<Pick<FinanceiroSolicitacao, 'aprovadoPor' | 'aprovadoPorNome' | 'aprovadoEm' | 'starkTransferId' | 'erro'>>,
): Promise<void> {
  const sets = ['#s = :s'];
  const names: Record<string, string> = { '#s': 'status' };
  const values: Record<string, unknown> = { ':s': status };
  let idx = 0;
  for (const [k, v] of Object.entries(extra)) {
    if (v === undefined) continue;
    const n = `#e${String(idx)}`;
    const val = `:e${String(idx)}`;
    sets.push(`${n} = ${val}`);
    names[n] = k;
    values[val] = v;
    idx += 1;
  }
  await db.send(new UpdateCommand({
    TableName: Tables.FINANCEIRO_SOLICITACOES,
    Key: { id },
    UpdateExpression: `SET ${sets.join(', ')}`,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
  }));
}

export async function listSolicitacoesByProjeto(projetoId: string): Promise<FinanceiroSolicitacao[]> {
  const result = await db.send(new QueryCommand({
    TableName: Tables.FINANCEIRO_SOLICITACOES,
    IndexName: 'projetoId-solicitadoEm-index',
    KeyConditionExpression: 'projetoId = :id',
    ExpressionAttributeValues: { ':id': projetoId },
    ScanIndexForward: false,
  }));
  return (result.Items ?? []) as FinanceiroSolicitacao[];
}

export async function putFinanceiroAuditoria(entry: FinanceiroAuditoriaEntry): Promise<void> {
  await db.send(new PutCommand({ TableName: Tables.FINANCEIRO_AUDITORIA, Item: entry }));
}

export async function listFinanceiroAuditoria(projetoId: string): Promise<FinanceiroAuditoriaEntry[]> {
  const result = await db.send(new QueryCommand({
    TableName: Tables.FINANCEIRO_AUDITORIA,
    KeyConditionExpression: 'projetoId = :id',
    ExpressionAttributeValues: { ':id': projetoId },
    ScanIndexForward: false,
    Limit: 100,
  }));
  return (result.Items ?? []) as FinanceiroAuditoriaEntry[];
}
