import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { created, unauthorized, forbidden, badRequest, conflict, serverError } from '../shared/http/response.js';
import { getUserId, AuthError, ForbiddenError, requireAdminMaster, getUserEmail } from '../shared/http/auth.js';
import { validate, criarUsuarioAdminSchema, ValidationError } from '../shared/http/validators.js';
import { putAdmin } from '../shared/db/index.js';
import { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminAddUserToGroupCommand } from '@aws-sdk/client-cognito-identity-provider';
import { AWS_REGION, USER_POOL_ID } from '../shared/core/env.js';
import { createLogger } from '../shared/core/logger.js';
import { v4 as uuidv4 } from 'uuid';
import type { Admin } from '../shared/core/types/index.js';

const cognito = new CognitoIdentityProviderClient({ region: AWS_REGION });

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('adminUsuarioCriar');
  try {
    const adminMasterId = getUserId(event);
    const adminMasterEmail = getUserEmail(event);
    requireAdminMaster(event);

    const body = validate(criarUsuarioAdminSchema, JSON.parse(event.body ?? '{}'));

    const temporaryPassword = `Atlas@${uuidv4().slice(0, 8)}`;
    let cognitoUserId: string;
    try {
      const result = await cognito.send(new AdminCreateUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: body.email,
        UserAttributes: [{ Name: 'email', Value: body.email }, { Name: 'email_verified', Value: 'true' }],
        TemporaryPassword: temporaryPassword,
        MessageAction: 'SUPPRESS',
      }));
      cognitoUserId = result.User?.Username ?? uuidv4();
    } catch (cognitoErr) {
      if ((cognitoErr as { name?: string }).name === 'UsernameExistsException') {
        return conflict(event, 'Já existe um usuário com este e-mail');
      }
      throw cognitoErr;
    }

    await cognito.send(new AdminAddUserToGroupCommand({
      UserPoolId: USER_POOL_ID,
      Username: body.email,
      GroupName: body.perfil,
    }));

    const now = new Date().toISOString();
    const admin: Admin = {
      id: cognitoUserId,
      nome: body.nome,
      email: body.email,
      perfil: body.perfil,
      ativo: true,
      criadoPor: adminMasterEmail,
      criadoEm: now,
    };

    await putAdmin(admin);
    log.info('Admin user created', { newUserId: cognitoUserId, perfil: body.perfil, adminMasterId });
    return created(event, { id: cognitoUserId, temporaryPassword });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof ForbiddenError) return forbidden(event);
    if (err instanceof ValidationError) return badRequest(event, err.message);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
