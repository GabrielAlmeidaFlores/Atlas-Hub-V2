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

export const SPE_CONTAS_TABLE = process.env['SPE_CONTAS_TABLE'] ?? 'AtlasSpeContas-dev';
export const FINANCEIRO_LEDGER_TABLE = process.env['FINANCEIRO_LEDGER_TABLE'] ?? 'AtlasFinanceiroLedger-dev';
export const FINANCEIRO_SOLICITACOES_TABLE = process.env['FINANCEIRO_SOLICITACOES_TABLE'] ?? 'AtlasFinanceiroSolicitacoes-dev';
export const FINANCEIRO_AUDITORIA_TABLE = process.env['FINANCEIRO_AUDITORIA_TABLE'] ?? 'AtlasFinanceiroAuditoria-dev';
export const CAPTACAO_EVENTOS_TABLE = process.env['CAPTACAO_EVENTOS_TABLE'] ?? 'AtlasCaptacaoEventos-dev';
export const CAPTACAO_COMPRAS_TABLE = process.env['CAPTACAO_COMPRAS_TABLE'] ?? 'AtlasCaptacaoCompras-dev';

export const DIVIFY_WEBHOOK_SECRET = process.env['DIVIFY_WEBHOOK_SECRET'] ?? '';
export const DIVIFY_TENANT_ID = process.env['DIVIFY_TENANT_ID'] ?? '';

export const STARK_ENVIRONMENT = process.env['STARK_ENVIRONMENT'] ?? 'sandbox';
export const STARK_ORGANIZATION_ID = process.env['STARK_ORGANIZATION_ID'] ?? '';
export const STARK_PRIVATE_KEY = (process.env['STARK_PRIVATE_KEY'] ?? '').replace(/\\n/g, '\n');

export const DOCUMENTS_BUCKET = process.env['DOCUMENTS_BUCKET'] ?? 'atlas-hub-documents-dev';

export const USER_POOL_ID = process.env['USER_POOL_ID'] ?? '';
export const USER_POOL_CLIENT_ID = process.env['USER_POOL_CLIENT_ID'] ?? '';

export const SES_FROM_EMAIL = process.env['SES_FROM_EMAIL'] ?? 'noreply@atlashub.com.br';
export const CORS_ORIGINS = process.env['CORS_ORIGINS'] ?? '*';
