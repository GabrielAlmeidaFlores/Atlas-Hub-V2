/**
 * Single source of truth for all environment variables.
 * Every `process.env` access MUST go through this file.
 */

export const AWS_REGION = process.env['AWS_REGION'] ?? 'sa-east-1';
export const STAGE = process.env['STAGE'] ?? 'dev';
export const LOG_LEVEL = process.env['LOG_LEVEL'] ?? 'INFO';

export const INCORPORADORAS_TABLE = process.env['INCORPORADORAS_TABLE'] ?? 'AtlasIncorporadoras-dev';
export const ADMINS_TABLE = process.env['ADMINS_TABLE'] ?? 'AtlasAdmins-dev';
export const PROJETOS_TABLE = process.env['PROJETOS_TABLE'] ?? 'AtlasProjetos-dev';
export const SCORECARD_TABLE = process.env['SCORECARD_TABLE'] ?? 'AtlasScorecard-dev';
export const NOTIFICACOES_TABLE = process.env['NOTIFICACOES_TABLE'] ?? 'AtlasNotificacoes-dev';
export const AUDITORIA_TABLE = process.env['AUDITORIA_TABLE'] ?? 'AtlasAuditoria-dev';
export const NOTAS_TABLE = process.env['NOTAS_TABLE'] ?? 'AtlasNotas-dev';

export const ANALYTICS_EVENTS_TABLE = process.env['ANALYTICS_EVENTS_TABLE'] ?? 'AtlasAnalyticsEvents-dev';
export const ANALYTICS_SESSIONS_TABLE = process.env['ANALYTICS_SESSIONS_TABLE'] ?? 'AtlasAnalyticsSessions-dev';
export const ANALYTICS_DAILY_TABLE = process.env['ANALYTICS_DAILY_TABLE'] ?? 'AtlasAnalyticsDaily-dev';
export const ANALYTICS_HEATMAPS_TABLE = process.env['ANALYTICS_HEATMAPS_TABLE'] ?? 'AtlasAnalyticsHeatmaps-dev';
export const ANALYTICS_ALERTS_TABLE = process.env['ANALYTICS_ALERTS_TABLE'] ?? 'AtlasAnalyticsAlerts-dev';
export const ANALYTICS_REPLAYS_TABLE = process.env['ANALYTICS_REPLAYS_TABLE'] ?? 'AtlasAnalyticsReplays-dev';

export const DOCUMENTS_BUCKET = process.env['DOCUMENTS_BUCKET'] ?? 'atlas-hub-documents-dev';

export const USER_POOL_ID = process.env['USER_POOL_ID'] ?? '';
export const USER_POOL_CLIENT_ID = process.env['USER_POOL_CLIENT_ID'] ?? '';

export const SES_FROM_EMAIL = process.env['SES_FROM_EMAIL'] ?? 'noreply@atlashub.com.br';
export const CORS_ORIGINS = process.env['CORS_ORIGINS'] ?? '*';
