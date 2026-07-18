import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, unauthorized, forbidden, badRequest, notFound, serverError } from '../shared/http/response.js';
import { getUserId, AuthError, ForbiddenError, requireAdmin, getUserEmail } from '../shared/http/auth.js';
import { validate, confirmarPublicacaoSchema, ValidationError } from '../shared/http/validators.js';
import { getProjeto, updateProjeto, putAuditoria, putNotificacao } from '../shared/db/index.js';
import { emailOfertaCriada } from '../shared/email/index.js';
import { createLogger } from '../shared/core/logger.js';
import { v4 as uuidv4 } from 'uuid';
import type { AuditoriaEntry, Notificacao } from '../shared/core/types/index.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('adminCuradoriaConfirmarPublicacao');
  try {
    const analistaId = getUserId(event);
    const analistaEmail = getUserEmail(event);
    requireAdmin(event);

    const id = event.pathParameters?.['id'];
    if (id === undefined || id === '') return notFound(event, 'Projeto não encontrado');

    const projeto = await getProjeto(id);
    if (projeto === null) return notFound(event, 'Projeto não encontrado');
    if (projeto.status !== 'APROVADO') {
      return badRequest(event, 'Publicação só pode ser confirmada em projetos aprovados', 'INVALID_STATUS_TRANSITION');
    }

    const body = validate(confirmarPublicacaoSchema, JSON.parse(event.body ?? '{}'));
    const now = new Date().toISOString();
    const ttl = Math.floor(Date.now() / 1000) + 7_776_000;

    const auditoria: AuditoriaEntry = {
      projetoId: id,
      criadoEm: now,
      acao: 'OFERTA_CRIADA',
      userId: analistaId,
      userName: analistaEmail,
      descricao: `Oferta publicada na plataforma. ID: ${body.ofertaId}`,
      statusAnterior: 'APROVADO',
      statusNovo: 'OFERTA_CRIADA',
    };

    const notificacao: Notificacao = {
      userId: projeto.incorporadoraId,
      criadoEm: now,
      id: uuidv4(),
      tipo: 'OFERTA_CRIADA',
      titulo: 'Oferta publicada!',
      mensagem: `A oferta do projeto "${projeto.nome}" está no ar para investidores.`,
      lida: false,
      projetoId: id,
      projetoNome: projeto.nome,
      ttl,
    };

    await updateProjeto(id, {
      status: 'OFERTA_CRIADA',
      ofertaId: body.ofertaId,
      ofertaLink: body.ofertaLink,
      ofertaConfirmadaEm: now,
    });
    await putAuditoria(auditoria);
    await putNotificacao(notificacao);

    try { await emailOfertaCriada('', projeto.nome, body.ofertaLink); } catch { /* email non-blocking */ }

    log.info('Offer publication confirmed', { projetoId: id, ofertaId: body.ofertaId, analistaId });
    return ok(event, { status: 'OFERTA_CRIADA', ofertaId: body.ofertaId, ofertaLink: body.ofertaLink });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof ForbiddenError) return forbidden(event);
    if (err instanceof ValidationError) return badRequest(event, err.message);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
