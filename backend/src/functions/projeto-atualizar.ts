import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, unauthorized, forbidden, badRequest, notFound, serverError } from '../shared/http/response.js';
import { getUserId, getUserName, AuthError, ForbiddenError, requirePerfil } from '../shared/http/auth.js';
import { validate, atualizarProjetoSchema, ValidationError, FIELD_LABELS } from '../shared/http/validators.js';
import { getProjeto, updateProjeto, putAuditoria } from '../shared/db/index.js';
import { createLogger } from '../shared/core/logger.js';
import type { AuditoriaEntry, StatusProjeto } from '../shared/core/types/index.js';

const STATUS_NAO_EDITAVEIS: StatusProjeto[] = ['APROVADO', 'OFERTA_CRIADA'];

function valorNormalizado(valor: unknown): string {
  if (valor === undefined || valor === null || valor === '') return 'vazio';
  if (Array.isArray(valor)) return valor.length === 0 ? 'vazio' : JSON.stringify(valor);
  if (typeof valor === 'object') return Object.keys(valor).length === 0 ? 'vazio' : JSON.stringify(valor);
  return JSON.stringify(valor);
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('projetoAtualizar');
  try {
    const userId = getUserId(event);
    requirePerfil(event, 'INCORPORADORA');
    const id = event.pathParameters?.['id'];
    if (id === undefined || id === '') return notFound(event, 'Projeto não encontrado');

    const projeto = await getProjeto(id);
    if (projeto === null) return notFound(event, 'Projeto não encontrado');
    if (projeto.incorporadoraId !== userId) return forbidden(event);
    if (STATUS_NAO_EDITAVEIS.includes(projeto.status)) {
      return badRequest(event, 'Projeto aprovado não pode mais ser editado', 'INVALID_STATUS_TRANSITION');
    }

    const body = validate(atualizarProjetoSchema, JSON.parse(event.body ?? '{}'));
    const alterados = Object.keys(body).filter(
      (campo) => valorNormalizado((projeto as unknown as Record<string, unknown>)[campo]) !== valorNormalizado((body as Record<string, unknown>)[campo]),
    );
    await updateProjeto(id, body as Parameters<typeof updateProjeto>[1]);

    const auditoria: AuditoriaEntry = {
      projetoId: id,
      criadoEm: new Date().toISOString(),
      acao: 'ATUALIZADO',
      userId,
      userName: getUserName(event),
      descricao: alterados.length > 0
        ? `Projeto editado pelo incorporador · Campos alterados: ${alterados.map((campo) => FIELD_LABELS[campo] ?? campo).join(', ')}`
        : 'Projeto editado pelo incorporador',
    };
    await putAuditoria(auditoria);

    log.info('Project updated', { projetoId: id, userId });
    return ok(event, { updated: true });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof ForbiddenError) return forbidden(event);
    if (err instanceof ValidationError) return badRequest(event, err.message, 'VALIDATION_ERROR', err.fields);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
