import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, unauthorized, forbidden, notFound, serverError } from '../shared/http/response.js';
import { getUserId, AuthError, ForbiddenError, requireAdminMaster } from '../shared/http/auth.js';
import { getAdmin, updateAdminAtivo } from '../shared/db/index.js';
import { CognitoIdentityProviderClient, AdminDisableUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { AWS_REGION, USER_POOL_ID } from '../shared/core/env.js';
import { createLogger } from '../shared/core/logger.js';

const cognito = new CognitoIdentityProviderClient({ region: AWS_REGION });

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('adminUsuarioDesativar');
  try {
    getUserId(event);
    requireAdminMaster(event);

    const id = event.pathParameters?.['id'];
    if (id === undefined || id === '') return notFound(event, 'Usuário não encontrado');

    const admin = await getAdmin(id);
    if (admin === null) return notFound(event, 'Usuário não encontrado');

    await cognito.send(new AdminDisableUserCommand({ UserPoolId: USER_POOL_ID, Username: admin.email }));
    await updateAdminAtivo(id, false);

    log.info('Admin user deactivated', { targetUserId: id });
    return ok(event, { updated: true });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof ForbiddenError) return forbidden(event);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
