import type { PostAuthenticationTriggerEvent } from 'aws-lambda';
import { buildClient, CommitmentPolicy, KmsKeyringNode } from '@aws-crypto/client-node';
import { emailNovoAcesso, emailCodigo } from '../shared/email/index.js';
import { COGNITO_EMAIL_KEY_ID } from '../shared/core/env.js';
import { createLogger } from '../shared/core/logger.js';

interface CustomEmailSenderEvent {
  readonly triggerSource: string;
  readonly userName: string;
  readonly request: {
    readonly code: string;
    readonly userAttributes: Record<string, string>;
    readonly clientMetadata?: Record<string, string>;
  };
}

const client = buildClient(CommitmentPolicy.REQUIRE_ENCRYPT_ALLOW_DECRYPT);

const CODE_EMAILS: Record<string, { readonly titulo: string; readonly texto: string }> = {
  CustomEmailSender_SignUp: {
    titulo: 'Confirme seu e-mail',
    texto: 'Use o código abaixo para confirmar o seu cadastro na Atlas Hub.',
  },
  CustomEmailSender_ResendCode: {
    titulo: 'Confirme seu e-mail',
    texto: 'Use o código abaixo para confirmar o seu cadastro na Atlas Hub.',
  },
  CustomEmailSender_ForgotPassword: {
    titulo: 'Recuperação de senha',
    texto: 'Use o código abaixo para redefinir a sua senha na Atlas Hub.',
  },
  CustomEmailSender_UpdateUserAttribute: {
    titulo: 'Confirme a alteração',
    texto: 'Use o código abaixo para confirmar a alteração dos seus dados.',
  },
  CustomEmailSender_VerifyUserAttribute: {
    titulo: 'Verifique seu e-mail',
    texto: 'Use o código abaixo para verificar o seu e-mail.',
  },
  CustomEmailSender_AdminCreateUser: {
    titulo: 'Bem-vindo à Atlas Hub',
    texto: 'Use o código abaixo para acessar a sua conta.',
  },
};

async function decryptCode(encoded: string): Promise<string> {
  const keyring = new KmsKeyringNode({ keyIds: [COGNITO_EMAIL_KEY_ID] });
  const { plaintext } = await client.decrypt(keyring, Buffer.from(encoded, 'base64'));
  return Buffer.from(plaintext).toString('utf-8');
}

export const handler = async (
  event: PostAuthenticationTriggerEvent | CustomEmailSenderEvent,
): Promise<unknown> => {
  const log = createLogger('onLogin');

  if (event.triggerSource.startsWith('CustomEmailSender_')) {
    const codeEvent = event as CustomEmailSenderEvent;
    const to = codeEvent.request.userAttributes['email'] ?? '';
    const config = CODE_EMAILS[event.triggerSource] ?? {
      titulo: 'Seu código de acesso',
      texto: 'Use o código abaixo para continuar.',
    };
    if (to.length > 0) {
      try {
        const code = await decryptCode(codeEvent.request.code);
        await emailCodigo(to, code, config);
      } catch (err) {
        log.warn('Code email failed', { trigger: event.triggerSource, keyId: COGNITO_EMAIL_KEY_ID, err: err instanceof Error ? `${err.name}: ${err.message}` : String(err) });
      }
    }
    return event;
  }

  const authEvent = event as PostAuthenticationTriggerEvent;
  const email = authEvent.request.userAttributes['email'] ?? '';
  if (email.length > 0) {
    const quando = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const userAgent = authEvent.request.clientMetadata?.['userAgent'] ?? '';
    const dispositivo = userAgent.length > 0 ? userAgent : 'Dispositivo não identificado';
    try {
      await emailNovoAcesso(email, quando, dispositivo);
    } catch {
      log.warn('Login email failed', { email });
    }
  }

  return event;
};
