import { v4 as uuidv4 } from 'uuid';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, unauthorized, forbidden, badRequest, notFound, conflict, serverError } from '../shared/http/response.js';
import { getUserId, getUserEmail, AuthError, ForbiddenError, requireAdminMaster } from '../shared/http/auth.js';
import { createLogger } from '../shared/core/logger.js';
import {
  getSolicitacao,
  updateSolicitacaoStatus,
  putFinanceiroAuditoria,
  upsertLedgerEntry,
} from '../shared/db/financeiro.js';
import { createWorkspaceTransfer, StarkNotConfiguredError, StarkOperationError } from '../shared/starkbank/index.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('adminFinanceiroSolicitacaoAprovar');
  try {
    const userId = getUserId(event);
    const userName = getUserEmail(event);
    requireAdminMaster(event);

    const id = event.pathParameters?.['id'];
    if (id === undefined || id === '') return notFound(event, 'Solicitação não encontrada');

    const solicitacao = await getSolicitacao(id);
    if (solicitacao === null) return notFound(event, 'Solicitação não encontrada');
    if (solicitacao.status !== 'PENDENTE') {
      return conflict(event, 'Solicitação já foi processada');
    }
    if (solicitacao.solicitadoPor === userId) {
      return badRequest(event, 'O mesmo admin não pode solicitar e aprovar a movimentação');
    }

    const now = new Date().toISOString();
    await updateSolicitacaoStatus(id, 'APROVADA', {
      aprovadoPor: userId,
      aprovadoPorNome: userName,
      aprovadoEm: now,
    });
    await putFinanceiroAuditoria({
      projetoId: solicitacao.projetoId,
      criadoEm: now,
      id: uuidv4(),
      acao: 'SOLICITACAO_APROVADA',
      userId,
      userName,
      descricao: 'Segundo admin master aprovou a movimentação',
      solicitacaoId: id,
      workspaceId: solicitacao.workspaceId,
    });

    try {
      const transfer = await createWorkspaceTransfer(
        solicitacao.workspaceId,
        solicitacao.destino,
        solicitacao.amount,
        solicitacao.description,
        id,
      );
      const executedAt = new Date().toISOString();
      await updateSolicitacaoStatus(id, 'EXECUTADA', { starkTransferId: transfer.id });
      await upsertLedgerEntry({
        projetoId: solicitacao.projetoId,
        starkId: transfer.id,
        workspaceId: solicitacao.workspaceId,
        tipo: 'TRANSFER',
        amount: -Math.abs(solicitacao.amount),
        description: solicitacao.description,
        criadoEm: executedAt,
        conciliado: true,
        source: 'sync',
        tags: [`solicitacao:${id}`],
      });
      await putFinanceiroAuditoria({
        projetoId: solicitacao.projetoId,
        criadoEm: executedAt,
        id: uuidv4(),
        acao: 'TRANSFERENCIA_EXECUTADA',
        userId,
        userName,
        descricao: `Pix executado (${transfer.id})`,
        solicitacaoId: id,
        workspaceId: solicitacao.workspaceId,
      });
      log.info('Payment executed', { id, transferId: transfer.id });
      return ok(event, { id, status: 'EXECUTADA', starkTransferId: transfer.id });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao executar Pix';
      await updateSolicitacaoStatus(id, 'FALHOU', { erro: message });
      await putFinanceiroAuditoria({
        projetoId: solicitacao.projetoId,
        criadoEm: new Date().toISOString(),
        id: uuidv4(),
        acao: 'TRANSFERENCIA_FALHOU',
        userId,
        userName,
        descricao: message,
        solicitacaoId: id,
        workspaceId: solicitacao.workspaceId,
      });
      if (err instanceof StarkNotConfiguredError || err instanceof StarkOperationError) {
        return badRequest(event, message);
      }
      throw err;
    }
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof ForbiddenError) return forbidden(event);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
