import {
  desvioDias,
  montarCronograma,
  podeLancarGastos,
  situacaoOrcamento,
  statusEtapaExibicao,
} from '../src/shared/obra/resumo.js';
import {
  atualizarLancamentoObraSchema,
  criarEtapaObraSchema,
  criarLancamentoObraSchema,
  validate,
} from '../src/shared/http/validators.js';
import type { EtapaObra, LancamentoObra } from '../src/shared/core/types/index.js';

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
  ordem: 1,
  inicioPrevisto: '2026-10-01',
  fimPrevisto: '2026-10-20',
  inicioReal: '2026-10-03',
  percentualExecucao: 75,
  valorOrcado: 50_000,
  criadoEm: '2026-09-01T10:00:00.000Z',
  atualizadoEm: '2026-09-10T10:00:00.000Z',
};
const estrutura: EtapaObra = {
  projetoId: 'proj-3',
  etapaId: 'etapa-estrutura',
  nome: 'Estrutura',
  ordem: 2,
  inicioPrevisto: '2026-10-21',
  fimPrevisto: '2026-11-30',
  percentualExecucao: 10,
  valorOrcado: 80_000,
  criadoEm: '2026-09-01T10:00:00.000Z',
  atualizadoEm: '2026-09-10T10:00:00.000Z',
};
const lancamentos: LancamentoObra[] = [
  {
    projetoId: 'proj-3',
    lancamentoId: 'lanc-1',
    etapaId: 'etapa-fund',
    descricao: 'Concreto usinado',
    valor: 49_000,
    dataLancamento: '2026-10-08',
    status: 'CONFIRMADO',
    criadoPor: 'user-inc-1',
    criadoEm: '2026-10-08T12:00:00.000Z',
    atualizadoEm: '2026-10-08T12:00:00.000Z',
  },
  {
    projetoId: 'proj-3',
    lancamentoId: 'lanc-2',
    etapaId: 'etapa-estrutura',
    descricao: 'Mão de obra da forma',
    valor: 92_000,
    dataLancamento: '2026-10-22',
    status: 'CONFIRMADO',
    criadoPor: 'user-inc-1',
    criadoEm: '2026-10-22T12:00:00.000Z',
    atualizadoEm: '2026-10-22T12:00:00.000Z',
  },
];

eq('gastos após aprovação', podeLancarGastos('APROVADO'), true);
eq('gastos após oferta', podeLancarGastos('OFERTA_CRIADA'), true);
eq('gastos bloqueados em rascunho', podeLancarGastos('RASCUNHO'), false);
eq('fundação 50 vs 49 = dentro', situacaoOrcamento(50_000, 49_000), 'DENTRO');
eq('estrutura 80 vs 92 = estouro', situacaoOrcamento(80_000, 92_000), 'ESTOURO');
eq('sem gasto', situacaoOrcamento(50_000, 0), 'SEM_LANCAMENTO');
eq('status em andamento', statusEtapaExibicao(fundacao, '2026-09-18'), 'EM_ANDAMENTO');
eq('status planejada', statusEtapaExibicao({ ...estrutura, percentualExecucao: 0 }, '2026-09-18'), 'PLANEJADA');
eq('desvio no prazo', desvioDias('2026-10-20', '2026-10-20', '2026-10-21', true), 0);

const montado = montarCronograma([fundacao, estrutura], lancamentos, '2026-09-18');
eq('exemplo pedido: fundação orçado 50000', montado.etapas[0]?.etapa.valorOrcado, 50_000);
eq('exemplo pedido: fundação realizado 49000', montado.etapas[0]?.valorRealizado, 49_000);
eq('exemplo pedido: fundação saldo 1000', montado.etapas[0]?.saldo, 1_000);
eq('estrutura realizado 92000', montado.etapas[1]?.valorRealizado, 92_000);
eq('estrutura saldo -12000', montado.etapas[1]?.saldo, -12_000);
eq('total orçado 130000', montado.resumo.valorOrcado, 130_000);
eq('total realizado 141000', montado.resumo.valorRealizado, 141_000);
eq('obra em estouro no consolidado', montado.resumo.situacaoOrcamento, 'ESTOURO');
eq('avanço físico médio 43%', montado.resumo.percentualAvanco, 43);

try {
  validate(criarEtapaObraSchema, {
    nome: 'Fundação', inicioPrevisto: '2026-10-01', fimPrevisto: '2026-10-20', valorOrcado: 50_000,
  });
  check('etapa válida', true);
} catch (err) {
  check('etapa válida', false, err instanceof Error ? err.message : '');
}
try {
  validate(criarLancamentoObraSchema, { descricao: 'Concreto', valor: 49000, dataLancamento: '2026-10-08' });
  check('gasto sem etapa rejeitado', false);
} catch {
  check('gasto sem etapa rejeitado', true);
}
try {
  validate(criarLancamentoObraSchema, {
    etapaId: 'etapa-fund', descricao: 'Concreto', valor: 49000, dataLancamento: '2026-10-08',
  });
  check('gasto com etapa aceito', true);
} catch (err) {
  check('gasto com etapa aceito', false, err instanceof Error ? err.message : '');
}
try {
  validate(atualizarLancamentoObraSchema, { status: 'CANCELADO' });
  check('cancelar gasto', true);
} catch (err) {
  check('cancelar gasto', false, err instanceof Error ? err.message : '');
}

const failed = cases.filter((c) => !c.ok);
process.stdout.write(`\nBE ${String(cases.length - failed.length)}/${String(cases.length)}\n`);
process.stdout.write(`JSON_BE ${JSON.stringify(cases)}\n`);
if (failed.length > 0) process.exitCode = 1;
