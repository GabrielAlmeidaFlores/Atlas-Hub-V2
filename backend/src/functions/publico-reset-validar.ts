import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AdminGetUserCommand, CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { ok, badRequest, serverError, serviceUnavailable } from '../shared/http/response.js';
import { validate, resetValidarSchema, ValidationError } from '../shared/http/validators.js';
import { AWS_REGION, COGNITO_USER_POOL_ID } from '../shared/core/env.js';
import { resetConfigurado, validarCodigo } from '../shared/password-reset/service.js';
import { getIncorporadora } from '../shared/db/index.js';
import { createLogger } from '../shared/core/logger.js';

const cognito = new CognitoIdentityProviderClient({ region: AWS_REGION });

function isUserNotFound(err: unknown): boolean {
  return err instanceof Error && err.name === 'UserNotFoundException';
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('publicoResetValidar');
  try {
    if (COGNITO_USER_POOL_ID === '' || !resetConfigurado()) {
      return serviceUnavailable(event, 'Recuperação de senha indisponível');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(event.body ?? '{}');
    } catch {
      return badRequest(event, 'JSON inválido');
    }
    const body = validate(resetValidarSchema, parsed);

    let user;
    try {
      user = await cognito.send(new AdminGetUserCommand({
        UserPoolId: COGNITO_USER_POOL_ID,
        Username: body.email,
      }));
    } catch (err) {
      if (isUserNotFound(err)) {
        return badRequest(event, 'Código inválido ou expirado. Solicite um novo.', 'VALIDATION_ERROR');
      }
      throw err;
    }

    const resetToken = await validarCodigo(body.email, body.code);
    if (resetToken === null) {
      return badRequest(event, 'Código inválido ou expirado. Solicite um novo.', 'VALIDATION_ERROR');
    }

    const username = user.Username ?? body.email;
    const tipo = user.UserAttributes?.find((item) => item.Name === 'custom:tipo')?.Value ?? '';
    let needsProfile = tipo === '';
    if (tipo === 'incorporadora') {
      const existente = await getIncorporadora(username);
      needsProfile = existente === null;
    }

    return ok(event, {
      resetToken,
      needsProfile,
      tipo: tipo === '' ? null : tipo,
    });
  } catch (err) {
    if (err instanceof ValidationError) {
      return badRequest(event, err.message, 'VALIDATION_ERROR', err.fields);
    }
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
