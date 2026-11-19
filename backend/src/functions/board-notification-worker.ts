import type { SQSEvent } from 'aws-lambda';
import { APP_URL } from '../shared/core/env.js';
import { createLogger } from '../shared/core/logger.js';
import { boardNotificationMessageSchema } from '../shared/board/notification-message.js';
import { emailBoardCardNotification, EmailError } from '../shared/email/index.js';

function isRetryableEmailError(err: EmailError): boolean {
  if (err.status === 429 || err.status >= 500) return true;
  return err.status === 409 && err.resendCode === 'concurrent_idempotent_requests';
}

export const handler = async (event: SQSEvent): Promise<void> => {
  const log = createLogger('boardNotificationWorker');
  for (const record of event.Records) {
    let message: unknown;
    try {
      message = JSON.parse(record.body);
    } catch {
      log.warn('Mensagem de notificação inválida', { messageId: record.messageId });
      continue;
    }
    const parsed = boardNotificationMessageSchema.safeParse(message);
    if (!parsed.success) {
      log.warn('Payload de notificação inválido', { messageId: record.messageId });
      continue;
    }
    const data = parsed.data;
    try {
      await emailBoardCardNotification({
        to: data.recipientEmail,
        boardName: data.boardName,
        cardTitle: data.cardTitle,
        ...(data.cardDescription !== undefined ? { cardDescription: data.cardDescription } : {}),
        columnName: data.columnName,
        ...(data.fromColumnName !== undefined ? { fromColumnName: data.fromColumnName } : {}),
        ...(data.toColumnName !== undefined ? { toColumnName: data.toColumnName } : {}),
        ...(data.changedFields !== undefined ? { changedFields: data.changedFields } : {}),
        ...(data.actorLabel !== undefined ? { actorLabel: data.actorLabel } : {}),
        ...(data.occurredAt !== undefined ? { occurredAt: data.occurredAt } : {}),
        event: data.event,
        boardUrl: `${APP_URL}/admin/boards/${data.boardId}`,
        idempotencyKey: data.notificationId,
      });
      log.info('E-mail de notificação enviado', { notificationId: data.notificationId, messageId: record.messageId });
    } catch (err) {
      if (err instanceof EmailError && !isRetryableEmailError(err)) {
        log.error('Falha permanente no envio de notificação', err, {
          notificationId: data.notificationId,
          messageId: record.messageId,
        });
        continue;
      }
      throw err;
    }
  }
};
