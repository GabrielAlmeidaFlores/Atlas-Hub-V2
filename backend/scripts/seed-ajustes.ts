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

interface Ajuste {
  readonly id: string;
  readonly nome: string;
  readonly modelo: 'VENDA' | 'RENDA';
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
  readonly textoAjuste: string;
  readonly dias: number;
}

const AJUSTES: readonly Ajuste[] = [
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
    textoAjuste:
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
    textoAjuste:
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
    textoAjuste:
      'A viabilidade financeira está inconsistente com o cronograma apresentado (a margem projetada não fecha com o prazo de obra). Revise os números e reenvie o estudo.',
    dias: 8,
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

  console.log(`Seed ajustes — stage=${stage} incorporadoraId=${incorporadoraId}`);

  for (const a of AJUSTES) {
    const criadoEm = daysAgo(a.dias + 6);
    const submetidoEm = daysAgo(a.dias + 4);
    const inicioAnaliseEm = daysAgo(a.dias + 1);
    const ajusteEm = daysAgo(a.dias);

    await put(T.projetos, {
      id: a.id,
      incorporadoraId,
      status: 'AJUSTE_SOLICITADO',
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
      textoAjuste: a.textoAjuste,
      analistaId,
      analistaNome,
      submetidoEm,
      criadoEm,
      atualizadoEm: ajusteEm,
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
      criadoEm: ajusteEm,
      acao: 'AJUSTE_SOLICITADO',
      userId: analistaId,
      userName: analistaNome,
      descricao: 'Ajuste solicitado ao incorporador',
      statusAnterior: 'EM_ANALISE',
      statusNovo: 'AJUSTE_SOLICITADO',
    });

    await put(T.notificacoes, {
      userId: incorporadoraId,
      criadoEm: ajusteEm,
      id: randomUUID(),
      tipo: 'AJUSTE_SOLICITADO',
      titulo: `Ajuste solicitado: ${a.nome}`,
      mensagem: a.textoAjuste,
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
      financeiraNota: 6,
      financeiraComentario: 'Números precisam de revisão antes da decisão final.',
      documentacaoNota: 5,
      documentacaoComentario: 'Documentação pendente de atualização.',
      equipeNota: 8,
      equipeComentario: 'Equipe com experiência comprovada.',
      riscoNota: 7,
      riscoComentario: 'Risco de execução moderado.',
      notaGeral: 6.7,
      parecer: a.textoAjuste,
      decisao: 'AJUSTE_SOLICITADO',
      criadoEm: ajusteEm,
      atualizadoEm: ajusteEm,
    });

    console.log(`  ✓ ${a.nome} (AJUSTE_SOLICITADO)`);
  }

  console.log(`\n✓ ${String(AJUSTES.length)} projetos em AJUSTE_SOLICITADO criados para ${incorporadoraId}`);
}

void run().catch((err) => {
  console.error('Erro no seed de ajustes:', err);
  process.exit(1);
});
