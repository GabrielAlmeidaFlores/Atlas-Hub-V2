import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import type { z } from 'zod';
import { getInvestidor, listInvestidores, putInvestidor } from '../shared/db/index.js';
import { investidorInteresseSchema, investidorPerfilSchema, validate, ValidationError } from '../shared/http/validators.js';
import { csvCell } from '../shared/core/csv.js';
import {
  AuthError,
  ForbiddenError,
  getUserId,
  getUserEmail,
  getUserNameRaw,
  requireAdmin,
  requireCognito,
  requirePerfil,
} from '../shared/http/auth.js';
import { badRequest, forbidden, getCorsHeaders, notFound, ok, serverError, unauthorized } from '../shared/http/response.js';
import { createLogger } from '../shared/core/logger.js';
import type { Investidor } from '../shared/core/types/index.js';

function parseBoolean(value: string | undefined): boolean | undefined {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

function filtered(items: readonly Investidor[], event: APIGatewayProxyEvent): Investidor[] {
  const search = (event.queryStringParameters?.['search'] ?? '').trim().toLowerCase();
  const marketingOptIn = parseBoolean(event.queryStringParameters?.['marketingOptIn']);
  const wantsAlerts = parseBoolean(event.queryStringParameters?.['wantsOpportunityAlerts']);
  return items.filter((item) => {
    if (marketingOptIn !== undefined && item.marketingOptIn !== marketingOptIn) return false;
    if (wantsAlerts !== undefined && item.wantsOpportunityAlerts !== wantsAlerts) return false;
    if (search.length === 0) return true;
    return [item.nome, item.email, item.telefone].some((value) => (value ?? '').toLowerCase().includes(search));
  });
}

function csvResponse(event: APIGatewayProxyEvent, body: string, fileName: string): APIGatewayProxyResult {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      ...getCorsHeaders(event),
    },
    body,
    isBase64Encoded: false,
  };
}

function phoneCell(phone: string | undefined): string {
  return phone !== undefined && /^\+\d{7,15}$/.test(phone) ? csvCell(phone, false) : csvCell(phone);
}

function investorCsv(items: readonly Investidor[]): string {
  const header = ['Nome', 'E-mail', 'Telefone', 'Marketing', 'Avisos de oportunidades', 'Termos aceitos em', 'Versão dos termos', 'Criado em', 'Interesse atualizado em'];
  const rows = items.map((item) => [
    csvCell(item.nome),
    csvCell(item.email),
    phoneCell(item.telefone),
    csvCell(item.marketingOptIn ? 'Sim' : 'Não'),
    csvCell(item.wantsOpportunityAlerts ? 'Sim' : 'Não'),
    csvCell(item.termosAceitosEm),
    csvCell(item.termosVersao),
    csvCell(item.criadoEm),
    csvCell(item.interestUpdatedAt),
  ].join(','));
  return [header.join(','), ...rows].join('\r\n');
}

async function updateProfile(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  requireCognito(event);
  requirePerfil(event, 'INVESTIDOR');
  let body: z.infer<typeof investidorPerfilSchema>;
  try {
    body = validate(investidorPerfilSchema, JSON.parse(event.body ?? '{}'));
  } catch (err) {
    if (err instanceof ValidationError) return badRequest(event, err.message, 'VALIDATION_ERROR', err.fields);
    return badRequest(event, 'Corpo da requisição inválido');
  }
  const userId = getUserId(event);
  const existing = await getInvestidor(userId);
  const now = new Date().toISOString();
  const termosAceitosEm = body.termosAceitosEm ?? existing?.termosAceitosEm;
  const termosVersao = body.termosVersao ?? existing?.termosVersao;
  const item: Investidor = {
    id: userId,
    email: getUserEmail(event).trim().toLowerCase(),
    nome: body.nome,
    telefone: body.telefone,
    marketingOptIn: body.marketingOptIn,
    ...(termosAceitosEm !== undefined ? { termosAceitosEm } : {}),
    ...(termosVersao !== undefined ? { termosVersao } : {}),
    wantsOpportunityAlerts: existing?.wantsOpportunityAlerts ?? false,
    ...(existing?.interestUpdatedAt !== undefined ? { interestUpdatedAt: existing.interestUpdatedAt } : {}),
    criadoEm: existing?.criadoEm ?? now,
    atualizadoEm: now,
  };
  await putInvestidor(item);
  return ok(event, { investidor: item });
}

async function interestStatus(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  requireCognito(event);
  requirePerfil(event, 'INVESTIDOR');
  const existing = await getInvestidor(getUserId(event));
  return ok(event, {
    investidor: {
      wantsOpportunityAlerts: existing?.wantsOpportunityAlerts ?? false,
      interestUpdatedAt: existing?.interestUpdatedAt ?? null,
    },
  });
}

async function interest(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  requireCognito(event);
  requirePerfil(event, 'INVESTIDOR');
  let body: z.infer<typeof investidorInteresseSchema>;
  try {
    body = validate(investidorInteresseSchema, JSON.parse(event.body ?? '{}'));
  } catch (err) {
    if (err instanceof ValidationError) return badRequest(event, err.message, 'VALIDATION_ERROR', err.fields);
    return badRequest(event, 'Corpo da requisição inválido');
  }
  const wantsOpportunityAlerts = body.wantsOpportunityAlerts;
  const userId = getUserId(event);
  const email = getUserEmail(event).trim().toLowerCase();
  const name = getUserNameRaw(event) ?? (email.length > 0 ? email : 'Investidor');
  const existing = await getInvestidor(userId);
  const now = new Date().toISOString();
  const nome = name;
  const item: Investidor = {
    id: userId,
    email,
    nome: existing?.nome ?? nome,
    ...(existing?.telefone !== undefined ? { telefone: existing.telefone } : {}),
    marketingOptIn: existing?.marketingOptIn ?? false,
    ...(existing?.termosAceitosEm !== undefined ? { termosAceitosEm: existing.termosAceitosEm } : {}),
    ...(existing?.termosVersao !== undefined ? { termosVersao: existing.termosVersao } : {}),
    wantsOpportunityAlerts,
    ...(wantsOpportunityAlerts ? { interestUpdatedAt: now } : {}),
    criadoEm: existing?.criadoEm ?? now,
    atualizadoEm: now,
  };
  await putInvestidor(item);
  return ok(event, { investidor: { wantsOpportunityAlerts: item.wantsOpportunityAlerts, interestUpdatedAt: item.interestUpdatedAt ?? null } });
}

async function allInvestidores(event: APIGatewayProxyEvent): Promise<Investidor[]> {
  const items: Investidor[] = [];
  let cursor: string | undefined;
  do {
    const page = await listInvestidores(cursor, 100);
    items.push(...filtered(page.items, event));
    cursor = page.nextCursor;
  } while (cursor !== undefined);
  return items;
}

async function investidoresPage(event: APIGatewayProxyEvent, pageSize: number): Promise<{ items: Investidor[]; nextCursor?: string }> {
  const startCursor = event.queryStringParameters?.['cursor'];
  let cursor = startCursor;
  const items: Investidor[] = [];
  let nextCursor: string | undefined;
  for (;;) {
    const page = await listInvestidores(cursor, pageSize);
    const matches = filtered(page.items, event);
    if (items.length > 0 && items.length + matches.length > pageSize) {
      nextCursor = cursor;
      break;
    }
    items.push(...matches);
    nextCursor = page.nextCursor;
    if (items.length >= pageSize || nextCursor === undefined) break;
    cursor = nextCursor;
  }
  return { items, ...(nextCursor !== undefined ? { nextCursor } : {}) };
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('investidores');
  try {
    const path = event.path;
    if (path === '/investidor/interesse') {
      if (event.httpMethod === 'POST') return await interest(event);
      if (event.httpMethod === 'GET') return await interestStatus(event);
    }
    if (path === '/investidor/perfil' && event.httpMethod === 'PUT') return await updateProfile(event);
    requireAdmin(event);
    if (event.httpMethod === 'GET' && path === '/admin/investidores/export') {
      return csvResponse(event, investorCsv(await allInvestidores(event)), 'investidores.csv');
    }
    if (event.httpMethod === 'GET' && path === '/admin/investidores') {
      const pageSize = Math.min(100, Math.max(1, Number(event.queryStringParameters?.['pageSize'] ?? '20') || 20));
      const page = await investidoresPage(event, pageSize);
      log.info('Investidores listed', { count: page.items.length, hasNext: page.nextCursor !== undefined, pageSize });
      return ok(event, { items: page.items, nextCursor: page.nextCursor ?? null, pageSize });
    }
    return notFound(event, 'Rota não encontrada');
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof ForbiddenError) return forbidden(event);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
