import {
  bloqueiosCartaoObra,
  bloqueiosRegistroCartao,
  cronogramaDesatualizado,
  limiteTotalCartao,
  montarLimitesCartao,
  podeRegistrarSolicitacaoCartao,
} from '../src/shared/financeiro/cartao.js';
import { solicitarCartaoObraSchema, validate, ValidationError } from '../src/shared/http/validators.js';
import type { CartaoObra, EtapaObra } from '../src/shared/core/types/index.js';

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
  percentualExecucao: 0,
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

const cartao: CartaoObra = {
  projetoId: 'proj-3',
  status: 'SOLICITADO',
  titularidade: 'SPE',
  pagamentoFatura: 'INTEGRAL_AUTOMATICO',
  cashbackDestino: 'SPE',
  receitaAtlas: 'COMISSAO_COMERCIAL',
  limites,
  criadoEm: '2026-09-01T10:00:00.000Z',
  atualizadoEm: '2026-09-01T10:00:00.000Z',
};
check('cronograma igual não marca desatualizado', !cronogramaDesatualizado(cartao, limites), '');
check(
  'cronograma mudou marca desatualizado',
  cronogramaDesatualizado(cartao, limites.map((l) => ({ ...l, limiteProposto: l.limiteProposto + 1 }))),
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
