import type { Board, BoardNotificationEvent } from './types.js';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function participantEmails(board: Board): Set<string> {
  const allowed = new Set<string>();
  if (board.createdByEmail !== undefined && board.createdByEmail.trim().length > 0) {
    allowed.add(normalizeEmail(board.createdByEmail));
  }
  for (const member of board.members ?? []) allowed.add(normalizeEmail(member.email));
  return allowed;
}

export function notificationRecipients(
  board: Board,
  event: BoardNotificationEvent,
  columnId: string,
): readonly string[] {
  const allowed = participantEmails(board);
  const recipients = new Set<string>();
  for (const rule of board.notificationRules ?? []) {
    if (!rule.enabled || rule.event !== event) continue;
    if (event === 'CARD_MOVED_TO_COLUMN' && rule.columnId !== columnId) continue;
    for (const email of rule.recipientEmails) {
      const normalized = normalizeEmail(email);
      if (allowed.has(normalized)) recipients.add(normalized);
    }
  }
  return [...recipients];
}
