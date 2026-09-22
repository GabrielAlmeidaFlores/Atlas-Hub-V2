import { v4 as uuidv4 } from 'uuid';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { created, unauthorized, forbidden, notFound, badRequest, serverError } from '../shared/http/response.js';
import { getUserId, getUserEmail, AuthError, ForbiddenError } from '../shared/http/auth.js';
import { validate, solicitarLiberacaoCartaoSchema, ValidationError } from '../shared/http/validators.js';
import { createLogger } from '../shared/core/logger.js';
import { CronogramaNotFoundError, loadProjetoCronograma } from '../shared/obra/access.js';
import { getSpeConta, putFinanceiroAuditoria } from '../shared/db/financeiro.js';
import { getCartaoObra, listCartaoLiberacoes, putCartaoLiberacao } from '../shared/db/cartao.js';
import { listEtapasByProjeto } from '../shared/db/cronograma.js';
import { carregarDetalheCartao } from '../shared/financeiro/cartao-payload.js';
import { etapaVigenteCartao, montarLimitesCartao, podeSolicitarLiberacaoCartao } from '../shared/financeiro/cartao.js';
import { montarCronograma } from '../shared/obra/resumo.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('cronogramaCartaoLiberacaoSolicitar');
  try {
    const userId = getUserId(event);
    const userName = getUserEmail(event);
    const projetoId = event.pathParameters?.['id'];
    if (projetoId === undefined || projetoId === '') return notFound(event, 'Projeto não encontrado');
    const body = validate(solicitarLiberacaoCartaoSchema, JSON.parse(event.body ?? '{}') as unknown);
    const projeto = await loadProjetoCronograma(event, projetoId, 'owner');

    const conta = await getSpeConta(projetoId);
    if (conta === null || conta.tipo !== 'SPE') return notFound(event, 'Conta da SPE ainda não foi aberta');

    const [etapas, cartao] = await Promise.all([
      listEtapasByProjeto(projetoId),
      getCartaoObra(projetoId),
    ]);
    if (cartao === null || cartao.status !== 'SOLICITADO') {
      return badRequest(event, 'O cartão desta obra ainda não foi habilitado pela Atlas');
    }

    const vigente = etapaVigenteCartao(montarCronograma(etapas, []).etapas);
    const liberacoes = await listCartaoLiberacoes(projetoId);
    if (!podeSolicitarLiberacaoCartao(cartao.status, vigente, body.etapaId, liberacoes)) {
      return badRequest(event, 'Só é possível solicitar a liberação da etapa em andamento');
    }

    const limites = montarLimitesCartao(etapas);
    const linha = limites.find((item) => item.etapaId === body.etapaId);
    if (linha === undefined) return notFound(event, 'Etapa não encontrada');

    const now = new Date().toISOString();
    await putCartaoLiberacao({
      projetoId,
      etapaId: body.etapaId,
      status: 'SOLICITADA',
      limite: linha.limiteProposto,
      solicitadoPor: userId,
      solicitadoPorNome: userName,
      solicitadoEm: now,
      atualizadoEm: now,
    });
    await putFinanceiroAuditoria({
      projetoId,
      criadoEm: now,
      id: uuidv4(),
      acao: 'CARTAO_LIBERACAO_SOLICITADA',
      userId,
      userName,
      descricao: `Liberação solicitada para a etapa ${linha.nome} (${linha.limiteProposto.toLocaleString('pt-BR')})`,
      workspaceId: conta.workspaceId,
    });

    log.info('Card stage release requested', { projetoId, etapaId: body.etapaId });
    const detalhe = await carregarDetalheCartao(conta, projeto, etapas, cartao, userId, userName);
    return created(event, detalhe);
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof CronogramaNotFoundError) return notFound(event, err.message);
    if (err instanceof ForbiddenError) return forbidden(event);
    if (err instanceof ValidationError) return badRequest(event, err.message);
    if (err instanceof SyntaxError) return badRequest(event, 'JSON inválido');
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
