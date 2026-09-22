import type {
  CartaoObra,
  CartaoObraBloqueio,
  EtapaObra,
  LimiteCartaoEtapa,
  SpeConta,
  StatusProjeto,
} from '../core/types/index.js';

export const REGRAS_CARTAO_OBRA = {
  titularidade: 'SPE',
  pagamentoFatura: 'INTEGRAL_AUTOMATICO',
  cashbackDestino: 'SPE',
  receitaAtlas: 'COMISSAO_COMERCIAL',
  rotativo: false,
} as const;

export function montarLimitesCartao(etapas: readonly EtapaObra[]): LimiteCartaoEtapa[] {
  return [...etapas]
    .sort((a, b) => a.ordem - b.ordem)
    .map((etapa) => ({
      etapaId: etapa.etapaId,
      nome: etapa.nome,
      ordem: etapa.ordem,
      valorOrcado: etapa.valorOrcado,
      limiteProposto: etapa.valorOrcado,
    }));
}

export function limiteTotalCartao(limites: readonly LimiteCartaoEtapa[]): number {
  return limites.reduce((sum, linha) => sum + linha.limiteProposto, 0);
}

export function cronogramaDesatualizado(
  cartao: CartaoObra | null,
  limitesAtuais: readonly LimiteCartaoEtapa[],
): boolean {
  if (cartao === null || cartao.status !== 'SOLICITADO') return false;
  if (cartao.limites.length !== limitesAtuais.length) return true;
  const atuais = new Map(limitesAtuais.map((linha) => [linha.etapaId, linha.limiteProposto]));
  return cartao.limites.some((linha) => atuais.get(linha.etapaId) !== linha.limiteProposto);
}

export function bloqueiosRegistroCartao(bloqueios: readonly CartaoObraBloqueio[]): CartaoObraBloqueio[] {
  return bloqueios.filter((item) => !item.codigo.startsWith('STARK_'));
}

export function podeRegistrarSolicitacaoCartao(
  contaTipo: SpeConta['tipo'],
  statusProjeto: StatusProjeto | undefined,
  limites: readonly LimiteCartaoEtapa[],
  statusCartao: CartaoObra['status'] | undefined,
): boolean {
  return contaTipo === 'SPE'
    && statusProjeto === 'OFERTA_CRIADA'
    && limites.length > 0
    && statusCartao !== 'SOLICITADO';
}

export function bloqueiosCartaoObra(input: {
  readonly contaTipo: SpeConta['tipo'];
  readonly contaStatus: SpeConta['status'];
  readonly statusProjeto: StatusProjeto | undefined;
  readonly limites: readonly LimiteCartaoEtapa[];
  readonly starkConfigurada: boolean;
}): CartaoObraBloqueio[] {
  const items: CartaoObraBloqueio[] = [];
  if (input.contaTipo !== 'SPE') {
    items.push({ codigo: 'CONTA_NAO_SPE', mensagem: 'Cartão só existe para conta da SPE, não para tesouraria.' });
  }
  if (input.contaStatus !== 'ATIVA') {
    items.push({ codigo: 'CONTA_INATIVA', mensagem: 'A conta da SPE precisa estar ativa.' });
  }
  if (input.statusProjeto !== 'OFERTA_CRIADA') {
    items.push({ codigo: 'PROJETO_NAO_ELEGIVEL', mensagem: 'O projeto precisa estar com oferta criada.' });
  }
  if (input.limites.length === 0) {
    items.push({ codigo: 'SEM_CRONOGRAMA', mensagem: 'Cadastre etapas no cronograma para calcular o limite.' });
  }
  if (!input.starkConfigurada) {
    items.push({ codigo: 'STARK_CONTA_NAO_HABILITADA', mensagem: 'A conta Stark ainda não está habilitada.' });
  }
  items.push({
    codigo: 'STARK_ISSUING_INDISPONIVEL',
    mensagem: 'Emissão, garantia em CDI e cashback ainda não estão ligados.',
  });
  return items;
}
