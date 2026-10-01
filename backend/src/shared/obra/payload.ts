import type { Projeto } from '../core/types/index.js';
import { montarCronograma, podeLancarGastos } from './resumo.js';
import type { EtapaObra, LancamentoObra } from '../core/types/index.js';

export function cronogramaPayload(
  projeto: Projeto,
  etapas: readonly EtapaObra[],
  lancamentos: readonly LancamentoObra[],
  role: 'owner' | 'admin',
) {
  const montado = montarCronograma(etapas, lancamentos);
  return {
    projeto: {
      id: projeto.id,
      nome: projeto.nome,
      status: projeto.status,
      cidade: projeto.cidade,
      estado: projeto.estado,
      ...(projeto.prazoObra !== undefined ? { prazoObra: projeto.prazoObra } : {}),
      ...(projeto.valorTotal !== undefined ? { valorTotal: projeto.valorTotal } : {}),
    },
    podeEditarEtapas: role === 'owner',
    podeLancarGastos: role === 'owner' && podeLancarGastos(projeto.status),
    resumo: montado.resumo,
    etapas: montado.etapas.map((view) => ({
      ...view.etapa,
      statusExibicao: view.statusExibicao,
      desvioDias: view.desvioDias,
      valorRealizado: view.valorRealizado,
      saldo: view.saldo,
      percentualRealizado: view.percentualRealizado,
      situacaoOrcamento: view.situacaoOrcamento,
    })),
    lancamentos: montado.lancamentos,
  };
}
