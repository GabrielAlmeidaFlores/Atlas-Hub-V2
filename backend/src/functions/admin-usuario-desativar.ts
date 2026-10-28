import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, unauthorized, forbidden, notFound, conflict, badRequest, serverError } from '../shared/http/response.js';
import { getUserId, getUserEmail, AuthError, ForbiddenError, requireAdminMaster } from '../shared/http/auth.js';
import { deleteAdmin, getAdmin, updateAdminAtivo } from '../shared/db/index.js';
import {
  AdminDeleteUserCommand,
  AdminDisableUserCommand,
  AdminEnableUserCommand,
  CognitoIdentityProviderClient,
  UserNotFoundException,
} from '@aws-sdk/client-cognito-identity-provider';
import { AWS_REGION, USER_POOL_ID } from '../shared/core/env.js';
import { createLogger } from '../shared/core/logger.js';
import type { Admin } from '../shared/core/types/index.js';

const cognito = new CognitoIdentityProviderClient({ region: AWS_REGION });

async function deleteCognitoUser(admin: Admin): Promise<void> {
  try {
    await cognito.send(new AdminDeleteUserCommand({ UserPoolId: USER_POOL_ID, Username: admin.id }));
  } catch (err) {
    if (!(err instanceof UserNotFoundException)) throw err;
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('adminUsuarioStatus');
  try {
    const currentUserId = getUserId(event);
    const currentEmail = getUserEmail(event).trim().toLowerCase();
    requireAdminMaster(event);

    const id = event.pathParameters?.['id'];
    if (id === undefined || id === '') return notFound(event, 'Usuário não encontrado');

    const admin = await getAdmin(id);
    if (admin === null) return notFound(event, 'Usuário não encontrado');

    const resource = event.resource ?? event.path;
    const activating = event.httpMethod === 'PUT' && resource.endsWith('/ativar');
    const deactivating = event.httpMethod === 'PUT' && resource.endsWith('/desativar');
    const deleting = event.httpMethod === 'DELETE';

    if (!activating && !deactivating && !deleting) return badRequest(event, 'Operação não suportada');

    const isSelf = id === currentUserId || admin.email.trim().toLowerCase() === currentEmail;
    if ((deactivating || deleting) && isSelf) {
      return conflict(event, 'Você não pode desativar ou excluir a própria conta');
    }

    if (deleting) {
      await deleteAdmin(id);
      try {
        await deleteCognitoUser(admin);
      } catch (err) {
        log.warn('Cognito cleanup failed after admin deletion', {
          targetUserId: id,
          err: err instanceof Error ? err.message : String(err),
        });
      }
      log.info('Admin user deleted', { targetUserId: id });
      return ok(event, { deleted: true });
    }

    if (activating) {
      try {
        await cognito.send(new AdminEnableUserCommand({ UserPoolId: USER_POOL_ID, Username: admin.id }));
      } catch (err) {
        if (err instanceof UserNotFoundException) return notFound(event, 'Usuário não encontrado no Cognito');
        throw err;
      }
      await updateAdminAtivo(id, true);
      log.info('Admin user activated', { targetUserId: id });
      return ok(event, { updated: true });
    }

    try {
      await cognito.send(new AdminDisableUserCommand({ UserPoolId: USER_POOL_ID, Username: admin.id }));
    } catch (err) {
      if (err instanceof UserNotFoundException) return notFound(event, 'Usuário não encontrado no Cognito');
      throw err;
    }
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
