import { v4 as uuidv4 } from 'uuid';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { created, unauthorized, forbidden, badRequest, notFound, serverError } from '../shared/http/response.js';
import { getUserId, getUserEmail, AuthError, ForbiddenError, requireAdminMaster } from '../shared/http/auth.js';
import { validate, criarSolicitacaoFinanceiroSchema, ValidationError } from '../shared/http/validators.js';
import { createLogger } from '../shared/core/logger.js';
import { getSpeConta, putSolicitacao, putFinanceiroAuditoria } from '../shared/db/financeiro.js';
import { lookupPixKey, StarkNotConfiguredError, StarkOperationError } from '../shared/starkbank/index.js';
import type { DestinoPix, FinanceiroSolicitacao } from '../shared/core/types/index.js';

function reaisToCents(value: number): number {
  return Math.round(value * 100);
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('adminFinanceiroSolicitacaoCriar');
  try {
    const userId = getUserId(event);
    const userName = getUserEmail(event);
    requireAdminMaster(event);

    const body = validate(criarSolicitacaoFinanceiroSchema, JSON.parse(event.body ?? '{}') as unknown);
    const conta = await getSpeConta(body.projetoId);
    if (conta === null) return notFound(event, 'Conta não encontrada');
    if (conta.status !== 'ATIVA') return badRequest(event, 'Conta indisponível para movimentação');

    let destino: DestinoPix;
    if (body.pixKey !== undefined && body.pixKey.length > 0) {
      destino = await lookupPixKey(body.pixKey, conta.workspaceId);
    } else {
      const taxId = (body.taxId ?? '').replace(/\D/g, '');
      destino = {
        name: body.name ?? '',
        taxId,
        bankCode: body.bankCode ?? '',
        branchCode: body.branchCode ?? '',
        accountNumber: body.accountNumber ?? '',
        accountType: body.accountType ?? 'checking',
      };
    }

    const now = new Date().toISOString();
    const solicitacao: FinanceiroSolicitacao = {
      id: uuidv4(),
      projetoId: conta.projetoId,
      workspaceId: conta.workspaceId,
      amount: reaisToCents(body.amountReais),
      description: body.description,
      destino,
      status: 'PENDENTE',
      solicitadoPor: userId,
      solicitadoPorNome: userName,
      solicitadoEm: now,
    };
    await putSolicitacao(solicitacao);
    await putFinanceiroAuditoria({
      projetoId: conta.projetoId,
      criadoEm: now,
      id: uuidv4(),
      acao: 'SOLICITACAO_CRIADA',
      userId,
      userName,
      descricao: `Solicitação de Pix de R$ ${body.amountReais.toFixed(2)}`,
      solicitacaoId: solicitacao.id,
      workspaceId: conta.workspaceId,
    });
    log.info('Payment request created', { id: solicitacao.id, projetoId: conta.projetoId });
    return created(event, { solicitacao });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof ForbiddenError) return forbidden(event);
    if (err instanceof ValidationError) return badRequest(event, err.message);
    if (err instanceof StarkNotConfiguredError || err instanceof StarkOperationError) {
      return badRequest(event, err.message);
    }
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
