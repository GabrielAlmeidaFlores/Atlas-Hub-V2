import { GetCommand, PutCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { Tables } from '../core/tables.js';
import type { CaptacaoCompra, CaptacaoEvento } from '../core/types/index.js';
import { compraStatusRank } from '../divify/normalize.js';
import { db } from './index.js';

interface CaptacaoEventoRecord extends CaptacaoEvento {
  readonly payload: Record<string, unknown>;
}

function compactItem(item: object): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(item).filter(([, value]) => value !== undefined),
  );
}

function mergeCompra(base: CaptacaoCompra, patch: Partial<CaptacaoCompra>): CaptacaoCompra {
  const investorId = patch.investorId ?? base.investorId;
  const amountCents = patch.amountCents ?? base.amountCents;
  const projetoId = patch.projetoId ?? base.projetoId;
  const projetoNome = patch.projetoNome ?? base.projetoNome;
  return {
    ofertaId: patch.ofertaId ?? base.ofertaId,
    purchaseId: patch.purchaseId ?? base.purchaseId,
    status: patch.status ?? base.status,
    atualizadoEm: patch.atualizadoEm ?? base.atualizadoEm,
    recebidoEm: patch.recebidoEm ?? base.recebidoEm,
    ...(investorId !== undefined ? { investorId } : {}),
    ...(amountCents !== undefined ? { amountCents } : {}),
    ...(projetoId !== undefined ? { projetoId } : {}),
    ...(projetoNome !== undefined ? { projetoNome } : {}),
  };
}

function publicEvent(record: CaptacaoEventoRecord): CaptacaoEvento {
  const { payload, ...rest } = record;
  void payload;
  return rest;
}

export async function putCaptacaoEvento(record: CaptacaoEventoRecord): Promise<boolean> {
  try {
    await db.send(new PutCommand({
      TableName: Tables.CAPTACAO_EVENTOS,
      Item: compactItem(record),
      ConditionExpression: 'attribute_not_exists(id)',
    }));
    return true;
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) return false;
    throw err;
  }
}

export async function listCaptacaoEventos(limit = 80): Promise<CaptacaoEvento[]> {
  const items: CaptacaoEventoRecord[] = [];
  let exclusiveStartKey: Record<string, unknown> | undefined;
  do {
    const result = await db.send(new ScanCommand({
      TableName: Tables.CAPTACAO_EVENTOS,
      Limit: 100,
      ...(exclusiveStartKey !== undefined ? { ExclusiveStartKey: exclusiveStartKey } : {}),
    }));
    items.push(...((result.Items ?? []) as CaptacaoEventoRecord[]));
    exclusiveStartKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (exclusiveStartKey !== undefined && items.length < 400);
  items.sort((a, b) => b.recebidoEm.localeCompare(a.recebidoEm));
  return items.slice(0, limit).map(publicEvent);
}

export async function listCaptacaoEventosByOferta(ofertaId: string): Promise<CaptacaoEvento[]> {
  const result = await db.send(new QueryCommand({
    TableName: Tables.CAPTACAO_EVENTOS,
    IndexName: 'ofertaId-recebidoEm-index',
    KeyConditionExpression: 'ofertaId = :o',
    ExpressionAttributeValues: { ':o': ofertaId },
    ScanIndexForward: false,
  }));
  return ((result.Items ?? []) as CaptacaoEventoRecord[]).map(publicEvent);
}

export async function getCaptacaoCompra(ofertaId: string, purchaseId: string): Promise<CaptacaoCompra | null> {
  const result = await db.send(new GetCommand({
    TableName: Tables.CAPTACAO_COMPRAS,
    Key: { ofertaId, purchaseId },
  }));
  return (result.Item as CaptacaoCompra | undefined) ?? null;
}

export async function upsertCaptacaoCompra(incoming: CaptacaoCompra): Promise<CaptacaoCompra> {
  const existing = await getCaptacaoCompra(incoming.ofertaId, incoming.purchaseId);
  if (existing !== null && compraStatusRank(existing.status) > compraStatusRank(incoming.status)) {
    const merged = mergeCompra(existing, {
      atualizadoEm: incoming.atualizadoEm,
      ...(existing.investorId === undefined && incoming.investorId !== undefined ? { investorId: incoming.investorId } : {}),
      ...(existing.amountCents === undefined && incoming.amountCents !== undefined ? { amountCents: incoming.amountCents } : {}),
      ...(existing.projetoId === undefined && incoming.projetoId !== undefined ? { projetoId: incoming.projetoId } : {}),
      ...(existing.projetoNome === undefined && incoming.projetoNome !== undefined ? { projetoNome: incoming.projetoNome } : {}),
    });
    await db.send(new PutCommand({
      TableName: Tables.CAPTACAO_COMPRAS,
      Item: compactItem(merged),
    }));
    return merged;
  }
  const next = existing === null
    ? incoming
    : mergeCompra(existing, { ...incoming, recebidoEm: existing.recebidoEm });
  await db.send(new PutCommand({
    TableName: Tables.CAPTACAO_COMPRAS,
    Item: compactItem(next),
  }));
  return next;
}

export async function listCaptacaoCompras(): Promise<CaptacaoCompra[]> {
  const items: CaptacaoCompra[] = [];
  let exclusiveStartKey: Record<string, unknown> | undefined;
  do {
    const result = await db.send(new ScanCommand({
      TableName: Tables.CAPTACAO_COMPRAS,
      ...(exclusiveStartKey !== undefined ? { ExclusiveStartKey: exclusiveStartKey } : {}),
    }));
    items.push(...((result.Items ?? []) as CaptacaoCompra[]));
    exclusiveStartKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (exclusiveStartKey !== undefined);
  return items;
}

export async function listCaptacaoComprasByOferta(ofertaId: string): Promise<CaptacaoCompra[]> {
  const result = await db.send(new QueryCommand({
    TableName: Tables.CAPTACAO_COMPRAS,
    KeyConditionExpression: 'ofertaId = :o',
    ExpressionAttributeValues: { ':o': ofertaId },
  }));
  const items = (result.Items ?? []) as CaptacaoCompra[];
  items.sort((a, b) => b.atualizadoEm.localeCompare(a.atualizadoEm));
  return items;
}
