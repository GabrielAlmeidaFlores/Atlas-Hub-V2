import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, unauthorized, forbidden, serverError } from '../shared/http/response.js';
import { getUserId, AuthError, ForbiddenError, requireAdmin } from '../shared/http/auth.js';
import { createLogger } from '../shared/core/logger.js';
import { listAllProjetosByStatus } from '../shared/db/index.js';
import { listAllEtapasObra, listAllLancamentosObra } from '../shared/db/cronograma.js';
import { montarCronograma } from '../shared/obra/resumo.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('adminCronogramaListar');
  try {
    getUserId(event);
    requireAdmin(event);
    const [aprovados, publicados, etapas, lancamentos] = await Promise.all([
      listAllProjetosByStatus('APROVADO'),
      listAllProjetosByStatus('OFERTA_CRIADA'),
      listAllEtapasObra(),
      listAllLancamentosObra(),
    ]);
    const projetos = [...aprovados, ...publicados];
    const etapasByProjeto = new Map<string, typeof etapas>();
    for (const etapa of etapas) {
      const list = etapasByProjeto.get(etapa.projetoId) ?? [];
      list.push(etapa);
      etapasByProjeto.set(etapa.projetoId, list);
    }
    const lancByProjeto = new Map<string, typeof lancamentos>();
    for (const item of lancamentos) {
      const list = lancByProjeto.get(item.projetoId) ?? [];
      list.push(item);
      lancByProjeto.set(item.projetoId, list);
    }
    const items = projetos.map((projeto) => {
      const montado = montarCronograma(etapasByProjeto.get(projeto.id) ?? [], lancByProjeto.get(projeto.id) ?? []);
      return {
        projetoId: projeto.id,
        nome: projeto.nome,
        cidade: projeto.cidade,
        estado: projeto.estado,
        status: projeto.status,
        etapas: montado.etapas.length,
        ...montado.resumo,
      };
    });
    items.sort((a, b) => {
      const rank = (item: (typeof items)[number]): number => {
        let score = item.etapasAtrasadas;
        if (item.situacaoOrcamento === 'ESTOURO') score += 20;
        return score;
      };
      const diff = rank(b) - rank(a);
      if (diff !== 0) return diff;
      return a.nome.localeCompare(b.nome);
    });
    log.info('Cronograma admin listed', { count: items.length });
    return ok(event, { items });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized(event);
    if (err instanceof ForbiddenError) return forbidden(event);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
