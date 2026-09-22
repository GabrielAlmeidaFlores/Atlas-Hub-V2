import { BatchGetCommand, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { Tables } from '../core/tables.js';
import type { CartaoObra } from '../core/types/index.js';
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
