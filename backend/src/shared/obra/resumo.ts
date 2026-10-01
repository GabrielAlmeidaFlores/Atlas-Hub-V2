import type {
  EtapaObra,
  LancamentoObra,
  SituacaoOrcamento,
  StatusEtapaObra,
  StatusProjeto,
} from '../core/types/index.js';

export function hojeYmd(): string {
  return new Date().toISOString().slice(0, 10);
}

export function podeLancarGastos(status: StatusProjeto): boolean {
  return status === 'APROVADO' || status === 'OFERTA_CRIADA';
}

function ymdUtc(ymd: string): number {
  const [y, m, d] = ymd.split('-').map((part) => Number(part));
  return Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function desvioDias(fimPrevisto: string, fimReal: string | undefined, hoje: string, concluida: boolean): number {
  if (fimReal !== undefined) {
    return Math.round((ymdUtc(fimReal) - ymdUtc(fimPrevisto)) / 86_400_000);
  }
  if (!concluida && fimPrevisto < hoje) {
    return Math.round((ymdUtc(hoje) - ymdUtc(fimPrevisto)) / 86_400_000);
  }
  return 0;
}

export function statusEtapaExibicao(etapa: EtapaObra, hoje: string): StatusEtapaObra {
  if (etapa.percentualExecucao >= 100 || etapa.fimReal !== undefined) return 'CONCLUIDA';
  if (etapa.fimPrevisto < hoje) return 'ATRASADA';
  if (etapa.inicioReal !== undefined || etapa.percentualExecucao > 0) return 'EM_ANDAMENTO';
  return 'PLANEJADA';
}

export function situacaoOrcamento(orcado: number, realizado: number): SituacaoOrcamento {
  if (realizado <= 0) return 'SEM_LANCAMENTO';
  if (realizado > orcado) return 'ESTOURO';
  return 'DENTRO';
}

export interface EtapaCronogramaView {
  readonly etapa: EtapaObra;
  readonly statusExibicao: StatusEtapaObra;
  readonly desvioDias: number;
  readonly valorRealizado: number;
  readonly saldo: number;
  readonly percentualRealizado: number;
  readonly situacaoOrcamento: SituacaoOrcamento;
}

export interface CronogramaResumo {
  readonly etapasAtrasadas: number;
  readonly etapasConcluidas: number;
  readonly percentualAvanco: number;
  readonly valorOrcado: number;
  readonly valorRealizado: number;
  readonly saldo: number;
  readonly percentualRealizado: number;
  readonly situacaoOrcamento: SituacaoOrcamento;
}

export interface CronogramaMontado {
  readonly resumo: CronogramaResumo;
  readonly etapas: EtapaCronogramaView[];
  readonly lancamentos: LancamentoObra[];
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function montarCronograma(etapas: readonly EtapaObra[], lancamentos: readonly LancamentoObra[], hoje = hojeYmd()): CronogramaMontado {
  const ativos = lancamentos.filter((item) => item.status === 'CONFIRMADO');
  const realizadoPorEtapa = new Map<string, number>();
  for (const item of ativos) {
    realizadoPorEtapa.set(item.etapaId, (realizadoPorEtapa.get(item.etapaId) ?? 0) + item.valor);
  }

  const ordered = [...etapas].sort((a, b) => a.ordem - b.ordem || a.inicioPrevisto.localeCompare(b.inicioPrevisto));
  const views: EtapaCronogramaView[] = ordered.map((etapa) => {
    const statusExibicao = statusEtapaExibicao(etapa, hoje);
    const valorRealizado = round2(realizadoPorEtapa.get(etapa.etapaId) ?? 0);
    return {
      etapa,
      statusExibicao,
      desvioDias: desvioDias(etapa.fimPrevisto, etapa.fimReal, hoje, statusExibicao === 'CONCLUIDA'),
      valorRealizado,
      saldo: round2(etapa.valorOrcado - valorRealizado),
      percentualRealizado: etapa.valorOrcado > 0 ? Math.round((valorRealizado / etapa.valorOrcado) * 1000) / 10 : 0,
      situacaoOrcamento: situacaoOrcamento(etapa.valorOrcado, valorRealizado),
    };
  });

  const valorOrcado = round2(ordered.reduce((sum, etapa) => sum + etapa.valorOrcado, 0));
  const valorRealizado = round2(ativos.reduce((sum, item) => sum + item.valor, 0));
  const percentualAvanco = ordered.length === 0
    ? 0
    : Math.round(ordered.reduce((sum, etapa) => sum + etapa.percentualExecucao, 0) / ordered.length);

  return {
    resumo: {
      etapasAtrasadas: views.filter((view) => view.statusExibicao === 'ATRASADA').length,
      etapasConcluidas: views.filter((view) => view.statusExibicao === 'CONCLUIDA').length,
      percentualAvanco,
      valorOrcado,
      valorRealizado,
      saldo: round2(valorOrcado - valorRealizado),
      percentualRealizado: valorOrcado > 0 ? Math.round((valorRealizado / valorOrcado) * 1000) / 10 : 0,
      situacaoOrcamento: situacaoOrcamento(valorOrcado, valorRealizado),
    },
    etapas: views,
    lancamentos: [...lancamentos].sort((a, b) => b.dataLancamento.localeCompare(a.dataLancamento) || b.criadoEm.localeCompare(a.criadoEm)),
  };
}
