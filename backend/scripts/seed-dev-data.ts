/**
 * Seed de dados fake para o ambiente DEV (painel admin + portal).
 *
 * Uso:
 *   AWS_PROFILE=atlas-hub \
 *   POOL_ID=sa-east-1_FyjlSJmHK \
 *   REGION=sa-east-1 \
 *   STAGE=dev \
 *   npx tsx scripts/seed-dev-data.ts
 */
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
import { randomUUID } from 'node:crypto';

const region = process.env['REGION'] ?? 'sa-east-1';
const stage = process.env['STAGE'] ?? 'dev';
const poolId = process.env['POOL_ID'] ?? '';
const password = process.env['SEED_PASSWORD'] ?? 'AtlasHub!Dev2026';

if (!poolId) {
  console.error('POOL_ID é obrigatório');
  process.exit(1);
}

const cognito = new CognitoIdentityProviderClient({ region });
const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));

const T = {
  incorporadoras: `AtlasIncorporadoras-${stage}`,
  admins: `AtlasAdmins-${stage}`,
  projetos: `AtlasProjetos-${stage}`,
  scorecard: `AtlasScorecard-${stage}`,
  notificacoes: `AtlasNotificacoes-${stage}`,
  auditoria: `AtlasAuditoria-${stage}`,
  notas: `AtlasNotas-${stage}`,
} as const;

const now = new Date();
const daysAgo = (d: number): string => new Date(now.getTime() - d * 86_400_000).toISOString();

async function ensureCognitoUser(opts: {
  email: string;
  group: 'INCORPORADORA' | 'ANALISTA' | 'ADMIN_MASTER';
}): Promise<string> {
  try {
    const created = await cognito.send(new AdminCreateUserCommand({
      UserPoolId: poolId,
      Username: opts.email,
      UserAttributes: [
        { Name: 'email', Value: opts.email },
        { Name: 'email_verified', Value: 'true' },
      ],
      TemporaryPassword: password,
      MessageAction: 'SUPPRESS',
    }));
    const userId = created.User?.Username ?? opts.email;
    await cognito.send(new AdminAddUserToGroupCommand({
      UserPoolId: poolId,
      Username: opts.email,
      GroupName: opts.group,
    }));
    await cognito.send(new AdminSetUserPasswordCommand({
      UserPoolId: poolId,
      Username: opts.email,
      Password: password,
      Permanent: true,
    }));
    return userId;
  } catch (err) {
    if (err instanceof UsernameExistsException || (err as { name?: string }).name === 'UsernameExistsException') {
      const existing = await cognito.send(new AdminGetUserCommand({
        UserPoolId: poolId,
        Username: opts.email,
      }));
      await cognito.send(new AdminSetUserPasswordCommand({
        UserPoolId: poolId,
        Username: opts.email,
        Password: password,
        Permanent: true,
      })).catch(() => undefined);
      try {
        await cognito.send(new AdminAddUserToGroupCommand({
          UserPoolId: poolId,
          Username: opts.email,
          GroupName: opts.group,
        }));
      } catch { /* already in group */ }
      return existing.Username ?? opts.email;
    }
    throw err;
  }
}

async function put(table: string, item: Record<string, unknown>): Promise<void> {
  await db.send(new PutCommand({ TableName: table, Item: item }));
}

async function batchPut(table: string, items: Record<string, unknown>[]): Promise<void> {
  for (let i = 0; i < items.length; i += 25) {
    const chunk = items.slice(i, i + 25);
    await db.send(new BatchWriteCommand({
      RequestItems: {
        [table]: chunk.map((Item) => ({ PutRequest: { Item } })),
      },
    }));
  }
}

async function run(): Promise<void> {
  console.log(`Seeding DEV (${stage}) — pool ${poolId}`);

  const adminId = await ensureCognitoUser({
    email: 'gabriel@atlashub.com.br',
    group: 'ADMIN_MASTER',
  });
  await put(T.admins, {
    id: adminId,
    nome: 'Gabriel Flores',
    email: 'gabriel@atlashub.com.br',
    perfil: 'ADMIN_MASTER',
    ativo: true,
    criadoPor: 'seed',
    criadoEm: daysAgo(30),
  });

  const analistaId = await ensureCognitoUser({
    email: 'analista@atlashub.com.br',
    group: 'ANALISTA',
  });
  await put(T.admins, {
    id: analistaId,
    nome: 'Ana Curadora',
    email: 'analista@atlashub.com.br',
    perfil: 'ANALISTA',
    ativo: true,
    criadoPor: adminId,
    criadoEm: daysAgo(25),
  });

  const incorporadorasSeed = [
    {
      email: 'contato@horizonconstrutora.com.br',
      cnpj: '12.345.678/0001-90',
      razaoSocial: 'Horizon Construtora Ltda',
      nomeResponsavel: 'Carlos Mendes',
      cpfResponsavel: '123.456.789-09',
      cargoResponsavel: 'Diretor de Incorporação',
      telefone: '(11) 98888-1001',
      endereco: 'Av. Paulista, 1000 — São Paulo/SP',
      site: 'https://horizonconstrutora.example',
      descricao: 'Incorporadora focada em residenciais de médio padrão na Grande SP.',
      historicoAnterior: '12 empreendimentos entregues desde 2012.',
    },
    {
      email: 'projetos@verdeurbano.com.br',
      cnpj: '23.456.789/0001-01',
      razaoSocial: 'Verde Urbano Empreendimentos S.A.',
      nomeResponsavel: 'Mariana Costa',
      cpfResponsavel: '987.654.321-00',
      cargoResponsavel: 'CEO',
      telefone: '(21) 97777-2002',
      endereco: 'Rua do Ouvidor, 50 — Rio de Janeiro/RJ',
      site: 'https://verdeurbano.example',
      descricao: 'Projetos sustentáveis e mistos (residencial + comercial).',
      historicoAnterior: '8 projetos entregues; 2 em obras.',
    },
    {
      email: 'admin@atlanticresidencial.com.br',
      cnpj: '34.567.890/0001-12',
      razaoSocial: 'Atlantic Residencial SPE',
      nomeResponsavel: 'Pedro Almeida',
      cpfResponsavel: '456.789.123-45',
      cargoResponsavel: 'Sócio-administrador',
      telefone: '(48) 96666-3003',
      endereco: 'Av. Beira Mar Norte, 200 — Florianópolis/SC',
      site: 'https://atlanticresidencial.example',
      descricao: 'SPE dedicada a empreendimentos litorâneos no Sul.',
      historicoAnterior: 'Primeiro projeto na plataforma Atlas Hub.',
    },
  ] as const;

  const incorporadoras: Array<{ id: string; razaoSocial: string; email: string }> = [];

  for (const inc of incorporadorasSeed) {
    const id = await ensureCognitoUser({ email: inc.email, group: 'INCORPORADORA' });
    await put(T.incorporadoras, {
      id,
      cnpj: inc.cnpj,
      razaoSocial: inc.razaoSocial,
      nomeResponsavel: inc.nomeResponsavel,
      cpfResponsavel: inc.cpfResponsavel,
      cargoResponsavel: inc.cargoResponsavel,
      email: inc.email,
      telefone: inc.telefone,
      emailConfirmado: true,
      criadoEm: daysAgo(20),
      atualizadoEm: daysAgo(2),
      endereco: inc.endereco,
      site: inc.site,
      descricao: inc.descricao,
      historicoAnterior: inc.historicoAnterior,
    });
    incorporadoras.push({ id, razaoSocial: inc.razaoSocial, email: inc.email });
    console.log(`  ✓ Incorporadora ${inc.razaoSocial}`);
  }

  const [h, v, a] = incorporadoras;
  if (!h || !v || !a) throw new Error('incorporadoras incompletas');

  const equipePadrao = [
    {
      nome: 'Eng. Roberto Silva',
      cargo: 'Responsável técnico',
      bio: '20 anos em obras residenciais de alto padrão.',
      linkedin: 'https://linkedin.com/in/exemplo',
    },
    {
      nome: 'Juliana Pereira',
      cargo: 'Gestora de projeto',
      bio: 'Especialista em cronograma e custo de obra.',
    },
  ];

  const docs = {
    matriculaUrl: 'https://example.com/docs/matricula.pdf',
    alvaraUrl: 'https://example.com/docs/alvara.pdf',
    memorialUrl: 'https://example.com/docs/memorial.pdf',
    plantaUrl: 'https://example.com/docs/planta.pdf',
    viabilidadeUrl: 'https://example.com/docs/viabilidade.pdf',
  };

  type ProjetoSeed = {
    id: string;
    incorporadoraId: string;
    status: string;
    nome: string;
    cidade: string;
    estado: string;
    valorCaptar: number;
    valorTotal: number;
    tipoOferta: 'PUBLICA' | 'PRIVADA';
    dias: number;
    analista?: boolean;
    textoAjuste?: string;
    justificativaReprovacao?: string;
    ofertaId?: string;
    ofertaLink?: string;
    revisao?: number;
  };

  const projetosSeed: ProjetoSeed[] = [
    {
      id: randomUUID(),
      incorporadoraId: h.id,
      status: 'SUBMETIDO',
      nome: 'Residencial Vista Paulista',
      cidade: 'São Paulo',
      estado: 'SP',
      valorCaptar: 8_500_000,
      valorTotal: 22_000_000,
      tipoOferta: 'PUBLICA',
      dias: 5,
    },
    {
      id: randomUUID(),
      incorporadoraId: h.id,
      status: 'EM_ANALISE',
      nome: 'Horizon Park Moema',
      cidade: 'São Paulo',
      estado: 'SP',
      valorCaptar: 12_000_000,
      valorTotal: 35_000_000,
      tipoOferta: 'PUBLICA',
      dias: 12,
      analista: true,
    },
    {
      id: randomUUID(),
      incorporadoraId: v.id,
      status: 'AJUSTE_SOLICITADO',
      nome: 'Eco Plaza Botafogo',
      cidade: 'Rio de Janeiro',
      estado: 'RJ',
      valorCaptar: 6_200_000,
      valorTotal: 18_000_000,
      tipoOferta: 'PUBLICA',
      dias: 8,
      analista: true,
      textoAjuste: 'Atualizar a matrícula do terreno (validade > 90 dias) e complementar a planilha de orçamento com custo de fundação.',
      revisao: 2,
    },
    {
      id: randomUUID(),
      incorporadoraId: v.id,
      status: 'REPROVADO',
      nome: 'Verde Living Barra',
      cidade: 'Rio de Janeiro',
      estado: 'RJ',
      valorCaptar: 14_800_000,
      valorTotal: 40_000_000,
      tipoOferta: 'PUBLICA',
      dias: 18,
      analista: true,
      justificativaReprovacao: 'Viabilidade financeira inconsistente com o cronograma e documentação incompleta (CND estadual ausente).',
    },
    {
      id: randomUUID(),
      incorporadoraId: a.id,
      status: 'APROVADO',
      nome: 'Atlantic Beira Mar',
      cidade: 'Florianópolis',
      estado: 'SC',
      valorCaptar: 9_900_000,
      valorTotal: 28_000_000,
      tipoOferta: 'PRIVADA',
      dias: 22,
      analista: true,
    },
    {
      id: randomUUID(),
      incorporadoraId: a.id,
      status: 'OFERTA_CRIADA',
      nome: 'Atlantic Jurerê Club Deal',
      cidade: 'Florianópolis',
      estado: 'SC',
      valorCaptar: 4_500_000,
      valorTotal: 12_000_000,
      tipoOferta: 'PRIVADA',
      dias: 35,
      analista: true,
      ofertaId: 'divify-offer-demo-001',
      ofertaLink: 'https://atlashub.divify.example/ofertas/atlantic-jurere',
    },
    {
      id: randomUUID(),
      incorporadoraId: h.id,
      status: 'RASCUNHO',
      nome: 'Horizon Brooklin (rascunho)',
      cidade: 'São Paulo',
      estado: 'SP',
      valorCaptar: 7_000_000,
      valorTotal: 20_000_000,
      tipoOferta: 'PUBLICA',
      dias: 1,
    },
    {
      id: randomUUID(),
      incorporadoraId: v.id,
      status: 'SUBMETIDO',
      nome: 'Verde Offices Centro',
      cidade: 'Niterói',
      estado: 'RJ',
      valorCaptar: 5_100_000,
      valorTotal: 15_500_000,
      tipoOferta: 'PUBLICA',
      dias: 2,
    },
  ];

  const scorecards: Record<string, unknown>[] = [];
  const auditoria: Record<string, unknown>[] = [];
  const notas: Record<string, unknown>[] = [];
  const notificacoes: Record<string, unknown>[] = [];

  for (const p of projetosSeed) {
    const criadoEm = daysAgo(p.dias);
    const submetidoEm = p.status === 'RASCUNHO' ? undefined : daysAgo(p.dias - 1);
    const item: Record<string, unknown> = {
      id: p.id,
      incorporadoraId: p.incorporadoraId,
      status: p.status,
      revisao: p.revisao ?? 1,
      nome: p.nome,
      modelo: 'VENDA',
      tipoImovel: p.cidade === 'Niterói' ? 'COMERCIAL' : 'RESIDENCIAL',
      cidade: p.cidade,
      estado: p.estado,
      endereco: `Rua Exemplo, ${100 + Math.floor(Math.random() * 400)}`,
      descricao: `${p.nome} é um empreendimento de construção para venda com foco em alta liquidez na região. Projeto seed para demonstração do painel Atlas Hub com documentação e equipe fictícias.`.padEnd(220, ' '),
      valorTotal: p.valorTotal,
      valorCaptar: p.valorCaptar,
      prazoObra: 24,
      prazoRetorno: 36,
      rentabilidadeEstimada: 14.5,
      modeloRetorno: p.tipoOferta === 'PRIVADA' ? 'SCP' : 'NOTA_COMERCIAL',
      planoSaida: 'Venda das unidades e distribuição do lucro aos cotistas após habite-se.',
      tipoOferta: p.tipoOferta,
      documentos: docs,
      equipe: equipePadrao,
      criadoEm,
      atualizadoEm: daysAgo(Math.max(0, p.dias - 3)),
      ...(submetidoEm ? { submetidoEm } : {}),
    };

    if (p.analista) {
      item['analistaId'] = analistaId;
      item['analistaNome'] = 'Ana Curadora';
    }
    if (p.textoAjuste) item['textoAjuste'] = p.textoAjuste;
    if (p.justificativaReprovacao) {
      item['justificativaReprovacao'] = p.justificativaReprovacao;
      item['reprovadoEm'] = daysAgo(p.dias - 4);
    }
    if (p.status === 'APROVADO' || p.status === 'OFERTA_CRIADA') {
      item['aprovadoEm'] = daysAgo(p.dias - 5);
    }
    if (p.ofertaId) {
      item['ofertaId'] = p.ofertaId;
      item['ofertaLink'] = p.ofertaLink;
      item['ofertaConfirmadaEm'] = daysAgo(p.dias - 6);
    }

    await put(T.projetos, item);
    console.log(`  ✓ Projeto [${p.status}] ${p.nome}`);

    auditoria.push({
      projetoId: p.id,
      criadoEm,
      acao: 'CRIACAO',
      userId: p.incorporadoraId,
      userName: 'Incorporadora seed',
      descricao: 'Projeto criado (seed)',
      statusNovo: 'RASCUNHO',
    });

    if (p.status !== 'RASCUNHO') {
      auditoria.push({
        projetoId: p.id,
        criadoEm: submetidoEm ?? criadoEm,
        acao: 'SUBMISSAO',
        userId: p.incorporadoraId,
        userName: 'Incorporadora seed',
        descricao: 'Projeto submetido à curadoria',
        statusAnterior: 'RASCUNHO',
        statusNovo: 'SUBMETIDO',
      });
    }

    if (p.analista) {
      auditoria.push({
        projetoId: p.id,
        criadoEm: daysAgo(p.dias - 2),
        acao: 'INICIO_ANALISE',
        userId: analistaId,
        userName: 'Ana Curadora',
        descricao: 'Análise iniciada',
        statusAnterior: 'SUBMETIDO',
        statusNovo: 'EM_ANALISE',
      });

      const notasScore = {
        localizacaoNota: 8,
        localizacaoComentario: 'Boa demanda regional e infraestrutura consolidada.',
        financeiraNota: p.status === 'REPROVADO' ? 4 : 7,
        financeiraComentario: p.status === 'REPROVADO'
          ? 'Orçamento inconsistente com o cronograma apresentado.'
          : 'Margem e cronograma coerentes com o mercado.',
        documentacaoNota: p.status === 'AJUSTE_SOLICITADO' ? 5 : 8,
        documentacaoComentario: p.status === 'AJUSTE_SOLICITADO'
          ? 'Matrícula vencida e orçamento incompleto.'
          : 'Documentação completa e certidões válidas.',
        equipeNota: 8,
        equipeComentario: 'Equipe com experiência comprovada.',
        riscoNota: 7,
        riscoComentario: 'Risco de execução moderado; mercado absorvente.',
      };
      const notaGeral =
        notasScore.localizacaoNota * 0.25 +
        notasScore.financeiraNota * 0.25 +
        notasScore.documentacaoNota * 0.2 +
        notasScore.equipeNota * 0.15 +
        notasScore.riscoNota * 0.15;

      let decisao: string | undefined;
      let parecer: string | undefined;
      if (p.status === 'APROVADO' || p.status === 'OFERTA_CRIADA') {
        decisao = 'APROVADO';
        parecer = 'Projeto aprovado. SPE/SCP ok e elegibilidade CVM atendida.';
      } else if (p.status === 'REPROVADO') {
        decisao = 'REPROVADO';
        parecer = p.justificativaReprovacao;
      } else if (p.status === 'AJUSTE_SOLICITADO') {
        decisao = 'AJUSTE_SOLICITADO';
        parecer = p.textoAjuste;
      } else {
        decisao = 'RASCUNHO';
        parecer = 'Análise em andamento.';
      }

      scorecards.push({
        projetoId: p.id,
        revisao: p.revisao ?? 1,
        analistaId,
        analistaNome: 'Ana Curadora',
        ...notasScore,
        notaGeral: Math.round(notaGeral * 10) / 10,
        parecer,
        decisao,
        criadoEm: daysAgo(p.dias - 2),
        atualizadoEm: daysAgo(p.dias - 3),
      });

      notas.push({
        projetoId: p.id,
        criadoEm: daysAgo(p.dias - 2),
        analistaId,
        analistaNome: 'Ana Curadora',
        texto: `Nota interna seed: revisar liquidez da região de ${p.cidade} antes da decisão final.`,
      });
    }

    if (p.status === 'AJUSTE_SOLICITADO' || p.status === 'REPROVADO' || p.status === 'APROVADO' || p.status === 'OFERTA_CRIADA') {
      const tipo =
        p.status === 'AJUSTE_SOLICITADO' ? 'AJUSTE_SOLICITADO'
          : p.status === 'REPROVADO' ? 'REPROVADO'
            : p.status === 'OFERTA_CRIADA' ? 'OFERTA_CRIADA'
              : 'APROVADO';
      notificacoes.push({
        userId: p.incorporadoraId,
        criadoEm: daysAgo(p.dias - 3),
        id: randomUUID(),
        tipo,
        titulo: `Atualização: ${p.nome}`,
        mensagem: p.textoAjuste ?? p.justificativaReprovacao ?? 'Seu projeto teve uma atualização na curadoria.',
        lida: false,
        projetoId: p.id,
        projetoNome: p.nome,
      });
    }
  }

  await batchPut(T.scorecard, scorecards);
  await batchPut(T.auditoria, auditoria);
  await batchPut(T.notas, notas);
  await batchPut(T.notificacoes, notificacoes);

  console.log('');
  console.log('✓ Seed DEV concluído');
  console.log('');
  console.log('Logins (senha para todos):', password);
  console.log('  Admin master : gabriel@atlashub.com.br');
  console.log('  Analista     : analista@atlashub.com.br');
  console.log('  Incorporadoras:');
  for (const inc of incorporadoras) {
    console.log(`    - ${inc.email} (${inc.razaoSocial})`);
  }
  console.log('');
  console.log('Frontend DEV: https://dev.dng6v0yvgarue.amplifyapp.com');
  console.log('Admin:         https://dev.dng6v0yvgarue.amplifyapp.com/admin');
}

void run().catch((err) => {
  console.error('Erro no seed:', err);
  process.exit(1);
});
