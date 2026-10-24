import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AdminGetUserCommand, CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { ok, badRequest, serverError, serviceUnavailable } from '../shared/http/response.js';
import { validate, resetSolicitarSchema, ValidationError } from '../shared/http/validators.js';
import { AWS_REGION, COGNITO_USER_POOL_ID } from '../shared/core/env.js';
import { limparReset, resetConfigurado, solicitarCodigo } from '../shared/password-reset/service.js';
import { emailCodigo } from '../shared/email/index.js';
import { createLogger } from '../shared/core/logger.js';

const cognito = new CognitoIdentityProviderClient({ region: AWS_REGION });

function isUserNotFound(err: unknown): boolean {
  return err instanceof Error && err.name === 'UserNotFoundException';
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('publicoResetSolicitar');
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
    const body = validate(resetSolicitarSchema, parsed);

    try {
      await cognito.send(new AdminGetUserCommand({
        UserPoolId: COGNITO_USER_POOL_ID,
        Username: body.email,
      }));
    } catch (err) {
      if (isUserNotFound(err)) return ok(event, { ok: true });
      throw err;
    }

    const codigo = await solicitarCodigo(body.email);
    if (codigo !== null) {
      try {
        await emailCodigo(body.email, codigo, {
          titulo: 'Recuperação de senha',
          texto: 'Use o código abaixo para redefinir a sua senha na Atlas Hub.',
        });
      } catch (err) {
        log.error('Falha ao enviar código de recuperação', err);
        try {
          await limparReset(body.email);
        } catch {
          void 0;
        }
        return serviceUnavailable(event, 'Não foi possível enviar o e-mail agora. Tente novamente.');
      }
    }

    return ok(event, { ok: true });
  } catch (err) {
    if (err instanceof ValidationError) {
      return badRequest(event, err.message, 'VALIDATION_ERROR', err.fields);
    }
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
