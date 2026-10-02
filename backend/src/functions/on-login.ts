import type { PostAuthenticationTriggerEvent } from 'aws-lambda';
import { emailNovoAcesso } from '../shared/email/index.js';
import { createLogger } from '../shared/core/logger.js';

export const handler = async (event: PostAuthenticationTriggerEvent): Promise<PostAuthenticationTriggerEvent> => {
  const log = createLogger('onLogin');
  const email = event.request.userAttributes['email'] ?? '';

  if (email.length > 0) {
    const quando = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const userAgent = event.request.clientMetadata?.['userAgent'] ?? '';
    const dispositivo = userAgent.length > 0 ? userAgent : 'Dispositivo não identificado';
    try {
      await emailNovoAcesso(email, quando, dispositivo);
    } catch {
      log.warn('Login email failed', { email });
    }
  }

  return event;
};
