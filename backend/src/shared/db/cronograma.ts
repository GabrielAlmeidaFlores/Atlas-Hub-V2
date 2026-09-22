import { DeleteCommand, GetCommand, PutCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { Tables } from '../core/tables.js';
import type { EtapaObra, LancamentoObra } from '../core/types/index.js';
import { db } from './index.js';

function compactItem(item: object): Record<string, unknown> {
  return Object.fromEntries(Object.entries(item).filter(([, value]) => value !== undefined));
}

async function scanAll<T>(tableName: string): Promise<T[]> {
  const items: T[] = [];
  let exclusiveStartKey: Record<string, unknown> | undefined;
  do {
    const result = await db.send(new ScanCommand({
      TableName: tableName,
      ...(exclusiveStartKey !== undefined ? { ExclusiveStartKey: exclusiveStartKey } : {}),
    }));
    items.push(...((result.Items ?? []) as T[]));
    exclusiveStartKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (exclusiveStartKey !== undefined);
  return items;
}

export async function putEtapaObra(item: EtapaObra): Promise<void> {
  await db.send(new PutCommand({ TableName: Tables.OBRA_ETAPAS, Item: compactItem(item) }));
}

export async function getEtapaObra(projetoId: string, etapaId: string): Promise<EtapaObra | null> {
  const result = await db.send(new GetCommand({
    TableName: Tables.OBRA_ETAPAS,
    Key: { projetoId, etapaId },
  }));
  return (result.Item as EtapaObra | undefined) ?? null;
}

export async function deleteEtapaObra(projetoId: string, etapaId: string): Promise<void> {
  await db.send(new DeleteCommand({
    TableName: Tables.OBRA_ETAPAS,
    Key: { projetoId, etapaId },
  }));
}

export async function listEtapasByProjeto(projetoId: string): Promise<EtapaObra[]> {
  const result = await db.send(new QueryCommand({
    TableName: Tables.OBRA_ETAPAS,
    KeyConditionExpression: 'projetoId = :p',
    ExpressionAttributeValues: { ':p': projetoId },
  }));
  return (result.Items ?? []) as EtapaObra[];
}

export async function listAllEtapasObra(): Promise<EtapaObra[]> {
  return scanAll<EtapaObra>(Tables.OBRA_ETAPAS);
}

export async function putLancamentoObra(item: LancamentoObra): Promise<void> {
  await db.send(new PutCommand({ TableName: Tables.OBRA_LANCAMENTOS, Item: compactItem(item) }));
}

export async function getLancamentoObra(projetoId: string, lancamentoId: string): Promise<LancamentoObra | null> {
  const result = await db.send(new GetCommand({
    TableName: Tables.OBRA_LANCAMENTOS,
    Key: { projetoId, lancamentoId },
  }));
  return (result.Item as LancamentoObra | undefined) ?? null;
}

export async function listLancamentosByProjeto(projetoId: string): Promise<LancamentoObra[]> {
  const result = await db.send(new QueryCommand({
    TableName: Tables.OBRA_LANCAMENTOS,
    KeyConditionExpression: 'projetoId = :p',
    ExpressionAttributeValues: { ':p': projetoId },
  }));
  return (result.Items ?? []) as LancamentoObra[];
}

export async function listAllLancamentosObra(): Promise<LancamentoObra[]> {
  return scanAll<LancamentoObra>(Tables.OBRA_LANCAMENTOS);
}
