import { randomUUID } from 'node:crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const region = process.env['REGION'] ?? 'sa-east-1';
const stage = process.env['STAGE'] ?? 'dev';
const baseId = process.env['BASE_PROJETO'] ?? 'inc-proj-aurora';

const T = {
  projetos: `AtlasProjetos-${stage}`,
  notificacoes: `AtlasNotificacoes-${stage}`,
  auditoria: `AtlasAuditoria-${stage}`,
  scorecard: `AtlasScorecard-${stage}`,
  admins: `AtlasAdmins-${stage}`,
} as const;

const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));

const daysAgo = (d: number): string => new Date(Date.now() - d * 86_400_000).toISOString();

type Decisao = 'AJUSTE_SOLICITADO' | 'REPROVADO';

interface SeedProjeto {
  readonly id: string;
  readonly nome: string;
  readonly modelo: 'VENDA' | 'RENDA' | 'MISTO';
  readonly tipoImovel: 'RESIDENCIAL' | 'COMERCIAL' | 'MISTO';
  readonly cidade: string;
  readonly estado: string;
  readonly endereco: string;
  readonly descricao: string;
  readonly valorCaptar: number;
  readonly valorTotal: number;
  readonly rentabilidade: number;
  readonly prazoObra: number;
  readonly prazoRetorno: number;
  readonly status: Decisao;
  readonly texto: string;
  readonly dias: number;
}

const PROJETOS: readonly SeedProjeto[] = [
  {
    id: 'inc-proj-matriz-prime',
    nome: 'Edifício Matriz Prime',
    modelo: 'RENDA',
    tipoImovel: 'COMERCIAL',
    cidade: 'São Paulo',
    estado: 'SP',
    endereco: 'Av. Brigadeiro Faria Lima, 2200 — Itaim Bibi',
    descricao:
      'Laje corporativa de alto padrão para locação no Itaim Bibi, com 18 pavimentos, certificação de eficiência energética e estacionamento automatizado. Projeto voltado a renda recorrente via contratos longos com locatários âncora.',
    valorCaptar: 6_800_000,
    valorTotal: 17_500_000,
    rentabilidade: 16.4,
    prazoObra: 30,
    prazoRetorno: 48,
    status: 'AJUSTE_SOLICITADO',
    texto:
      'A certidão da matrícula está vencida (emitida há mais de 90 dias) e falta a CND estadual. Anexe os documentos atualizados para seguirmos com a aprovação.',
    dias: 3,
  },
  {
    id: 'inc-proj-solar-acacias',
    nome: 'Residencial Solar das Acácias',
    modelo: 'VENDA',
    tipoImovel: 'RESIDENCIAL',
    cidade: 'Campinas',
    estado: 'SP',
    endereco: 'Rua das Acácias, 780 — Cambuí',
    descricao:
      'Condomínio residencial de médio padrão com 3 torres e 96 unidades, área de lazer completa e foco em famílias jovens na região do Cambuí. Construção para venda com alto potencial de absorção local.',
    valorCaptar: 3_900_000,
    valorTotal: 11_200_000,
    rentabilidade: 14.8,
    prazoObra: 24,
    prazoRetorno: 36,
    status: 'AJUSTE_SOLICITADO',
    texto:
      'A planilha de orçamento de obra está incompleta: faltam os custos de fundação e de infraestrutura. Complemente o orçamento com esses itens e reenvie.',
    dias: 5,
  },
  {
    id: 'inc-proj-norte-center',
    nome: 'Complexo Comercial Norte',
    modelo: 'MISTO',
    tipoImovel: 'MISTO',
    cidade: 'Ribeirão Preto',
    estado: 'SP',
    endereco: 'Av. Presidente Vargas, 1500 — Jardim Irajá',
    descricao:
      'Complexo misto com centro comercial, torre de salas e áreas de alimentação no Jardim Irajá. Estrutura pensada para atender o crescimento da zona norte, combinando vendas de salas e renda de locação.',
    valorCaptar: 5_200_000,
    valorTotal: 14_600_000,
    rentabilidade: 15.7,
    prazoObra: 28,
    prazoRetorno: 42,
    status: 'AJUSTE_SOLICITADO',
    texto:
      'A viabilidade financeira está inconsistente com o cronograma apresentado (a margem projetada não fecha com o prazo de obra). Revise os números e reenvie o estudo.',
    dias: 8,
  },
  {
    id: 'inc-proj-vista-serra',
    nome: 'Residencial Vista da Serra',
    modelo: 'VENDA',
    tipoImovel: 'RESIDENCIAL',
    cidade: 'Campos do Jordão',
    estado: 'SP',
    endereco: 'Estrada do Horto, 3200 — Alto da Boa Vista',
    descricao:
      'Empreendimento residencial de alto padrão em Campos do Jordão, com 40 unidades e vista para a serra. Projeto entregue sem o estudo de viabilidade assinado por responsável técnico e com a matrícula do terreno desatualizada.',
    valorCaptar: 4_400_000,
    valorTotal: 12_900_000,
    rentabilidade: 13.2,
    prazoObra: 26,
    prazoRetorno: 40,
    status: 'REPROVADO',
    texto:
      'Projeto reprovado: viabilidade financeira inconsistente com o cronograma e documentação incompleta (CND estadual ausente e matrícula desatualizada).',
    dias: 11,
  },
];

async function put(table: string, item: Record<string, unknown>): Promise<void> {
  await db.send(new PutCommand({ TableName: table, Item: item }));
}

async function run(): Promise<void> {
  const base = (await db.send(new GetCommand({ TableName: T.projetos, Key: { id: baseId } }))).Item;
  if (!base) throw new Error(`projeto base ${baseId} não encontrado`);
  const incorporadoraId = String(base['incorporadoraId']);

  const admins = await db.send(new ScanCommand({ TableName: T.admins }));
  const analista = (admins.Items ?? []).find((a) => a['perfil'] === 'ANALISTA');
  const analistaId = String(analista?.['id'] ?? 'seed-analista');
  const analistaNome = String(analista?.['nome'] ?? 'Ana Curadora');

  console.log(`Seed projetos — stage=${stage} incorporadoraId=${incorporadoraId}`);

  for (const a of PROJETOS) {
    const criadoEm = daysAgo(a.dias + 6);
    const submetidoEm = daysAgo(a.dias + 4);
    const inicioAnaliseEm = daysAgo(a.dias + 1);
    const decisaoEm = daysAgo(a.dias);
    const isReprovado = a.status === 'REPROVADO';

    await put(T.projetos, {
      id: a.id,
      incorporadoraId,
      status: a.status,
      revisao: 2,
      nome: a.nome,
      modelo: a.modelo,
      tipoImovel: a.tipoImovel,
      tipoOferta: 'PUBLICA',
      cidade: a.cidade,
      estado: a.estado,
      endereco: a.endereco,
      descricao: a.descricao,
      valorTotal: a.valorTotal,
      valorCaptar: a.valorCaptar,
      rentabilidadeEstimada: a.rentabilidade,
      prazoObra: a.prazoObra,
      prazoRetorno: a.prazoRetorno,
      modeloRetorno: 'SCP',
      parcelado: false,
      documentos: base['documentos'],
      fotosUrls: [],
      equipe: base['equipe'],
      viabilidade: base['viabilidade'],
      analistaId,
      analistaNome,
      submetidoEm,
      criadoEm,
      atualizadoEm: decisaoEm,
      ...(isReprovado ? { justificativaReprovacao: a.texto, reprovadoEm: decisaoEm } : { textoAjuste: a.texto }),
    });

    await put(T.auditoria, {
      projetoId: a.id,
      criadoEm,
      acao: 'CRIADO',
      userId: incorporadoraId,
      userName: 'Felipe Construtora',
      descricao: 'Projeto criado como rascunho',
      statusNovo: 'RASCUNHO',
    });
    await put(T.auditoria, {
      projetoId: a.id,
      criadoEm: submetidoEm,
      acao: 'SUBMETIDO',
      userId: incorporadoraId,
      userName: 'Felipe Construtora',
      descricao: 'Projeto submetido para análise',
      statusAnterior: 'RASCUNHO',
      statusNovo: 'SUBMETIDO',
    });
    await put(T.auditoria, {
      projetoId: a.id,
      criadoEm: inicioAnaliseEm,
      acao: 'ANALISE_INICIADA',
      userId: analistaId,
      userName: analistaNome,
      descricao: 'Análise iniciada',
      statusAnterior: 'SUBMETIDO',
      statusNovo: 'EM_ANALISE',
    });
    await put(T.auditoria, {
      projetoId: a.id,
      criadoEm: decisaoEm,
      acao: a.status,
      userId: analistaId,
      userName: analistaNome,
      descricao: isReprovado ? 'Projeto reprovado na curadoria' : 'Ajuste solicitado ao incorporador',
      statusAnterior: 'EM_ANALISE',
      statusNovo: a.status,
    });

    await put(T.notificacoes, {
      userId: incorporadoraId,
      criadoEm: decisaoEm,
      id: randomUUID(),
      tipo: a.status,
      titulo: isReprovado ? `Projeto reprovado: ${a.nome}` : `Ajuste solicitado: ${a.nome}`,
      mensagem: a.texto,
      lida: false,
      projetoId: a.id,
      projetoNome: a.nome,
    });

    await put(T.scorecard, {
      projetoId: a.id,
      revisao: 2,
      analistaId,
      analistaNome,
      localizacaoNota: 8,
      localizacaoComentario: 'Boa localização e demanda regional consistente.',
      financeiraNota: isReprovado ? 4 : 6,
      financeiraComentario: isReprovado ? 'Orçamento inconsistente com o cronograma.' : 'Números precisam de revisão antes da decisão final.',
      documentacaoNota: isReprovado ? 4 : 5,
      documentacaoComentario: isReprovado ? 'Documentação incompleta e desatualizada.' : 'Documentação pendente de atualização.',
      equipeNota: 8,
      equipeComentario: 'Equipe com experiência comprovada.',
      riscoNota: 7,
      riscoComentario: 'Risco de execução moderado.',
      notaGeral: isReprovado ? 5.8 : 6.7,
      parecer: a.texto,
      decisao: a.status,
      criadoEm: decisaoEm,
      atualizadoEm: decisaoEm,
    });

    console.log(`  ✓ ${a.nome} (${a.status})`);
  }

  console.log(`\n✓ ${String(PROJETOS.length)} projetos criados para ${incorporadoraId}`);
}

void run().catch((err) => {
  console.error('Erro no seed:', err);
  process.exit(1);
});
