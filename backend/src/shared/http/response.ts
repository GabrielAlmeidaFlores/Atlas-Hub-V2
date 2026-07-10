import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CORS_ORIGINS } from '../core/env.js';
import type { ApiErrorCode } from '../core/types/index.js';

function getCorsHeaders(event: APIGatewayProxyEvent): Record<string, string> {
  if (CORS_ORIGINS === '*') {
    return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    };
  }
  const allowedList = CORS_ORIGINS.split(',').map((o) => o.trim());
  const requestOrigin = (event.headers['origin'] ?? event.headers['Origin']) ?? '';
  const matchedOrigin = allowedList.includes(requestOrigin) ? requestOrigin : (allowedList[0] ?? '');
  return {
    'Access-Control-Allow-Origin': matchedOrigin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  };
}

function build(statusCode: number, body: unknown, event: APIGatewayProxyEvent): APIGatewayProxyResult {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', ...getCorsHeaders(event) },
    body: JSON.stringify(body),
  };
}

export function ok(event: APIGatewayProxyEvent, body: unknown): APIGatewayProxyResult {
  return build(200, body, event);
}

export function created(event: APIGatewayProxyEvent, body: unknown): APIGatewayProxyResult {
  return build(201, body, event);
}

export function unauthorized(event: APIGatewayProxyEvent): APIGatewayProxyResult {
  return build(401, {
    code: 'UNAUTHENTICATED' satisfies ApiErrorCode,
    error: 'Unauthorized',
    message: 'Token inválido ou ausente',
  }, event);
}

export function forbidden(event: APIGatewayProxyEvent): APIGatewayProxyResult {
  return build(403, {
    code: 'FORBIDDEN' satisfies ApiErrorCode,
    error: 'Forbidden',
    message: 'Acesso negado',
  }, event);
}

export function badRequest(
  event: APIGatewayProxyEvent,
  message: string,
  code: ApiErrorCode = 'VALIDATION_ERROR',
): APIGatewayProxyResult {
  return build(400, { code, error: 'Bad Request', message }, event);
}

export function notFound(
  event: APIGatewayProxyEvent,
  message: string,
): APIGatewayProxyResult {
  return build(404, { code: 'NOT_FOUND' satisfies ApiErrorCode, error: 'Not Found', message }, event);
}

export function conflict(
  event: APIGatewayProxyEvent,
  message: string,
): APIGatewayProxyResult {
  return build(409, { code: 'CONFLICT' satisfies ApiErrorCode, error: 'Conflict', message }, event);
}

export function serverError(
  event: APIGatewayProxyEvent,
  err: unknown,
): APIGatewayProxyResult {
  console.error('[SERVER ERROR]', err);
  return build(500, {
    code: 'INTERNAL_ERROR' satisfies ApiErrorCode,
    error: 'Internal Server Error',
    message: 'Erro interno. Tente novamente.',
  }, event);
}
