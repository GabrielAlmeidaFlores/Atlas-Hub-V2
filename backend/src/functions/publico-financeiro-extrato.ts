import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, badRequest, notFound, serverError } from '../shared/http/response.js';
import { createLogger } from '../shared/core/logger.js';
import { getSpeConta, listLedgerByProjeto } from '../shared/db/financeiro.js';
import { getWorkspaceBalance, isStarkConfigured } from '../shared/starkbank/index.js';
import type { FinanceiroLedgerEntry } from '../shared/core/types/index.js';

function extractToken(event: APIGatewayProxyEvent): string | null {
  const auth = event.headers['authorization'] ?? event.headers['Authorization'];
  if (auth !== undefined && auth.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim();
  }
  const query = event.queryStringParameters?.['token'];
  if (query !== undefined && query.length > 0) return query;
  return null;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('publicoFinanceiroExtrato');
  try {
    const projetoId = event.pathParameters?.['projetoId'];
    if (projetoId === undefined || projetoId === '') {
      return notFound(event, 'Projeto não encontrado');
    }
    const decoded = decodeURIComponent(projetoId);

    const token = extractToken(event);
    if (token === null || token.length < 16) {
      return badRequest(event, 'Token de acesso ausente ou inválido');
    }

    const conta = await getSpeConta(decoded);
    if (conta === null) {
      return notFound(event, 'Conta não encontrada');
    }

    const expectedToken = `${conta.projetoId}:${conta.workspaceId}`.slice(0, 64);
    if (token !== expectedToken) {
      return badRequest(event, 'Token de acesso inválido para este projeto');
    }

    const entries = await listLedgerByProjeto(decoded, 100);

    let saldoCents: number | null = null;
    if (isStarkConfigured() && conta.status === 'ATIVA') {
      try {
        saldoCents = await getWorkspaceBalance(conta.workspaceId);
      } catch {
      }
    }

    log.info('Public extrato served', { projetoId: decoded, entries: entries.length });
    return ok(event, {
      projeto: {
        id: conta.projetoId,
        nome: conta.projetoNome ?? conta.projetoId,
        razaoSocialSpe: conta.razaoSocialSpe ?? null,
        cnpjSpe: conta.cnpjSpe ?? null,
      },
      saldoCents,
      extrato: entries.map((e: FinanceiroLedgerEntry) => ({
        data: e.criadoEm,
        tipo: e.tipo,
        descricao: e.description,
        valor: e.amount,
      })),
    });
  } catch (err) {
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
