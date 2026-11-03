import type { PostConfirmationTriggerEvent } from 'aws-lambda';
import { CognitoIdentityProviderClient, AdminAddUserToGroupCommand } from '@aws-sdk/client-cognito-identity-provider';
import { getInvestidor, putIncorporadora, putInvestidor } from '../shared/db/index.js';
import { emailBoasVindas } from '../shared/email/index.js';
import { AWS_REGION } from '../shared/core/env.js';
import { createLogger } from '../shared/core/logger.js';
import type { Incorporadora } from '../shared/core/types/index.js';

const cognito = new CognitoIdentityProviderClient({ region: AWS_REGION });

function meta(event: PostConfirmationTriggerEvent, key: string): string {
  return event.request.clientMetadata?.[key]?.trim() ?? '';
}

function attr(event: PostConfirmationTriggerEvent, key: string): string {
  return event.request.userAttributes[key]?.trim() ?? '';
}

function tipoUsuario(event: PostConfirmationTriggerEvent): string {
  return attr(event, 'custom:tipo') || meta(event, 'tipo');
}

export const handler = async (event: PostConfirmationTriggerEvent): Promise<PostConfirmationTriggerEvent> => {
  const log = createLogger('onIncorporadoraSignup');

  const userId = event.userName;
  const email = event.request.userAttributes['email'] ?? '';
  const poolId = event.userPoolId;
  const now = new Date().toISOString();

  log.info('Signup confirmed', { userId, email });

  const tipo = tipoUsuario(event);
  if (tipo === '') {
    log.warn('Confirmacao sem tipo de conta', { userId, email });
    return event;
  }

  if (tipo === 'investidor') {
    await cognito.send(new AdminAddUserToGroupCommand({
      UserPoolId: poolId,
      Username: userId,
      GroupName: 'INVESTIDOR',
    }));

    const nome = meta(event, 'nome') || attr(event, 'name');
    const investidorId = attr(event, 'sub') || userId;
    const existingInvestidor = await getInvestidor(investidorId);
    const termosAceitosEm = attr(event, 'custom:termos_aceitos');
    const termosVersao = attr(event, 'custom:termos_versao');
    const telefone = attr(event, 'phone_number');
    await putInvestidor({
      id: investidorId,
      email,
      nome: nome.length > 0 ? nome : email,
      ...(telefone.length > 0 ? { telefone } : {}),
      marketingOptIn: attr(event, 'custom:marketing_optin') === 'true',
      ...(termosAceitosEm.length > 0 ? { termosAceitosEm } : {}),
      ...(termosVersao.length > 0 ? { termosVersao } : {}),
      wantsOpportunityAlerts: existingInvestidor?.wantsOpportunityAlerts ?? false,
      ...(existingInvestidor?.interestUpdatedAt !== undefined ? { interestUpdatedAt: existingInvestidor.interestUpdatedAt } : {}),
      criadoEm: existingInvestidor?.criadoEm ?? now,
      atualizadoEm: now,
    });
    if (email.length > 0) {
      try {
        await emailBoasVindas(email, nome.length > 0 ? nome : email);
      } catch {
        log.warn('Welcome email failed', { userId });
      }
    }

    log.info('Investidor confirmed and added to INVESTIDOR group', { userId });
    return event;
  }

  const cnpj = meta(event, 'cnpj').replace(/\D/g, '');
  const cpfResponsavel = meta(event, 'cpfResponsavel').replace(/\D/g, '');
  const telefone = meta(event, 'telefone').replace(/\D/g, '');
  const razaoSocial = meta(event, 'razaoSocial');

  if (cnpj.length !== 14 || razaoSocial.length === 0) {
    log.warn('Incorporadora confirmada sem dados da empresa', { userId, email });
    await cognito.send(new AdminAddUserToGroupCommand({
      UserPoolId: poolId,
      Username: userId,
      GroupName: 'INCORPORADORA',
    }));
    return event;
  }

  const incorporadora: Incorporadora = {
    id: userId,
    cnpj,
    razaoSocial,
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

  if (email.length > 0) {
    try {
      await emailBoasVindas(email, incorporadora.nomeResponsavel.length > 0 ? incorporadora.nomeResponsavel : incorporadora.razaoSocial);
    } catch {
      log.warn('Welcome email failed', { userId });
    }
  }

  log.info('Incorporadora record created and added to INCORPORADORA group', { userId });

  return event;
};
