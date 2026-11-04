import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { BoardService } from '../shared/board/service.js';
import { DynamoBoardRepository } from '../shared/board/dynamo-repository.js';
import type { BoardView } from '../shared/board/types.js';
import { badRequest, notFound, ok, serverError } from '../shared/http/response.js';
import { validate, ValidationError } from '../shared/http/validators.js';
import { createLogger } from '../shared/core/logger.js';
import { LEADS_BOARD_ID, PASSWORD_RESET_SECRET } from '../shared/core/env.js';

const whatsappSchema = z.string().trim().regex(/^\+[1-9]\d{7,14}$/, 'WhatsApp inválido');

const leadCreateSchema = z.object({
  nome: z.string().trim().min(2).max(160),
  email: z.string().trim().toLowerCase().email().max(254),
  whatsapp: whatsappSchema,
  consentimento: z.literal(true),
  origem: z.string().trim().max(200).optional(),
  utmSource: z.string().trim().max(200).optional(),
  utmMedium: z.string().trim().max(200).optional(),
  utmCampaign: z.string().trim().max(200).optional(),
  utmContent: z.string().trim().max(200).optional(),
  utmTerm: z.string().trim().max(200).optional(),
  metaCampaignId: z.string().trim().max(200).optional(),
  metaAdId: z.string().trim().max(200).optional(),
}).strict();

const papelOptions = ['Sócio ou proprietário', 'Diretor ou gestor do projeto', 'Responsável financeiro ou de captação', 'Parceiro ou representante', 'Outro'] as const;
const tipoOptions = ['Edifício residencial', 'Condomínio de casas', 'Loteamento', 'Comercial ou misto', 'Outro'] as const;
const terrenoOptions = ['Terreno próprio ou da empresa', 'Permuta formalizada', 'Permuta ou aquisição em negociação', 'Terreno de terceiro com parceria em estudo', 'Ainda não tenho terreno definido'] as const;
const estagioOptions = ['Estudo de viabilidade em andamento', 'Viabilidade concluída e projeto em desenvolvimento', 'Projeto em aprovação', 'Projeto aprovado e preparação para execução', 'Obra iniciada'] as const;
const vgvOptions = ['Até R$ 5 milhões', 'De R$ 5 milhões a R$ 10 milhões', 'De R$ 10 milhões a R$ 30 milhões', 'Acima de R$ 30 milhões', 'Ainda não definido'] as const;
const valorOptions = ['Até R$ 500 mil', 'De R$ 500 mil a R$ 1 milhão', 'De R$ 1 milhão a R$ 3 milhões', 'De R$ 3 milhões a R$ 5 milhões', 'Acima de R$ 5 milhões', 'Ainda estou definindo'] as const;
const finalidadeOptions = ['Aquisição ou composição de terreno', 'Projetos, aprovações e preparação', 'Início da construção', 'Execução ou continuidade da obra', 'Expansão para outro empreendimento', 'Outra finalidade'] as const;
const prazoOptions = ['Próximos 3 meses', 'Entre 3 e 6 meses', 'Entre 6 e 12 meses', 'Mais de 12 meses', 'Ainda estou avaliando'] as const;
const documentosOptions = ['Estudo de viabilidade econômico-financeira', 'Projeto arquitetônico ou estudo preliminar', 'Documentação do terreno ou permuta', 'Orçamento de obra e cronograma físico-financeiro', 'Aprovações ou licenças aplicáveis', 'Ainda estou reunindo os documentos'] as const;

const qualificationSchema = z.object({
  papel: z.enum(papelOptions),
  tipoEmpreendimento: z.enum(tipoOptions),
  cidadeUf: z.string().trim().min(2).max(120),
  situacaoTerreno: z.enum(terrenoOptions),
  estagio: z.enum(estagioOptions),
  vgv: z.enum(vgvOptions),
  valorPretendido: z.enum(valorOptions),
  finalidade: z.enum(finalidadeOptions),
  prazoCaptacao: z.enum(prazoOptions),
  documentos: z.array(z.enum(documentosOptions)).min(1).max(documentosOptions.length),
}).strict();

type LeadCreate = z.infer<typeof leadCreateSchema>;
type Qualification = z.infer<typeof qualificationSchema>;

function tokenSecret(): string {
  if (PASSWORD_RESET_SECRET.length === 0) throw new Error('PASSWORD_RESET_SECRET não configurado para tokens de lead');
  return `${PASSWORD_RESET_SECRET}:lead`;
}

function qualificationToken(cardId: string): string {
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
  const payload = `${cardId}.${String(expiresAt)}`;
  const signature = createHmac('sha256', tokenSecret()).update(payload).digest('hex');
  return `${String(expiresAt)}.${signature}`;
}

function validToken(cardId: string, token: string): boolean {
  const [expiresRaw, signature] = token.split('.');
  if (expiresRaw === undefined || signature === undefined) return false;
  const expiresAt = Number(expiresRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;
  const expected = createHmac('sha256', tokenSecret()).update(`${cardId}.${expiresRaw}`).digest('hex');
  const actual = Buffer.from(signature);
  const wanted = Buffer.from(expected);
  return actual.length === wanted.length && timingSafeEqual(actual, wanted);
}

function columnByName(board: BoardView, name: string): string {
  const column = board.columns.find((item) => item.name === name);
  if (column === undefined) throw new Error(`Coluna ${name} não encontrada no board de leads`);
  return column.columnId;
}

function fieldMap(board: BoardView): Map<string, string> {
  const template = board.templates[0];
  return new Map((template?.fields ?? []).map((field) => [field.label, field.fieldId]));
}

function valuesFor(board: BoardView, values: Record<string, string | boolean | undefined>): Record<string, string | boolean> {
  const fields = fieldMap(board);
  const result: Record<string, string | boolean> = {};
  for (const [label, value] of Object.entries(values)) {
    if (value === undefined) continue;
    const fieldId = fields.get(label);
    if (fieldId === undefined) throw new Error(`Campo ${label} não encontrado no board de leads`);
    result[fieldId] = value;
  }
  return result;
}

function boardService(): BoardService {
  return new BoardService(new DynamoBoardRepository());
}

async function createLead(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (LEADS_BOARD_ID === '') return serverError(event, new Error('LEADS_BOARD_ID não configurado'));
  if (PASSWORD_RESET_SECRET === '') return serverError(event, new Error('PASSWORD_RESET_SECRET não configurado'));
  let body: LeadCreate;
  try {
    body = validate(leadCreateSchema, JSON.parse(event.body ?? '{}'));
  } catch (err) {
    if (err instanceof ValidationError) return badRequest(event, err.message, 'VALIDATION_ERROR', err.fields);
    return badRequest(event, 'Corpo da requisição inválido');
  }
  const service = boardService();
  const board = await service.getBoard(LEADS_BOARD_ID);
  const template = board.templates[0];
  if (template === undefined) return serverError(event, new Error('Template do board de leads ausente'));
  const fieldValues = valuesFor(board, {
    'Nome do responsável': body.nome,
    'E-mail': body.email,
    'WhatsApp': body.whatsapp,
    'Origem': body.origem,
    'UTM source': body.utmSource,
    'UTM medium': body.utmMedium,
    'UTM campaign': body.utmCampaign,
    'UTM content': body.utmContent,
    'UTM term': body.utmTerm,
    'Meta campaign ID': body.metaCampaignId,
    'Meta ad ID': body.metaAdId,
    'Consentimento': body.consentimento,
  });
  const emailFieldId = fieldMap(board).get('E-mail');
  const existing = emailFieldId === undefined
    ? undefined
    : board.cards.find((card) => card.archivedAt === undefined && String(card.fieldValues[emailFieldId] ?? '').toLowerCase() === body.email);
  if (existing !== undefined) {
    return ok(event, { leadId: existing.cardId, qualificationToken: null, duplicate: true });
  }
  const card = await service.createCard(LEADS_BOARD_ID, {
    columnId: columnByName(board, 'Qualificação pendente'),
    title: body.nome,
    templateId: template.templateId,
    fieldValues,
  }, 'public-lead', 'site@atlascomp.com.br');
  return ok(event, { leadId: card.cardId, qualificationToken: qualificationToken(card.cardId) });
}

async function qualifyLead(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (LEADS_BOARD_ID === '') return serverError(event, new Error('LEADS_BOARD_ID não configurado'));
  if (PASSWORD_RESET_SECRET === '') return serverError(event, new Error('PASSWORD_RESET_SECRET não configurado'));
  const leadId = event.pathParameters?.['leadId'] ?? '';
  const token = event.queryStringParameters?.['token'] ?? '';
  if (!validToken(leadId, token)) return badRequest(event, 'Link de qualificação inválido ou expirado');
  let body: Qualification;
  try {
    body = validate(qualificationSchema, JSON.parse(event.body ?? '{}'));
  } catch (err) {
    if (err instanceof ValidationError) return badRequest(event, err.message, 'VALIDATION_ERROR', err.fields);
    return badRequest(event, 'Corpo da requisição inválido');
  }
  const service = boardService();
  const board = await service.getBoard(LEADS_BOARD_ID);
  const card = board.cards.find((item) => item.cardId === leadId && item.archivedAt === undefined);
  if (card === undefined) return notFound(event, 'Lead não encontrado');
  const fieldValues = valuesFor(board, {
    'Papel na empresa': body.papel,
    'Tipo de empreendimento': body.tipoEmpreendimento,
    'Cidade/UF': body.cidadeUf,
    'Situação do terreno': body.situacaoTerreno,
    'Estágio do empreendimento': body.estagio,
    'VGV estimado': body.vgv,
    'Valor pretendido': body.valorPretendido,
    'Finalidade dos recursos': body.finalidade,
    'Prazo de captação': body.prazoCaptacao,
    'Documentos disponíveis': body.documentos.join('; '),
    'Data da qualificação': new Date().toISOString().slice(0, 10),
  });
  await service.updateCard(LEADS_BOARD_ID, leadId, {
    templateId: board.templates[0]?.templateId,
    fieldValues: { ...card.fieldValues, ...fieldValues } as unknown as Record<string, string | number | boolean | null>,
  }, 'public-lead', 'site@atlascomp.com.br');
  await service.moveCard(LEADS_BOARD_ID, leadId, {
    columnId: columnByName(board, 'Qualificado'),
    position: 0,
  }, 'public-lead', 'site@atlascomp.com.br');
  return ok(event, { ok: true });
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const log = createLogger('publicoLeads');
  try {
    if (event.httpMethod === 'POST' && event.path === '/publico/leads') return await createLead(event);
    if (event.httpMethod === 'PUT' && event.path.startsWith('/publico/leads/') && event.path.endsWith('/qualificacao')) return await qualifyLead(event);
    return notFound(event, 'Rota não encontrada');
  } catch (err) {
    if (err instanceof ValidationError) return badRequest(event, err.message, 'VALIDATION_ERROR', err.fields);
    log.error('Unexpected error', err);
    return serverError(event, err);
  }
};
