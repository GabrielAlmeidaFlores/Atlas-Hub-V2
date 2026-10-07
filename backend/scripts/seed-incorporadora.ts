import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminAddUserToGroupCommand,
  AdminGetUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const region = process.env['REGION'] ?? 'sa-east-1';
const stage = process.env['STAGE'] ?? 'dev';
const poolId = process.env['POOL_ID'] ?? '';
const email = process.env['INC_EMAIL'] ?? 'incorporadora@atlascomp.com.br';
const password = process.env['INC_PASSWORD'] ?? 'AtlasDev@2026';
const imgDir = process.env['SEED_IMG_DIR'] ?? '/tmp/atlas-seed';

const bucket = `atlas-hub-documents-${stage}`;
const projetosTable = `AtlasProjetos-${stage}`;
const incorporadorasTable = `AtlasIncorporadoras-${stage}`;

const cognito = new CognitoIdentityProviderClient({ region });
const s3 = new S3Client({ region });
const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));

const now = new Date().toISOString();

interface Seed {
  readonly id: string;
  readonly nome: string;
  readonly status: 'EM_ANALISE' | 'AJUSTE_SOLICITADO' | 'OFERTA_CRIADA';
  readonly modelo: 'VENDA' | 'RENDA';
  readonly tipoImovel: 'RESIDENCIAL' | 'COMERCIAL';
  readonly cidade: string;
  readonly estado: string;
  readonly endereco: string;
  readonly descricao: string;
  readonly valorCaptar: number;
  readonly rentabilidade: number;
  readonly prazoObra: number;
  readonly prazoRetorno: number;
  readonly unidades: number;
  readonly imagens: readonly string[];
}

const PROJETOS: readonly Seed[] = [
  {
    id: 'inc-proj-aurora',
    nome: 'Residencial Aurora',
    status: 'EM_ANALISE',
    modelo: 'RENDA',
    tipoImovel: 'RESIDENCIAL',
    cidade: 'São Paulo',
    estado: 'SP',
    endereco: 'Rua Harmonia, 450 — Vila Madalena',
    descricao: 'Prédio de studios para locação de curta temporada na Vila Madalena, com projeto de interiores e gestão de aluguel. Foco em renda recorrente.',
    valorCaptar: 2_400_000,
    rentabilidade: 19.5,
    prazoObra: 14,
    prazoRetorno: 30,
    unidades: 22,
    imagens: ['1.jpg', '2.jpg'],
  },
  {
    id: 'inc-proj-bela-vista',
    nome: 'Edifício Bela Vista',
    status: 'AJUSTE_SOLICITADO',
    modelo: 'VENDA',
    tipoImovel: 'RESIDENCIAL',
    cidade: 'Campinas',
    estado: 'SP',
    endereco: 'Av. Norte-Sul, 900 — Centro',
    descricao: 'Empreendimento residencial de 32 unidades no centro de Campinas, com boa liquidez de venda e localização próxima a universidades.',
    valorCaptar: 3_600_000,
    rentabilidade: 23.0,
    prazoObra: 20,
    prazoRetorno: 26,
    unidades: 32,
    imagens: ['3.jpg', '4.jpg'],
  },
  {
    id: 'inc-proj-itu',
    nome: 'Barracão Logístico Itu',
    status: 'OFERTA_CRIADA',
    modelo: 'RENDA',
    tipoImovel: 'COMERCIAL',
    cidade: 'Itu',
    estado: 'SP',
    endereco: 'Rodovia Castello Branco, km 82 — Itu',
    descricao: 'Galpão logístico de 1.800 m² com contrato de locação de longo prazo, pátio de manobras e acesso pela Castello Branco.',
    valorCaptar: 4_800_000,
    rentabilidade: 21.0,
    prazoObra: 16,
    prazoRetorno: 36,
    unidades: 1,
    imagens: ['5.jpg', '6.jpg'],
  },
];

const EQUIPE = [
  { nome: 'Paulo Menezes', cargo: 'Engenheiro responsável', bio: '15 anos em incorporação e gestão de obras.' },
  { nome: 'Clara Ribeiro', cargo: 'Arquiteta', bio: 'Projetos residenciais e comerciais.' },
];

const DOCS: readonly (readonly ['matriculaUrl' | 'alvaraUrl' | 'memorialUrl' | 'plantaUrl', string])[] = [
  ['matriculaUrl', 'matricula.pdf'],
  ['alvaraUrl', 'alvara.pdf'],
  ['memorialUrl', 'memorial.pdf'],
  ['plantaUrl', 'planta.pdf'],
];

function viabilidade(p: Seed): Record<string, unknown> {
  const vgv = Math.round(p.valorCaptar * 1.6);
  const retornoLiquido = vgv - p.valorCaptar;
  const roiPercent = Number(((retornoLiquido / p.valorCaptar) * 100).toFixed(1));
  return {
    inputs: { unidades: p.unidades, custoObra: p.valorCaptar, precoMedioUnidade: Math.round(vgv / Math.max(p.unidades, 1)), prazoMeses: p.prazoObra },
    outputs: {
      vgv,
      custoPorUnidade: Math.round(p.valorCaptar / Math.max(p.unidades, 1)),
      custoTerrenoEstimado: 0,
      investimentoTotal: p.valorCaptar,
      retornoLiquido,
      roiPercent,
      fluxoMensal: [{ mes: p.prazoObra, valor: -Math.round(p.valorCaptar * 0.7) }, { mes: p.prazoRetorno, valor: vgv }],
    },
    atualizadoEm: now,
  };
}

async function ensureUser(): Promise<string> {
  try {
    const created = await cognito.send(new AdminCreateUserCommand({
      UserPoolId: poolId,
      Username: email,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'email_verified', Value: 'true' },
        { Name: 'name', Value: 'Felipe Construtora' },
      ],
      MessageAction: 'SUPPRESS',
    }));
    await cognito.send(new AdminSetUserPasswordCommand({ UserPoolId: poolId, Username: email, Password: password, Permanent: true }));
    await cognito.send(new AdminAddUserToGroupCommand({ UserPoolId: poolId, Username: email, GroupName: 'INCORPORADORA' }));
    return created.User?.Username ?? email;
  } catch (err) {
    if (err instanceof Error && err.name === 'UsernameExistsException') {
      await cognito.send(new AdminSetUserPasswordCommand({ UserPoolId: poolId, Username: email, Password: password, Permanent: true }));
      await cognito.send(new AdminAddUserToGroupCommand({ UserPoolId: poolId, Username: email, GroupName: 'INCORPORADORA' }));
      const got = await cognito.send(new AdminGetUserCommand({ UserPoolId: poolId, Username: email }));
      return got.Username ?? email;
    }
    throw err;
  }
}

async function run(): Promise<void> {
  if (poolId === '') throw new Error('POOL_ID é obrigatório');
  console.log(`Seed incorporadora — stage=${stage} pool=${poolId} email=${email}`);

  const userId = await ensureUser();
  console.log(`✓ usuário confirmado no Cognito (id=${userId})`);

  await db.send(new PutCommand({
    TableName: incorporadorasTable,
    Item: {
      id: userId,
      cnpj: '12345678000195',
      razaoSocial: 'Construtora Horizonte Empreendimentos Ltda',
      nomeResponsavel: 'Felipe Construtora',
      cpfResponsavel: '12345678901',
      cargoResponsavel: 'Diretor',
      email,
      telefone: '15999990000',
      emailConfirmado: true,
      descricao: 'Incorporadora de médio porte com foco na região de São Paulo e interior, atuação em residencial e comercial.',
      site: 'https://www.atlascomp.com.br',
      endereco: 'Av. Paulista, 1000 — São Paulo/SP',
      criadoEm: now,
      atualizadoEm: now,
    },
  }));
  console.log('✓ registro da incorporadora criado');

  const docPdf = readFileSync(join(imgDir, 'doc.pdf'));

  for (const p of PROJETOS) {
    const fotosUrls: string[] = [];
    for (let i = 0; i < p.imagens.length; i += 1) {
      const key = `incorporadoras/${userId}/projetos/${p.id}/foto-${String(i + 1)}.jpg`;
      await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: readFileSync(join(imgDir, p.imagens[i] ?? '1.jpg')), ContentType: 'image/jpeg' }));
      fotosUrls.push(`https://${bucket}.s3.${region}.amazonaws.com/${key}`);
    }

    const documentos: Record<string, unknown> = { outrosUrls: [] };
    for (const [campo, arquivo] of DOCS) {
      const key = `incorporadoras/${userId}/projetos/${p.id}/documentos/${arquivo}`;
      await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: docPdf, ContentType: 'application/pdf' }));
      documentos[campo] = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
    }

    const publicada = p.status === 'OFERTA_CRIADA';
    await db.send(new PutCommand({
      TableName: projetosTable,
      Item: {
        id: p.id,
        incorporadoraId: userId,
        status: p.status,
        revisao: 1,
        nome: p.nome,
        modelo: p.modelo,
        tipoImovel: p.tipoImovel,
        tipoOferta: 'PUBLICA',
        cidade: p.cidade,
        estado: p.estado,
        endereco: p.endereco,
        descricao: p.descricao,
        fotosUrls,
        valorTotal: Math.round(p.valorCaptar * 1.6),
        valorCaptar: p.valorCaptar,
        rentabilidadeEstimada: p.rentabilidade,
        prazoObra: p.prazoObra,
        prazoRetorno: p.prazoRetorno,
        modeloRetorno: 'SCP',
        planoSaida: 'Distribuição proporcional do lucro após a venda das unidades.',
        parcelado: false,
        documentos,
        viabilidade: viabilidade(p),
        equipe: EQUIPE,
        submetidoEm: now,
        criadoEm: now,
        atualizadoEm: now,
        ...(p.status === 'AJUSTE_SOLICITADO' ? { textoAjuste: 'Anexar matrícula atualizada e detalhar melhor o plano de saída.' } : {}),
        ...(publicada ? { ofertaLink: 'https://www.atlascomp.com.br', ofertaConfirmadaEm: now, aprovadoEm: now, analistaNome: 'Felipe Analista' } : {}),
      },
    }));
    console.log(`✓ projeto ${p.nome} (${p.status})`);
  }

  console.log(`\n✓ conta pronta: ${email} / ${password}`);
}

void run().catch((err) => {
  console.error('Erro:', err);
  process.exit(1);
});
