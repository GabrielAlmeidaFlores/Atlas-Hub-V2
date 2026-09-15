import { v4 as uuidv4 } from 'uuid';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, unauthorized, forbidden, notFound, conflict, serverError } from '../shared/http/response.js';
import { getUserId, getUserEmail, AuthError, ForbiddenError, requireAdminMaster } from '../shared/http/auth.js';
import { createLogger } from '../shared/core/logger.js';
import { getSolicitacao, updateSolicitacaoStatus, putFinanceiroAuditoria } from '../shared/db/financeiro.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('adminFinanceiroSolicitacaoRejeitar');
  try {
    const userId = getUserId(event);
    const userName = getUserEmail(event);
    requireAdminMaster(event);

    const id = event.pathParameters?.['id'];
    if (id === undefined || id === '') return notFound(event, 'Solicitação não encontrada');
    const solicitacao = await getSolicitacao(id);
    if (solicitacao === null) return notFound(event, 'Solicitação não encontrada');
    if (solicitacao.status !== 'PENDENTE') return conflict(event, 'Solicitação já foi processada');

    const now = new Date().toISOString();
    await updateSolicitacaoStatus(id, 'REJEITADA', {
      aprovadoPor: userId,
      aprovadoPorNome: userName,
      aprovadoEm: now,
    });
    await putFinanceiroAuditoria({
      projetoId: solicitacao.projetoId,
      criadoEm: now,
      id: uuidv4(),
      acao: 'SOLICITACAO_REJEITADA',
      userId,
      userName,
      descricao: 'Solicitação de Pix rejeitada',
      solicitacaoId: id,
      workspaceId: solicitacao.workspaceId,
    });
    log.info('Payment request rejected', { id });
    return ok(event, { id, status: 'REJEITADA' });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof ForbiddenError) return forbidden(event);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
