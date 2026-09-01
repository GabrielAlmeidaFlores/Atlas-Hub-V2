import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, serverError } from '../shared/http/response.js';
import { listProjetosPublicados } from '../shared/db/index.js';
import { createLogger } from '../shared/core/logger.js';
import type { Projeto } from '../shared/core/types/domain.js';
import { extractKeyFromLocation, generatePresignedGetUrl } from '../shared/storage/index.js';

function publishedAt(projeto: Projeto): string {
  return projeto.ofertaConfirmadaEm ?? projeto.aprovadoEm ?? projeto.atualizadoEm ?? projeto.criadoEm;
}

async function resolveImagemUrl(location: string | undefined): Promise<string | null> {
  if (location === undefined || location === '') return null;
  if (location.startsWith('/')) return location;
  const key = extractKeyFromLocation(location);
  if (key === null) {
    return location.startsWith('http') ? location : null;
  }
  return generatePresignedGetUrl(key, 3600);
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('publicoProjetosListar');
  try {
    const rawLimit = Number(event.queryStringParameters?.['limit'] ?? '5');
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.trunc(rawLimit), 1), 12) : 5;
    const rawOffset = Number(event.queryStringParameters?.['offset'] ?? '0');
    const offset = Number.isFinite(rawOffset) ? Math.max(Math.trunc(rawOffset), 0) : 0;
    const { items: projetos, total } = await listProjetosPublicados(limit, offset);
    const items = await Promise.all(
      projetos.map(async (p) => ({
        id: p.id,
        nome: p.nome,
        cidade: p.cidade,
        estado: p.estado,
        valorCaptar: p.valorCaptar ?? null,
        rentabilidadeEstimada: p.rentabilidadeEstimada ?? null,
        status: p.status,
        statusLabel: 'Oferta Publicada',
        ofertaLink: p.ofertaLink ?? null,
        imagemUrl: await resolveImagemUrl(p.fotosUrls?.[0]),
        publicadoEm: publishedAt(p),
      })),
    );
    log.info('Public projects listed', { count: items.length, total, offset });
    return ok(event, { items, total, limit, offset });
  } catch (err) {
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
