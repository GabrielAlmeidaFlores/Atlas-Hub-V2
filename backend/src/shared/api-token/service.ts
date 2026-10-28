import { v4 as uuidv4 } from 'uuid';
import { generateApiToken, hashApiToken } from './crypto.js';
import { ApiTokenNotFoundError } from './errors.js';
import type { ApiTokenRepository } from './repository.js';
import type {
  ApiTokenActor,
  ApiTokenPermission,
  ApiTokenRecord,
  ApiTokenSummary,
  CreatedApiToken,
} from './types.js';

const DAY_MS = 86_400_000;
const LAST_USED_THROTTLE_MS = 60_000;

export interface ApiTokenCreateInput {
  readonly name: string;
  readonly permission: ApiTokenPermission;
  readonly expiresInDays: number | null;
}

export class ApiTokenService {
  constructor(private readonly repository: ApiTokenRepository) {}

  async create(actor: ApiTokenActor, input: ApiTokenCreateInput): Promise<CreatedApiToken> {
    const generated = generateApiToken();
    const createdAt = new Date().toISOString();
    const expiresAt = input.expiresInDays === null
      ? undefined
      : new Date(Date.now() + input.expiresInDays * DAY_MS).toISOString();
    const record: ApiTokenRecord = {
      tokenHash: generated.tokenHash,
      tokenId: uuidv4(),
      name: input.name,
      ownerId: actor.userId,
      ownerEmail: actor.email,
      permission: input.permission,
      prefix: generated.prefix,
      createdAt,
      ...(expiresAt !== undefined ? { expiresAt } : {}),
    };
    await this.repository.put(record);
    return { ...this.toSummary(record), token: generated.token };
  }

  async list(ownerId: string): Promise<ApiTokenSummary[]> {
    const records = await this.repository.listByOwner(ownerId);
    return [...records]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((record) => this.toSummary(record));
  }

  async revoke(ownerId: string, tokenId: string): Promise<ApiTokenSummary> {
    const records = await this.repository.listByOwner(ownerId);
    const record = records.find((item) => item.tokenId === tokenId);
    if (record === undefined) throw new ApiTokenNotFoundError();
    if (record.revokedAt === undefined) {
      await this.repository.revoke(record.tokenHash, new Date().toISOString());
    }
    return this.toSummary({ ...record, revokedAt: record.revokedAt ?? new Date().toISOString() });
  }

  async validate(rawToken: string): Promise<ApiTokenRecord | null> {
    const record = await this.repository.getByHash(hashApiToken(rawToken));
    if (record === null) return null;
    if (record.revokedAt !== undefined) return null;
    if (record.expiresAt !== undefined && Date.parse(record.expiresAt) <= Date.now()) return null;
    return record;
  }

  async markUsed(record: ApiTokenRecord): Promise<void> {
    if (record.lastUsedAt !== undefined && Date.now() - Date.parse(record.lastUsedAt) < LAST_USED_THROTTLE_MS) return;
    await this.repository.markUsed(record.tokenHash, new Date().toISOString());
  }

  private toSummary(record: ApiTokenRecord): ApiTokenSummary {
    const { tokenHash, ownerId, ownerEmail, ...summary } = record;
    void tokenHash;
    void ownerId;
    void ownerEmail;
    return summary;
  }
}
