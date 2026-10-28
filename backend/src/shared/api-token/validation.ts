import { z } from 'zod';
import { API_TOKEN_PERMISSIONS } from './types.js';

export const apiTokenCreateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  permission: z.enum(API_TOKEN_PERMISSIONS),
  expiresInDays: z.number().int().min(1).max(3650).nullable().default(90),
}).strict();
