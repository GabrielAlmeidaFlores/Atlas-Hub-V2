import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { APIGatewayProxyEvent } from 'aws-lambda';
import { createAdminApiTokensHandler } from './admin-api-tokens.js';
import { ApiTokenService } from '../shared/api-token/service.js';
import { MemoryApiTokenRepository } from '../shared/api-token/memory-repository.js';

function event(method: string, resource: string, body?: unknown, tokenAuth = false): APIGatewayProxyEvent {
  return {
    httpMethod: method,
    resource,
    path: resource,
    headers: {},
    multiValueHeaders: {},
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    pathParameters: null,
    stageVariables: null,
    body: body === undefined ? null : JSON.stringify(body),
    isBase64Encoded: false,
    requestContext: {
      authorizer: tokenAuth
        ? { authType: 'token', userId: 'admin-1', email: 'admin1@atlashub.com', perfil: 'ADMIN_MASTER' }
        : { claims: { sub: 'admin-1', email: 'admin1@atlashub.com', 'cognito:groups': 'ADMIN_MASTER' } },
    } as unknown as APIGatewayProxyEvent['requestContext'],
  } as APIGatewayProxyEvent;
}

test('creates, lists and revokes API tokens', async () => {
  const handler = createAdminApiTokensHandler(new ApiTokenService(new MemoryApiTokenRepository()));
  const created = await handler(event('POST', '/admin/api-tokens', { name: 'CRM', permission: 'write', expiresInDays: 90 }));
  assert.equal(created.statusCode, 201);
  const createdBody = JSON.parse(created.body) as { token: { token: string; tokenId: string; permission: string } };
  assert.match(createdBody.token.token, /^atl_/);
  assert.equal(createdBody.token.permission, 'write');

  const list = await handler(event('GET', '/admin/api-tokens'));
  assert.equal(list.statusCode, 200);
  const listBody = JSON.parse(list.body) as { items: { tokenId: string; token?: string }[] };
  assert.equal(listBody.items.length, 1);
  assert.equal(listBody.items[0]?.tokenId, createdBody.token.tokenId);
  assert.equal(listBody.items[0]?.token, undefined);

  const revokeEvent = event('DELETE', '/admin/api-tokens/{tokenId}');
  revokeEvent.pathParameters = { tokenId: createdBody.token.tokenId };
  const revoked = await handler(revokeEvent);
  assert.equal(revoked.statusCode, 200);
});

test('does not allow API tokens to manage tokens', async () => {
  const handler = createAdminApiTokensHandler(new ApiTokenService(new MemoryApiTokenRepository()));
  const response = await handler(event('POST', '/admin/api-tokens', { name: 'Blocked', permission: 'read', expiresInDays: 90 }, true));
  assert.equal(response.statusCode, 403);
});
