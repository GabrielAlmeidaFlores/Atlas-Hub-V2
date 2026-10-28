import { api } from "./api";

export type ApiTokenPermission = "read" | "write";

export interface ApiTokenSummary {
  readonly tokenId: string;
  readonly name: string;
  readonly permission: ApiTokenPermission;
  readonly createdAt: string;
  readonly expiresAt?: string;
  readonly lastUsedAt?: string;
  readonly revokedAt?: string;
}

export interface ApiTokenCreated extends ApiTokenSummary {
  readonly token: string;
}

export interface ApiTokenCreateInput {
  readonly name: string;
  readonly permission: ApiTokenPermission;
  readonly expiresInDays: number | null;
}

export const apiTokensApi = {
  list: async (): Promise<readonly ApiTokenSummary[]> => {
    const response = await api.get<{ items: readonly ApiTokenSummary[] }>("/admin/api-tokens");
    return response.items;
  },
  create: async (input: ApiTokenCreateInput): Promise<ApiTokenCreated> => {
    const response = await api.post<{ token: ApiTokenCreated }>("/admin/api-tokens", input);
    return response.token;
  },
  revoke: async (tokenId: string): Promise<void> => {
    await api.delete(`/admin/api-tokens/${encodeURIComponent(tokenId)}`);
  },
};
