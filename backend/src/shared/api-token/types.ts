export const API_TOKEN_PERMISSIONS = ['read', 'write'] as const;

export type ApiTokenPermission = (typeof API_TOKEN_PERMISSIONS)[number];

export interface ApiTokenRecord {
  readonly tokenHash: string;
  readonly tokenId: string;
  readonly name: string;
  readonly ownerId: string;
  readonly ownerEmail: string;
  readonly permission: ApiTokenPermission;
  readonly prefix: string;
  readonly createdAt: string;
  readonly expiresAt?: string;
  readonly lastUsedAt?: string;
  readonly revokedAt?: string;
}

export interface ApiTokenSummary {
  readonly tokenId: string;
  readonly name: string;
  readonly permission: ApiTokenPermission;
  readonly createdAt: string;
  readonly expiresAt?: string;
  readonly lastUsedAt?: string;
  readonly revokedAt?: string;
}

export interface CreatedApiToken extends ApiTokenSummary {
  readonly token: string;
}

export interface ApiTokenActor {
  readonly userId: string;
  readonly email: string;
}
