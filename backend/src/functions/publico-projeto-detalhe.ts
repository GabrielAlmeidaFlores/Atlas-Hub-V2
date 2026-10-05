import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, notFound, serverError } from '../shared/http/response.js';
import { getProjeto } from '../shared/db/index.js';
import { createLogger } from '../shared/core/logger.js';
import { extractKeyFromLocation, generatePresignedGetUrl } from '../shared/storage/index.js';
import type { Projeto } from '../shared/core/types/domain.js';

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
  const log = createLogger('publicoProjetoDetalhe');
  try {
    const id = event.pathParameters?.['id'];
    if (id === undefined || id === '') return notFound(event, 'Projeto não encontrado');

    const projeto = await getProjeto(id);
    if (projeto === null || projeto.status !== 'OFERTA_CRIADA') {
      return notFound(event, 'Projeto não encontrado');
    }

    const fotos = await Promise.all((projeto.fotosUrls ?? []).map(resolveImagemUrl));

    log.info('Public project detail fetched', { projetoId: id });
    return ok(event, {
      id: projeto.id,
      nome: projeto.nome,
      modelo: projeto.modelo,
      tipoImovel: projeto.tipoImovel,
      tipoOferta: projeto.tipoOferta ?? null,
      cidade: projeto.cidade,
      estado: projeto.estado,
      endereco: projeto.endereco,
      descricao: projeto.descricao,
      fotos: fotos.filter((url): url is string => url !== null),
      videoUrl: projeto.videoUrl ?? null,
      valorTotal: projeto.valorTotal ?? null,
      valorCaptar: projeto.valorCaptar ?? null,
      rentabilidadeEstimada: projeto.rentabilidadeEstimada ?? null,
      prazoObra: projeto.prazoObra ?? null,
      prazoRetorno: projeto.prazoRetorno ?? null,
      modeloRetorno: projeto.modeloRetorno ?? null,
      planoSaida: projeto.planoSaida ?? null,
      ofertaLink: projeto.ofertaLink ?? null,
      statusLabel: 'Oferta Publicada',
      publicadoEm: publishedAt(projeto),
    });
  } catch (err) {
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
