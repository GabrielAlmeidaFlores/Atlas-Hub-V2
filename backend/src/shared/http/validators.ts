import { z } from 'zod';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const message = result.error.errors.map((e) => e.message).join('; ');
    throw new ValidationError(message);
  }
  return result.data;
}

const cnpjRegex = /^\d{14}$/;
const cpfRegex = /^\d{11}$/;

export const perfilSchema = z.object({
  endereco: z.string().max(500).optional(),
  site: z.string().url('URL inválida').optional().or(z.literal('')),
  descricao: z.string().max(2000).optional(),
  historicoAnterior: z.string().max(2000).optional(),
  contratoSocialUrl: z.string().url().optional(),
  comprovanteCnpjUrl: z.string().url().optional(),
});

export const criarProjetoSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter ao menos 3 caracteres').max(200),
  modelo: z.enum(['VENDA', 'RENDA', 'MISTO']),
  tipoImovel: z.enum(['RESIDENCIAL', 'COMERCIAL', 'MISTO']),
  cidade: z.string().min(2).max(100),
  estado: z.string().length(2, 'Use a sigla do estado com 2 letras'),
  endereco: z.string().min(5).max(300),
  descricao: z.string().min(200, 'Descrição deve ter ao menos 200 caracteres').max(5000),
  fotosUrls: z.array(z.string().url()).max(10).optional(),
  videoUrl: z.string().url('URL do YouTube inválida').optional().or(z.literal('')),
});

export const atualizarProjetoSchema = z.object({
  nome: z.string().min(3).max(200).optional(),
  modelo: z.enum(['VENDA', 'RENDA', 'MISTO']).optional(),
  tipoImovel: z.enum(['RESIDENCIAL', 'COMERCIAL', 'MISTO']).optional(),
  cidade: z.string().min(2).max(100).optional(),
  estado: z.string().length(2).optional(),
  endereco: z.string().min(5).max(300).optional(),
  descricao: z.string().min(200).max(5000).optional(),
  fotosUrls: z.array(z.string().url()).max(10).optional(),
  videoUrl: z.string().url().optional().or(z.literal('')),
  valorTotal: z.number().positive().optional(),
  valorCaptar: z.number().positive().max(15_000_000, 'Valor máximo de captação é R$15M (CVM 88)').optional(),
  prazoObra: z.number().int().min(1).max(120).optional(),
  prazoRetorno: z.number().int().min(1).max(120).optional(),
  rentabilidadeEstimada: z.number().min(0).max(100).optional(),
  modeloRetorno: z.enum(['SCP', 'NOTA_COMERCIAL']).optional(),
  planoSaida: z.string().max(2000).optional(),
  tipoOferta: z.enum(['PUBLICA', 'PRIVADA']).optional(),
  parcelado: z.boolean().optional(),
  numParcelas: z.number().int().min(2).max(120).optional(),
  percentualEntrada: z.number().min(1).max(100).optional(),
  equipe: z.array(z.object({
    nome: z.string().min(2).max(200),
    cargo: z.string().min(2).max(200),
    bio: z.string().min(10).max(1000),
    fotoUrl: z.string().url().optional(),
    linkedin: z.string().url().optional().or(z.literal('')),
  })).max(20).optional(),
  documentos: z.object({
    matriculaUrl: z.string().url().optional(),
    alvaraUrl: z.string().url().optional(),
    memorialUrl: z.string().url().optional(),
    plantaUrl: z.string().url().optional(),
    viabilidadeUrl: z.string().url().optional(),
    orcamentoUrl: z.string().url().optional(),
    projeto3dUrl: z.string().url().optional(),
    contratoSpeUrl: z.string().url().optional(),
    cndUrl: z.string().url().optional(),
    outrosUrls: z.array(z.string().url()).max(10).optional(),
  }).optional(),
  viabilidade: z.object({
    inputs: z.object({
      unidades: z.number().positive(),
      custoObra: z.number().nonnegative(),
      precoMedioUnidade: z.number().positive(),
      prazoMeses: z.number().int().min(1).max(120),
      taxaDescontoInvestidor: z.number().min(0).max(100).optional(),
      valorTerreno: z.number().nonnegative().optional(),
      unidadesPermuta: z.number().nonnegative().optional(),
    }),
    outputs: z.object({
      vgv: z.number(),
      custoPorUnidade: z.number(),
      custoTerrenoEstimado: z.number(),
      investimentoTotal: z.number(),
      retornoLiquido: z.number(),
      roiPercent: z.number(),
      fluxoMensal: z.array(z.object({
        mes: z.number().int().min(1),
        valor: z.number(),
      })).max(120),
    }),
    atualizadoEm: z.string().min(1),
  }).optional(),
});

export const presignSchema = z.object({
  mimeType: z.string().min(1).max(100),
  fileName: z.string().min(1).max(200),
});

export const scorecardSchema = z.object({
  localizacaoNota: z.number().min(1).max(10).optional(),
  localizacaoComentario: z.string().max(1000).optional(),
  financeiraNota: z.number().min(1).max(10).optional(),
  financeiraComentario: z.string().max(1000).optional(),
  documentacaoNota: z.number().min(1).max(10).optional(),
  documentacaoComentario: z.string().max(1000).optional(),
  equipeNota: z.number().min(1).max(10).optional(),
  equipeComentario: z.string().max(1000).optional(),
  riscoNota: z.number().min(1).max(10).optional(),
  riscoComentario: z.string().max(1000).optional(),
  parecer: z.string().max(5000).optional(),
});

export const ajusteSchema = z.object({
  scorecard: scorecardSchema,
  textoAjuste: z.string().min(20, 'Descreva o ajuste necessário com ao menos 20 caracteres').max(2000),
});

export const reprovarSchema = z.object({
  scorecard: scorecardSchema.extend({
    localizacaoNota: z.number().min(1).max(10),
    localizacaoComentario: z.string().min(1).max(1000),
    financeiraNota: z.number().min(1).max(10),
    financeiraComentario: z.string().min(1).max(1000),
    documentacaoNota: z.number().min(1).max(10),
    documentacaoComentario: z.string().min(1).max(1000),
    equipeNota: z.number().min(1).max(10),
    equipeComentario: z.string().min(1).max(1000),
    riscoNota: z.number().min(1).max(10),
    riscoComentario: z.string().min(1).max(1000),
    parecer: z.string().min(20, 'Parecer deve ter ao menos 20 caracteres').max(5000),
  }),
  justificativa: z.string().min(20, 'Justificativa deve ter ao menos 20 caracteres').max(2000),
});

export const aprovarSchema = reprovarSchema.omit({ justificativa: true }).extend({
  checklist: z.object({
    patrimonioAfetacao: z.literal(true),
    seguroObra: z.literal(true),
    speScp: z.literal(true),
    elegibilidadeCvm: z.literal(true),
  }),
});

export const downloadPresignSchema = z.object({
  location: z.string().url(),
});

export const confirmarPublicacaoSchema = z.object({
  ofertaId: z.string().min(1, 'ID da oferta é obrigatório').max(200),
  ofertaLink: z.string().url('Link da oferta inválido'),
});

export const notaInternaSchema = z.object({
  texto: z.string().min(5, 'Nota deve ter ao menos 5 caracteres').max(5000),
});

export const reatribuirSchema = z.object({
  analistaId: z.string().min(1),
  motivo: z.string().min(5, 'Informe o motivo da reatribuição').max(500),
});

export const criarUsuarioAdminSchema = z.object({
  nome: z.string().min(2).max(200),
  email: z.string().email('E-mail inválido'),
  perfil: z.enum(['ANALISTA', 'ADMIN_MASTER']),
});

export { cnpjRegex, cpfRegex };
