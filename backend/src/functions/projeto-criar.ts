import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { created, unauthorized, forbidden, badRequest, serverError } from '../shared/http/response.js';
import { getUserId, AuthError, ForbiddenError, requirePerfil } from '../shared/http/auth.js';
import { validate, criarProjetoSchema, ValidationError } from '../shared/http/validators.js';
import { putProjeto, putAuditoria } from '../shared/db/index.js';
import { createLogger } from '../shared/core/logger.js';
import type { Projeto, AuditoriaEntry } from '../shared/core/types/index.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('projetoCriar');
  try {
    const userId = getUserId(event);
    requirePerfil(event, 'INCORPORADORA');
    const body = validate(criarProjetoSchema, JSON.parse(event.body ?? '{}'));
    const now = new Date().toISOString();
    const id = uuidv4();

    const projeto: Projeto = {
      id,
      incorporadoraId: userId,
      status: 'RASCUNHO',
      revisao: 1,
      nome: body.nome,
      modelo: body.modelo,
      tipoImovel: body.tipoImovel,
      cidade: body.cidade,
      estado: body.estado,
      endereco: body.endereco,
      descricao: body.descricao,
      ...(body.fotosUrls !== undefined && body.fotosUrls.length > 0 && { fotosUrls: body.fotosUrls }),
      ...(body.videoUrl !== undefined && body.videoUrl !== '' && { videoUrl: body.videoUrl }),
      criadoEm: now,
      atualizadoEm: now,
    };

    const auditoria: AuditoriaEntry = {
      projetoId: id,
      criadoEm: now,
      acao: 'CRIADO',
      userId,
      userName: 'Incorporadora',
      descricao: 'Projeto criado como rascunho',
      statusNovo: 'RASCUNHO',
    };

    await putProjeto(projeto);
    await putAuditoria(auditoria);
    log.info('Project created', { projetoId: id, userId });
    return created(event, { id });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof ForbiddenError) return forbidden(event);
    if (err instanceof ValidationError) return badRequest(event, err.message);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
