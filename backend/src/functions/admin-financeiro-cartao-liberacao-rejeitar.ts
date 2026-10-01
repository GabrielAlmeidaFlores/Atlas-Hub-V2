import { v4 as uuidv4 } from 'uuid';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, unauthorized, forbidden, notFound, badRequest, serverError } from '../shared/http/response.js';
import { getUserId, getUserEmail, AuthError, ForbiddenError, requireAdminMaster } from '../shared/http/auth.js';
import { createLogger } from '../shared/core/logger.js';
import { getSpeConta, putFinanceiroAuditoria } from '../shared/db/financeiro.js';
import { getCartaoLiberacao, getCartaoObra, putCartaoLiberacao } from '../shared/db/cartao.js';
import { getProjeto } from '../shared/db/index.js';
import { listEtapasByProjeto } from '../shared/db/cronograma.js';
import { carregarDetalheCartao } from '../shared/financeiro/cartao-payload.js';
import { notificarIncorporadoraCartao } from '../shared/financeiro/cartao-notificacao.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('adminFinanceiroCartaoLiberacaoRejeitar');
  try {
    const userId = getUserId(event);
    const userName = getUserEmail(event);
    requireAdminMaster(event);
    const projetoId = event.pathParameters?.['projetoId'];
    const etapaId = event.pathParameters?.['etapaId'];
    if (projetoId === undefined || projetoId === '' || etapaId === undefined || etapaId === '') {
      return notFound(event, 'Liberação não encontrada');
    }

    const conta = await getSpeConta(projetoId);
    if (conta === null || conta.tipo !== 'SPE') return notFound(event, 'Conta não encontrada');
    const [projeto, etapas, cartao, liberacao] = await Promise.all([
      getProjeto(projetoId),
      listEtapasByProjeto(projetoId),
      getCartaoObra(projetoId),
      getCartaoLiberacao(projetoId, etapaId),
    ]);
    if (liberacao === null || liberacao.status !== 'SOLICITADA') {
      return badRequest(event, 'Não há pedido de liberação pendente nesta etapa');
    }

    const now = new Date().toISOString();
    await putCartaoLiberacao({
      ...liberacao,
      status: 'REJEITADA',
      atualizadoEm: now,
      rejeitadoPor: userId,
      rejeitadoPorNome: userName,
      rejeitadoEm: now,
    });
    await putFinanceiroAuditoria({
      projetoId,
      criadoEm: now,
      id: uuidv4(),
      acao: 'CARTAO_LIBERACAO_REJEITADA',
      userId,
      userName,
      descricao: `Liberação recusada para a etapa ${liberacao.etapaId}`,
      workspaceId: conta.workspaceId,
    });
    const etapaNome = etapas.find((etapa) => etapa.etapaId === etapaId)?.nome ?? 'a etapa solicitada';
    await notificarIncorporadoraCartao(
      projeto,
      'CARTAO_LIBERACAO_REJEITADA',
      'Liberação da etapa recusada',
      `A Atlas recusou a liberação de "${etapaNome}" em "${projeto?.nome ?? 'sua obra'}". Ajuste o pedido no cronograma.`,
    );

    log.info('Card stage release rejected', { projetoId, etapaId });
    return ok(event, await carregarDetalheCartao(conta, projeto, etapas, cartao, userId, userName));
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof ForbiddenError) return forbidden(event);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
