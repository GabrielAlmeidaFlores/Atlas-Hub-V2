import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { created, unauthorized, forbidden, badRequest, notFound, serverError } from '../shared/http/response.js';
import { getUserId, getUserEmail, AuthError, ForbiddenError, requireAdminMaster } from '../shared/http/auth.js';
import { validate, criarContaFinanceiroSchema, ValidationError } from '../shared/http/validators.js';
import { createLogger } from '../shared/core/logger.js';
import { getProjeto } from '../shared/db/index.js';
import { openSpeAccount, openTreasuryAccount } from '../shared/db/financeiro-contas.js';
import { StarkNotConfiguredError, StarkOperationError } from '../shared/starkbank/index.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('adminFinanceiroContasCriar');
  try {
    const userId = getUserId(event);
    const userName = getUserEmail(event);
    requireAdminMaster(event);

    const body = validate(criarContaFinanceiroSchema, JSON.parse(event.body ?? '{}') as unknown);
    if (body.tipo === 'TESOURARIA') {
      const conta = await openTreasuryAccount(userId, userName);
      log.info('Treasury account ensured', { workspaceId: conta.workspaceId });
      return created(event, { conta });
    }

    const projeto = await getProjeto(body.projetoId);
    if (projeto === null) return notFound(event, 'Projeto não encontrado');
    if (projeto.status !== 'OFERTA_CRIADA') {
      return badRequest(event, 'Conta SPE só pode ser aberta após a oferta publicada', 'INVALID_STATUS_TRANSITION');
    }

    const conta = await openSpeAccount({
      projetoId: projeto.id,
      projetoNome: projeto.nome,
      cnpjSpe: body.cnpjSpe,
      razaoSocialSpe: body.razaoSocialSpe,
      userId,
      userName,
    });
    log.info('SPE account ensured', { projetoId: projeto.id, workspaceId: conta.workspaceId });
    return created(event, { conta });
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
