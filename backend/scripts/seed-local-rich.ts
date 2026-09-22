import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminAddUserToGroupCommand,
  AdminSetUserPasswordCommand,
  AdminGetUserCommand,
  UsernameExistsException,
} from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { createHash } from 'node:crypto';
import { v5 as uuidv5 } from 'uuid';

const region = process.env['REGION'] ?? 'sa-east-1';
const stage = process.env['STAGE'] ?? 'dev';
const poolId = process.env['POOL_ID'] ?? 'sa-east-1_FyjlSJmHK';
const password = process.env['SEED_PASSWORD'] ?? 'AtlasHub!Dev2026';
const NS = '7f3c1a90-4b2e-4c8d-9f11-a7b0c1d2e3f4';
const now = new Date();
const ttlNotificacao = Math.floor(now.getTime() / 1000) + 7_776_000;

const T = {
  incorporadoras: `AtlasIncorporadoras-${stage}`,
  admins: `AtlasAdmins-${stage}`,
  projetos: `AtlasProjetos-${stage}`,
  scorecard: `AtlasScorecard-${stage}`,
  notificacoes: `AtlasNotificacoes-${stage}`,
  auditoria: `AtlasAuditoria-${stage}`,
  notas: `AtlasNotas-${stage}`,
  analyticsEvents: `AtlasAnalyticsEvents-${stage}`,
  analyticsSessions: `AtlasAnalyticsSessions-${stage}`,
  analyticsDaily: `AtlasAnalyticsDaily-${stage}`,
  analyticsHeatmaps: `AtlasAnalyticsHeatmaps-${stage}`,
  analyticsAlerts: `AtlasAnalyticsAlerts-${stage}`,
  analyticsReplays: `AtlasAnalyticsReplays-${stage}`,
  speContas: `AtlasSpeContas-${stage}`,
  ledger: `AtlasFinanceiroLedger-${stage}`,
  solicitacoes: `AtlasFinanceiroSolicitacoes-${stage}`,
  finAuditoria: `AtlasFinanceiroAuditoria-${stage}`,
  captacaoEventos: `AtlasCaptacaoEventos-${stage}`,
  captacaoCompras: `AtlasCaptacaoCompras-${stage}`,
  etapas: `AtlasObraEtapas-${stage}`,
  lancamentos: `AtlasObraLancamentos-${stage}`,
  speCartoes: `AtlasSpeCartoes-${stage}`,
} as const;

type Perfil = 'INCORPORADORA' | 'ANALISTA' | 'ADMIN_MASTER';
type StatusProjeto =
  | 'RASCUNHO'
  | 'SUBMETIDO'
  | 'EM_ANALISE'
  | 'AJUSTE_SOLICITADO'
  | 'REPROVADO'
  | 'APROVADO'
  | 'OFERTA_CRIADA';
type Modelo = 'VENDA' | 'RENDA' | 'MISTO';
type TipoImovel = 'RESIDENCIAL' | 'COMERCIAL' | 'MISTO';
type TipoOferta = 'PUBLICA' | 'PRIVADA';
type ModeloRetorno = 'SCP' | 'NOTA_COMERCIAL';
type IncKey = 'horizon' | 'verde' | 'atlantic' | 'serra' | 'litoral';
type AnalistaKey = 'ana' | 'marcos';
type CaptacaoModo = 'progresso' | 'sucesso' | 'insucesso';
type CronogramaModo = 'planejada' | 'avancada' | 'atraso';

interface ContaUser {
  readonly id: string;
  readonly email: string;
  readonly nome: string;
}

const cognito = new CognitoIdentityProviderClient({ region });
const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region }), {
  marshallOptions: { removeUndefinedValues: true },
});

function sid(name: string): string {
  return uuidv5(name, NS);
}

function isoDays(daysAgo: number, extraMs = 0): string {
  return new Date(now.getTime() - daysAgo * 86_400_000 + extraMs).toISOString();
}

function isoSalt(daysAgo: number, salt: string): string {
  const digest = createHash('sha256').update(salt).digest();
  const extra = ((digest[0] ?? 0) << 16 | (digest[1] ?? 0) << 8 | (digest[2] ?? 0)) % 86_400_000;
  return new Date(now.getTime() - daysAgo * 86_400_000 - extra).toISOString();
}

function ymdDays(daysAgo: number): string {
  return isoDays(daysAgo).slice(0, 10);
}

function ymdShift(base: string, days: number): string {
  const [y, m, d] = base.split('-').map(Number);
  const dt = new Date(Date.UTC(y ?? 2026, (m ?? 1) - 1, d ?? 1));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

function modulo11(digits: readonly number[], weights: readonly number[]): number {
  const sum = digits.reduce((acc, digit, index) => acc + digit * (weights[index] ?? 0), 0);
  const rest = sum % 11;
  return rest < 2 ? 0 : 11 - rest;
}

function cnpjFromBase(base12: string): string {
  const nums = [...base12].map((d) => Number(d));
  const d1 = modulo11(nums, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = modulo11([...nums, d1], [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return `${base12}${String(d1)}${String(d2)}`;
}

function cpfFromBase(base9: string): string {
  const nums = [...base9].map((d) => Number(d));
  const d1 = (nums.reduce((acc, n, i) => acc + n * (10 - i), 0) * 10) % 11 % 10;
  const d2 = ([...nums, d1].reduce((acc, n, i) => acc + n * (11 - i), 0) * 10) % 11 % 10;
  return `${base9}${String(d1)}${String(d2)}`;
}

function calcularViabilidade(inputs: {
  unidades: number;
  custoObra: number;
  precoMedioUnidade: number;
  prazoMeses: number;
  valorTerreno: number;
}): Record<string, unknown> {
  const vgv = inputs.unidades * inputs.precoMedioUnidade;
  const investimentoTotal = inputs.custoObra + inputs.valorTerreno;
  const retornoLiquido = vgv - investimentoTotal;
  const fluxoMensal: Array<{ mes: number; valor: number }> = [];
  const desembolso = -(inputs.custoObra / inputs.prazoMeses);
  for (let mes = 1; mes <= inputs.prazoMeses; mes += 1) {
    fluxoMensal.push({ mes, valor: Math.round(desembolso * 100) / 100 });
  }
  const last = fluxoMensal[fluxoMensal.length - 1];
  if (last !== undefined) {
    fluxoMensal[fluxoMensal.length - 1] = { mes: last.mes, valor: Math.round((last.valor + vgv) * 100) / 100 };
  }
  return {
    inputs,
    outputs: {
      vgv: Math.round(vgv * 100) / 100,
      custoPorUnidade: Math.round((inputs.custoObra / inputs.unidades) * 100) / 100,
      custoTerrenoEstimado: inputs.valorTerreno,
      investimentoTotal: Math.round(investimentoTotal * 100) / 100,
      retornoLiquido: Math.round(retornoLiquido * 100) / 100,
      roiPercent: Math.round((retornoLiquido / investimentoTotal) * 1000) / 10,
      fluxoMensal,
    },
    atualizadoEm: isoDays(4),
  };
}

function descricaoEmpreendimento(nome: string, cidade: string, modelo: Modelo): string {
  const base = `${nome} fica em ${cidade} e foi estruturado no modelo ${modelo.toLowerCase()} para captação via Atlas Hub. O estudo considera localização, demanda residencial, cronograma de obra, VGV e necessidade de capital. A SPE concentra o empreendimento, a equipe técnica acompanha execução e a curadoria avalia documentação, risco e retorno antes de qualquer oferta.`;
  return base.length >= 200 ? base : `${base} Complemento de memorial descritivo para atender o mínimo exigido na submissão.`;
}

function notaGeral(n: { loc: number; fin: number; doc: number; eq: number; risco: number }): number {
  return Math.round((n.loc * 0.25 + n.fin * 0.25 + n.doc * 0.2 + n.eq * 0.15 + n.risco * 0.15) * 10) / 10;
}

async function ensureCognitoUser(email: string, group: Perfil): Promise<string> {
  const readSub = async (username: string): Promise<string> => {
    const existing = await cognito.send(new AdminGetUserCommand({ UserPoolId: poolId, Username: username }));
    const sub = existing.UserAttributes?.find((a) => a.Name === 'sub')?.Value;
    if (sub === undefined || sub === '') throw new Error(`sub ausente para ${email}`);
    await cognito.send(new AdminSetUserPasswordCommand({
      UserPoolId: poolId,
      Username: username,
      Password: password,
      Permanent: true,
    })).catch(() => undefined);
    try {
      await cognito.send(new AdminAddUserToGroupCommand({ UserPoolId: poolId, Username: username, GroupName: group }));
    } catch {
      void 0;
    }
    return sub;
  };

  try {
    const created = await cognito.send(new AdminCreateUserCommand({
      UserPoolId: poolId,
      Username: email,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'email_verified', Value: 'true' },
      ],
      TemporaryPassword: password,
      MessageAction: 'SUPPRESS',
    }));
    const username = created.User?.Username ?? email;
    await cognito.send(new AdminAddUserToGroupCommand({ UserPoolId: poolId, Username: username, GroupName: group }));
    await cognito.send(new AdminSetUserPasswordCommand({
      UserPoolId: poolId,
      Username: username,
      Password: password,
      Permanent: true,
    }));
    return readSub(username);
  } catch (err) {
    if (err instanceof UsernameExistsException || (err as { name?: string }).name === 'UsernameExistsException') {
      return readSub(email);
    }
    throw err;
  }
}

async function put(table: string, item: Record<string, unknown>): Promise<void> {
  await db.send(new PutCommand({ TableName: table, Item: item }));
}

function tableItemKey(table: string, item: Record<string, unknown>): string {
  if (table === T.scorecard) return `${String(item['projetoId'])}#${String(item['revisao'])}`;
  if (table === T.notificacoes) return `${String(item['userId'])}#${String(item['criadoEm'])}`;
  if (table === T.auditoria || table === T.notas || table === T.finAuditoria) {
    return `${String(item['projetoId'])}#${String(item['criadoEm'])}`;
  }
  if (table === T.etapas) return `${String(item['projetoId'])}#${String(item['etapaId'])}`;
  if (table === T.lancamentos) return `${String(item['projetoId'])}#${String(item['lancamentoId'])}`;
  if (table === T.captacaoEventos) return String(item['id']);
  if (table === T.captacaoCompras) return `${String(item['ofertaId'])}#${String(item['purchaseId'])}`;
  if (table === T.speContas || table === T.speCartoes) return String(item['projetoId']);
  if (table === T.ledger) return `${String(item['projetoId'])}#${String(item['starkId'])}`;
  if (table === T.solicitacoes) return String(item['id']);
  if (table === T.analyticsEvents) return String(item['id']);
  if (table === T.analyticsSessions) return String(item['sessionId']);
  if (table === T.analyticsDaily) return `${String(item['dayKey'])}#${String(item['metricKey'])}`;
  if (table === T.analyticsHeatmaps) return `${String(item['pageKey'])}#${String(item['cellKey'])}`;
  return JSON.stringify(item);
}

async function batchPut(table: string, items: Record<string, unknown>[]): Promise<void> {
  if (items.length === 0) return;
  const seen = new Set<string>();
  const dups: string[] = [];
  for (const item of items) {
    const key = tableItemKey(table, item);
    if (seen.has(key)) dups.push(key);
    seen.add(key);
  }
  if (dups.length > 0) {
    throw new Error(`chaves duplicadas em ${table}: ${dups.slice(0, 5).join(' | ')}`);
  }
  for (let i = 0; i < items.length; i += 25) {
    let requestItems: Record<string, unknown> | undefined = {
      [table]: items.slice(i, i + 25).map((Item) => ({ PutRequest: { Item } })),
    };
    while (requestItems !== undefined && Object.keys(requestItems).length > 0) {
      const res = await db.send(new BatchWriteCommand({ RequestItems: requestItems as never }));
      const unprocessed = res.UnprocessedItems ?? {};
      if (Object.keys(unprocessed).length === 0) break;
      requestItems = unprocessed as Record<string, unknown>;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
}

const FOTOS = [
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1448630360428-65456885c650?auto=format&fit=crop&w=1600&q=80',
] as const;

function docsDe(slug: string): Record<string, string | string[]> {
  const base = `https://atlas-hub-documents-dev.s3.sa-east-1.amazonaws.com/seed/${slug}`;
  return {
    matriculaUrl: `${base}/matricula.pdf`,
    alvaraUrl: `${base}/alvara.pdf`,
    memorialUrl: `${base}/memorial.pdf`,
    plantaUrl: `${base}/planta.pdf`,
    viabilidadeUrl: `${base}/viabilidade.pdf`,
    orcamentoUrl: `${base}/orcamento.pdf`,
    contratoSpeUrl: `${base}/contrato-spe.pdf`,
    cndUrl: `${base}/cnd.pdf`,
    outrosUrls: [`${base}/habitese-previa.pdf`],
  };
}

function equipeDe(inc: IncKey): Array<Record<string, string>> {
  const times: Record<IncKey, Array<Record<string, string>>> = {
    horizon: [
      { nome: 'Eng. Roberto Silva', cargo: 'Responsável técnico', bio: 'CREA-SP. Vinte anos em residenciais de médio e alto padrão na Grande São Paulo.', linkedin: 'https://www.linkedin.com/in/roberto-silva-horizon' },
      { nome: 'Juliana Pereira', cargo: 'Gestora de projeto', bio: 'Especialista em cronograma, custo de obra e interface com curadoria.', linkedin: 'https://www.linkedin.com/in/juliana-pereira-horizon' },
    ],
    verde: [
      { nome: 'Arq. Helena Duarte', cargo: 'Coordenação de projeto', bio: 'Arquitetura sustentável e certificação ambiental em empreendimentos mistos.', linkedin: 'https://www.linkedin.com/in/helena-duarte-verde' },
      { nome: 'Paulo Nogueira', cargo: 'Engenheiro de custos', bio: 'Orçamento analítico e controle de desvio orçado versus realizado.', linkedin: 'https://www.linkedin.com/in/paulo-nogueira-verde' },
    ],
    atlantic: [
      { nome: 'Marina Lopes', cargo: 'Diretora de obra', bio: 'Experiência em empreendimentos litorâneos e fundação em solo arenoso.', linkedin: 'https://www.linkedin.com/in/marina-lopes-atlantic' },
    ],
    serra: [
      { nome: 'Carlos Brandão', cargo: 'Responsável técnico', bio: 'Obras verticais em Belo Horizonte e Região Metropolitana, com foco em prazo.', linkedin: 'https://www.linkedin.com/in/carlos-brandao-serra' },
      { nome: 'Sofia Martins', cargo: 'Jurídica imobiliária', bio: 'SPE, afetação de patrimônio e regularização registral de matrícula.', linkedin: 'https://www.linkedin.com/in/sofia-martins-serra' },
    ],
    litoral: [
      { nome: 'Diego Farias', cargo: 'Gestor de incorporação', bio: 'Lançamentos no litoral baiano, com captação privada e club deals.', linkedin: 'https://www.linkedin.com/in/diego-farias-litoral' },
      { nome: 'Ana Beatriz Ramos', cargo: 'Engenheira residente', bio: 'Acompanha execução diária, medições e comprovantes de gasto da obra.', linkedin: 'https://www.linkedin.com/in/ana-beatriz-ramos-litoral' },
    ],
  };
  return times[inc];
}

interface ProjetoSpec {
  readonly slug: string;
  readonly inc: IncKey;
  readonly status: StatusProjeto;
  readonly nome: string;
  readonly cidade: string;
  readonly estado: string;
  readonly endereco: string;
  readonly modelo: Modelo;
  readonly tipoImovel: TipoImovel;
  readonly tipoOferta: TipoOferta;
  readonly modeloRetorno: ModeloRetorno;
  readonly valorTotal: number;
  readonly valorCaptar: number;
  readonly prazoObra: number;
  readonly prazoRetorno: number;
  readonly rentabilidade: number;
  readonly dias: number;
  readonly revisao?: number;
  readonly analista?: AnalistaKey;
  readonly textoAjuste?: string;
  readonly justificativaReprovacao?: string;
  readonly oferta?: { readonly id: string; readonly link: string; readonly modo: CaptacaoModo };
  readonly cronograma?: CronogramaModo;
  readonly rascunhoIncompleto?: boolean;
  readonly reatribuido?: boolean;
}

const PROJETOS: readonly ProjetoSpec[] = [
  { slug: 'horizon-brooklin-rascunho', inc: 'horizon', status: 'RASCUNHO', nome: 'Horizon Brooklin Garden', cidade: 'São Paulo', estado: 'SP', endereco: 'Rua Georgia, 420 — Brooklin', modelo: 'VENDA', tipoImovel: 'RESIDENCIAL', tipoOferta: 'PUBLICA', modeloRetorno: 'NOTA_COMERCIAL', valorTotal: 22_000_000, valorCaptar: 8_200_000, prazoObra: 24, prazoRetorno: 36, rentabilidade: 13.8, dias: 3, rascunhoIncompleto: true },
  { slug: 'horizon-perdizes-rascunho', inc: 'horizon', status: 'RASCUNHO', nome: 'Horizon Perdizes Compact', cidade: 'São Paulo', estado: 'SP', endereco: 'Rua Apiacás, 88 — Perdizes', modelo: 'VENDA', tipoImovel: 'RESIDENCIAL', tipoOferta: 'PUBLICA', modeloRetorno: 'NOTA_COMERCIAL', valorTotal: 18_400_000, valorCaptar: 6_800_000, prazoObra: 20, prazoRetorno: 30, rentabilidade: 14.1, dias: 8 },
  { slug: 'horizon-vista-paulista', inc: 'horizon', status: 'SUBMETIDO', nome: 'Residencial Vista Paulista', cidade: 'São Paulo', estado: 'SP', endereco: 'Alameda Santos, 1450 — Cerqueira César', modelo: 'VENDA', tipoImovel: 'RESIDENCIAL', tipoOferta: 'PUBLICA', modeloRetorno: 'NOTA_COMERCIAL', valorTotal: 22_000_000, valorCaptar: 8_500_000, prazoObra: 24, prazoRetorno: 36, rentabilidade: 14.5, dias: 5 },
  { slug: 'horizon-moema', inc: 'horizon', status: 'EM_ANALISE', nome: 'Horizon Park Moema', cidade: 'São Paulo', estado: 'SP', endereco: 'Av. Ibirapuera, 2100 — Moema', modelo: 'VENDA', tipoImovel: 'RESIDENCIAL', tipoOferta: 'PUBLICA', modeloRetorno: 'NOTA_COMERCIAL', valorTotal: 35_000_000, valorCaptar: 12_000_000, prazoObra: 30, prazoRetorno: 42, rentabilidade: 15.2, dias: 12, analista: 'ana' },
  { slug: 'horizon-pinheiros', inc: 'horizon', status: 'EM_ANALISE', nome: 'Horizon Pinheiros Offices', cidade: 'São Paulo', estado: 'SP', endereco: 'Rua dos Pinheiros, 870', modelo: 'RENDA', tipoImovel: 'COMERCIAL', tipoOferta: 'PRIVADA', modeloRetorno: 'SCP', valorTotal: 28_500_000, valorCaptar: 9_400_000, prazoObra: 22, prazoRetorno: 60, rentabilidade: 12.4, dias: 9, analista: 'marcos', reatribuido: true },
  { slug: 'horizon-vila-madalena', inc: 'horizon', status: 'APROVADO', nome: 'Horizon Vila Madalena Lofts', cidade: 'São Paulo', estado: 'SP', endereco: 'Rua Harmonia, 310 — Vila Madalena', modelo: 'VENDA', tipoImovel: 'RESIDENCIAL', tipoOferta: 'PUBLICA', modeloRetorno: 'NOTA_COMERCIAL', valorTotal: 19_800_000, valorCaptar: 7_200_000, prazoObra: 18, prazoRetorno: 28, rentabilidade: 14.0, dias: 28, analista: 'ana', cronograma: 'planejada' },
  { slug: 'horizon-mooca-oferta', inc: 'horizon', status: 'OFERTA_CRIADA', nome: 'Horizon Mooca Station', cidade: 'São Paulo', estado: 'SP', endereco: 'Rua da Mooca, 2550', modelo: 'VENDA', tipoImovel: 'RESIDENCIAL', tipoOferta: 'PUBLICA', modeloRetorno: 'NOTA_COMERCIAL', valorTotal: 31_000_000, valorCaptar: 11_200_000, prazoObra: 26, prazoRetorno: 38, rentabilidade: 14.8, dias: 40, analista: 'ana', cronograma: 'avancada', oferta: { id: 'dvf-horizon-mooca-01', link: 'https://investir.atlashub.com.br/ofertas/horizon-mooca-station', modo: 'progresso' } },
  { slug: 'horizon-santana-sucesso', inc: 'horizon', status: 'OFERTA_CRIADA', nome: 'Horizon Santana Parque', cidade: 'São Paulo', estado: 'SP', endereco: 'Av. Cruzeiro do Sul, 1800 — Santana', modelo: 'VENDA', tipoImovel: 'RESIDENCIAL', tipoOferta: 'PUBLICA', modeloRetorno: 'NOTA_COMERCIAL', valorTotal: 26_500_000, valorCaptar: 9_800_000, prazoObra: 24, prazoRetorno: 36, rentabilidade: 15.0, dias: 70, analista: 'marcos', cronograma: 'avancada', oferta: { id: 'dvf-horizon-santana-01', link: 'https://investir.atlashub.com.br/ofertas/horizon-santana-parque', modo: 'sucesso' } },
  { slug: 'verde-eco-ajuste', inc: 'verde', status: 'AJUSTE_SOLICITADO', nome: 'Eco Plaza Botafogo', cidade: 'Rio de Janeiro', estado: 'RJ', endereco: 'Rua Voluntários da Pátria, 190 — Botafogo', modelo: 'MISTO', tipoImovel: 'MISTO', tipoOferta: 'PUBLICA', modeloRetorno: 'NOTA_COMERCIAL', valorTotal: 18_000_000, valorCaptar: 6_200_000, prazoObra: 20, prazoRetorno: 32, rentabilidade: 13.2, dias: 8, analista: 'ana', revisao: 2, textoAjuste: 'Atualizar a matrícula do terreno com validade superior a 90 dias e complementar a planilha de orçamento com o custo detalhado de fundação e contenção.' },
  { slug: 'verde-living-reprovado', inc: 'verde', status: 'REPROVADO', nome: 'Verde Living Barra', cidade: 'Rio de Janeiro', estado: 'RJ', endereco: 'Av. das Américas, 5000 — Barra da Tijuca', modelo: 'VENDA', tipoImovel: 'RESIDENCIAL', tipoOferta: 'PUBLICA', modeloRetorno: 'NOTA_COMERCIAL', valorTotal: 40_000_000, valorCaptar: 14_800_000, prazoObra: 36, prazoRetorno: 48, rentabilidade: 11.5, dias: 18, analista: 'marcos', justificativaReprovacao: 'Viabilidade financeira inconsistente com o cronograma apresentado e documentação incompleta, com CND estadual ausente e VGV superestimado para a tipologia.' },
  { slug: 'verde-offices-niteroi', inc: 'verde', status: 'SUBMETIDO', nome: 'Verde Offices Centro', cidade: 'Niterói', estado: 'RJ', endereco: 'Rua da Conceição, 120 — Centro', modelo: 'RENDA', tipoImovel: 'COMERCIAL', tipoOferta: 'PUBLICA', modeloRetorno: 'SCP', valorTotal: 15_500_000, valorCaptar: 5_100_000, prazoObra: 18, prazoRetorno: 48, rentabilidade: 12.8, dias: 2 },
  { slug: 'verde-leme-analise', inc: 'verde', status: 'EM_ANALISE', nome: 'Verde Leme Residences', cidade: 'Rio de Janeiro', estado: 'RJ', endereco: 'Av. Atlântica, 320 — Leme', modelo: 'VENDA', tipoImovel: 'RESIDENCIAL', tipoOferta: 'PRIVADA', modeloRetorno: 'SCP', valorTotal: 24_000_000, valorCaptar: 8_900_000, prazoObra: 22, prazoRetorno: 34, rentabilidade: 13.9, dias: 6, analista: 'ana' },
  { slug: 'verde-gavea-aprovado', inc: 'verde', status: 'APROVADO', nome: 'Verde Gávea Studio', cidade: 'Rio de Janeiro', estado: 'RJ', endereco: 'Rua Marquês de São Vicente, 445 — Gávea', modelo: 'VENDA', tipoImovel: 'RESIDENCIAL', tipoOferta: 'PUBLICA', modeloRetorno: 'NOTA_COMERCIAL', valorTotal: 17_200_000, valorCaptar: 6_400_000, prazoObra: 16, prazoRetorno: 26, rentabilidade: 14.3, dias: 20, analista: 'ana', cronograma: 'atraso' },
  { slug: 'verde-ipanema-sucesso', inc: 'verde', status: 'OFERTA_CRIADA', nome: 'Verde Ipanema Courtyard', cidade: 'Rio de Janeiro', estado: 'RJ', endereco: 'Rua Visconde de Pirajá, 580 — Ipanema', modelo: 'VENDA', tipoImovel: 'RESIDENCIAL', tipoOferta: 'PRIVADA', modeloRetorno: 'SCP', valorTotal: 21_000_000, valorCaptar: 7_500_000, prazoObra: 20, prazoRetorno: 30, rentabilidade: 13.6, dias: 55, analista: 'marcos', cronograma: 'avancada', oferta: { id: 'dvf-verde-ipanema-01', link: 'https://investir.atlashub.com.br/ofertas/verde-ipanema-courtyard', modo: 'sucesso' } },
  { slug: 'verde-recreio-insucesso', inc: 'verde', status: 'OFERTA_CRIADA', nome: 'Verde Recreio Park', cidade: 'Rio de Janeiro', estado: 'RJ', endereco: 'Av. das Américas, 14000 — Recreio', modelo: 'VENDA', tipoImovel: 'RESIDENCIAL', tipoOferta: 'PUBLICA', modeloRetorno: 'NOTA_COMERCIAL', valorTotal: 16_800_000, valorCaptar: 5_600_000, prazoObra: 18, prazoRetorno: 28, rentabilidade: 12.1, dias: 80, analista: 'ana', cronograma: 'planejada', oferta: { id: 'dvf-verde-recreio-01', link: 'https://investir.atlashub.com.br/ofertas/verde-recreio-park', modo: 'insucesso' } },
  { slug: 'atlantic-jurere-rascunho', inc: 'atlantic', status: 'RASCUNHO', nome: 'Atlantic Campeche Dunes', cidade: 'Florianópolis', estado: 'SC', endereco: 'Av. Pequeno Príncipe, 900 — Campeche', modelo: 'VENDA', tipoImovel: 'RESIDENCIAL', tipoOferta: 'PRIVADA', modeloRetorno: 'SCP', valorTotal: 14_200_000, valorCaptar: 4_800_000, prazoObra: 16, prazoRetorno: 24, rentabilidade: 13.0, dias: 4, rascunhoIncompleto: true },
  { slug: 'atlantic-centro-submetido', inc: 'atlantic', status: 'SUBMETIDO', nome: 'Atlantic Centro Histórico', cidade: 'Florianópolis', estado: 'SC', endereco: 'Rua Felipe Schmidt, 210 — Centro', modelo: 'MISTO', tipoImovel: 'MISTO', tipoOferta: 'PUBLICA', modeloRetorno: 'NOTA_COMERCIAL', valorTotal: 12_500_000, valorCaptar: 4_200_000, prazoObra: 14, prazoRetorno: 24, rentabilidade: 12.7, dias: 3 },
  { slug: 'atlantic-beira-mar', inc: 'atlantic', status: 'APROVADO', nome: 'Atlantic Beira Mar', cidade: 'Florianópolis', estado: 'SC', endereco: 'Av. Beira Mar Norte, 200', modelo: 'VENDA', tipoImovel: 'RESIDENCIAL', tipoOferta: 'PRIVADA', modeloRetorno: 'SCP', valorTotal: 28_000_000, valorCaptar: 9_900_000, prazoObra: 24, prazoRetorno: 36, rentabilidade: 14.2, dias: 22, analista: 'ana', cronograma: 'planejada' },
  { slug: 'atlantic-jurere-oferta', inc: 'atlantic', status: 'OFERTA_CRIADA', nome: 'Atlantic Jurerê Club Deal', cidade: 'Florianópolis', estado: 'SC', endereco: 'Alameda César Nascimento, 50 — Jurerê', modelo: 'VENDA', tipoImovel: 'RESIDENCIAL', tipoOferta: 'PRIVADA', modeloRetorno: 'SCP', valorTotal: 12_000_000, valorCaptar: 4_500_000, prazoObra: 18, prazoRetorno: 30, rentabilidade: 13.5, dias: 35, analista: 'ana', cronograma: 'avancada', oferta: { id: 'dvf-atlantic-jurere-01', link: 'https://investir.atlashub.com.br/ofertas/atlantic-jurere-club', modo: 'progresso' } },
  { slug: 'serra-savassi-rascunho', inc: 'serra', status: 'RASCUNHO', nome: 'Serra Savassi House', cidade: 'Belo Horizonte', estado: 'MG', endereco: 'Rua Pernambuco, 1100 — Savassi', modelo: 'VENDA', tipoImovel: 'RESIDENCIAL', tipoOferta: 'PUBLICA', modeloRetorno: 'NOTA_COMERCIAL', valorTotal: 15_800_000, valorCaptar: 5_400_000, prazoObra: 18, prazoRetorno: 28, rentabilidade: 13.4, dias: 6 },
  { slug: 'serra-pampulha-submetido', inc: 'serra', status: 'SUBMETIDO', nome: 'Serra Pampulha Lakes', cidade: 'Belo Horizonte', estado: 'MG', endereco: 'Av. Otacílio Negrão de Lima, 3200', modelo: 'VENDA', tipoImovel: 'RESIDENCIAL', tipoOferta: 'PUBLICA', modeloRetorno: 'NOTA_COMERCIAL', valorTotal: 19_600_000, valorCaptar: 7_100_000, prazoObra: 22, prazoRetorno: 34, rentabilidade: 14.6, dias: 4 },
  { slug: 'serra-lourdes-analise', inc: 'serra', status: 'EM_ANALISE', nome: 'Serra Lourdes Corporate', cidade: 'Belo Horizonte', estado: 'MG', endereco: 'Rua da Bahia, 1400 — Lourdes', modelo: 'RENDA', tipoImovel: 'COMERCIAL', tipoOferta: 'PRIVADA', modeloRetorno: 'SCP', valorTotal: 23_400_000, valorCaptar: 8_300_000, prazoObra: 20, prazoRetorno: 54, rentabilidade: 12.2, dias: 11, analista: 'marcos' },
  { slug: 'serra-belvedere-ajuste', inc: 'serra', status: 'AJUSTE_SOLICITADO', nome: 'Serra Belvedere View', cidade: 'Belo Horizonte', estado: 'MG', endereco: 'Rua Professor Alípio de Melo, 80 — Belvedere', modelo: 'VENDA', tipoImovel: 'RESIDENCIAL', tipoOferta: 'PUBLICA', modeloRetorno: 'NOTA_COMERCIAL', valorTotal: 27_900_000, valorCaptar: 10_500_000, prazoObra: 28, prazoRetorno: 40, rentabilidade: 13.1, dias: 15, analista: 'ana', textoAjuste: 'Incluir memorial de cálculo da contenção de encosta e atualizar alvará de construção com a revisão 2026 da prefeitura.' },
  { slug: 'serra-nova-lima-aprovado', inc: 'serra', status: 'APROVADO', nome: 'Serra Nova Lima Garden', cidade: 'Nova Lima', estado: 'MG', endereco: 'Alameda do Morro, 500 — Vale do Sereno', modelo: 'VENDA', tipoImovel: 'RESIDENCIAL', tipoOferta: 'PUBLICA', modeloRetorno: 'NOTA_COMERCIAL', valorTotal: 32_000_000, valorCaptar: 11_800_000, prazoObra: 30, prazoRetorno: 42, rentabilidade: 14.9, dias: 26, analista: 'marcos', cronograma: 'atraso' },
  { slug: 'serra-contagem-oferta', inc: 'serra', status: 'OFERTA_CRIADA', nome: 'Serra Contagem Logistics', cidade: 'Contagem', estado: 'MG', endereco: 'Av. João César de Oliveira, 7800', modelo: 'RENDA', tipoImovel: 'COMERCIAL', tipoOferta: 'PRIVADA', modeloRetorno: 'SCP', valorTotal: 29_000_000, valorCaptar: 10_200_000, prazoObra: 16, prazoRetorno: 60, rentabilidade: 12.9, dias: 48, analista: 'ana', cronograma: 'avancada', oferta: { id: 'dvf-serra-contagem-01', link: 'https://investir.atlashub.com.br/ofertas/serra-contagem-logistics', modo: 'progresso' } },
  { slug: 'litoral-itacare-rascunho', inc: 'litoral', status: 'RASCUNHO', nome: 'Litoral Itacaré Cliffs', cidade: 'Itacaré', estado: 'BA', endereco: 'Rodovia Ilhéus-Itacaré, km 58', modelo: 'VENDA', tipoImovel: 'RESIDENCIAL', tipoOferta: 'PRIVADA', modeloRetorno: 'SCP', valorTotal: 11_000_000, valorCaptar: 3_900_000, prazoObra: 14, prazoRetorno: 24, rentabilidade: 13.8, dias: 2, rascunhoIncompleto: true },
  { slug: 'litoral-salvador-submetido', inc: 'litoral', status: 'SUBMETIDO', nome: 'Litoral Rio Vermelho', cidade: 'Salvador', estado: 'BA', endereco: 'Rua da Paciência, 77 — Rio Vermelho', modelo: 'VENDA', tipoImovel: 'RESIDENCIAL', tipoOferta: 'PUBLICA', modeloRetorno: 'NOTA_COMERCIAL', valorTotal: 18_700_000, valorCaptar: 6_600_000, prazoObra: 20, prazoRetorno: 32, rentabilidade: 14.4, dias: 7 },
  { slug: 'litoral-praia-do-forte-analise', inc: 'litoral', status: 'EM_ANALISE', nome: 'Litoral Praia do Forte', cidade: 'Mata de São João', estado: 'BA', endereco: 'Alameda do Sol, 12 — Praia do Forte', modelo: 'VENDA', tipoImovel: 'RESIDENCIAL', tipoOferta: 'PRIVADA', modeloRetorno: 'SCP', valorTotal: 20_400_000, valorCaptar: 7_800_000, prazoObra: 18, prazoRetorno: 30, rentabilidade: 13.7, dias: 10, analista: 'marcos' },
  { slug: 'litoral-porto-seguro-reprovado', inc: 'litoral', status: 'REPROVADO', nome: 'Litoral Porto Seguro Marina', cidade: 'Porto Seguro', estado: 'BA', endereco: 'Av. Beira Mar, 1500 — Arraial d\'Ajuda', modelo: 'MISTO', tipoImovel: 'MISTO', tipoOferta: 'PUBLICA', modeloRetorno: 'NOTA_COMERCIAL', valorTotal: 13_200_000, valorCaptar: 4_700_000, prazoObra: 16, prazoRetorno: 26, rentabilidade: 11.2, dias: 21, analista: 'ana', justificativaReprovacao: 'Risco ambiental elevado na faixa de marinha, alvará municipal condicionado e estudo de demanda incompatível com a sazonalidade local.' },
  { slug: 'litoral-aracaju-aprovado', inc: 'litoral', status: 'APROVADO', nome: 'Litoral Aracaju Orla', cidade: 'Aracaju', estado: 'SE', endereco: 'Av. Santos Dumont, 800 — Atalaia', modelo: 'VENDA', tipoImovel: 'RESIDENCIAL', tipoOferta: 'PUBLICA', modeloRetorno: 'NOTA_COMERCIAL', valorTotal: 16_100_000, valorCaptar: 5_900_000, prazoObra: 18, prazoRetorno: 28, rentabilidade: 13.3, dias: 19, analista: 'marcos', cronograma: 'planejada' },
  { slug: 'litoral-salvador-sucesso', inc: 'litoral', status: 'OFERTA_CRIADA', nome: 'Litoral Pituba Sky', cidade: 'Salvador', estado: 'BA', endereco: 'Av. Paulo VI, 222 — Pituba', modelo: 'VENDA', tipoImovel: 'RESIDENCIAL', tipoOferta: 'PUBLICA', modeloRetorno: 'NOTA_COMERCIAL', valorTotal: 25_600_000, valorCaptar: 9_100_000, prazoObra: 24, prazoRetorno: 36, rentabilidade: 14.7, dias: 62, analista: 'ana', cronograma: 'avancada', oferta: { id: 'dvf-litoral-pituba-01', link: 'https://investir.atlashub.com.br/ofertas/litoral-pituba-sky', modo: 'sucesso' } },
];

function scoreNotas(status: StatusProjeto): { loc: number; fin: number; doc: number; eq: number; risco: number; locC: string; finC: string; docC: string; eqC: string; riscoC: string; parecer: string } {
  if (status === 'REPROVADO') {
    return {
      loc: 6, fin: 3, doc: 4, eq: 6, risco: 3,
      locC: 'Demanda existe, mas o entorno apresenta restrições urbanísticas relevantes.',
      finC: 'VGV e cronograma não se sustentam juntos; necessidade de capital está subdimensionada.',
      docC: 'Faltam certidões e o alvará está desatualizado para a revisão atual do projeto.',
      eqC: 'Equipe técnica adequada, porém sem histórico no tipo de risco identificado.',
      riscoC: 'Risco de execução e regularização acima do apetite da curadoria Atlas.',
      parecer: 'Reprovado. O dossiê não atende os critérios mínimos de viabilidade e documentação.',
    };
  }
  if (status === 'AJUSTE_SOLICITADO') {
    return {
      loc: 8, fin: 6, doc: 5, eq: 8, risco: 6,
      locC: 'Boa absorção regional e infraestrutura consolidada.',
      finC: 'Margem aceitável, mas o orçamento precisa detalhar fundação e contingência.',
      docC: 'Matrícula e alvará precisam ser atualizados antes da aprovação.',
      eqC: 'Equipe com experiência comprovada no padrão do produto.',
      riscoC: 'Risco moderado e mitigável com a documentação pendente.',
      parecer: 'Análise interrompida para ajuste. Reapresentar documentos e orçamento complementar.',
    };
  }
  return {
    loc: 8, fin: 8, doc: 8, eq: 8, risco: 7,
    locC: 'Localização com demanda consistente e liquidez de revenda acima da média da praça.',
    finC: 'VGV, custo de obra e captação estão coerentes com o prazo e com o teto CVM 88.',
    docC: 'Dossiê completo, certidões válidas e SPE/SCP regular.',
    eqC: 'Responsável técnico e gestão de obra com entregas anteriores auditáveis.',
    riscoC: 'Risco de execução moderado, mercado absorvente e cronograma factível.',
    parecer: 'Projeto aprovado. Patrimônio de afetação, seguro de obra, SPE/SCP e elegibilidade CVM 88 conferidos.',
  };
}

async function run(): Promise<void> {
  console.log(`Seed local rico — stage ${stage} pool ${poolId}`);

  const gabrielId = await ensureCognitoUser('gabriel@atlashub.com.br', 'ADMIN_MASTER');
  const luciaId = await ensureCognitoUser('lucia.mendes@atlashub.com.br', 'ADMIN_MASTER');
  const anaId = await ensureCognitoUser('analista@atlashub.com.br', 'ANALISTA');
  const marcosId = await ensureCognitoUser('marcos.oliveira@atlashub.com.br', 'ANALISTA');

  const admins: Record<'gabriel' | 'lucia' | 'ana' | 'marcos', ContaUser> = {
    gabriel: { id: gabrielId, email: 'gabriel@atlashub.com.br', nome: 'Gabriel Flores' },
    lucia: { id: luciaId, email: 'lucia.mendes@atlashub.com.br', nome: 'Lúcia Mendes' },
    ana: { id: anaId, email: 'analista@atlashub.com.br', nome: 'Ana Curadora' },
    marcos: { id: marcosId, email: 'marcos.oliveira@atlashub.com.br', nome: 'Marcos Oliveira' },
  };

  await put(T.admins, { id: gabrielId, nome: admins.gabriel.nome, email: admins.gabriel.email, perfil: 'ADMIN_MASTER', ativo: true, criadoPor: 'seed', criadoEm: isoDays(40) });
  await put(T.admins, { id: luciaId, nome: admins.lucia.nome, email: admins.lucia.email, perfil: 'ADMIN_MASTER', ativo: true, criadoPor: gabrielId, criadoEm: isoDays(18) });
  await put(T.admins, { id: anaId, nome: admins.ana.nome, email: admins.ana.email, perfil: 'ANALISTA', ativo: true, criadoPor: gabrielId, criadoEm: isoDays(32) });
  await put(T.admins, { id: marcosId, nome: admins.marcos.nome, email: admins.marcos.email, perfil: 'ANALISTA', ativo: true, criadoPor: luciaId, criadoEm: isoDays(16) });

  const incsMeta: Array<{ key: IncKey; email: string; cnpjBase: string; cpfBase: string; razao: string; nome: string; cargo: string; tel: string; end: string; site: string; desc: string; hist: string }> = [
    { key: 'horizon', email: 'contato@horizonconstrutora.com.br', cnpjBase: '123456780001', cpfBase: '123456789', razao: 'Horizon Construtora Ltda', nome: 'Carlos Mendes', cargo: 'Diretor de Incorporação', tel: '11988881001', end: 'Av. Paulista, 1000 — São Paulo/SP', site: 'https://horizonconstrutora.com.br', desc: 'Incorporadora focada em residenciais de médio padrão na Grande São Paulo, com entregas desde 2012.', hist: 'Doze empreendimentos entregues e três em obras na RMSP.' },
    { key: 'verde', email: 'projetos@verdeurbano.com.br', cnpjBase: '234567890001', cpfBase: '987654321', razao: 'Verde Urbano Empreendimentos S.A.', nome: 'Mariana Costa', cargo: 'CEO', tel: '21977772002', end: 'Rua do Ouvidor, 50 — Rio de Janeiro/RJ', site: 'https://verdeurbano.com.br', desc: 'Projetos sustentáveis e mistos, com ênfase em eficiência energética e uso misto.', hist: 'Oito projetos entregues; dois em obras na região metropolitana do Rio.' },
    { key: 'atlantic', email: 'admin@atlanticresidencial.com.br', cnpjBase: '345678900001', cpfBase: '456789123', razao: 'Atlantic Residencial SPE', nome: 'Pedro Almeida', cargo: 'Sócio-administrador', tel: '48966663003', end: 'Av. Beira Mar Norte, 200 — Florianópolis/SC', site: 'https://atlanticresidencial.com.br', desc: 'SPE dedicada a empreendimentos litorâneos no Sul, com club deals privados.', hist: 'Primeiro ciclo completo na plataforma Atlas Hub, com oferta em Jurerê.' },
    { key: 'serra', email: 'contato@serradourada.com.br', cnpjBase: '412345670001', cpfBase: '321654987', razao: 'Serra Dourada Incorporações Ltda', nome: 'Helena Prado', cargo: 'Diretora-presidente', tel: '31995554004', end: 'Av. Afonso Pena, 1500 — Belo Horizonte/MG', site: 'https://serradourada.com.br', desc: 'Incorporadora mineira de médio porte, com verticalização em BH, Nova Lima e Contagem.', hist: 'Seis torres entregues na RMBH e um galpão logístico em operação.' },
    { key: 'litoral', email: 'projetos@litoralnorte.com.br', cnpjBase: '556677880001', cpfBase: '741852963', razao: 'Litoral Norte Empreendimentos Ltda', nome: 'Rafael Queiroz', cargo: 'Diretor comercial', tel: '71994443005', end: 'Av. Tancredo Neves, 620 — Salvador/BA', site: 'https://litoralnorte.com.br', desc: 'Foco em produto de segunda residência e orla, com captação pública e privada.', hist: 'Quatro condomínios entregues no litoral baiano e um em Sergipe.' },
  ];

  const incs = {} as Record<IncKey, ContaUser & { razao: string }>;
  for (const inc of incsMeta) {
    const id = await ensureCognitoUser(inc.email, 'INCORPORADORA');
    await put(T.incorporadoras, {
      id,
      cnpj: cnpjFromBase(inc.cnpjBase),
      razaoSocial: inc.razao,
      nomeResponsavel: inc.nome,
      cpfResponsavel: cpfFromBase(inc.cpfBase),
      cargoResponsavel: inc.cargo,
      email: inc.email,
      telefone: inc.tel,
      emailConfirmado: true,
      criadoEm: isoDays(50),
      atualizadoEm: isoDays(1),
      endereco: inc.end,
      site: inc.site,
      descricao: inc.desc,
      historicoAnterior: inc.hist,
      contratoSocialUrl: `https://atlas-hub-documents-dev.s3.sa-east-1.amazonaws.com/seed/inc/${inc.key}/contrato-social.pdf`,
      comprovanteCnpjUrl: `https://atlas-hub-documents-dev.s3.sa-east-1.amazonaws.com/seed/inc/${inc.key}/cartao-cnpj.pdf`,
    });
    incs[inc.key] = { id, email: inc.email, nome: inc.nome, razao: inc.razao };
    console.log(`  incorporadora ${inc.razao}`);
  }

  const scorecards: Record<string, unknown>[] = [];
  const auditoria: Record<string, unknown>[] = [];
  const notas: Record<string, unknown>[] = [];
  const notificacoes: Record<string, unknown>[] = [];
  const etapas: Record<string, unknown>[] = [];
  const lancamentos: Record<string, unknown>[] = [];
  const captacaoEventos: Record<string, unknown>[] = [];
  const captacaoCompras: Record<string, unknown>[] = [];
  const speContas: Record<string, unknown>[] = [];
  const ledger: Record<string, unknown>[] = [];
  const solicitacoes: Record<string, unknown>[] = [];
  const finAuditoria: Record<string, unknown>[] = [];
  const speCartoes: Record<string, unknown>[] = [];

  function analistaDe(key: AnalistaKey | undefined): ContaUser {
    if (key === 'marcos') return admins.marcos;
    return admins.ana;
  }

  function pushAudit(projetoId: string, criadoEm: string, acao: string, user: ContaUser, descricao: string, statusAnterior?: StatusProjeto, statusNovo?: StatusProjeto): void {
    auditoria.push({
      projetoId,
      criadoEm,
      acao,
      userId: user.id,
      userName: user.nome,
      descricao,
      ...(statusAnterior !== undefined ? { statusAnterior } : {}),
      ...(statusNovo !== undefined ? { statusNovo } : {}),
    });
  }

  function pushNotaInc(userId: string, criadoEm: string, tipo: string, titulo: string, mensagem: string, projetoId: string, projetoNome: string, lida: boolean): void {
    notificacoes.push({
      userId,
      criadoEm,
      id: sid(`notif:${projetoId}:${tipo}`),
      tipo,
      titulo,
      mensagem,
      lida,
      projetoId,
      projetoNome,
      ttl: ttlNotificacao,
    });
  }

  function montarCronograma(spec: ProjetoSpec, projetoId: string, owner: ContaUser): void {
    const modo = spec.cronograma;
    if (modo === undefined) return;
    if (spec.status !== 'APROVADO' && spec.status !== 'OFERTA_CRIADA') return;
    const nomes = ['Fundação', 'Estrutura', 'Alvenaria', 'Instalações', 'Acabamento', 'Entrega'];
    const orcados = [50_000, 80_000, 50_000, 40_000, 70_000, 20_000];
    const inicio0 = modo === 'planejada' ? ymdShift(ymdDays(0), 20) : ymdDays(200);
    for (let i = 0; i < nomes.length; i += 1) {
      const etapaId = sid(`etapa:${spec.slug}:${String(i)}`);
      const inicioPrevisto = ymdShift(inicio0, i * 45);
      const fimPrevisto = ymdShift(inicioPrevisto, 40);
      let percentual = 0;
      let inicioReal: string | undefined;
      let fimReal: string | undefined;
      if (modo === 'planejada') {
        percentual = 0;
      } else if (modo === 'avancada') {
        if (i === 0) { percentual = 100; inicioReal = ymdShift(inicioPrevisto, 1); fimReal = ymdShift(fimPrevisto, 3); }
        else if (i === 1) { percentual = 100; inicioReal = ymdShift(inicioPrevisto, 0); fimReal = fimPrevisto; }
        else if (i === 2) { percentual = 55; inicioReal = ymdShift(inicioPrevisto, 2); }
        else percentual = 0;
      } else {
        if (i === 0) { percentual = 100; inicioReal = inicioPrevisto; fimReal = ymdShift(fimPrevisto, 2); }
        else if (i === 1) { percentual = 40; inicioReal = ymdShift(inicioPrevisto, 4); }
        else percentual = 0;
      }
      const criadoEm = isoDays(spec.dias - 6, i * 1000);
      etapas.push({
        projetoId,
        etapaId,
        nome: nomes[i],
        ordem: i + 1,
        inicioPrevisto,
        fimPrevisto,
        percentualExecucao: percentual,
        valorOrcado: orcados[i],
        criadoEm,
        atualizadoEm: isoDays(Math.max(0, spec.dias - 10), i * 1000),
        ...(inicioReal !== undefined ? { inicioReal } : {}),
        ...(fimReal !== undefined ? { fimReal } : {}),
      });

      if (modo === 'planejada') continue;
      if (i === 0) {
        lancamentos.push({
          projetoId, lancamentoId: sid(`gasto:${spec.slug}:0a`), etapaId,
          descricao: 'Concreto e forma da fundação', valor: 49_000, dataLancamento: ymdShift(inicioPrevisto, 10),
          status: 'CONFIRMADO', criadoPor: owner.id, criadoEm: isoDays(spec.dias - 12), atualizadoEm: isoDays(spec.dias - 12),
        });
        lancamentos.push({
          projetoId, lancamentoId: sid(`gasto:${spec.slug}:0b`), etapaId,
          descricao: 'Lançamento duplicado cancelado', valor: 8_000, dataLancamento: ymdShift(inicioPrevisto, 11),
          status: 'CANCELADO', criadoPor: owner.id, criadoEm: isoDays(spec.dias - 11), atualizadoEm: isoDays(spec.dias - 10),
        });
      }
      if (i === 1 && modo === 'avancada') {
        lancamentos.push({
          projetoId, lancamentoId: sid(`gasto:${spec.slug}:1a`), etapaId,
          descricao: 'Estrutura — concreto usinado', valor: 92_000, dataLancamento: ymdShift(inicioPrevisto, 15),
          status: 'CONFIRMADO', criadoPor: owner.id, criadoEm: isoDays(spec.dias - 20), atualizadoEm: isoDays(spec.dias - 20),
        });
      }
      if (i === 2 && modo === 'avancada') {
        lancamentos.push({
          projetoId, lancamentoId: sid(`gasto:${spec.slug}:2a`), etapaId,
          descricao: 'Alvenaria — blocos e argamassa', valor: 49_000, dataLancamento: ymdShift(inicioPrevisto, 8),
          status: 'CONFIRMADO', criadoPor: owner.id, criadoEm: isoDays(spec.dias - 8), atualizadoEm: isoDays(spec.dias - 8),
        });
      }
      if (i === 1 && modo === 'atraso') {
        lancamentos.push({
          projetoId, lancamentoId: sid(`gasto:${spec.slug}:1x`), etapaId,
          descricao: 'Estrutura parcial — aço CA-50', valor: 33_000, dataLancamento: ymdShift(inicioPrevisto, 20),
          status: 'CONFIRMADO', criadoPor: owner.id, criadoEm: isoDays(spec.dias - 7), atualizadoEm: isoDays(spec.dias - 7),
        });
      }
    }
  }

  function montarCaptacao(spec: ProjetoSpec, projetoId: string): void {
    const oferta = spec.oferta;
    if (oferta === undefined) return;
    const modo = oferta.modo;
    const alvoCents = spec.valorCaptar * 100;
    const nInvestidores = modo === 'insucesso' ? 6 : modo === 'progresso' ? 11 : 16;
    const aprovadas = modo === 'insucesso' ? 3 : modo === 'progresso' ? 8 : 14;
    const valorAprovadoAlvo = modo === 'insucesso'
      ? Math.round(alvoCents * 0.42)
      : modo === 'progresso'
        ? Math.round(alvoCents * 0.61)
        : Math.round(alvoCents * 1.04);
    const baseDia = spec.dias - 8;

    for (let i = 0; i < nInvestidores; i += 1) {
      const investorId = sid(`inv:${spec.slug}:${String(i)}`);
      const recebidoEm = isoDays(baseDia - i, i * 4000);
      captacaoEventos.push({
        id: sid(`evt:${spec.slug}:user:${String(i)}`),
        tipo: 'USER_ACTIVE',
        tipoOriginal: 'UserActiveEvent',
        recebidoEm,
        occurredAt: recebidoEm,
        ofertaId: oferta.id,
        investorId,
        projetoId,
        projetoNome: spec.nome,
        payload: { offerId: oferta.id, userId: investorId },
      });
      captacaoEventos.push({
        id: sid(`evt:${spec.slug}:inv:${String(i)}`),
        tipo: 'INVESTOR_CREATED',
        tipoOriginal: 'InvestorCreatedEvent',
        recebidoEm: isoDays(baseDia - i, i * 4000 + 500),
        occurredAt: isoDays(baseDia - i, i * 4000 + 500),
        ofertaId: oferta.id,
        investorId,
        projetoId,
        projetoNome: spec.nome,
        payload: { offerId: oferta.id, investorId },
      });
    }

    let alocado = 0;
    for (let i = 0; i < nInvestidores; i += 1) {
      const purchaseId = sid(`buy:${spec.slug}:${String(i)}`);
      const investorId = sid(`inv:${spec.slug}:${String(i)}`);
      const aprovada = i < aprovadas;
      const restantes = Math.max(1, aprovadas - i);
      const amountCents = aprovada
        ? (i === aprovadas - 1 ? Math.max(50_000_00, valorAprovadoAlvo - alocado) : Math.round(valorAprovadoAlvo / aprovadas))
        : 25_000_00;
      if (aprovada) alocado += amountCents;
      const status = aprovada ? (modo === 'sucesso' ? 'COMPLETED' : 'APPROVED') : 'EXPIRED';
      const recebidoEm = isoDays(baseDia - i - 1, i * 3000);
      captacaoCompras.push({
        ofertaId: oferta.id,
        purchaseId,
        status,
        atualizadoEm: recebidoEm,
        recebidoEm,
        investorId,
        amountCents,
        projetoId,
        projetoNome: spec.nome,
      });
      captacaoEventos.push({
        id: sid(`evt:${spec.slug}:buy:${String(i)}`),
        tipo: aprovada ? 'PURCHASE_APPROVED' : 'PURCHASE_EXPIRED',
        tipoOriginal: aprovada ? 'PurchaseApprovedEvent' : 'PurchaseExpiredEvent',
        recebidoEm,
        occurredAt: recebidoEm,
        ofertaId: oferta.id,
        purchaseId,
        investorId,
        status,
        amountCents,
        projetoId,
        projetoNome: spec.nome,
        payload: { offerId: oferta.id, purchaseId, amountCents, status },
      });
    }

    if (modo === 'sucesso' || modo === 'insucesso') {
      const encerradoEm = isoDays(Math.max(1, spec.dias - 30));
      captacaoEventos.push({
        id: sid(`evt:${spec.slug}:fim`),
        tipo: modo === 'sucesso' ? 'OFFER_FINISHED_SUCCESS' : 'OFFER_FINISHED_UNSUCCESS',
        tipoOriginal: modo === 'sucesso' ? 'OfferFinishedSuccessEvent' : 'OfferFinishedUnsuccessEvent',
        recebidoEm: encerradoEm,
        occurredAt: encerradoEm,
        ofertaId: oferta.id,
        projetoId,
        projetoNome: spec.nome,
        payload: { offerId: oferta.id, result: modo },
      });
    }
  }

  function montarFinanceiroSpe(spec: ProjetoSpec, projetoId: string): void {
    if (spec.status !== 'OFERTA_CRIADA') return;
    if (spec.oferta?.modo === 'insucesso') return;
    const workspaceId = sid(`ws:${spec.slug}`);
    const criadoEm = isoDays(spec.dias - 7);
    const cnpjSpe = cnpjFromBase(createHash('sha256').update(spec.slug).digest('hex').replace(/\D/g, '').padEnd(12, '8').slice(0, 12));
    speContas.push({
      projetoId,
      tipo: 'SPE',
      workspaceId,
      username: `spe-${spec.slug}`.slice(0, 32),
      status: 'ATIVA',
      cnpjSpe,
      razaoSocialSpe: `SPE ${spec.nome}`,
      pixKey: cnpjSpe,
      projetoNome: spec.nome,
      criadoEm,
      atualizadoEm: criadoEm,
      criadoPor: admins.gabriel.id,
    });
    finAuditoria.push({
      projetoId, criadoEm, id: sid(`finaud:${spec.slug}:conta`), acao: 'CONTA_CRIADA',
      userId: admins.gabriel.id, userName: admins.gabriel.nome,
      descricao: `Workspace SPE criado para SPE ${spec.nome}`, workspaceId,
    });

    if (spec.oferta?.modo !== 'sucesso') return;

    const depositoEm = isoDays(spec.dias - 28);
    ledger.push({
      projetoId, starkId: sid(`led:${spec.slug}:dep`), workspaceId, tipo: 'DEPOSIT',
      amount: 850_000_00, description: 'Aporte operacional da incorporadora após o sucesso da oferta',
      criadoEm: depositoEm, conciliado: true, source: 'webhook', tags: ['pos-sucesso', 'aporte-spe'],
    });
    finAuditoria.push({
      projetoId, criadoEm: depositoEm, id: sid(`finaud:${spec.slug}:dep`), acao: 'WEBHOOK_CONCILIADO',
      userId: 'stark-webhook', userName: 'Stark Bank',
      descricao: 'Depósito operacional conciliado no workspace da SPE', workspaceId,
    });

    const solExecId = sid(`sol:${spec.slug}:exec`);
    const solPendId = sid(`sol:${spec.slug}:pend`);
    const solicitadoEm = isoDays(spec.dias - 20);
    const aprovadoEm = isoDays(spec.dias - 19);
    solicitacoes.push({
      id: solExecId, projetoId, workspaceId, amount: 120_000_00,
      description: 'Pix para fornecedor de concreto (caixa operacional da SPE)',
      destino: { pixKey: cnpjFromBase('112223330001'), name: 'Cimento e Cia Ltda', taxId: cnpjFromBase('112223330001'), bankCode: '001', branchCode: '3456', accountNumber: '123456-7', accountType: 'checking' },
      status: 'EXECUTADA', solicitadoPor: admins.gabriel.id, solicitadoPorNome: admins.gabriel.nome, solicitadoEm,
      aprovadoPor: admins.lucia.id, aprovadoPorNome: admins.lucia.nome, aprovadoEm, starkTransferId: sid(`tr:${spec.slug}`),
    });
    finAuditoria.push({ projetoId, criadoEm: solicitadoEm, id: sid(`finaud:${spec.slug}:sol`), acao: 'SOLICITACAO_CRIADA', userId: admins.gabriel.id, userName: admins.gabriel.nome, descricao: 'Solicitação de Pix de R$ 120000.00', solicitacaoId: solExecId, workspaceId });
    finAuditoria.push({ projetoId, criadoEm: aprovadoEm, id: sid(`finaud:${spec.slug}:apr`), acao: 'SOLICITACAO_APROVADA', userId: admins.lucia.id, userName: admins.lucia.nome, descricao: 'Segundo admin master aprovou a movimentação', solicitacaoId: solExecId, workspaceId });
    finAuditoria.push({ projetoId, criadoEm: isoDays(spec.dias - 19, 2_000), id: sid(`finaud:${spec.slug}:pix`), acao: 'TRANSFERENCIA_EXECUTADA', userId: admins.lucia.id, userName: admins.lucia.nome, descricao: 'Pix executado', solicitacaoId: solExecId, workspaceId });
    ledger.push({
      projetoId, starkId: sid(`led:${spec.slug}:pix`), workspaceId, tipo: 'TRANSFER',
      amount: -120_000_00, description: 'Pix para fornecedor de concreto (caixa operacional da SPE)',
      criadoEm: aprovadoEm, conciliado: true, source: 'sync', tags: [`solicitacao:${solExecId}`],
    });

    solicitacoes.push({
      id: solPendId, projetoId, workspaceId, amount: 45_000_00,
      description: 'Pix de adiantamento a projetista (aguarda 2ª aprovação)',
      destino: { name: 'Studio Estrutural Ltda', taxId: cnpjFromBase('223334440001'), bankCode: '033', branchCode: '2001', accountNumber: '99887-1', accountType: 'checking' },
      status: 'PENDENTE', solicitadoPor: admins.gabriel.id, solicitadoPorNome: admins.gabriel.nome, solicitadoEm: isoSalt(1, `solpend:${spec.slug}`),
    });
    finAuditoria.push({ projetoId, criadoEm: isoSalt(1, `finaudpend:${spec.slug}`), id: sid(`finaud:${spec.slug}:pend`), acao: 'SOLICITACAO_CRIADA', userId: admins.gabriel.id, userName: admins.gabriel.nome, descricao: 'Solicitação de Pix de R$ 45000.00', solicitacaoId: solPendId, workspaceId });
  }

  function montarCartaoSpe(spec: ProjetoSpec, projetoId: string): void {
    if (spec.status !== 'OFERTA_CRIADA') return;
    if (spec.oferta?.modo === 'insucesso') return;
    const limites = etapas
      .filter((e) => e['projetoId'] === projetoId)
      .sort((a, b) => Number(a['ordem']) - Number(b['ordem']))
      .map((e) => ({
        etapaId: String(e['etapaId']),
        nome: String(e['nome']),
        ordem: Number(e['ordem']),
        valorOrcado: Number(e['valorOrcado']),
        limiteProposto: Number(e['valorOrcado']),
      }));
    if (limites.length === 0) return;
    if (spec.oferta?.modo !== 'sucesso') return;
    const solicitadoEm = isoDays(spec.dias - 8, 3_000);
    speCartoes.push({
      projetoId,
      status: 'SOLICITADO',
      titularidade: 'SPE',
      pagamentoFatura: 'INTEGRAL_AUTOMATICO',
      cashbackDestino: 'SPE',
      receitaAtlas: 'COMISSAO_COMERCIAL',
      limites,
      confirmacoes: { titularSpe: true, faturaIntegral: true, semRotativo: true, cashbackNaSpe: true },
      criadoEm: solicitadoEm,
      atualizadoEm: solicitadoEm,
      solicitadoPor: admins.gabriel.id,
      solicitadoPorNome: admins.gabriel.nome,
      solicitadoEm,
    });
    finAuditoria.push({
      projetoId, criadoEm: solicitadoEm, id: sid(`finaud:${spec.slug}:cartao`), acao: 'CARTAO_SOLICITADO',
      userId: admins.gabriel.id, userName: admins.gabriel.nome,
      descricao: `Solicitação interna de cartão com ${String(limites.length)} etapa(s)`,
    });
  }

  for (const spec of PROJETOS) {
    const owner = incs[spec.inc];
    const projetoId = sid(`projeto:${spec.slug}`);
    const criadoEm = isoDays(spec.dias, 10);
    const submetidoEm = spec.status === 'RASCUNHO' ? undefined : isoDays(spec.dias - 1, 20);
    const analista = analistaDe(spec.analista);
    const completo = spec.rascunhoIncompleto !== true;
    const unidades = Math.max(20, Math.round(spec.valorTotal / 420_000));
    const custoObra = Math.round(spec.valorTotal * 0.62);
    const valorTerreno = Math.round(spec.valorTotal * 0.18);
    const preco = Math.round(spec.valorTotal / unidades);

    const item: Record<string, unknown> = {
      id: projetoId,
      incorporadoraId: owner.id,
      status: spec.status,
      revisao: spec.revisao ?? 1,
      nome: spec.nome,
      modelo: spec.modelo,
      tipoImovel: spec.tipoImovel,
      cidade: spec.cidade,
      estado: spec.estado,
      endereco: spec.endereco,
      descricao: descricaoEmpreendimento(spec.nome, spec.cidade, spec.modelo),
      criadoEm,
      atualizadoEm: isoDays(Math.max(0, spec.dias - 3), 30),
    };

    if (completo) {
      item['fotosUrls'] = [FOTOS[spec.dias % FOTOS.length], FOTOS[(spec.dias + 1) % FOTOS.length]];
      item['valorTotal'] = spec.valorTotal;
      item['valorCaptar'] = spec.valorCaptar;
      item['prazoObra'] = spec.prazoObra;
      item['prazoRetorno'] = spec.prazoRetorno;
      item['rentabilidadeEstimada'] = spec.rentabilidade;
      item['modeloRetorno'] = spec.modeloRetorno;
      item['planoSaida'] = spec.modelo === 'RENDA'
        ? 'Locação das unidades e distribuição periódica do resultado aos cotistas, com venda do ativo ao final do prazo.'
        : 'Venda das unidades e distribuição do resultado após habite-se e quitação da obra.';
      item['tipoOferta'] = spec.tipoOferta;
      item['documentos'] = docsDe(spec.slug);
      item['equipe'] = equipeDe(spec.inc);
      item['viabilidade'] = calcularViabilidade({
        unidades, custoObra, precoMedioUnidade: preco, prazoMeses: spec.prazoObra, valorTerreno,
      });
    }

    if (spec.analista !== undefined) {
      item['analistaId'] = analista.id;
      item['analistaNome'] = analista.nome;
    }
    if (submetidoEm !== undefined) item['submetidoEm'] = submetidoEm;
    if (spec.textoAjuste !== undefined) item['textoAjuste'] = spec.textoAjuste;
    if (spec.justificativaReprovacao !== undefined) {
      item['justificativaReprovacao'] = spec.justificativaReprovacao;
      item['reprovadoEm'] = isoDays(spec.dias - 4, 40);
    }
    if (spec.status === 'APROVADO' || spec.status === 'OFERTA_CRIADA') {
      item['aprovadoEm'] = isoDays(spec.dias - 5, 50);
    }
    if (spec.oferta !== undefined) {
      item['ofertaId'] = spec.oferta.id;
      item['ofertaLink'] = spec.oferta.link;
      item['ofertaConfirmadaEm'] = isoDays(spec.dias - 6, 60);
    }

    await put(T.projetos, item);
    console.log(`  projeto [${spec.status}] ${spec.nome}`);

    pushAudit(projetoId, criadoEm, 'CRIADO', owner, 'Projeto criado como rascunho', undefined, 'RASCUNHO');

    if (spec.status !== 'RASCUNHO') {
      pushAudit(projetoId, submetidoEm ?? criadoEm, 'SUBMETIDO', owner, 'Projeto submetido para análise', 'RASCUNHO', 'SUBMETIDO');
      pushNotaInc(owner.id, submetidoEm ?? criadoEm, 'PROJETO_SUBMETIDO', 'Projeto submetido', `Seu projeto "${spec.nome}" foi submetido com sucesso e aguarda análise.`, projetoId, spec.nome, true);
    }

    if (spec.revisao !== undefined && spec.revisao > 1) {
      pushAudit(projetoId, isoDays(spec.dias - 1, 25), 'RESUBMETIDO', owner, `Projeto resubmetido (revisão ${String(spec.revisao)})`, 'AJUSTE_SOLICITADO', 'SUBMETIDO');
    }

    if (spec.analista !== undefined) {
      const inicioEm = isoDays(spec.dias - 2, 70);
      pushAudit(projetoId, inicioEm, 'ANALISE_INICIADA', analista, 'Análise iniciada pelo analista', 'SUBMETIDO', 'EM_ANALISE');
      pushNotaInc(owner.id, inicioEm, 'ANALISE_INICIADA', 'Análise iniciada', `A curadoria iniciou a análise de "${spec.nome}".`, projetoId, spec.nome, spec.status !== 'EM_ANALISE');
      if (spec.reatribuido === true) {
        pushAudit(projetoId, isoDays(spec.dias - 2, 90), 'REATRIBUIDO', admins.gabriel, 'Reatribuição para balancear a fila de curadoria', 'EM_ANALISE', 'EM_ANALISE');
      }

      const n = scoreNotas(spec.status);
      const decisoes: Partial<Record<StatusProjeto, 'APROVADO' | 'REPROVADO' | 'AJUSTE_SOLICITADO' | 'RASCUNHO'>> = {
        APROVADO: 'APROVADO',
        OFERTA_CRIADA: 'APROVADO',
        REPROVADO: 'REPROVADO',
        AJUSTE_SOLICITADO: 'AJUSTE_SOLICITADO',
        EM_ANALISE: 'RASCUNHO',
      };
      scorecards.push({
        projetoId,
        revisao: spec.revisao ?? 1,
        analistaId: analista.id,
        analistaNome: analista.nome,
        localizacaoNota: n.loc,
        localizacaoComentario: n.locC,
        financeiraNota: n.fin,
        financeiraComentario: n.finC,
        documentacaoNota: n.doc,
        documentacaoComentario: n.docC,
        equipeNota: n.eq,
        equipeComentario: n.eqC,
        riscoNota: n.risco,
        riscoComentario: n.riscoC,
        notaGeral: notaGeral(n),
        parecer: n.parecer,
        decisao: decisoes[spec.status] ?? 'RASCUNHO',
        criadoEm: inicioEm,
        atualizadoEm: isoDays(spec.dias - 3, 80),
      });
      notas.push({
        projetoId,
        criadoEm: isoDays(spec.dias - 2, 110),
        analistaId: analista.id,
        analistaNome: analista.nome,
        texto: `Nota interna: conferir liquidez de ${spec.cidade}/${spec.estado} e a coerência entre prazo de obra (${String(spec.prazoObra)} meses) e captação de R$ ${spec.valorCaptar.toLocaleString('pt-BR')}.`,
      });
    }

    if (spec.status === 'AJUSTE_SOLICITADO') {
      pushAudit(projetoId, isoDays(spec.dias - 3, 120), 'AJUSTE_SOLICITADO', analista, `Ajuste solicitado: ${spec.textoAjuste ?? ''}`, 'EM_ANALISE', 'AJUSTE_SOLICITADO');
      pushNotaInc(owner.id, isoDays(spec.dias - 3, 120), 'AJUSTE_SOLICITADO', 'Ajuste necessário', `O analista solicitou ajustes no projeto "${spec.nome}".`, projetoId, spec.nome, false);
    }
    if (spec.status === 'REPROVADO') {
      pushAudit(projetoId, isoDays(spec.dias - 4, 130), 'REPROVADO', analista, spec.justificativaReprovacao ?? 'Reprovado', 'EM_ANALISE', 'REPROVADO');
      pushNotaInc(owner.id, isoDays(spec.dias - 4, 130), 'REPROVADO', 'Projeto reprovado', spec.justificativaReprovacao ?? 'Reprovado na curadoria.', projetoId, spec.nome, false);
    }
    if (spec.status === 'APROVADO' || spec.status === 'OFERTA_CRIADA') {
      pushAudit(projetoId, isoDays(spec.dias - 5, 140), 'APROVADO', analista, `Projeto aprovado. Nota geral: ${String(notaGeral(scoreNotas(spec.status)))}`, 'EM_ANALISE', 'APROVADO');
      pushNotaInc(owner.id, isoDays(spec.dias - 5, 140), 'APROVADO', 'Projeto aprovado!', `Parabéns! O projeto "${spec.nome}" foi aprovado pela curadoria Atlas Hub.`, projetoId, spec.nome, spec.status === 'OFERTA_CRIADA');
    }
    if (spec.status === 'OFERTA_CRIADA' && spec.oferta !== undefined) {
      pushAudit(projetoId, isoDays(spec.dias - 6, 150), 'OFERTA_CRIADA', admins.gabriel, `Oferta publicada na plataforma. ID: ${spec.oferta.id}`, 'APROVADO', 'OFERTA_CRIADA');
      pushNotaInc(owner.id, isoDays(spec.dias - 6, 150), 'OFERTA_CRIADA', 'Oferta publicada!', `A oferta do projeto "${spec.nome}" está no ar para investidores.`, projetoId, spec.nome, false);
    }

    montarCronograma(spec, projetoId, owner);
    montarCaptacao(spec, projetoId);
    montarFinanceiroSpe(spec, projetoId);
    montarCartaoSpe(spec, projetoId);
  }

  const tesourariaWs = sid('ws:tesouraria');
  speContas.push({
    projetoId: '__TESOURARIA__',
    tipo: 'TESOURARIA',
    workspaceId: tesourariaWs,
    username: 'atlas-tesouraria',
    status: 'ATIVA',
    projetoNome: 'Tesouraria Atlas',
    pixKey: cnpjFromBase('111111110001'),
    criadoEm: isoDays(45),
    atualizadoEm: isoDays(2),
    criadoPor: admins.gabriel.id,
  });
  finAuditoria.push({
    projetoId: '__TESOURARIA__', criadoEm: isoDays(45), id: sid('finaud:tesouraria'), acao: 'CONTA_CRIADA',
    userId: admins.gabriel.id, userName: admins.gabriel.nome,
    descricao: 'Workspace de tesouraria Atlas criado', workspaceId: tesourariaWs,
  });
  ledger.push({
    projetoId: '__TESOURARIA__', starkId: sid('led:tesouraria:dep'), workspaceId: tesourariaWs, tipo: 'DEPOSIT',
    amount: 250_000_00, description: 'Saldo operacional Atlas (não é recurso de captação)',
    criadoEm: isoDays(30), conciliado: true, source: 'webhook', tags: ['tesouraria'],
  });

  const solRej = sid('sol:tesouraria:rej');
  solicitacoes.push({
    id: solRej, projetoId: '__TESOURARIA__', workspaceId: tesourariaWs, amount: 15_000_00,
    description: 'Pix de teste rejeitado na dupla aprovação',
    destino: { name: 'Fornecedor Avulso ME', taxId: cnpjFromBase('334445550001'), bankCode: '237', branchCode: '0099', accountNumber: '1122-3', accountType: 'checking' },
    status: 'REJEITADA', solicitadoPor: admins.lucia.id, solicitadoPorNome: admins.lucia.nome, solicitadoEm: isoDays(5),
    aprovadoPor: admins.gabriel.id, aprovadoPorNome: admins.gabriel.nome, aprovadoEm: isoDays(5, 3_600_000),
  });
  finAuditoria.push({ projetoId: '__TESOURARIA__', criadoEm: isoDays(5), id: sid('finaud:tes:sol'), acao: 'SOLICITACAO_CRIADA', userId: admins.lucia.id, userName: admins.lucia.nome, descricao: 'Solicitação de Pix de R$ 15000.00', solicitacaoId: solRej, workspaceId: tesourariaWs });
  finAuditoria.push({ projetoId: '__TESOURARIA__', criadoEm: isoDays(5, 3_600_000), id: sid('finaud:tes:rej'), acao: 'SOLICITACAO_REJEITADA', userId: admins.gabriel.id, userName: admins.gabriel.nome, descricao: 'Movimentação fora da política de tesouraria', solicitacaoId: solRej, workspaceId: tesourariaWs });

  const analyticsEvents: Record<string, unknown>[] = [];
  const analyticsSessions: Record<string, unknown>[] = [];
  const analyticsDaily: Record<string, unknown>[] = [];
  const analyticsHeat: Record<string, unknown>[] = [];
  const browsers = ['Chrome', 'Safari', 'Firefox'] as const;
  const devices = ['desktop', 'mobile'] as const;
  const cities = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Salvador', 'Florianópolis'] as const;
  const utms = ['google', 'linkedin', 'direto', 'newsletter'] as const;
  const funnel = ['page_view', 'hero_view', 'section_view', 'form_view', 'form_start', 'form_submit', 'email_confirmed', 'login', 'profile_updated', 'project_created', 'project_submitted', 'offer_published'] as const;
  const funnelBase = [180, 150, 120, 70, 48, 22, 18, 16, 12, 8, 6, 2];

  for (let d = 20; d >= 0; d -= 1) {
    const day = ymdDays(d);
    const weekday = new Date(`${day}T12:00:00Z`).getUTCDay();
    const fator = weekday === 0 || weekday === 6 ? 0.45 : 1;
    for (let i = 0; i < funnel.length; i += 1) {
      const count = Math.max(1, Math.round((funnelBase[i] ?? 1) * fator * (0.85 + ((d % 5) * 0.04))));
      analyticsDaily.push({ dayKey: day, metricKey: `event:${funnel[i]}`, count });
    }
    analyticsDaily.push({ dayKey: day, metricKey: 'events_total', count: Math.round(420 * fator) });
    analyticsDaily.push({ dayKey: day, metricKey: 'device:desktop', count: Math.round(70 * fator) });
    analyticsDaily.push({ dayKey: day, metricKey: 'device:mobile', count: Math.round(50 * fator) });
    analyticsDaily.push({ dayKey: day, metricKey: 'browser:Chrome', count: Math.round(80 * fator) });
    analyticsDaily.push({ dayKey: day, metricKey: 'browser:Safari', count: Math.round(25 * fator) });
    analyticsDaily.push({ dayKey: day, metricKey: 'os:macOS', count: Math.round(40 * fator) });
    analyticsDaily.push({ dayKey: day, metricKey: 'os:Windows', count: Math.round(55 * fator) });
    analyticsDaily.push({ dayKey: day, metricKey: `utm:${utms[d % utms.length]}`, count: Math.round(30 * fator) });
    analyticsDaily.push({ dayKey: day, metricKey: 'country:BR', count: Math.round(110 * fator) });
    analyticsDaily.push({ dayKey: day, metricKey: `city:${cities[d % cities.length]}`, count: Math.round(40 * fator) });

    for (let s = 0; s < 3; s += 1) {
      const sessionId = sid(`sess:${day}:${String(s)}`);
      const anonymousId = sid(`anon:${day}:${String(s)}`);
      const started = `${day}T12:${String(10 + s * 7).padStart(2, '0')}:00.000Z`;
      const lastSeen = `${day}T12:${String(28 + s * 7).padStart(2, '0')}:00.000Z`;
      const user = s === 0 && d % 3 === 0 ? incs.horizon : s === 1 && d % 4 === 0 ? admins.ana : undefined;
      analyticsSessions.push({
        sessionId, anonymousId, startedAt: started, lastSeenAt: lastSeen,
        landingPath: s === 2 ? '/para-incorporadoras' : '/', referrer: 'https://www.google.com/',
        utmSource: utms[(d + s) % utms.length], device: devices[s % devices.length], browser: browsers[s % browsers.length],
        os: s === 0 ? 'macOS' : 'Windows', country: 'BR', region: 'SP', city: cities[(d + s) % cities.length],
        eventCount: 6, pageViews: 3, ...(user !== undefined ? { userId: user.id } : {}),
      });
      const names = ['page_view', 'hero_view', 'scroll_50', 'cta_click', s === 2 ? 'form_view' : 'section_view', 'heatmap_click'];
      for (let e = 0; e < names.length; e += 1) {
        const ts = `${day}T12:${String(10 + s * 7 + e).padStart(2, '0')}:${String(10 + e).padStart(2, '0')}.000Z`;
        const eventName = names[e] ?? 'page_view';
        analyticsEvents.push({
          id: sid(`ev:${day}:${String(s)}:${String(e)}`),
          sessionId, anonymousId, eventName, ts, dayKey: day,
          ...(user !== undefined ? { userId: user.id, userEventKey: `${user.id}#${ts}` } : {}),
          nameTsKey: `${eventName}#${ts}`,
          ipHash: createHash('sha256').update(`${day}${String(s)}`).digest('hex').slice(0, 16),
          context: {
            path: s === 2 ? '/para-incorporadoras' : '/', referrer: 'https://www.google.com/',
            utmSource: utms[(d + s) % utms.length], browser: browsers[s % browsers.length],
            os: s === 0 ? 'macOS' : 'Windows', device: devices[s % devices.length],
            screenWidth: 1440, screenHeight: 900, language: 'pt-BR', timeZone: 'America/Sao_Paulo',
            country: 'BR', region: 'SP', city: cities[(d + s) % cities.length],
          },
          props: eventName === 'heatmap_click' ? { xNorm: 0.42 + s * 0.08, yNorm: 0.31 + e * 0.04, path: '/' } : { section: 'hero' },
        });
      }
    }

    for (let x = 6; x <= 12; x += 2) {
      for (let y = 8; y <= 16; y += 4) {
        analyticsHeat.push({
          pageKey: `/#${day}`,
          cellKey: `click:${String(x)}:${String(y)}`,
          count: 4 + ((x + y + d) % 9),
          updatedAt: `${day}T18:00:00.000Z`,
        });
      }
    }
    analyticsHeat.push({ pageKey: `/#${day}`, cellKey: 'scroll:50', count: 18 + (d % 6), updatedAt: `${day}T18:00:00.000Z` });
  }

  await batchPut(T.scorecard, scorecards);
  await batchPut(T.auditoria, auditoria);
  await batchPut(T.notas, notas);
  await batchPut(T.notificacoes, notificacoes);
  await batchPut(T.etapas, etapas);
  await batchPut(T.lancamentos, lancamentos);
  await batchPut(T.captacaoEventos, captacaoEventos);
  await batchPut(T.captacaoCompras, captacaoCompras);
  await batchPut(T.speContas, speContas);
  await batchPut(T.ledger, ledger);
  await batchPut(T.solicitacoes, solicitacoes);
  await batchPut(T.finAuditoria, finAuditoria);
  await batchPut(T.speCartoes, speCartoes);
  await batchPut(T.analyticsEvents, analyticsEvents);
  await batchPut(T.analyticsSessions, analyticsSessions);
  await batchPut(T.analyticsDaily, analyticsDaily);
  await batchPut(T.analyticsHeatmaps, analyticsHeat);

  await put(T.analyticsAlerts, {
    id: sid('alert:conv'), name: 'Queda de conversão do funil LP', rule: 'conversion_drop',
    threshold: 20, active: true, lastTriggeredAt: isoDays(2), createdAt: isoDays(25), updatedAt: isoDays(2),
  });
  await put(T.analyticsAlerts, {
    id: sid('alert:bounce'), name: 'Bounce elevado na landing', rule: 'bounce_high',
    threshold: 65, active: true, createdAt: isoDays(25), updatedAt: isoDays(10),
  });
  await put(T.analyticsAlerts, {
    id: sid('alert:spike'), name: 'Pico de tráfego atípico', rule: 'traffic_spike',
    threshold: 200, active: false, createdAt: isoDays(15), updatedAt: isoDays(15),
  });
  await put(T.analyticsReplays, {
    id: sid('replay:1'), sessionId: sid(`sess:${ymdDays(1)}:0`), anonymousId: sid(`anon:${ymdDays(1)}:0`),
    userId: incs.horizon.id, startedAt: isoDays(1, 0), endedAt: isoDays(1, -1_200_000),
    chunkCount: 4, eventsJson: JSON.stringify([{ eventName: 'page_view', path: '/' }, { eventName: 'cta_click', path: '/' }]),
  });

  console.log('');
  console.log('Seed local concluído');
  console.log(`Projetos: ${String(PROJETOS.length)}  etapas: ${String(etapas.length)}  gastos: ${String(lancamentos.length)}`);
  console.log(`Captação eventos: ${String(captacaoEventos.length)}  compras: ${String(captacaoCompras.length)}`);
  console.log(`Financeiro contas: ${String(speContas.length)}  ledger: ${String(ledger.length)}  cartões: ${String(speCartoes.length)}`);
  console.log(`Analytics events: ${String(analyticsEvents.length)}  daily: ${String(analyticsDaily.length)}`);
  console.log('');
  console.log('Senha de todos:', password);
  console.log('  Admin master : gabriel@atlashub.com.br');
  console.log('  Admin master : lucia.mendes@atlashub.com.br');
  console.log('  Analista     : analista@atlashub.com.br');
  console.log('  Analista     : marcos.oliveira@atlashub.com.br');
  for (const inc of Object.values(incs)) {
    console.log(`  Incorporadora: ${inc.email} (${inc.razao})`);
  }
}

void run().catch((err: unknown) => {
  console.error('Erro no seed:', err);
  process.exit(1);
});
