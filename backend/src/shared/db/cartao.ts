import { BatchGetCommand, GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { Tables } from '../core/tables.js';
import type { CartaoLiberacao, CartaoObra } from '../core/types/index.js';
import { db } from './index.js';

function compactItem(item: object): Record<string, unknown> {
  return Object.fromEntries(Object.entries(item).filter(([, value]) => value !== undefined));
}

export async function getCartaoObra(projetoId: string): Promise<CartaoObra | null> {
  const result = await db.send(new GetCommand({
    TableName: Tables.SPE_CARTOES,
    Key: { projetoId },
  }));
  return (result.Item as CartaoObra | undefined) ?? null;
}

export async function putCartaoObra(item: CartaoObra): Promise<void> {
  await db.send(new PutCommand({
    TableName: Tables.SPE_CARTOES,
    Item: compactItem(item),
  }));
}

export async function listCartoesByProjetos(projetoIds: readonly string[]): Promise<Map<string, CartaoObra>> {
  const map = new Map<string, CartaoObra>();
  const unique = [...new Set(projetoIds)].filter((id) => id.length > 0);
  for (let i = 0; i < unique.length; i += 100) {
    const chunk = unique.slice(i, i + 100);
    const result = await db.send(new BatchGetCommand({
      RequestItems: {
        [Tables.SPE_CARTOES]: {
          Keys: chunk.map((projetoId) => ({ projetoId })),
        },
      },
    }));
    for (const item of result.Responses?.[Tables.SPE_CARTOES] ?? []) {
      const cartao = item as CartaoObra;
      map.set(cartao.projetoId, cartao);
    }
  }
  return map;
}

export async function getCartaoLiberacao(projetoId: string, etapaId: string): Promise<CartaoLiberacao | null> {
  const result = await db.send(new GetCommand({
    TableName: Tables.SPE_CARTAO_LIBERACOES,
    Key: { projetoId, etapaId },
  }));
  return (result.Item as CartaoLiberacao | undefined) ?? null;
}

export async function putCartaoLiberacao(item: CartaoLiberacao): Promise<void> {
  await db.send(new PutCommand({
    TableName: Tables.SPE_CARTAO_LIBERACOES,
    Item: compactItem(item),
  }));
}

export async function listCartaoLiberacoes(projetoId: string): Promise<CartaoLiberacao[]> {
  const result = await db.send(new QueryCommand({
    TableName: Tables.SPE_CARTAO_LIBERACOES,
    KeyConditionExpression: 'projetoId = :p',
    ExpressionAttributeValues: { ':p': projetoId },
  }));
  return (result.Items ?? []) as CartaoLiberacao[];
}

export async function projetosComLiberacaoPendente(projetoIds: readonly string[]): Promise<Set<string>> {
  const pendentes = new Set<string>();
  await Promise.all(projetoIds.map(async (projetoId) => {
    const items = await listCartaoLiberacoes(projetoId);
    if (items.some((item) => item.status === 'SOLICITADA')) pendentes.add(projetoId);
  }));
  return pendentes;
}
