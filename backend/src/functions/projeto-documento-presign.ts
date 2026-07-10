import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, unauthorized, forbidden, badRequest, notFound, serverError } from '../shared/http/response.js';
import { getUserId, AuthError, ForbiddenError, requirePerfil } from '../shared/http/auth.js';
import { validate, presignSchema, ValidationError } from '../shared/http/validators.js';
import { getProjeto } from '../shared/db/index.js';
import { generatePresignedUrl } from '../shared/storage/index.js';
import { createLogger } from '../shared/core/logger.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('projetoDocumentoPresign');
  try {
    const userId = getUserId(event);
    requirePerfil(event, 'INCORPORADORA');

    const id = event.pathParameters?.['id'];
    if (id === undefined || id === '') return notFound(event, 'Projeto não encontrado');

    const projeto = await getProjeto(id);
    if (projeto === null) return notFound(event, 'Projeto não encontrado');
    if (projeto.incorporadoraId !== userId) return forbidden(event);

    const body = validate(presignSchema, JSON.parse(event.body ?? '{}'));
    const key = `projetos/${id}/documentos/${Date.now()}-${body.fileName}`;
    const result = await generatePresignedUrl(key, body.mimeType);

    log.info('Project pre-signed URL generated', { projetoId: id, userId, key });
    return ok(event, result);
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof ForbiddenError) return forbidden(event);
    if (err instanceof ValidationError) return badRequest(event, err.message);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
