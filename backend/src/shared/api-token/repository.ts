import type { ApiTokenRecord } from './types.js';

export interface ApiTokenRepository {
  put(record: ApiTokenRecord): Promise<void>;
  getByHash(tokenHash: string): Promise<ApiTokenRecord | null>;
  listByOwner(ownerId: string): Promise<readonly ApiTokenRecord[]>;
  markUsed(tokenHash: string, usedAt: string): Promise<void>;
  revoke(tokenHash: string, revokedAt: string): Promise<void>;
}
