import { v4 as uuidv4 } from 'uuid';
import type { CartaoLiberacao, CartaoObra, EtapaObra, Projeto, SpeConta } from '../core/types/index.js';
import { putFinanceiroAuditoria } from '../db/financeiro.js';
import { listCartaoLiberacoes, putCartaoLiberacao, putCartaoObra } from '../db/cartao.js';
import { montarCronograma } from '../obra/resumo.js';
import { isStarkConfigured } from '../starkbank/index.js';
import {
  bloqueiosCartaoObra,
  bloqueiosRegistroCartao,
  etapaVigenteCartao,
  limiteTotalCartao,
  limiteVigenteCartao,
  limitesCartaoIguais,
  montarLimitesCartao,
  objetoEtapasCartaoMudou,
  podeRegistrarSolicitacaoCartao,
  podeSolicitarLiberacaoCartao,
  REGRAS_CARTAO_OBRA,
} from './cartao.js';

export async function sincronizarPedidoCartao(input: {
  readonly cartao: CartaoObra | null;
  readonly etapas: readonly EtapaObra[];
  readonly userId: string;
  readonly userName: string;
  readonly workspaceId?: string;
}): Promise<{ cartao: CartaoObra | null; liberacoes: CartaoLiberacao[]; limiteRecalculado: boolean }> {
  const limites = montarLimitesCartao(input.etapas);
  let cartao = input.cartao;
  let liberacoes = cartao === null ? [] : await listCartaoLiberacoes(cartao.projetoId);
  if (cartao === null || cartao.status !== 'SOLICITADO' || limitesCartaoIguais(limites, cartao.limites)) {
    return { cartao, liberacoes, limiteRecalculado: false };
  }

  const now = new Date().toISOString();
  const objetoMudou = objetoEtapasCartaoMudou(limites, cartao.limites);
  cartao = { ...cartao, limites, atualizadoEm: now };
  await putCartaoObra(cartao);

  const idsAtuais = new Set(limites.map((linha) => linha.etapaId));
  const orcadoPorEtapa = new Map(limites.map((linha) => [linha.etapaId, linha.limiteProposto]));
  const proximas: CartaoLiberacao[] = [];
  let offset = 1;
  for (const liberacao of liberacoes) {
    if (!idsAtuais.has(liberacao.etapaId) && liberacao.status !== 'CANCELADA') {
      const cancelada: CartaoLiberacao = {
        ...liberacao,
        status: 'CANCELADA',
        atualizadoEm: new Date(Date.now() + offset).toISOString(),
      };
      offset += 1;
      await putCartaoLiberacao(cancelada);
      proximas.push(cancelada);
      continue;
    }
    const novoLimite = orcadoPorEtapa.get(liberacao.etapaId);
    if (
      novoLimite !== undefined
      && (liberacao.status === 'SOLICITADA' || liberacao.status === 'CONFIRMADA')
      && liberacao.limite !== novoLimite
    ) {
      const atualizada: CartaoLiberacao = { ...liberacao, limite: novoLimite, atualizadoEm: now };
      await putCartaoLiberacao(atualizada);
      proximas.push(atualizada);
      continue;
    }
    proximas.push(liberacao);
  }
  liberacoes = proximas;

  await putFinanceiroAuditoria({
    projetoId: cartao.projetoId,
    criadoEm: new Date(Date.now() + offset).toISOString(),
    id: uuidv4(),
    acao: 'CARTAO_LIMITE_ATUALIZADO',
    userId: input.userId,
    userName: input.userName,
    descricao: objetoMudou
      ? 'Pedido mantido. Limite recalculado porque etapas do cronograma mudaram.'
      : 'Pedido mantido. Limite recalculado pelos valores atualizados do cronograma.',
    ...(input.workspaceId !== undefined ? { workspaceId: input.workspaceId } : {}),
  });

  return { cartao, liberacoes, limiteRecalculado: true };
}

export async function carregarDetalheCartao(
  conta: SpeConta,
  projeto: Projeto | null,
  etapas: readonly EtapaObra[],
  cartao: CartaoObra | null,
  userId: string,
  userName: string,
) {
  const sync = await sincronizarPedidoCartao({
    cartao,
    etapas,
    userId,
    userName,
    workspaceId: conta.workspaceId,
  });
  return cartaoObraPayload(conta, projeto, etapas, sync.cartao, sync.liberacoes, sync.limiteRecalculado);
}

export function cartaoObraPayload(
  conta: SpeConta,
  projeto: Projeto | null,
  etapas: readonly EtapaObra[],
  cartao: CartaoObra | null,
  liberacoes: readonly CartaoLiberacao[],
  limiteRecalculado = false,
) {
  const limites = montarLimitesCartao(etapas);
  const montado = montarCronograma(etapas, []);
  const vigente = etapaVigenteCartao(montado.etapas);
  const status = cartao?.status ?? 'PREPARACAO';
  const bloqueios = bloqueiosCartaoObra({
    contaTipo: conta.tipo,
    contaStatus: conta.status,
    statusProjeto: projeto?.status,
    limites,
    starkConfigurada: isStarkConfigured(),
  });
  return {
    projetoId: conta.projetoId,
    projetoNome: projeto?.nome ?? conta.projetoNome ?? conta.razaoSocialSpe ?? conta.username,
    ...(projeto !== null ? { statusProjeto: projeto.status } : {}),
    contaTipo: conta.tipo,
    emissaoDisponivel: false,
    regras: REGRAS_CARTAO_OBRA,
    status,
    cartao,
    limites: montado.etapas.map((view) => ({
      etapaId: view.etapa.etapaId,
      nome: view.etapa.nome,
      ordem: view.etapa.ordem,
      valorOrcado: view.etapa.valorOrcado,
      limiteProposto: view.etapa.valorOrcado,
      statusExibicao: view.statusExibicao,
      vigente: vigente !== null && vigente.etapa.etapaId === view.etapa.etapaId,
    })),
    limiteTotal: limiteTotalCartao(limites),
    limiteVigente: limiteVigenteCartao(vigente, liberacoes),
    ...(vigente !== null ? { etapaVigenteId: vigente.etapa.etapaId, etapaVigenteNome: vigente.etapa.nome } : {}),
    ...(cartao !== null ? { limiteRegistrado: limiteTotalCartao(cartao.limites) } : {}),
    cronogramaDesatualizado: false,
    limiteRecalculado,
    podeRegistrar: podeRegistrarSolicitacaoCartao(conta.tipo, projeto?.status, limites, cartao?.status),
    podeSolicitarLiberacao: vigente !== null
      && podeSolicitarLiberacaoCartao(cartao?.status, vigente, vigente.etapa.etapaId, liberacoes),
    liberacoes,
    bloqueios,
    bloqueiosRegistro: bloqueiosRegistroCartao(bloqueios),
  };
}
