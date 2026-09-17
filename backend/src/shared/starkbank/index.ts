import starkbank from 'starkbank';
import { STAGE, STARK_ENVIRONMENT, STARK_ORGANIZATION_ID, STARK_PRIVATE_KEY } from '../core/env.js';
import type { DestinoPix } from '../core/types/index.js';

export class StarkNotConfiguredError extends Error {
  constructor() {
    super('Integração bancária não configurada neste ambiente');
    this.name = 'StarkNotConfiguredError';
  }
}

export class StarkOperationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StarkOperationError';
  }
}

interface StarkWorkspace {
  readonly id: string;
  readonly username: string;
  readonly name: string;
  readonly status: string;
}

interface StarkBalance {
  readonly amount: number;
}

interface StarkTx {
  readonly id: string;
  readonly amount: number;
  readonly description: string;
  readonly created: string;
  readonly source: string;
  readonly tags: string[];
}

interface StarkTransferResult {
  readonly id: string;
  readonly status: string;
}

export interface StarkWebhookEvent {
  readonly id: string;
  readonly subscription: string;
  readonly workspaceId?: string;
  readonly amount?: number;
  readonly description?: string;
  readonly created?: string;
  readonly tags?: string[];
  readonly operationId?: string;
  readonly tipo: 'DEPOSIT' | 'TRANSFER' | 'INVOICE' | 'TRANSACTION';
}

interface StarkSdk {
  Organization: new (params: {
    id: string;
    privateKey: string;
    environment: string;
    workspaceId?: string | null;
  }) => StarkOrg;
  workspace: {
    create: (data: { username: string; name: string; allowedTaxIds?: string[] }, options?: { user?: StarkOrg }) => Promise<StarkWorkspace>;
    query: (params?: { limit?: number; username?: string }, options?: { user?: StarkOrg }) => AsyncIterable<StarkWorkspace>;
  };
  balance: { get: (options?: { user?: StarkOrg }) => Promise<StarkBalance> };
  transaction: {
    query: (params?: { limit?: number; after?: string; before?: string }, options?: { user?: StarkOrg }) => AsyncIterable<StarkTx>;
  };
  transfer: {
    create: (transfers: Array<Record<string, unknown>>, options?: { user?: StarkOrg }) => Promise<Array<{ id: string; status: string }>>;
  };
  dictKey: {
    get: (id: string, options?: { user?: StarkOrg }) => Promise<{
      id: string;
      name?: string;
      taxId?: string;
      ispb?: string;
      branchCode?: string;
      accountNumber?: string;
      accountType?: string;
    }>;
    query: (params?: { limit?: number; type?: string }, options?: { user?: StarkOrg }) => AsyncIterable<{ id: string; type: string }>;
    create?: (data: { type: string }, options?: { user?: StarkOrg }) => Promise<{ id: string; type: string }>;
  };
  splitReceiver: {
    create: (receivers: Array<Record<string, unknown>>, options?: { user?: StarkOrg }) => Promise<Array<{ id: string }>>;
  };
  event: {
    parse: (params: { content: string; signature: string }) => {
      id: string;
      subscription: string;
      workspaceId?: string;
      log?: {
        type?: string;
        transfer?: { id: string; amount: number; created?: string; tags?: string[]; description?: string };
        deposit?: { id: string; amount: number; created?: string; tags?: string[]; description?: string };
        invoice?: { id: string; amount: number; created?: string; tags?: string[]; descriptions?: Array<{ text: string }> };
        transaction?: { id: string; amount: number; created?: string; description?: string; tags?: string[] };
      };
    };
  };
}

interface StarkOrg {
  id: string;
}

function loadSdk(): StarkSdk {
  return starkbank as unknown as StarkSdk;
}

export function isStarkConfigured(): boolean {
  return STARK_ORGANIZATION_ID.length > 0 && STARK_PRIVATE_KEY.includes('BEGIN');
}

function requireConfigured(): void {
  if (!isStarkConfigured()) throw new StarkNotConfiguredError();
}

function orgUser(workspaceId?: string): StarkOrg {
  requireConfigured();
  const sdk = loadSdk();
  return new sdk.Organization({
    id: STARK_ORGANIZATION_ID,
    privateKey: STARK_PRIVATE_KEY,
    environment: STARK_ENVIRONMENT === 'production' ? 'production' : 'sandbox',
    workspaceId: workspaceId ?? null,
  });
}

async function collect<T>(iter: AsyncIterable<T>, max: number): Promise<T[]> {
  const items: T[] = [];
  for await (const item of iter) {
    items.push(item);
    if (items.length >= max) break;
  }
  return items;
}

function wrapStarkError(err: unknown): never {
  if (err instanceof StarkNotConfiguredError || err instanceof StarkOperationError) throw err;
  const message = err instanceof Error ? err.message : 'Falha na operação bancária';
  throw new StarkOperationError(message);
}

async function firstPixKey(user: StarkOrg): Promise<string | undefined> {
  const sdk = loadSdk();
  try {
    if (typeof sdk.dictKey.create === 'function') {
      const created = await sdk.dictKey.create({ type: 'evp' }, { user });
      if (created.id.length > 0) return created.id;
    }
  } catch {
  }
  try {
    const keys = await collect(sdk.dictKey.query({ limit: 5, type: 'evp' }, { user }), 5);
    return keys[0]?.id;
  } catch {
    return undefined;
  }
}

export async function findWorkspaceByUsername(username: string): Promise<StarkWorkspace | null> {
  requireConfigured();
  const sdk = loadSdk();
  try {
    const found = await collect(sdk.workspace.query({ limit: 20, username }, { user: orgUser() }), 20);
    return found.find((w) => w.username === username) ?? found[0] ?? null;
  } catch (err) {
    wrapStarkError(err);
  }
}

export async function createWorkspace(params: {
  readonly username: string;
  readonly name: string;
}): Promise<{ workspace: StarkWorkspace; pixKey?: string }> {
  requireConfigured();
  const sdk = loadSdk();
  const existing = await findWorkspaceByUsername(params.username);
  if (existing !== null) {
    const pixKey = await firstPixKey(orgUser(existing.id));
    return pixKey !== undefined ? { workspace: existing, pixKey } : { workspace: existing };
  }
  try {
    const workspace = await sdk.workspace.create(
      { username: params.username, name: params.name },
      { user: orgUser() },
    );
    const pixKey = await firstPixKey(orgUser(workspace.id));
    return pixKey !== undefined ? { workspace, pixKey } : { workspace };
  } catch (err) {
    wrapStarkError(err);
  }
}

export function treasuryUsername(): string {
  return `atlashub-tesouraria-${STAGE}`.slice(0, 48);
}

export function projectUsername(projetoId: string): string {
  const compact = projetoId.replace(/-/g, '').toLowerCase();
  return `atlashub-spe-${STAGE}-${compact}`.slice(0, 48);
}

export async function getWorkspaceBalance(workspaceId: string): Promise<number> {
  requireConfigured();
  const sdk = loadSdk();
  try {
    const balance = await sdk.balance.get({ user: orgUser(workspaceId) });
    return balance.amount;
  } catch (err) {
    wrapStarkError(err);
  }
}

export async function listWorkspaceTransactions(
  workspaceId: string,
  limit = 50,
): Promise<readonly StarkTx[]> {
  requireConfigured();
  const sdk = loadSdk();
  try {
    return await collect(sdk.transaction.query({ limit }, { user: orgUser(workspaceId) }), limit);
  } catch (err) {
    wrapStarkError(err);
  }
}

export async function lookupPixKey(pixKey: string, workspaceId: string): Promise<DestinoPix> {
  requireConfigured();
  const sdk = loadSdk();
  try {
    const dict = await sdk.dictKey.get(pixKey, { user: orgUser(workspaceId) });
    if (dict.taxId === undefined || dict.name === undefined || dict.ispb === undefined
      || dict.branchCode === undefined || dict.accountNumber === undefined) {
      throw new StarkOperationError('Chave Pix não encontrada ou incompleta');
    }
    const accountType = dict.accountType === 'savings' || dict.accountType === 'salary' || dict.accountType === 'payment'
      ? dict.accountType
      : 'checking';
    return {
      pixKey,
      name: dict.name,
      taxId: dict.taxId.replace(/\D/g, ''),
      bankCode: dict.ispb,
      branchCode: dict.branchCode,
      accountNumber: dict.accountNumber,
      accountType,
    };
  } catch (err) {
    wrapStarkError(err);
  }
}

export async function createWorkspaceTransfer(
  workspaceId: string,
  destino: DestinoPix,
  amount: number,
  description: string,
  externalId: string,
): Promise<StarkTransferResult> {
  requireConfigured();
  const sdk = loadSdk();
  try {
    const created = await sdk.transfer.create([{
      amount,
      name: destino.name,
      taxId: destino.taxId,
      bankCode: destino.bankCode,
      branchCode: destino.branchCode,
      accountNumber: destino.accountNumber,
      accountType: destino.accountType,
      description,
      externalId,
      tags: ['atlas-hub', `solicitacao:${externalId}`],
    }], { user: orgUser(workspaceId) });
    const first = created[0];
    if (first === undefined) throw new StarkOperationError('Transferência não retornou identificador');
    return { id: first.id, status: first.status };
  } catch (err) {
    wrapStarkError(err);
  }
}

export async function createSplitReceiverPrep(
  workspaceId: string,
  destino: DestinoPix,
  tags: string[],
): Promise<string> {
  requireConfigured();
  const sdk = loadSdk();
  try {
    const created = await sdk.splitReceiver.create([{
      name: destino.name,
      taxId: destino.taxId,
      bankCode: destino.bankCode,
      branchCode: destino.branchCode,
      accountNumber: destino.accountNumber,
      accountType: destino.accountType,
      tags,
    }], { user: orgUser(workspaceId) });
    const first = created[0];
    if (first === undefined) throw new StarkOperationError('Split receiver não criado');
    return first.id;
  } catch (err) {
    wrapStarkError(err);
  }
}

function mapSubscription(subscription: string): 'DEPOSIT' | 'TRANSFER' | 'INVOICE' | 'TRANSACTION' {
  if (subscription.includes('deposit')) return 'DEPOSIT';
  if (subscription.includes('invoice')) return 'INVOICE';
  if (subscription.includes('transfer')) return 'TRANSFER';
  return 'TRANSACTION';
}

export function parseStarkWebhook(content: string, signature: string): StarkWebhookEvent {
  requireConfigured();
  const sdk = loadSdk();
  try {
    const event = sdk.event.parse({ content, signature });
    const log = event.log;
    const transfer = log?.transfer;
    const deposit = log?.deposit;
    const invoice = log?.invoice;
    const transaction = log?.transaction;
    const op = transfer ?? deposit ?? invoice ?? transaction;
    const description = invoice?.descriptions?.[0]?.text
      ?? transfer?.description
      ?? deposit?.description
      ?? transaction?.description
      ?? event.subscription;
    const tags = transfer?.tags ?? deposit?.tags ?? transaction?.tags;
    return {
      id: event.id,
      subscription: event.subscription,
      description,
      tipo: mapSubscription(event.subscription),
      ...(event.workspaceId !== undefined ? { workspaceId: event.workspaceId } : {}),
      ...(op?.amount !== undefined ? { amount: op.amount } : {}),
      ...(op?.created !== undefined ? { created: op.created } : {}),
      ...(op?.id !== undefined ? { operationId: op.id } : {}),
      ...(tags !== undefined ? { tags } : {}),
    };
  } catch (err) {
    wrapStarkError(err);
  }
}
