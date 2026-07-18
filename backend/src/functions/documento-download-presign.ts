import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, unauthorized, forbidden, badRequest, notFound, serverError } from '../shared/http/response.js';
import { getUserId, AuthError, ForbiddenError, getUserPerfil } from '../shared/http/auth.js';
import { validate, downloadPresignSchema, ValidationError } from '../shared/http/validators.js';
import { getProjeto } from '../shared/db/index.js';
import { generatePresignedGetUrl, extractKeyFromLocation } from '../shared/storage/index.js';
import { createLogger } from '../shared/core/logger.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('documentoDownloadPresign');
  try {
    const userId = getUserId(event);
    const perfil = getUserPerfil(event);
    if (perfil === null) throw new ForbiddenError('Acesso negado');

    const body = validate(downloadPresignSchema, JSON.parse(event.body ?? '{}'));
    const key = extractKeyFromLocation(body.location);
    if (key === null) return badRequest(event, 'URL de documento inválida');

    const incorpPrefix = `incorporadoras/${userId}/`;
    if (key.startsWith('incorporadoras/')) {
      if (!key.startsWith(incorpPrefix) && perfil === 'INCORPORADORA') {
        return forbidden(event);
      }
      if (perfil === 'INCORPORADORA' || perfil === 'ANALISTA' || perfil === 'ADMIN_MASTER') {
        const url = await generatePresignedGetUrl(key);
        return ok(event, { url });
      }
      return forbidden(event);
    }

    if (key.startsWith('projetos/')) {
      const parts = key.split('/');
      const projetoId = parts[1];
      if (projetoId === undefined || projetoId === '') return badRequest(event, 'Chave de documento inválida');
      const projeto = await getProjeto(projetoId);
      if (projeto === null) return notFound(event, 'Projeto não encontrado');
      if (perfil === 'INCORPORADORA' && projeto.incorporadoraId !== userId) return forbidden(event);
      if (perfil !== 'INCORPORADORA' && perfil !== 'ANALISTA' && perfil !== 'ADMIN_MASTER') {
        return forbidden(event);
      }
      const url = await generatePresignedGetUrl(key);
      return ok(event, { url });
    }

    return forbidden(event);
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof ForbiddenError) return forbidden(event);
    if (err instanceof ValidationError) return badRequest(event, err.message);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
