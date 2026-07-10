import type { PreSignUpTriggerEvent } from 'aws-lambda';
import { CognitoIdentityProviderClient, AdminAddUserToGroupCommand } from '@aws-sdk/client-cognito-identity-provider';
import { putIncorporadora } from '../shared/db/index.js';
import { AWS_REGION, USER_POOL_ID } from '../shared/core/env.js';
import { createLogger } from '../shared/core/logger.js';
import type { Incorporadora } from '../shared/core/types/index.js';

const cognito = new CognitoIdentityProviderClient({ region: AWS_REGION });

export const handler = async (event: PreSignUpTriggerEvent): Promise<PreSignUpTriggerEvent> => {
  const log = createLogger('onIncorporadoraSignup');

  const userId = event.userName;
  const email = event.request.userAttributes['email'] ?? '';
  const now = new Date().toISOString();

  log.info('Incorporadora signup confirmed', { userId, email });

  const incorporadora: Incorporadora = {
    id: userId,
    cnpj: '',
    razaoSocial: '',
    nomeResponsavel: '',
    cpfResponsavel: '',
    cargoResponsavel: '',
    email,
    telefone: '',
    emailConfirmado: true,
    criadoEm: now,
    atualizadoEm: now,
  };

  await putIncorporadora(incorporadora);

  await cognito.send(new AdminAddUserToGroupCommand({
    UserPoolId: USER_POOL_ID,
    Username: userId,
    GroupName: 'INCORPORADORA',
  }));

  log.info('Incorporadora record created and added to INCORPORADORA group', { userId });

  return event;
};
