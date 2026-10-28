import type { ApiTokenRepository } from './repository.js';
import type { ApiTokenRecord } from './types.js';

export class MemoryApiTokenRepository implements ApiTokenRepository {
  readonly tokens = new Map<string, ApiTokenRecord>();

  async put(record: ApiTokenRecord): Promise<void> {
    this.tokens.set(record.tokenHash, record);
  }

  async getByHash(tokenHash: string): Promise<ApiTokenRecord | null> {
    return this.tokens.get(tokenHash) ?? null;
  }

  async listByOwner(ownerId: string): Promise<readonly ApiTokenRecord[]> {
    return [...this.tokens.values()].filter((record) => record.ownerId === ownerId);
  }

  async markUsed(tokenHash: string, usedAt: string): Promise<void> {
    const record = this.tokens.get(tokenHash);
    if (record !== undefined) this.tokens.set(tokenHash, { ...record, lastUsedAt: usedAt });
  }

  async revoke(tokenHash: string, revokedAt: string): Promise<void> {
    const record = this.tokens.get(tokenHash);
    if (record !== undefined) this.tokens.set(tokenHash, { ...record, revokedAt });
  }
}
