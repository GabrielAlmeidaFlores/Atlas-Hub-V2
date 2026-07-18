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

export function getUserId(event: APIGatewayProxyEvent): string {
  const sub = event.requestContext.authorizer?.['claims']?.['sub'] as string | undefined;
  if (sub === undefined || sub === '') throw new AuthError('Token inválido ou ausente');
  return sub;
}

export function getUserEmail(event: APIGatewayProxyEvent): string {
  const email = event.requestContext.authorizer?.['claims']?.['email'] as string | undefined;
  return email ?? '';
}

export function getUserGroups(event: APIGatewayProxyEvent): string[] {
  const groups = event.requestContext.authorizer?.['claims']?.['cognito:groups'] as string | undefined;
  if (groups === undefined || groups === '') return [];
  return groups.split(',').map((g) => g.trim());
}

export function getUserPerfil(event: APIGatewayProxyEvent): Perfil | null {
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
