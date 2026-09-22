import type { CartaoObra, EtapaObra, Projeto, SpeConta } from '../core/types/index.js';
import { isStarkConfigured } from '../starkbank/index.js';
import {
  bloqueiosCartaoObra,
  bloqueiosRegistroCartao,
  cronogramaDesatualizado,
  limiteTotalCartao,
  montarLimitesCartao,
  podeRegistrarSolicitacaoCartao,
  REGRAS_CARTAO_OBRA,
} from './cartao.js';

export function cartaoObraPayload(
  conta: SpeConta,
  projeto: Projeto | null,
  etapas: readonly EtapaObra[],
  cartao: CartaoObra | null,
) {
  const limites = montarLimitesCartao(etapas);
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
    limites,
    limiteTotal: limiteTotalCartao(limites),
    ...(cartao !== null ? { limiteRegistrado: limiteTotalCartao(cartao.limites) } : {}),
    cronogramaDesatualizado: cronogramaDesatualizado(cartao, limites),
    podeRegistrar: podeRegistrarSolicitacaoCartao(conta.tipo, projeto?.status, limites, cartao?.status),
    bloqueios,
    bloqueiosRegistro: bloqueiosRegistroCartao(bloqueios),
  };
}
