import type { APIGatewayProxyEvent } from 'aws-lambda';
import { getUserId, getUserPerfil, ForbiddenError } from '../http/auth.js';
import { getProjeto } from '../db/index.js';
import type { Projeto } from '../core/types/index.js';

export class CronogramaNotFoundError extends Error {
  constructor() {
    super('Projeto não encontrado');
    this.name = 'CronogramaNotFoundError';
  }
}

export async function loadProjetoCronograma(
  event: APIGatewayProxyEvent,
  projetoId: string,
  mode: 'owner' | 'admin',
): Promise<Projeto> {
  const userId = getUserId(event);
  const perfil = getUserPerfil(event);
  const projeto = await getProjeto(projetoId);
  if (projeto === null) {
    throw new CronogramaNotFoundError();
  }
  if (mode === 'admin') {
    if (perfil !== 'ANALISTA' && perfil !== 'ADMIN_MASTER') {
      throw new ForbiddenError('Acesso negado');
    }
    return projeto;
  }
  if (perfil !== 'INCORPORADORA' || projeto.incorporadoraId !== userId) {
    throw new ForbiddenError('Acesso negado');
  }
  return projeto;
}
