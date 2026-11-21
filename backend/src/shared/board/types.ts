import type { BoardMetricsDashboard } from './metrics/types.js';

export const BOARD_FIELD_TYPES = [
  'text',
  'longText',
  'number',
  'date',
  'checkbox',
  'select',
  'phone',
  'email',
  'url',
  'file',
  'files',
] as const;

export type BoardFieldType = (typeof BOARD_FIELD_TYPES)[number];

export const BOARD_ICONS = [
  'layout-grid',
  'briefcase',
  'building-2',
  'home',
  'target',
  'rocket',
  'users',
  'calendar',
  'bar-chart',
  'wallet',
  'megaphone',
  'folder',
] as const;

export type BoardIcon = (typeof BOARD_ICONS)[number];

export const BOARD_COLUMN_COLORS = [
  'slate',
  'blue',
  'green',
  'amber',
  'rose',
  'violet',
  'teal',
  'orange',
] as const;

export type BoardColumnColor = (typeof BOARD_COLUMN_COLORS)[number];

export interface BoardFile {
  readonly key: string;
  readonly name: string;
  readonly size: number;
  readonly contentType: string;
}

export type BoardFieldValue = string | number | boolean | null | BoardFile | readonly BoardFile[];

export const BOARD_MEMBER_ROLES = ['admin', 'write', 'read'] as const;

export type BoardMemberRole = (typeof BOARD_MEMBER_ROLES)[number];

export type BoardAccessRole = 'owner' | BoardMemberRole;

export interface BoardMember {
  readonly email: string;
  readonly name: string;
  readonly role: BoardMemberRole;
  readonly addedAt: string;
  readonly addedBy: string;
}

export const BOARD_LABEL_COLORS = [
  'green',
  'yellow',
  'orange',
  'red',
  'purple',
  'blue',
  'sky',
  'lime',
  'pink',
  'gray',
] as const;

export type BoardLabelColor = (typeof BOARD_LABEL_COLORS)[number];

export const BOARD_LABEL_DISPLAY_MODES = ['hover', 'expanded'] as const;
export type BoardLabelDisplayMode = (typeof BOARD_LABEL_DISPLAY_MODES)[number];

export const BOARD_NOTIFICATION_EVENTS = ['CARD_CREATED', 'CARD_MOVED_TO_COLUMN', 'CARD_UPDATED', 'CARD_ARCHIVED', 'CARD_REMOVED'] as const;

export type BoardNotificationEvent = (typeof BOARD_NOTIFICATION_EVENTS)[number];

export interface BoardNotificationRule {
  readonly id: string;
  readonly event: BoardNotificationEvent;
  readonly columnId?: string | undefined;
  readonly recipientEmails: readonly string[];
  readonly enabled: boolean;
}

export interface BoardTemplateField {
  readonly fieldId: string;
  readonly label: string;
  readonly type: BoardFieldType;
  readonly required: boolean;
  readonly options?: readonly string[];
  readonly position: number;
}

export interface BoardTemplate {
  readonly boardId: string;
  readonly templateId: string;
  readonly name: string;
  readonly fields: readonly BoardTemplateField[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface BoardColumn {
  readonly boardId: string;
  readonly columnId: string;
  readonly name: string;
  readonly color?: BoardColumnColor;
  readonly position: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface BoardLabel {
  readonly boardId: string;
  readonly labelId: string;
  readonly name: string;
  readonly color: BoardLabelColor;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type BoardCardHistoryAction = 'created' | 'updated' | 'moved' | 'archived' | 'removed';

export interface BoardCardHistoryEntry {
  readonly historyId: string;
  readonly action: BoardCardHistoryAction;
  readonly description: string;
  readonly userId: string;
  readonly userEmail?: string;
  readonly createdAt: string;
}

export interface BoardCard {
  readonly boardId: string;
  readonly cardId: string;
  readonly cardNumber?: number;
  readonly columnId: string;
  readonly position: number;
  readonly title: string;
  readonly description?: string;
  readonly templateId?: string | null;
  readonly fieldValues: Readonly<Record<string, BoardFieldValue>>;
  readonly labelIds: readonly string[];
  readonly assigneeEmails?: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdBy: string;
  readonly updatedBy: string;
  readonly history?: readonly BoardCardHistoryEntry[];
  readonly archivedAt?: string;
  readonly removedAt?: string;
}

export interface Board {
  readonly boardId: string;
  readonly name: string;
  readonly icon?: BoardIcon;
  readonly description?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdBy: string;
  readonly createdByEmail?: string;
  readonly cardSequence?: number;
  readonly members?: readonly BoardMember[];
  readonly labelDisplayMode?: BoardLabelDisplayMode;
  readonly archivedAt?: string;
  readonly metricsDashboard?: BoardMetricsDashboard;
  readonly notificationRules?: readonly BoardNotificationRule[];
  readonly notificationRulesVersion?: number;
}

export interface BoardView {
  readonly board: Board;
  readonly columns: readonly BoardColumn[];
  readonly labels: readonly BoardLabel[];
  readonly templates: readonly BoardTemplate[];
  readonly cards: readonly BoardCard[];
  readonly accessRole?: BoardAccessRole;
}
