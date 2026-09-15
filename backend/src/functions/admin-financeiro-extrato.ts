import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, unauthorized, forbidden, notFound, serverError } from '../shared/http/response.js';
import { getUserId, AuthError, ForbiddenError, requireAdmin } from '../shared/http/auth.js';
import { createLogger } from '../shared/core/logger.js';
import { getSpeConta, listLedgerByProjeto, upsertLedgerEntry } from '../shared/db/financeiro.js';
import {
  isStarkConfigured,
  listWorkspaceTransactions,
  StarkNotConfiguredError,
  StarkOperationError,
} from '../shared/starkbank/index.js';
import type { FinanceiroLedgerEntry } from '../shared/core/types/index.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('adminFinanceiroExtrato');
  try {
    getUserId(event);
    requireAdmin(event);
    const projetoId = event.pathParameters?.['projetoId'];
    if (projetoId === undefined || projetoId === '') return notFound(event, 'Conta não encontrada');

    const conta = await getSpeConta(projetoId);
    if (conta === null) return notFound(event, 'Conta não encontrada');

    if (isStarkConfigured()) {
      try {
        const txs = await listWorkspaceTransactions(conta.workspaceId, 80);
        await Promise.all(txs.map(async (tx) => {
          const entry: FinanceiroLedgerEntry = {
            projetoId,
            starkId: tx.id,
            workspaceId: conta.workspaceId,
            tipo: 'TRANSACTION',
            amount: tx.amount,
            description: tx.description,
            criadoEm: tx.created,
            conciliado: true,
            source: 'sync',
            tags: tx.tags,
          };
          await upsertLedgerEntry(entry);
        }));
      } catch (err) {
        if (!(err instanceof StarkNotConfiguredError) && !(err instanceof StarkOperationError)) throw err;
      }
    }

    const items = (await listLedgerByProjeto(projetoId, 80))
      .slice()
      .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
    log.info('Statement listed', { projetoId, count: items.length });
    return ok(event, { items, configured: isStarkConfigured() });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof ForbiddenError) return forbidden(event);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
