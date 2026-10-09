import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const region = process.env['REGION'] ?? 'sa-east-1';
const stage = process.env['STAGE'] ?? 'dev';

const INCORPORADORA_ID = process.env['INCORPORADORA_ID'] ?? '831c4a1a-5011-7069-ed3a-ef78df48ee0b';
const ANALISTA_ID = process.env['ANALISTA_ID'] ?? 'c3ecfa2a-b061-7053-b422-69c1e324a33e';
const ANALISTA_NOME = process.env['ANALISTA_NOME'] ?? 'Ana Curadora';

const T = {
  projetos: `AtlasProjetos-${stage}`,
  scorecard: `AtlasScorecard-${stage}`,
  auditoria: `AtlasAuditoria-${stage}`,
  notificacoes: `AtlasNotificacoes-${stage}`,
} as const;

const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));

const now = new Date();
const daysAgo = (d: number): string => new Date(now.getTime() - d * 86_400_000).toISOString();

const docs = {
  matriculaUrl: 'https://example.com/docs/matricula.pdf',
  alvaraUrl: 'https://example.com/docs/alvara.pdf',
  memorialUrl: 'https://example.com/docs/memorial.pdf',
  plantaUrl: 'https://example.com/docs/planta.pdf',
  viabilidadeUrl: 'https://example.com/docs/viabilidade.pdf',
};

const equipe = [
  { nome: 'Eng. Roberto Silva', cargo: 'Responsável técnico', bio: '20 anos em obras residenciais de alto padrão.' },
  { nome: 'Juliana Pereira', cargo: 'Gestora de projeto', bio: 'Especialista em cronograma e custo de obra.' },
];

type Projeto = {
  id: string;
  nome: string;
  cidade: string;
  estado: string;
  tipoImovel: 'RESIDENCIAL' | 'COMERCIAL';
  tipoOferta: 'PUBLICA' | 'PRIVADA';
  valorCaptar: number;
  valorTotal: number;
  status: 'SUBMETIDO' | 'EM_ANALISE';
  submetidoEm: string;
  analisar: boolean;
};

const projetos: Projeto[] = [
  {
    id: 'seed-curadoria-vila-nova',
    nome: 'Residencial Vila Nova',
    cidade: 'São Paulo',
    estado: 'SP',
    tipoImovel: 'RESIDENCIAL',
    tipoOferta: 'PUBLICA',
    valorCaptar: 7_400_000,
    valorTotal: 21_000_000,
    status: 'SUBMETIDO',
    submetidoEm: daysAgo(0),
    analisar: false,
  },
  {
    id: 'seed-curadoria-mirante',
    nome: 'Loteamento Mirante',
    cidade: 'Campinas',
    estado: 'SP',
    tipoImovel: 'RESIDENCIAL',
    tipoOferta: 'PUBLICA',
    valorCaptar: 4_800_000,
    valorTotal: 14_500_000,
    status: 'SUBMETIDO',
    submetidoEm: daysAgo(1),
    analisar: false,
  },
  {
    id: 'seed-curadoria-faria-lima',
    nome: 'Corporate Faria Lima II',
    cidade: 'São Paulo',
    estado: 'SP',
    tipoImovel: 'COMERCIAL',
    tipoOferta: 'PRIVADA',
    valorCaptar: 15_600_000,
    valorTotal: 42_000_000,
    status: 'EM_ANALISE',
    submetidoEm: daysAgo(2),
    analisar: true,
  },
  {
    id: 'seed-curadoria-palmeiras',
    nome: 'Jardim das Palmeiras',
    cidade: 'Belo Horizonte',
    estado: 'MG',
    tipoImovel: 'RESIDENCIAL',
    tipoOferta: 'PUBLICA',
    valorCaptar: 6_300_000,
    valorTotal: 18_900_000,
    status: 'EM_ANALISE',
    submetidoEm: daysAgo(4),
    analisar: true,
  },
];

async function put(table: string, item: Record<string, unknown>): Promise<void> {
  await db.send(new PutCommand({ TableName: table, Item: item }));
}

async function run(): Promise<void> {
  console.log(`Seed curadoria — ${stage}`);

  for (const p of projetos) {
    const item: Record<string, unknown> = {
      id: p.id,
      incorporadoraId: INCORPORADORA_ID,
      status: p.status,
      revisao: 1,
      nome: p.nome,
      modelo: 'VENDA',
      tipoImovel: p.tipoImovel,
      cidade: p.cidade,
      estado: p.estado,
      endereco: 'Rua Exemplo, 250',
      descricao: `${p.nome} é um empreendimento de construção para venda com foco em alta liquidez. Projeto de demonstração da fila de curadoria do Atlas Hub, com documentação e equipe fictícias para permitir o fluxo completo de análise.`.padEnd(220, ' '),
      valorTotal: p.valorTotal,
      valorCaptar: p.valorCaptar,
      prazoObra: 24,
      prazoRetorno: 36,
      rentabilidadeEstimada: 14.5,
      modeloRetorno: 'SCP',
      tipoOferta: p.tipoOferta,
      documentos: docs,
      equipe,
      criadoEm: daysAgo(6),
      atualizadoEm: p.submetidoEm,
      submetidoEm: p.submetidoEm,
      ...(p.analisar ? { analistaId: ANALISTA_ID, analistaNome: ANALISTA_NOME } : {}),
    };
    await put(T.projetos, item);

    await put(T.auditoria, {
      projetoId: p.id,
      criadoEm: daysAgo(6),
      acao: 'CRIACAO',
      userId: INCORPORADORA_ID,
      userName: 'Incorporadora',
      descricao: 'Projeto criado',
      statusNovo: 'RASCUNHO',
    });
    await put(T.auditoria, {
      projetoId: p.id,
      criadoEm: p.submetidoEm,
      acao: 'SUBMISSAO',
      userId: INCORPORADORA_ID,
      userName: 'Incorporadora',
      descricao: 'Projeto submetido à curadoria',
      statusAnterior: 'RASCUNHO',
      statusNovo: 'SUBMETIDO',
    });

    if (p.analisar) {
      await put(T.auditoria, {
        projetoId: p.id,
        criadoEm: daysAgo(1),
        acao: 'INICIO_ANALISE',
        userId: ANALISTA_ID,
        userName: ANALISTA_NOME,
        descricao: 'Análise iniciada',
        statusAnterior: 'SUBMETIDO',
        statusNovo: 'EM_ANALISE',
      });
      await put(T.scorecard, {
        projetoId: p.id,
        revisao: 1,
        analistaId: ANALISTA_ID,
        analistaNome: ANALISTA_NOME,
        localizacaoNota: 8,
        localizacaoComentario: 'Boa demanda regional e infraestrutura consolidada.',
        financeiraNota: 7,
        financeiraComentario: 'Margem e cronograma coerentes com o mercado.',
        documentacaoNota: 8,
        documentacaoComentario: 'Documentação completa e certidões válidas.',
        equipeNota: 8,
        equipeComentario: 'Equipe com experiência comprovada.',
        riscoNota: 7,
        riscoComentario: 'Risco de execução moderado.',
        notaGeral: 7.6,
        parecer: 'Análise em andamento.',
        decisao: 'RASCUNHO',
        criadoEm: daysAgo(1),
        atualizadoEm: daysAgo(1),
      });
    }

    console.log(`  ✓ [${p.status}] ${p.nome}`);
  }

  console.log('✓ Fila de curadoria preenchida');
}

void run().catch((err) => {
  console.error('Erro no seed de curadoria:', err);
  process.exit(1);
});
