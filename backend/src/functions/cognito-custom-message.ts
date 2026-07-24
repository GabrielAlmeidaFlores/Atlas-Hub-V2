import type { CustomMessageTriggerEvent } from 'aws-lambda';
import { templateConfirmacaoEmail } from '../shared/email/templates/confirmacao-email.js';

const CONFIRM_TRIGGERS = new Set([
  'CustomMessage_SignUp',
  'CustomMessage_ResendCode',
]);

export const handler = async (event: CustomMessageTriggerEvent): Promise<CustomMessageTriggerEvent> => {
  if (!CONFIRM_TRIGGERS.has(event.triggerSource)) {
    return event;
  }

  const assetsBase = (process.env['EMAIL_ASSETS_BASE_URL'] ?? '').replace(/\/$/, '');
  const logoUrl = assetsBase !== '' ? `${assetsBase}/atlas-icon.png` : '';
  const useHtml = (process.env['EMAIL_HTML_ENABLED'] ?? '') === 'true';

  event.response.emailSubject = 'Confirme seu e-mail — Atlas Hub';
  event.response.emailMessage = useHtml
    ? templateConfirmacaoEmail(logoUrl)
    : 'Seu código de verificação Atlas Hub: {####}';

  return event;
};
