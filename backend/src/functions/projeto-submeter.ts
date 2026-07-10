import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, unauthorized, forbidden, badRequest, notFound, serverError } from '../shared/http/response.js';
import { getUserId, AuthError, ForbiddenError, requirePerfil } from '../shared/http/auth.js';
import { getProjeto, updateProjeto, putAuditoria, putNotificacao } from '../shared/db/index.js';
import { emailProjetoSubmetido } from '../shared/email/index.js';
import { getUserEmail } from '../shared/http/auth.js';
import { createLogger } from '../shared/core/logger.js';
import { v4 as uuidv4 } from 'uuid';
import type { AuditoriaEntry, Notificacao } from '../shared/core/types/index.js';

const DOCS_OBRIGATORIOS = ['matriculaUrl', 'alvaraUrl', 'memorialUrl', 'plantaUrl', 'viabilidadeUrl'] as const;
const CAMPOS_FINANCEIROS = ['valorTotal', 'valorCaptar', 'prazoObra', 'prazoRetorno', 'rentabilidadeEstimada', 'modeloRetorno', 'planoSaida', 'tipoOferta'] as const;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('projetoSubmeter');
  try {
    const userId = getUserId(event);
    const email = getUserEmail(event);
    requirePerfil(event, 'INCORPORADORA');

    const id = event.pathParameters?.['id'];
    if (id === undefined || id === '') return notFound(event, 'Projeto não encontrado');

    const projeto = await getProjeto(id);
    if (projeto === null) return notFound(event, 'Projeto não encontrado');
    if (projeto.incorporadoraId !== userId) return forbidden(event);
    if (projeto.status !== 'RASCUNHO' && projeto.status !== 'AJUSTE_SOLICITADO' && projeto.status !== 'REPROVADO') {
      return badRequest(event, 'Projeto não pode ser submetido no status atual', 'INVALID_STATUS_TRANSITION');
    }

    for (const campo of CAMPOS_FINANCEIROS) {
      if (projeto[campo] === undefined) {
        return badRequest(event, `Campo obrigatório ausente: ${campo}`);
      }
    }

    if (projeto.documentos === undefined) {
      return badRequest(event, 'Documentos obrigatórios não foram enviados');
    }
    for (const doc of DOCS_OBRIGATORIOS) {
      if (projeto.documentos[doc] === undefined) {
        return badRequest(event, `Documento obrigatório ausente: ${doc}`);
      }
    }

    if (projeto.equipe === undefined || projeto.equipe.length === 0) {
      return badRequest(event, 'Ao menos um membro da equipe deve ser cadastrado');
    }

    const now = new Date().toISOString();
    const novoStatus = 'SUBMETIDO';
    const ttl = Math.floor(Date.now() / 1000) + 7_776_000;

    await updateProjeto(id, { status: novoStatus, submetidoEm: now });

    const auditoria: AuditoriaEntry = {
      projetoId: id,
      criadoEm: now,
      acao: 'SUBMETIDO',
      userId,
      userName: 'Incorporadora',
      descricao: 'Projeto submetido para análise',
      statusAnterior: projeto.status,
      statusNovo: novoStatus,
    };

    const notificacao: Notificacao = {
      userId,
      criadoEm: now,
      id: uuidv4(),
      tipo: 'PROJETO_SUBMETIDO',
      titulo: 'Projeto submetido',
      mensagem: `Seu projeto "${projeto.nome}" foi submetido com sucesso e aguarda análise.`,
      lida: false,
      projetoId: id,
      projetoNome: projeto.nome,
      ttl,
    };

    await putAuditoria(auditoria);
    await putNotificacao(notificacao);

    try { await emailProjetoSubmetido(email, projeto.nome); } catch { /* email non-blocking */ }

    log.info('Project submitted', { projetoId: id, userId });
    return ok(event, { status: novoStatus });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof ForbiddenError) return forbidden(event);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
