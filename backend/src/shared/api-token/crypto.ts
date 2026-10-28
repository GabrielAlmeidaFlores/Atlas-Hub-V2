import { createHash, randomBytes } from 'node:crypto';

const TOKEN_PREFIX = 'atl_';

export function generateApiToken(): { readonly token: string; readonly tokenHash: string; readonly prefix: string } {
  const token = `${TOKEN_PREFIX}${randomBytes(32).toString('base64url')}`;
  return {
    token,
    tokenHash: hashApiToken(token),
    prefix: token.slice(0, 12),
  };
}

export function hashApiToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
