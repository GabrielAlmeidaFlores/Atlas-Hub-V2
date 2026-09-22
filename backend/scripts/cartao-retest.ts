import {
  bloqueiosCartaoObra,
  bloqueiosRegistroCartao,
  cronogramaDesatualizado,
  etapaVigenteCartao,
  limiteTotalCartao,
  limiteVigenteCartao,
  montarLimitesCartao,
  objetoEtapasCartaoMudou,
  podeLiberarStatusEtapa,
  podeRegistrarSolicitacaoCartao,
  podeSolicitarLiberacaoCartao,
} from '../src/shared/financeiro/cartao.js';
import { montarCronograma } from '../src/shared/obra/resumo.js';
import { solicitarCartaoObraSchema, validate, ValidationError } from '../src/shared/http/validators.js';
import type { CartaoLiberacao, CartaoObra, EtapaObra } from '../src/shared/core/types/index.js';

const cases: Array<{ name: string; ok: boolean; detail: string }> = [];
function check(name: string, ok: boolean, detail = ''): void {
  cases.push({ name, ok, detail });
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail !== '' ? ` — ${detail}` : ''}\n`);
}
function eq<T>(name: string, actual: T, expected: T): void {
  check(name, JSON.stringify(actual) === JSON.stringify(expected), String(actual));
}

const fundacao: EtapaObra = {
  projetoId: 'proj-3',
  etapaId: 'etapa-fund',
  nome: 'Fundação',
  ordem: 2,
  inicioPrevisto: '2026-10-01',
  fimPrevisto: '2026-10-20',
  percentualExecucao: 0,
  valorOrcado: 50_000,
  criadoEm: '2026-09-01T10:00:00.000Z',
  atualizadoEm: '2026-09-10T10:00:00.000Z',
};
const estrutura: EtapaObra = {
  projetoId: 'proj-3',
  etapaId: 'etapa-estrutura',
  nome: 'Estrutura',
  ordem: 1,
  inicioPrevisto: '2026-10-21',
  fimPrevisto: '2026-11-30',
  percentualExecucao: 40,
  inicioReal: '2026-10-22',
  valorOrcado: 80_000,
  criadoEm: '2026-09-01T10:00:00.000Z',
  atualizadoEm: '2026-09-10T10:00:00.000Z',
};

const limites = montarLimitesCartao([fundacao, estrutura]);
eq('limites ordenados pela ordem da etapa', limites.map((l) => l.etapaId), ['etapa-estrutura', 'etapa-fund']);
eq('limite proposto = orçado', limites[0]?.limiteProposto, 80_000);
eq('total do cartão', limiteTotalCartao(limites), 130_000);

check('pode registrar com SPE, oferta e etapas', podeRegistrarSolicitacaoCartao('SPE', 'OFERTA_CRIADA', limites, undefined), '');
check('não registra tesouraria', !podeRegistrarSolicitacaoCartao('TESOURARIA', 'OFERTA_CRIADA', limites, undefined), '');
check('não registra sem oferta', !podeRegistrarSolicitacaoCartao('SPE', 'APROVADO', limites, undefined), '');
check('não registra sem etapas', !podeRegistrarSolicitacaoCartao('SPE', 'OFERTA_CRIADA', [], undefined), '');
check('não registra de novo', !podeRegistrarSolicitacaoCartao('SPE', 'OFERTA_CRIADA', limites, 'SOLICITADO'), '');

const bloqueios = bloqueiosCartaoObra({
  contaTipo: 'SPE',
  contaStatus: 'ATIVA',
  statusProjeto: 'OFERTA_CRIADA',
  limites,
  starkConfigurada: false,
});
eq('bloqueios Stark sempre presentes', bloqueios.map((b) => b.codigo).filter((c) => c.startsWith('STARK_')), [
  'STARK_CONTA_NAO_HABILITADA',
  'STARK_ISSUING_INDISPONIVEL',
]);
eq('bloqueios de registro Atlas vazios quando elegível', bloqueiosRegistroCartao(bloqueios).map((b) => b.codigo), []);
check('SPE conta própria aparece como pendência', bloqueios.some((b) => b.codigo === 'SPE_CONTA_PROPRIA_PENDENTE'), '');

const cartao: CartaoObra = {
  projetoId: 'proj-3',
  status: 'SOLICITADO',
  titularidade: 'SPE',
  pagamentoFatura: 'INTEGRAL_AUTOMATICO',
  cashbackDestino: 'SPE',
  receitaAtlas: 'PERCENTUAL_CAPTACAO',
  limites,
  criadoEm: '2026-09-01T10:00:00.000Z',
  atualizadoEm: '2026-09-01T10:00:00.000Z',
};
check('cronograma igual não marca desatualizado', !cronogramaDesatualizado(cartao, limites), '');
check(
  'mudança de valor marca desatualizado',
  cronogramaDesatualizado(cartao, limites.map((l) => ({ ...l, limiteProposto: l.limiteProposto + 1 }))),
  '',
);
check('mudança de valor não muda o objeto das etapas', !objetoEtapasCartaoMudou(limites.map((l) => ({ ...l, limiteProposto: l.limiteProposto + 1 })), limites), '');
const primeira = limites[0];
check(
  'etapa nova muda o objeto do pedido',
  primeira !== undefined && objetoEtapasCartaoMudou([...limites, { ...primeira, etapaId: 'nova' }], limites),
  '',
);

const views = montarCronograma([fundacao, estrutura], []).etapas;
const vigente = etapaVigenteCartao(views);
eq('etapa vigente é a em andamento', vigente?.etapa.etapaId, 'etapa-estrutura');
check('não libera etapa planejada', !podeSolicitarLiberacaoCartao('SOLICITADO', vigente, 'etapa-fund', []), '');
check('libera etapa vigente sem pedido', podeSolicitarLiberacaoCartao('SOLICITADO', vigente, 'etapa-estrutura', []), '');
check('status em andamento pode liberar', vigente !== null && podeLiberarStatusEtapa(vigente.statusExibicao), '');

const confirmada: CartaoLiberacao = {
  projetoId: 'proj-3',
  etapaId: 'etapa-estrutura',
  status: 'CONFIRMADA',
  limite: 80_000,
  solicitadoPor: 'inc',
  solicitadoPorNome: 'Inc',
  solicitadoEm: '2026-09-01T10:00:00.000Z',
  atualizadoEm: '2026-09-01T10:00:00.000Z',
};
eq('teto vigente é só a etapa confirmada', limiteVigenteCartao(vigente, [confirmada]), 80_000);
check('não pede de novo se já confirmada', !podeSolicitarLiberacaoCartao('SOLICITADO', vigente, 'etapa-estrutura', [confirmada]), '');
check(
  'repede se recusada',
  podeSolicitarLiberacaoCartao('SOLICITADO', vigente, 'etapa-estrutura', [{ ...confirmada, status: 'REJEITADA' }]),
  '',
);

try {
  validate(solicitarCartaoObraSchema, {});
  check('checklist vazio falha', false, 'aceitou vazio');
} catch (err) {
  check('checklist vazio falha', err instanceof ValidationError, '');
}

const okBody = { titularSpe: true, faturaIntegral: true, semRotativo: true, cashbackNaSpe: true };
eq('checklist completo passa', validate(solicitarCartaoObraSchema, okBody), okBody);

const failed = cases.filter((c) => !c.ok).length;
process.stdout.write(`\n${String(cases.length - failed)}/${String(cases.length)} ok\n`);
if (failed > 0) process.exit(1);
