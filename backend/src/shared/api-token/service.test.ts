import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hashApiToken } from './crypto.js';
import { MemoryApiTokenRepository } from './memory-repository.js';
import { ApiTokenService } from './service.js';

const actor = { userId: 'user-1', email: 'admin@atlashub.com' };

test('creates, lists, validates and revokes an API token', async () => {
  const service = new ApiTokenService(new MemoryApiTokenRepository());
  const created = await service.create(actor, { name: 'CRM', permission: 'write', expiresInDays: 90 });
  assert.match(created.token, /^atl_/);
  assert.equal(created.name, 'CRM');
  assert.equal(created.permission, 'write');
  assert.equal('tokenHash' in created, false);

  const list = await service.list(actor.userId);
  assert.equal(list.length, 1);
  assert.equal(list[0]?.tokenId, created.tokenId);
  assert.equal('tokenHash' in (list[0] ?? {}), false);

  const valid = await service.validate(created.token);
  assert.equal(valid?.tokenId, created.tokenId);
  assert.equal(valid?.tokenHash, hashApiToken(created.token));

  await service.revoke(actor.userId, created.tokenId);
  assert.equal(await service.validate(created.token), null);
});

test('supports tokens without expiration and rejects expired tokens', async () => {
  const service = new ApiTokenService(new MemoryApiTokenRepository());
  const permanent = await service.create(actor, { name: 'Permanente', permission: 'read', expiresInDays: null });
  assert.equal(permanent.expiresAt, undefined);

  const repository = new MemoryApiTokenRepository();
  const expiredService = new ApiTokenService(repository);
  const token = await expiredService.create(actor, { name: 'Expirado', permission: 'read', expiresInDays: 1 });
  const stored = await repository.getByHash(hashApiToken(token.token));
  assert.ok(stored !== undefined && stored !== null);
  if (stored !== null) {
    await repository.put({ ...stored, expiresAt: new Date(Date.now() - 1000).toISOString() });
  }
  assert.equal(await expiredService.validate(token.token), null);
});
