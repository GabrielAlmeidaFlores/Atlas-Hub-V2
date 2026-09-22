import { v4 as uuidv4 } from 'uuid';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { created, unauthorized, forbidden, notFound, badRequest, serverError } from '../shared/http/response.js';
import { getUserId, getUserEmail, AuthError, ForbiddenError, requireAdminMaster } from '../shared/http/auth.js';
import { validate, solicitarCartaoObraSchema, ValidationError } from '../shared/http/validators.js';
import { createLogger } from '../shared/core/logger.js';
import { getSpeConta, putFinanceiroAuditoria } from '../shared/db/financeiro.js';
import { getCartaoObra, putCartaoObra } from '../shared/db/cartao.js';
import { getProjeto } from '../shared/db/index.js';
import { listEtapasByProjeto } from '../shared/db/cronograma.js';
import { cartaoObraPayload } from '../shared/financeiro/cartao-payload.js';
import { montarLimitesCartao, podeRegistrarSolicitacaoCartao, REGRAS_CARTAO_OBRA } from '../shared/financeiro/cartao.js';
import type { CartaoObra } from '../shared/core/types/index.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('adminFinanceiroCartaoSolicitar');
  try {
    const userId = getUserId(event);
    const userName = getUserEmail(event);
    requireAdminMaster(event);

    const projetoId = event.pathParameters?.['projetoId'];
    if (projetoId === undefined || projetoId === '') return notFound(event, 'Conta não encontrada');
    const confirmacoes = validate(solicitarCartaoObraSchema, JSON.parse(event.body ?? '{}') as unknown);

    const conta = await getSpeConta(projetoId);
    if (conta === null) return notFound(event, 'Conta não encontrada');
    if (conta.tipo !== 'SPE') return badRequest(event, 'Cartão disponível apenas para conta da SPE');

    const [projeto, etapas, existente] = await Promise.all([
      getProjeto(projetoId),
      listEtapasByProjeto(projetoId),
      getCartaoObra(projetoId),
    ]);

    const limites = montarLimitesCartao(etapas);
    if (!podeRegistrarSolicitacaoCartao(conta.tipo, projeto?.status, limites, existente?.status)) {
      return badRequest(event, 'Não é possível registrar a solicitação deste cartão agora');
    }

    const now = new Date().toISOString();
    const cartao: CartaoObra = {
      projetoId: conta.projetoId,
      status: 'SOLICITADO',
      titularidade: REGRAS_CARTAO_OBRA.titularidade,
      pagamentoFatura: REGRAS_CARTAO_OBRA.pagamentoFatura,
      cashbackDestino: REGRAS_CARTAO_OBRA.cashbackDestino,
      receitaAtlas: REGRAS_CARTAO_OBRA.receitaAtlas,
      limites,
      confirmacoes,
      criadoEm: existente?.criadoEm ?? now,
      atualizadoEm: now,
      solicitadoPor: userId,
      solicitadoPorNome: userName,
      solicitadoEm: now,
    };
    await putCartaoObra(cartao);
    await putFinanceiroAuditoria({
      projetoId: conta.projetoId,
      criadoEm: now,
      id: uuidv4(),
      acao: 'CARTAO_SOLICITADO',
      userId,
      userName,
      descricao: `Solicitação interna de cartão com ${String(limites.length)} etapa(s)`,
      workspaceId: conta.workspaceId,
    });

    log.info('Card request recorded', { projetoId, etapas: limites.length });
    return created(event, cartaoObraPayload(conta, projeto, etapas, cartao));
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof ForbiddenError) return forbidden(event);
    if (err instanceof ValidationError) return badRequest(event, err.message);
    if (err instanceof SyntaxError) return badRequest(event, 'JSON inválido');
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
