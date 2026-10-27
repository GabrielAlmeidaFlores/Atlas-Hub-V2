import { z } from 'zod';
import { BOARD_COLUMN_COLORS, BOARD_FIELD_TYPES, BOARD_ICONS, BOARD_LABEL_COLORS, BOARD_MEMBER_ROLES } from './types.js';

const boardFileSchema = z.object({
  key: z.string().trim().min(1).max(1024),
  name: z.string().trim().min(1).max(255),
  size: z.number().int().nonnegative(),
  contentType: z.string().trim().min(1).max(200),
}).strict();

const fieldValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  boardFileSchema,
  z.array(boardFileSchema).max(20),
]);

export const boardCreateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(300).optional(),
  icon: z.enum(BOARD_ICONS).optional(),
}).strict();

export const boardUpdateSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  description: z.string().trim().max(300).nullable().optional(),
}).strict().refine((value) => value.name !== undefined || value.description !== undefined, {
  message: 'Informe ao menos um campo',
});

export const columnCreateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  color: z.enum(BOARD_COLUMN_COLORS).optional(),
}).strict();

export const columnUpdateSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  color: z.enum(BOARD_COLUMN_COLORS).optional(),
  position: z.number().int().min(0).optional(),
}).strict().refine((value) => value.name !== undefined || value.color !== undefined || value.position !== undefined, {
  message: 'Informe ao menos um campo',
});

export const labelCreateSchema = z.object({
  name: z.string().trim().min(1).max(40),
  color: z.enum([...BOARD_LABEL_COLORS]),
}).strict();

export const labelUpdateSchema = z.object({
  name: z.string().trim().min(1).max(40).optional(),
  color: z.enum([...BOARD_LABEL_COLORS]).optional(),
}).strict().refine((value) => value.name !== undefined || value.color !== undefined, {
  message: 'Informe ao menos um campo',
});

export const templateFieldSchema = z.object({
  fieldId: z.string().uuid().optional(),
  label: z.string().trim().min(1).max(80),
  type: z.enum(BOARD_FIELD_TYPES),
  required: z.boolean().optional(),
  options: z.array(z.string().trim().min(1).max(80)).min(1).max(50).optional(),
  position: z.number().int().min(0).optional(),
}).strict();

export const templateCreateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  fields: z.array(templateFieldSchema).min(1).max(50),
}).strict();

export const templateUpdateSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  fields: z.array(templateFieldSchema).min(1).max(50).optional(),
}).strict().refine((value) => value.name !== undefined || value.fields !== undefined, {
  message: 'Informe ao menos um campo',
});

const assigneeEmailsSchema = z.array(z.string().trim().toLowerCase().email()).max(30);

export const cardCreateSchema = z.object({
  columnId: z.string().uuid(),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).optional(),
  templateId: z.string().uuid().optional(),
  fieldValues: z.record(fieldValueSchema).optional(),
  labelIds: z.array(z.string().uuid()).max(30).optional(),
  assigneeEmails: assigneeEmailsSchema.optional(),
}).strict();

export const cardUpdateSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  templateId: z.string().uuid().nullable().optional(),
  fieldValues: z.record(fieldValueSchema).optional(),
  labelIds: z.array(z.string().uuid()).max(30).optional(),
  assigneeEmails: assigneeEmailsSchema.optional(),
}).strict().refine((value) => (
  value.title !== undefined
  || value.description !== undefined
  || value.templateId !== undefined
  || value.fieldValues !== undefined
  || value.labelIds !== undefined
  || value.assigneeEmails !== undefined
), {
  message: 'Informe ao menos um campo',
});

export const filePresignSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  contentType: z.string().trim().min(1).max(200),
  size: z.number().int().positive().max(25 * 1024 * 1024),
}).strict();

export const boardMemberAddSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  role: z.enum(BOARD_MEMBER_ROLES),
}).strict();

export const fileDownloadSchema = z.object({
  key: z.string().trim().min(1).max(1024),
}).strict();

export const cardMoveSchema = z.object({
  columnId: z.string().uuid(),
  position: z.number().int().min(0),
}).strict();

export type BoardCreateInput = z.infer<typeof boardCreateSchema>;
export type BoardMemberAddInput = z.infer<typeof boardMemberAddSchema>;
export type BoardUpdateInput = z.infer<typeof boardUpdateSchema>;
export type ColumnCreateInput = z.infer<typeof columnCreateSchema>;
export type ColumnUpdateInput = z.infer<typeof columnUpdateSchema>;
export type LabelCreateInput = z.infer<typeof labelCreateSchema>;
export type LabelUpdateInput = z.infer<typeof labelUpdateSchema>;
export type TemplateCreateInput = z.infer<typeof templateCreateSchema>;
export type TemplateUpdateInput = z.infer<typeof templateUpdateSchema>;
export type CardCreateInput = z.infer<typeof cardCreateSchema>;
export type CardUpdateInput = z.infer<typeof cardUpdateSchema>;
export type CardMoveInput = z.infer<typeof cardMoveSchema>;
export type TemplateFieldInput = z.infer<typeof templateFieldSchema>;
