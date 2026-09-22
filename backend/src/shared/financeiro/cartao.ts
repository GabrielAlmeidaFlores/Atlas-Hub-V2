import type {
  CartaoLiberacao,
  CartaoObra,
  CartaoObraBloqueio,
  EtapaObra,
  LimiteCartaoEtapa,
  SpeConta,
  StatusEtapaObra,
  StatusProjeto,
} from '../core/types/index.js';
import type { EtapaCronogramaView } from '../obra/resumo.js';

export const REGRAS_CARTAO_OBRA = {
  titularidade: 'SPE',
  contaTitular: 'CNPJ_SPE',
  pagamentoFatura: 'INTEGRAL_AUTOMATICO',
  cashbackDestino: 'SPE',
  receitaAtlas: 'PERCENTUAL_CAPTACAO',
  cashbackNaoCompoeComissao: true,
  rotativo: false,
  liberacao: 'ETAPA_VIGENTE',
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

export function limitesCartaoIguais(
  atuais: readonly LimiteCartaoEtapa[],
  registrados: readonly LimiteCartaoEtapa[],
): boolean {
  if (atuais.length !== registrados.length) return false;
  const mapa = new Map(registrados.map((linha) => [`${linha.etapaId}:${linha.limiteProposto}`, true]));
  return atuais.every((linha) => mapa.has(`${linha.etapaId}:${linha.limiteProposto}`));
}

export function objetoEtapasCartaoMudou(
  atuais: readonly LimiteCartaoEtapa[],
  registrados: readonly LimiteCartaoEtapa[],
): boolean {
  if (atuais.length !== registrados.length) return true;
  const ids = new Set(registrados.map((linha) => linha.etapaId));
  return atuais.some((linha) => !ids.has(linha.etapaId));
}

export function cronogramaDesatualizado(
  cartao: CartaoObra | null,
  limitesAtuais: readonly LimiteCartaoEtapa[],
): boolean {
  if (cartao === null || cartao.status !== 'SOLICITADO') return false;
  return !limitesCartaoIguais(limitesAtuais, cartao.limites);
}

export function etapaVigenteCartao(views: readonly EtapaCronogramaView[]): EtapaCronogramaView | null {
  return views.find((view) => podeLiberarStatusEtapa(view.statusExibicao)) ?? null;
}

export function podeLiberarStatusEtapa(status: StatusEtapaObra): boolean {
  return status === 'EM_ANDAMENTO' || status === 'ATRASADA';
}

export function limiteVigenteCartao(
  vigente: EtapaCronogramaView | null,
  liberacoes: readonly CartaoLiberacao[],
): number {
  if (vigente === null) return 0;
  const liberacao = liberacoes.find((item) => item.etapaId === vigente.etapa.etapaId && item.status === 'CONFIRMADA');
  return liberacao?.limite ?? 0;
}

export function podeSolicitarLiberacaoCartao(
  statusCartao: CartaoObra['status'] | undefined,
  vigente: EtapaCronogramaView | null,
  etapaId: string,
  liberacoes: readonly CartaoLiberacao[],
): boolean {
  if (statusCartao !== 'SOLICITADO') return false;
  if (vigente === null || vigente.etapa.etapaId !== etapaId) return false;
  const atual = liberacoes.find((item) => item.etapaId === etapaId);
  return atual === undefined || atual.status === 'REJEITADA';
}

export function bloqueiosRegistroCartao(bloqueios: readonly CartaoObraBloqueio[]): CartaoObraBloqueio[] {
  return bloqueios.filter((item) => !item.codigo.startsWith('STARK_') && item.codigo !== 'SPE_CONTA_PROPRIA_PENDENTE');
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
  items.push({
    codigo: 'SPE_CONTA_PROPRIA_PENDENTE',
    mensagem: 'A SPE precisa de conta própria no CNPJ dela. Workspace Atlas não serve para o cartão.',
  });
  if (!input.starkConfigurada) {
    items.push({ codigo: 'STARK_CONTA_NAO_HABILITADA', mensagem: 'A conta Stark ainda não está habilitada.' });
  }
  items.push({
    codigo: 'STARK_ISSUING_INDISPONIVEL',
    mensagem: 'Emissão, garantia em CDI e cashback ainda não estão ligados.',
  });
  return items;
}
