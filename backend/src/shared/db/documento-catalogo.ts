import { GetCommand, PutCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { db } from './index.js';
import { Tables } from '../core/tables.js';
import type { DocumentoCatalogoItem, DocumentoScope } from '../core/types/index.js';

const CACHE_TTL_MS = 5 * 60 * 1000;

interface CatalogoCache {
  items: DocumentoCatalogoItem[];
  expiresAt: number;
}

let cache: CatalogoCache | null = null;

export function invalidateCatalogoCache(): void {
  cache = null;
}

function sortCatalogo(items: DocumentoCatalogoItem[]): DocumentoCatalogoItem[] {
  return items.sort((a, b) =>
    a.scope.localeCompare(b.scope)
    || a.categoria.localeCompare(b.categoria)
    || a.ordem - b.ordem
    || a.key.localeCompare(b.key));
}

export async function getCatalogoItem(key: string): Promise<DocumentoCatalogoItem | null> {
  const result = await db.send(new GetCommand({ TableName: Tables.DOCUMENTOS_CATALOGO, Key: { key } }));
  return (result.Item as DocumentoCatalogoItem | undefined) ?? null;
}

export async function putCatalogoItem(item: DocumentoCatalogoItem): Promise<void> {
  await db.send(new PutCommand({
    TableName: Tables.DOCUMENTOS_CATALOGO,
    Item: item,
    ConditionExpression: 'attribute_not_exists(#k)',
    ExpressionAttributeNames: { '#k': 'key' },
  }));
  invalidateCatalogoCache();
}

export async function updateCatalogoItem(
  key: string,
  patch: Record<string, unknown>,
): Promise<DocumentoCatalogoItem | null> {
  const current = await getCatalogoItem(key);
  if (current === null) return null;
  const merged: Record<string, unknown> = { ...current };
  for (const [k, v] of Object.entries(patch)) {
    if (v === null || v === undefined || v === '') delete merged[k];
    else merged[k] = v;
  }
  merged['atualizadoEm'] = new Date().toISOString();
  await db.send(new PutCommand({
    TableName: Tables.DOCUMENTOS_CATALOGO,
    Item: merged as unknown as DocumentoCatalogoItem,
  }));
  invalidateCatalogoCache();
  return merged as unknown as DocumentoCatalogoItem;
}

export async function deleteCatalogoItem(key: string): Promise<void> {
  await db.send(new DeleteCommand({ TableName: Tables.DOCUMENTOS_CATALOGO, Key: { key } }));
  invalidateCatalogoCache();
}

export async function listCatalogo(options?: { onlyActive?: boolean; scope?: DocumentoScope; noCache?: boolean }): Promise<DocumentoCatalogoItem[]> {
  const onlyActive = options?.onlyActive ?? false;
  const scope = options?.scope;
  const noCache = options?.noCache ?? false;
  let items: DocumentoCatalogoItem[];
  if (!noCache && cache !== null && Date.now() < cache.expiresAt) {
    items = cache.items;
  } else {
    const result = await db.send(new ScanCommand({ TableName: Tables.DOCUMENTOS_CATALOGO }));
    items = sortCatalogo((result.Items ?? []) as DocumentoCatalogoItem[]);
    cache = { items, expiresAt: Date.now() + CACHE_TTL_MS };
  }
  return items
    .filter((i) => !onlyActive || i.ativo)
    .filter((i) => scope === undefined || i.scope === scope);
}
