import type { APIGatewayAuthorizerResult, APIGatewayRequestAuthorizerEvent } from 'aws-lambda';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { DynamoApiTokenRepository } from '../shared/api-token/dynamo-repository.js';
import { ApiTokenService } from '../shared/api-token/service.js';
import { getAdmin } from '../shared/db/index.js';
import { COGNITO_CLIENT_ID, COGNITO_USER_POOL_ID } from '../shared/core/env.js';
import { createLogger } from '../shared/core/logger.js';
import type { Perfil } from '../shared/core/types/index.js';

const service = new ApiTokenService(new DynamoApiTokenRepository());
const verifier = COGNITO_USER_POOL_ID.length > 0 && COGNITO_CLIENT_ID.length > 0
  ? CognitoJwtVerifier.create({
      userPoolId: COGNITO_USER_POOL_ID,
      tokenUse: 'id',
      clientId: COGNITO_CLIENT_ID,
    })
  : null;

function header(event: APIGatewayRequestAuthorizerEvent, name: string): string {
  const direct = event.headers?.[name] ?? event.headers?.[name.toLowerCase()] ?? event.headers?.[name.toUpperCase()];
  return direct ?? '';
}

function methodAndPath(event: APIGatewayRequestAuthorizerEvent): { readonly method: string; readonly path: string } {
  const parts = (event.methodArn.split(':').pop() ?? '').split('/');
  return { method: parts[2] ?? '', path: parts.slice(3).join('/') };
}

function policy(
  principalId: string,
  effect: 'Allow' | 'Deny',
  methodArn: string,
  context: Record<string, string>,
): APIGatewayAuthorizerResult {
  return {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [{ Action: 'execute-api:Invoke', Effect: effect, Resource: methodArn }],
    },
    context,
  };
}

function deny(principalId = 'unauthorized'): APIGatewayAuthorizerResult {
  return policy(principalId, 'Deny', '*', {});
}

function perfilFromGroups(groups: readonly string[]): Perfil | null {
  if (groups.includes('ADMIN_MASTER')) return 'ADMIN_MASTER';
  if (groups.includes('ANALISTA')) return 'ANALISTA';
  if (groups.includes('INCORPORADORA')) return 'INCORPORADORA';
  return null;
}

export const handler = async (event: APIGatewayRequestAuthorizerEvent): Promise<APIGatewayAuthorizerResult> => {
  const log = createLogger('apiAuthorizer');
  try {
    const authorization = header(event, 'Authorization');
    const token = authorization.toLowerCase().startsWith('bearer ') ? authorization.slice(7).trim() : '';
    if (token.length === 0) return deny();

    if (token.startsWith('atl_')) {
      const record = await service.validate(token);
      if (record === null) return deny();
      const owner = await getAdmin(record.ownerId);
      if (owner === null || !owner.ativo) return deny();
      const request = methodAndPath(event);
      const readAllowed = request.method === 'GET'
        || request.method === 'HEAD'
        || (request.method === 'POST' && (request.path === 'admin/boards/files/download-url' || request.path === 'documentos/download-url'));
      if (record.permission === 'read' && !readAllowed) return deny(record.tokenId);
      await service.markUsed(record).catch((err: unknown) => {
        log.warn('Token usage update failed', { tokenId: record.tokenId, err: err instanceof Error ? err.message : String(err) });
      });
      return policy(record.tokenId, 'Allow', event.methodArn, {
        authType: 'token',
        tokenId: record.tokenId,
        userId: record.ownerId,
        email: record.ownerEmail,
        perfil: owner.perfil,
        permission: record.permission,
      });
    }

    if (verifier === null) return deny();
    const payload = await verifier.verify(token);
    const groups = Array.isArray(payload['cognito:groups']) ? payload['cognito:groups'].map(String) : [];
    const perfil = perfilFromGroups(groups);
    if (perfil === null) return deny();
    return policy(String(payload.sub), 'Allow', event.methodArn, {
      authType: 'cognito',
      userId: String(payload.sub),
      email: typeof payload['email'] === 'string' ? payload['email'] : '',
      name: typeof payload['name'] === 'string' ? payload['name'] : '',
      groups: groups.join(','),
      perfil,
    });
  } catch (err) {
    log.warn('Authorization failed', { err: err instanceof Error ? err.message : String(err) });
    return deny();
  }
};
