import { z, type ZodIssue } from 'zod';

export interface ValidationField {
  readonly field: string;
  readonly message: string;
}

export class ValidationError extends Error {
  readonly fields: readonly ValidationField[];
  constructor(fields: readonly ValidationField[]) {
    super(fields[0]?.message ?? 'Dados inválidos');
    this.name = 'ValidationError';
    this.fields = fields;
  }
}

const FIELD_LABELS: Record<string, string> = {
  nome: 'Nome',
  name: 'Nome',
  razaoSocial: 'Razão social',
  cnpj: 'CNPJ',
  cpf: 'CPF',
  cpfResponsavel: 'CPF do responsável',
  nomeResponsavel: 'Nome do responsável',
  cargoResponsavel: 'Cargo do responsável',
  email: 'E-mail',
  telefone: 'Telefone',
  cidade: 'Cidade',
  estado: 'Estado',
  endereco: 'Endereço',
  descricao: 'Descrição',
  description: 'Descrição',
  fotosUrls: 'Fotos',
  videoUrl: 'Vídeo',
  modelo: 'Modelo',
  tipoImovel: 'Tipo de imóvel',
  valorTotal: 'Valor total',
  valorCaptar: 'Valor a captar',
  valorTerreno: 'Valor do terreno',
  prazoObra: 'Prazo de obra',
  prazoRetorno: 'Prazo de retorno',
  prazoMeses: 'Prazo',
  rentabilidadeEstimada: 'Rentabilidade estimada',
  modeloRetorno: 'Modelo de retorno',
  tipoOferta: 'Tipo de oferta',
  parcelado: 'Parcelamento',
  numParcelas: 'Número de parcelas',
  percentualEntrada: 'Percentual de entrada',
  documentos: 'Documentos',
  equipe: 'Equipe',
  viabilidade: 'Viabilidade',
  justificativa: 'Justificativa',
  observacao: 'Observação',
  status: 'Status',
  senha: 'Senha',
  novaSenha: 'Nova senha',
  pixKey: 'Chave Pix',
  quantia: 'Valor',
  quantidade: 'Quantidade',
  amount: 'Valor',
  amountReais: 'Valor',
  valor: 'Valor',
  titulo: 'Título',
  mensagem: 'Mensagem',
  texto: 'Texto',
  motivo: 'Motivo',
  limite: 'Limite',
  comissao: 'Comissão',
  percentual: 'Percentual',
  ofertaId: 'Oferta',
  ofertaLink: 'Link da oferta',
  etapaId: 'Etapa',
  lancamentoId: 'Lançamento',
  projetoId: 'Projeto',
  contaId: 'Conta',
  data: 'Data',
  mes: 'Mês',
  unidades: 'Unidades',
  unidadesPermuta: 'Unidades de permuta',
  custoObra: 'Custo de obra',
  precoMedioUnidade: 'Preço médio da unidade',
  taxId: 'CPF/CNPJ',
  bankCode: 'Banco',
  branchCode: 'Agência',
  accountNumber: 'Conta',
  accountType: 'Tipo de conta',
  localizacaoNota: 'Nota de localização',
  financeiraNota: 'Nota financeira',
  documentacaoNota: 'Nota de documentação',
  equipeNota: 'Nota de equipe',
  riscoNota: 'Nota de risco',
  notaGeral: 'Nota geral',
  parecer: 'Parecer',
};

const ZOD_DEFAULT_MESSAGE = /^(String must|Number must|Array must|Invalid|Required|Expected|Unrecognized|Too small|Too big)/i;

function humanize(key: string): string {
  if (key.length === 0) return 'Campo';
  const spaced = key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function fieldLabel(issue: ZodIssue): string {
  const segs = issue.path.filter((seg): seg is string => typeof seg === 'string');
  const raw = segs.length > 0 ? String(segs[segs.length - 1]) : '';
  return FIELD_LABELS[raw] ?? humanize(raw);
}

function friendlyIssue(issue: ZodIssue): string {
  if (issue.message.length > 0 && !ZOD_DEFAULT_MESSAGE.test(issue.message)) return issue.message;

  const label = fieldLabel(issue);

  if (issue.code === 'too_small') {
    const exact = issue.exact === true;
    const inclusive = issue.inclusive !== false;
    const min = String(issue.minimum);
    if (issue.type === 'string') return `${label} deve ter ${exact ? 'exatamente' : inclusive ? 'ao menos' : 'mais de'} ${min} caractere(s)`;
    if (issue.type === 'array') return `${label} precisa de ${exact ? 'exatamente' : inclusive ? 'ao menos' : 'mais de'} ${min} item(ns)`;
    return `${label} deve ser ${exact ? 'igual a' : inclusive ? 'no mínimo' : 'maior que'} ${min}`;
  }
  if (issue.code === 'too_big') {
    const exact = issue.exact === true;
    const inclusive = issue.inclusive !== false;
    const max = String(issue.maximum);
    if (issue.type === 'string') return `${label} deve ter ${exact ? 'exatamente' : inclusive ? 'no máximo' : 'menos de'} ${max} caractere(s)`;
    if (issue.type === 'array') return `${label} deve ter ${exact ? 'exatamente' : inclusive ? 'no máximo' : 'menos de'} ${max} item(ns)`;
    return `${label} deve ser ${exact ? 'igual a' : inclusive ? 'no máximo' : 'menor que'} ${max}`;
  }
  if (issue.code === 'invalid_type') {
    return issue.received === 'undefined' ? `${label} é obrigatório` : `${label} está em um formato inválido`;
  }
  if (issue.code === 'invalid_string') {
    if (issue.validation === 'url') return `${label} deve ser um link válido`;
    if (issue.validation === 'email') return `${label} deve ser um e-mail válido`;
    return `${label} está em um formato inválido`;
  }
  return `${label} inválido`;
}

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const fields = result.error.issues.map((issue) => ({
      field: issue.path.map(String).join('.'),
      message: friendlyIssue(issue),
    }));
    throw new ValidationError(fields);
  }
  return result.data;
}

const cnpjRegex = /^\d{14}$/;
const cpfRegex = /^\d{11}$/;

function modulo11(digits: readonly number[], weights: readonly number[]): number {
  const sum = digits.reduce((acc, digit, index) => acc + digit * (weights[index] ?? 0), 0);
  const rest = sum % 11;
  return rest < 2 ? 0 : 11 - rest;
}

function isValidCnpjDigits(value: string): boolean {
  if (!cnpjRegex.test(value) || /^(\d)\1{13}$/.test(value)) return false;
  const nums = [...value].map((d) => Number(d));
  const d1 = modulo11(nums.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  if (nums[12] !== d1) return false;
  const d2 = modulo11(nums.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return nums[13] === d2;
}

function isValidCpfDigits(value: string): boolean {
  if (!cpfRegex.test(value) || /^(\d)\1{10}$/.test(value)) return false;
  const nums = [...value].map((d) => Number(d));
  const d1Sum = nums.slice(0, 9).reduce((acc, n, i) => acc + n * (10 - i), 0);
  const d1 = (d1Sum * 10) % 11 % 10;
  if (nums[9] !== d1) return false;
  const d2Sum = nums.slice(0, 10).reduce((acc, n, i) => acc + n * (11 - i), 0);
  const d2 = (d2Sum * 10) % 11 % 10;
  return nums[10] === d2;
}

export const perfilSchema = z.object({
  endereco: z.string().max(500).optional(),
  site: z.string().url('URL inválida').optional().or(z.literal('')),
  descricao: z.string().max(2000).optional(),
  historicoAnterior: z.string().max(2000).optional(),
  contratoSocialUrl: z.string().url().optional(),
  comprovanteCnpjUrl: z.string().url().optional(),
});

export const criarProjetoSchema = z.object({
  nome: z.string().max(200).default(''),
  modelo: z.enum(['VENDA', 'RENDA', 'MISTO']).default('VENDA'),
  tipoImovel: z.enum(['RESIDENCIAL', 'COMERCIAL', 'MISTO']).default('RESIDENCIAL'),
  cidade: z.string().max(100).default(''),
  estado: z.string().max(2).default(''),
  endereco: z.string().max(300).default(''),
  descricao: z.string().max(5000).default(''),
  fotosUrls: z.array(z.string().url()).max(10).optional(),
  videoUrl: z.string().url('URL do YouTube inválida').optional().or(z.literal('')),
});

export const atualizarProjetoSchema = z.object({
  nome: z.string().max(200).optional(),
  modelo: z.enum(['VENDA', 'RENDA', 'MISTO']).optional(),
  tipoImovel: z.enum(['RESIDENCIAL', 'COMERCIAL', 'MISTO']).optional(),
  cidade: z.string().max(100).optional(),
  estado: z.string().max(2).optional(),
  endereco: z.string().max(300).optional(),
  descricao: z.string().max(5000).optional(),
  fotosUrls: z.array(z.string().url()).max(10).optional(),
  videoUrl: z.string().url().optional().or(z.literal('')),
  valorTotal: z.number().positive().optional(),
  valorCaptar: z.number().positive().max(15_000_000, 'Valor máximo de captação é R$15M (CVM 88)').optional(),
  prazoObra: z.number().int().min(1).max(120).optional(),
  prazoRetorno: z.number().int().min(1).max(120).optional(),
  rentabilidadeEstimada: z.number().min(0).max(100).optional(),
  modeloRetorno: z.literal('SCP').optional(),
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

const analyticsContextSchema = z.object({
  path: z.string().max(500).optional(),
  referrer: z.string().max(1000).optional(),
  utmSource: z.string().max(200).optional(),
  utmMedium: z.string().max(200).optional(),
  utmCampaign: z.string().max(200).optional(),
  utmContent: z.string().max(200).optional(),
  utmTerm: z.string().max(200).optional(),
  browser: z.string().max(100).optional(),
  os: z.string().max(100).optional(),
  device: z.string().max(50).optional(),
  screenWidth: z.number().int().positive().optional(),
  screenHeight: z.number().int().positive().optional(),
  language: z.string().max(32).optional(),
  timeZone: z.string().max(80).optional(),
  country: z.string().max(80).optional(),
  region: z.string().max(80).optional(),
  city: z.string().max(80).optional(),
}).optional();

export const analyticsCollectSchema = z.object({
  sessionId: z.string().min(8).max(80),
  anonymousId: z.string().min(8).max(80),
  userId: z.string().min(1).max(128).optional(),
  events: z.array(z.object({
    eventName: z.string().min(2).max(80),
    ts: z.string().min(10).max(40).optional(),
    props: z.record(z.unknown()).optional(),
    context: analyticsContextSchema,
  })).min(1).max(50),
});

export const analyticsAlertSchema = z.object({
  name: z.string().min(3).max(120),
  rule: z.enum([
    'conversion_drop',
    'bounce_high',
    'traffic_drop',
    'form_error',
    'api_error',
    'traffic_spike',
  ]),
  threshold: z.number().min(0).max(1000),
  active: z.boolean().default(true),
});

export const criarContaFinanceiroSchema = z.discriminatedUnion('tipo', [
  z.object({
    tipo: z.literal('TESOURARIA'),
  }),
  z.object({
    tipo: z.literal('SPE'),
    projetoId: z.string().min(1).max(80),
    cnpjSpe: z.string().regex(cnpjRegex, 'CNPJ da SPE inválido').refine(isValidCnpjDigits, 'CNPJ da SPE inválido'),
    razaoSocialSpe: z.string().min(3).max(200),
  }),
]);

export const criarSolicitacaoFinanceiroSchema = z.object({
  projetoId: z.string().min(1).max(80),
  amountReais: z.number().positive('Informe um valor maior que zero').max(15_000_000),
  description: z.string().min(5).max(200),
  pixKey: z.string().min(8).max(80).optional(),
  name: z.string().min(2).max(200).optional(),
  taxId: z.string().min(11).max(18).optional(),
  bankCode: z.string().min(3).max(8).optional(),
  branchCode: z.string().min(1).max(10).optional(),
  accountNumber: z.string().min(2).max(20).optional(),
  accountType: z.enum(['checking', 'savings', 'salary', 'payment']).optional(),
}).superRefine((data, ctx) => {
  const hasPix = data.pixKey !== undefined && data.pixKey.length > 0;
  const hasConta = data.name !== undefined && data.taxId !== undefined && data.bankCode !== undefined
    && data.branchCode !== undefined && data.accountNumber !== undefined;
  if (!hasPix && !hasConta) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Informe a chave Pix ou os dados da conta destino' });
  }
});

const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida');

function assertPeriodo(inicio: string, fim: string, ctx: z.RefinementCtx, fimPath: string): void {
  if (inicio > fim) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Término deve ser posterior ao início', path: [fimPath] });
  }
}

export const criarEtapaObraSchema = z.object({
  nome: z.string().min(2).max(120),
  inicioPrevisto: ymd,
  fimPrevisto: ymd,
  inicioReal: ymd.optional(),
  fimReal: ymd.optional(),
  percentualExecucao: z.number().min(0).max(100).optional(),
  valorOrcado: z.number().min(0).max(1_000_000_000),
}).superRefine((data, ctx) => {
  assertPeriodo(data.inicioPrevisto, data.fimPrevisto, ctx, 'fimPrevisto');
  if (data.inicioReal !== undefined && data.fimReal !== undefined) {
    assertPeriodo(data.inicioReal, data.fimReal, ctx, 'fimReal');
  }
});

export const atualizarEtapaObraSchema = z.object({
  nome: z.string().min(2).max(120).optional(),
  inicioPrevisto: ymd.optional(),
  fimPrevisto: ymd.optional(),
  inicioReal: ymd.optional().or(z.literal('')),
  fimReal: ymd.optional().or(z.literal('')),
  percentualExecucao: z.number().min(0).max(100).optional(),
  valorOrcado: z.number().min(0).max(1_000_000_000).optional(),
}).superRefine((data, ctx) => {
  if (data.inicioPrevisto !== undefined && data.fimPrevisto !== undefined) {
    assertPeriodo(data.inicioPrevisto, data.fimPrevisto, ctx, 'fimPrevisto');
  }
  if (data.inicioReal !== undefined && data.inicioReal !== '' && data.fimReal !== undefined && data.fimReal !== '') {
    assertPeriodo(data.inicioReal, data.fimReal, ctx, 'fimReal');
  }
});

export const criarLancamentoObraSchema = z.object({
  etapaId: z.string().min(1).max(80),
  descricao: z.string().min(2).max(200),
  valor: z.number().positive().max(1_000_000_000),
  dataLancamento: ymd,
  comprovanteUrl: z.string().url().optional(),
});

export const atualizarLancamentoObraSchema = z.object({
  status: z.literal('CANCELADO'),
});

export const solicitarCartaoObraSchema = z.object({
  titularSpe: z.literal(true, { errorMap: () => ({ message: 'Confirme que o titular é a SPE' }) }),
  faturaIntegral: z.literal(true, { errorMap: () => ({ message: 'Confirme o pagamento integral da fatura' }) }),
  semRotativo: z.literal(true, { errorMap: () => ({ message: 'Confirme que não haverá crédito rotativo' }) }),
  cashbackNaSpe: z.literal(true, { errorMap: () => ({ message: 'Confirme que o cashback permanece na SPE' }) }),
});

export const solicitarLiberacaoCartaoSchema = z.object({
  etapaId: z.string().min(1).max(80),
});

export { cnpjRegex, cpfRegex, isValidCnpjDigits, isValidCpfDigits };
