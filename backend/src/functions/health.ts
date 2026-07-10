import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok } from '../shared/http/response.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return ok(event, { status: 'ok', timestamp: new Date().toISOString(), service: 'atlas-hub-backend' });
};
