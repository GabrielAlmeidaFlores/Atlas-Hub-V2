import type { APIGatewayProxyEvent } from 'aws-lambda';
import type { Perfil } from '../core/types/index.js';

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

interface AuthorizerContext {
  readonly claims?: Record<string, string>;
  readonly userId?: string;
  readonly email?: string;
  readonly name?: string;
  readonly groups?: string;
  readonly perfil?: string;
  readonly authType?: string;
}

function authorizerContext(event: APIGatewayProxyEvent): AuthorizerContext {
  return (event.requestContext.authorizer ?? {}) as unknown as AuthorizerContext;
}

export function getAuthType(event: APIGatewayProxyEvent): 'cognito' | 'token' {
  return authorizerContext(event).authType === 'token' ? 'token' : 'cognito';
}

export function requireCognito(event: APIGatewayProxyEvent): void {
  if (getAuthType(event) === 'token') throw new ForbiddenError('Esta operação exige autenticação de usuário');
}

export function getUserId(event: APIGatewayProxyEvent): string {
  const context = authorizerContext(event);
  const sub = context.claims?.['sub'] ?? context.userId;
  if (sub === undefined || sub === '') throw new AuthError('Token inválido ou ausente');
  return sub;
}

export function getUserEmail(event: APIGatewayProxyEvent): string {
  const context = authorizerContext(event);
  return context.claims?.['email'] ?? context.email ?? '';
}

export function getUserName(event: APIGatewayProxyEvent): string {
  const context = authorizerContext(event);
  const name = context.claims?.['name'] ?? context.name;
  return name !== undefined && name.trim().length > 0 ? name.trim() : 'Incorporadora';
}

export function getUserGroups(event: APIGatewayProxyEvent): string[] {
  const context = authorizerContext(event);
  const groups = context.claims?.['cognito:groups'] ?? context.groups;
  if (groups === undefined || groups === '') return [];
  return groups.split(',').map((g) => g.trim());
}

export function getUserPerfil(event: APIGatewayProxyEvent): Perfil | null {
  const context = authorizerContext(event);
  if (context.perfil === 'ADMIN_MASTER' || context.perfil === 'ANALISTA' || context.perfil === 'INCORPORADORA') {
    return context.perfil;
  }
  const groups = getUserGroups(event);
  if (groups.includes('ADMIN_MASTER')) return 'ADMIN_MASTER';
  if (groups.includes('ANALISTA')) return 'ANALISTA';
  if (groups.includes('INCORPORADORA')) return 'INCORPORADORA';
  return null;
}

export function requirePerfil(event: APIGatewayProxyEvent, ...perfis: Perfil[]): void {
  const perfil = getUserPerfil(event);
  if (perfil === null || !perfis.includes(perfil)) {
    throw new ForbiddenError('Acesso negado');
  }
}

export function requireAdmin(event: APIGatewayProxyEvent): void {
  requirePerfil(event, 'ANALISTA', 'ADMIN_MASTER');
}

export function requireAdminMaster(event: APIGatewayProxyEvent): void {
  requirePerfil(event, 'ADMIN_MASTER');
}
