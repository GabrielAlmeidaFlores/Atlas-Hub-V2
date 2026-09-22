import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, unauthorized, forbidden, serverError } from '../shared/http/response.js';
import { getUserId, AuthError, ForbiddenError, requireAdmin } from '../shared/http/auth.js';
import { createLogger } from '../shared/core/logger.js';
import { TESOURARIA_CONTA_ID } from '../shared/core/types/index.js';
import { listSpeContas } from '../shared/db/financeiro.js';
import { listCartoesByProjetos } from '../shared/db/cartao.js';
import { listAllProjetosByStatus } from '../shared/db/index.js';
import { getWorkspaceBalance, isStarkConfigured, StarkNotConfiguredError, StarkOperationError } from '../shared/starkbank/index.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('adminFinanceiroContasListar');
  try {
    getUserId(event);
    requireAdmin(event);

    const contas = await listSpeContas();
    const tesouraria = contas.find((c) => c.projetoId === TESOURARIA_CONTA_ID) ?? null;
    const spe = contas.filter((c) => c.tipo === 'SPE');
    const speIds = new Set(spe.map((c) => c.projetoId));
    const publicados = await listAllProjetosByStatus('OFERTA_CRIADA');
    const elegiveis = publicados
      .filter((p) => !speIds.has(p.id))
      .map((p) => ({ id: p.id, nome: p.nome, cidade: p.cidade, estado: p.estado, valorCaptar: p.valorCaptar }));

    const configured = isStarkConfigured();
    const cartoes = await listCartoesByProjetos(spe.map((c) => c.projetoId));
    const withBalance = await Promise.all(contas.map(async (conta) => {
      if (!configured || conta.status !== 'ATIVA') {
        return { ...conta, saldoCents: null as number | null };
      }
      try {
        const saldoCents = await getWorkspaceBalance(conta.workspaceId);
        return { ...conta, saldoCents };
      } catch (err) {
        if (err instanceof StarkNotConfiguredError || err instanceof StarkOperationError) {
          return { ...conta, saldoCents: null as number | null };
        }
        throw err;
      }
    }));

    log.info('Finance accounts listed', { count: spe.length, configured });
    return ok(event, {
      configured,
      tesouraria: withBalance.find((c) => c.projetoId === TESOURARIA_CONTA_ID) ?? tesouraria,
      items: withBalance.filter((c) => c.tipo === 'SPE').map((conta) => ({
        ...conta,
        statusCartao: cartoes.get(conta.projetoId)?.status ?? 'PREPARACAO',
      })),
      elegiveis,
    });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof ForbiddenError) return forbidden(event);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
