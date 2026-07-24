import type { PostConfirmationTriggerEvent } from 'aws-lambda';
import { CognitoIdentityProviderClient, AdminAddUserToGroupCommand } from '@aws-sdk/client-cognito-identity-provider';
import { putIncorporadora } from '../shared/db/index.js';
import { AWS_REGION } from '../shared/core/env.js';
import { createLogger } from '../shared/core/logger.js';
import type { Incorporadora } from '../shared/core/types/index.js';

const cognito = new CognitoIdentityProviderClient({ region: AWS_REGION });

function meta(event: PostConfirmationTriggerEvent, key: string): string {
  return event.request.clientMetadata?.[key]?.trim() ?? '';
}

export const handler = async (event: PostConfirmationTriggerEvent): Promise<PostConfirmationTriggerEvent> => {
  const log = createLogger('onIncorporadoraSignup');

  const userId = event.userName;
  const email = event.request.userAttributes['email'] ?? '';
  const poolId = event.userPoolId;
  const now = new Date().toISOString();

  log.info('Incorporadora signup confirmed', { userId, email });

  const cnpj = meta(event, 'cnpj').replace(/\D/g, '');
  const cpfResponsavel = meta(event, 'cpfResponsavel').replace(/\D/g, '');
  const telefone = meta(event, 'telefone').replace(/\D/g, '');

  const incorporadora: Incorporadora = {
    id: userId,
    cnpj,
    razaoSocial: meta(event, 'razaoSocial'),
    nomeResponsavel: meta(event, 'nomeResponsavel'),
    cpfResponsavel,
    cargoResponsavel: meta(event, 'cargoResponsavel'),
    email,
    telefone,
    emailConfirmado: true,
    criadoEm: now,
    atualizadoEm: now,
  };

  await putIncorporadora(incorporadora);

  await cognito.send(new AdminAddUserToGroupCommand({
    UserPoolId: poolId,
    Username: userId,
    GroupName: 'INCORPORADORA',
  }));

  log.info('Incorporadora record created and added to INCORPORADORA group', { userId });

  return event;
};
