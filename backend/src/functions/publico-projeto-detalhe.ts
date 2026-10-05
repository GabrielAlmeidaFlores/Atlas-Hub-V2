import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, notFound, serverError } from '../shared/http/response.js';
import { getProjeto, getIncorporadora } from '../shared/db/index.js';
import { createLogger } from '../shared/core/logger.js';
import { extractKeyFromLocation, generatePresignedGetUrl } from '../shared/storage/index.js';
import type { Projeto, DocumentosProjeto, MembroEquipe } from '../shared/core/types/domain.js';

function publishedAt(projeto: Projeto): string {
  return projeto.ofertaConfirmadaEm ?? projeto.aprovadoEm ?? projeto.atualizadoEm ?? projeto.criadoEm;
}

async function resolveUrl(location: string | undefined): Promise<string | null> {
  if (location === undefined || location === '') return null;
  if (location.startsWith('/')) return location;
  const key = extractKeyFromLocation(location);
  if (key === null) {
    return location.startsWith('http') ? location : null;
  }
  return generatePresignedGetUrl(key, 3600);
}

async function resolveDocumentos(documentos: DocumentosProjeto | undefined): Promise<Record<string, string | string[] | null>> {
  const d = documentos ?? {};
  const outros = await Promise.all((d.outrosUrls ?? []).map(resolveUrl));
  return {
    matriculaUrl: await resolveUrl(d.matriculaUrl),
    alvaraUrl: await resolveUrl(d.alvaraUrl),
    memorialUrl: await resolveUrl(d.memorialUrl),
    plantaUrl: await resolveUrl(d.plantaUrl),
    viabilidadeUrl: await resolveUrl(d.viabilidadeUrl),
    orcamentoUrl: await resolveUrl(d.orcamentoUrl),
    projeto3dUrl: await resolveUrl(d.projeto3dUrl),
    contratoSpeUrl: await resolveUrl(d.contratoSpeUrl),
    cndUrl: await resolveUrl(d.cndUrl),
    outrosUrls: outros.filter((url): url is string => url !== null),
  };
}

async function resolveEquipe(equipe: MembroEquipe[] | undefined): Promise<readonly Record<string, string | null>[]> {
  const lista = equipe ?? [];
  return Promise.all(
    lista.map(async (m) => ({
      nome: m.nome,
      cargo: m.cargo,
      bio: m.bio,
      fotoUrl: await resolveUrl(m.fotoUrl),
      linkedin: m.linkedin ?? null,
    })),
  );
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

    const [fotos, documentos, equipe, incorporadora] = await Promise.all([
      Promise.all((projeto.fotosUrls ?? []).map(resolveUrl)),
      resolveDocumentos(projeto.documentos),
      resolveEquipe(projeto.equipe),
      getIncorporadora(projeto.incorporadoraId),
    ]);

    log.info('Public project detail fetched', { projetoId: id });
    return ok(event, {
      id: projeto.id,
      status: projeto.status,
      revisao: projeto.revisao,
      nome: projeto.nome,
      modelo: projeto.modelo,
      tipoImovel: projeto.tipoImovel,
      tipoOferta: projeto.tipoOferta ?? null,
      cidade: projeto.cidade,
      estado: projeto.estado,
      endereco: projeto.endereco,
      descricao: projeto.descricao,
      fotos: fotos.filter((url): url is string => url !== null),
      videoUrl: await resolveUrl(projeto.videoUrl),
      valorTotal: projeto.valorTotal ?? null,
      valorCaptar: projeto.valorCaptar ?? null,
      rentabilidadeEstimada: projeto.rentabilidadeEstimada ?? null,
      prazoObra: projeto.prazoObra ?? null,
      prazoRetorno: projeto.prazoRetorno ?? null,
      modeloRetorno: projeto.modeloRetorno ?? null,
      planoSaida: projeto.planoSaida ?? null,
      parcelado: projeto.parcelado ?? false,
      numParcelas: projeto.numParcelas ?? null,
      percentualEntrada: projeto.percentualEntrada ?? null,
      documentos,
      viabilidade: projeto.viabilidade ?? null,
      equipe,
      incorporadora: incorporadora === null
        ? null
        : {
            razaoSocial: incorporadora.razaoSocial,
            descricao: incorporadora.descricao ?? null,
            site: incorporadora.site ?? null,
            endereco: incorporadora.endereco ?? null,
          },
      analistaNome: projeto.analistaNome ?? null,
      ofertaId: projeto.ofertaId ?? null,
      ofertaLink: projeto.ofertaLink ?? null,
      ofertaConfirmadaEm: projeto.ofertaConfirmadaEm ?? null,
      criadoEm: projeto.criadoEm,
      atualizadoEm: projeto.atualizadoEm,
      submetidoEm: projeto.submetidoEm ?? null,
      aprovadoEm: projeto.aprovadoEm ?? null,
      statusLabel: 'Oferta Publicada',
      publicadoEm: publishedAt(projeto),
    });
  } catch (err) {
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
