import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const region = process.env['REGION'] ?? 'sa-east-1';
const stage = process.env['STAGE'] ?? 'dev';
const imgDir = process.env['SEED_IMG_DIR'] ?? '/tmp/atlas-seed';

const bucket = `atlas-hub-documents-${stage}`;
const projetosTable = `AtlasProjetos-${stage}`;
const incorporadorasTable = `AtlasIncorporadoras-${stage}`;

const s3 = new S3Client({ region });
const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));

const INCORP_ID = 'seed-demo-incorporadora';
const now = new Date().toISOString();

interface SeedProjeto {
  readonly id: string;
  readonly nome: string;
  readonly modelo: 'VENDA' | 'RENDA' | 'MISTO';
  readonly tipoImovel: 'RESIDENCIAL' | 'COMERCIAL' | 'MISTO';
  readonly tipoOferta: 'PUBLICA' | 'PRIVADA';
  readonly cidade: string;
  readonly estado: string;
  readonly endereco: string;
  readonly descricao: string;
  readonly valorCaptar: number;
  readonly rentabilidadeEstimada: number;
  readonly prazoObra: number;
  readonly prazoRetorno: number;
  readonly unidades: number;
  readonly imagem: string;
}

const PROJETOS: readonly SeedProjeto[] = [
  {
    id: 'seed-proj-jardins',
    nome: 'Residencial Jardins',
    modelo: 'VENDA',
    tipoImovel: 'RESIDENCIAL',
    tipoOferta: 'PUBLICA',
    cidade: 'São Paulo',
    estado: 'SP',
    endereco: 'Rua Oscar Freire, 1200 — Jardins',
    descricao: 'Empreendimento residencial de alto padrão com 24 unidades no bairro Jardins. Acabamento premium, localização privilegiada e forte demanda por venda.',
    valorCaptar: 3_000_000,
    rentabilidadeEstimada: 22.5,
    prazoObra: 18,
    prazoRetorno: 24,
    unidades: 24,
    imagem: '1.jpg',
  },
  {
    id: 'seed-proj-vila-mariana',
    nome: 'Vila Mariana Studios',
    modelo: 'RENDA',
    tipoImovel: 'RESIDENCIAL',
    tipoOferta: 'PUBLICA',
    cidade: 'São Paulo',
    estado: 'SP',
    endereco: 'Rua Domingos de Morais, 880 — Vila Mariana',
    descricao: 'Studios para locação de curta temporada a 200m do metrô. Projeto desenhado para renda recorrente e gestão profissional de aluguel.',
    valorCaptar: 1_500_000,
    rentabilidadeEstimada: 18.0,
    prazoObra: 12,
    prazoRetorno: 30,
    unidades: 18,
    imagem: '2.jpg',
  },
  {
    id: 'seed-proj-cajamar',
    nome: 'Barracão Logístico Cajamar',
    modelo: 'RENDA',
    tipoImovel: 'COMERCIAL',
    tipoOferta: 'PUBLICA',
    cidade: 'Cajamar',
    estado: 'SP',
    endereco: 'Rodovia Anhanguera, km 32 — Cajamar',
    descricao: 'Galpão logístico de 2.400 m² com contrato de locação de 5 anos já assinado, locatário de grande porte e garagem para carretas.',
    valorCaptar: 4_200_000,
    rentabilidadeEstimada: 20.0,
    prazoObra: 14,
    prazoRetorno: 36,
    unidades: 1,
    imagem: '3.jpg',
  },
  {
    id: 'seed-proj-alto-pinheiros',
    nome: 'Casa Alto de Pinheiros',
    modelo: 'VENDA',
    tipoImovel: 'RESIDENCIAL',
    tipoOferta: 'PRIVADA',
    cidade: 'São Paulo',
    estado: 'SP',
    endereco: 'Rua Ferreira de Araújo, 500 — Alto de Pinheiros',
    descricao: 'Casa térrea de 320 m² em terreno de 600 m², reforma e revenda com foco em valorização. Oferta privada para grupo seleto de investidores.',
    valorCaptar: 2_800_000,
    rentabilidadeEstimada: 24.0,
    prazoObra: 10,
    prazoRetorno: 18,
    unidades: 1,
    imagem: '4.jpg',
  },
  {
    id: 'seed-proj-beira-mar',
    nome: 'Residencial Beira Mar',
    modelo: 'VENDA',
    tipoImovel: 'RESIDENCIAL',
    tipoOferta: 'PUBLICA',
    cidade: 'Balneário Camboriú',
    estado: 'SC',
    endereco: 'Av. Atlântica, 1500 — Centro',
    descricao: 'Torre residencial de 40 unidades com vista mar em Balneário Camboriú. Alta liquidez de venda e valorização consistente nos últimos anos.',
    valorCaptar: 9_000_000,
    rentabilidadeEstimada: 26.0,
    prazoObra: 24,
    prazoRetorno: 30,
    unidades: 40,
    imagem: '5.jpg',
  },
  {
    id: 'seed-proj-faria-lima',
    nome: 'Corporate Faria Lima',
    modelo: 'RENDA',
    tipoImovel: 'COMERCIAL',
    tipoOferta: 'PUBLICA',
    cidade: 'São Paulo',
    estado: 'SP',
    endereco: 'Av. Brigadeiro Faria Lima, 3400 — Itaim Bibi',
    descricao: 'Lajes corporativas para locação na Faria Lima, com locatários multinacionais e contratos atípicos. Geração de renda mensal previsível.',
    valorCaptar: 5_500_000,
    rentabilidadeEstimada: 19.0,
    prazoObra: 16,
    prazoRetorno: 36,
    unidades: 8,
    imagem: '6.jpg',
  },
];

const EQUIPE = [
  { nome: 'Marina Alves', cargo: 'Engenheira responsável', bio: '10 anos de experiência em incorporação residencial e gestão de obras.' },
  { nome: 'Rafael Costa', cargo: 'Arquiteto', bio: 'Especialista em projetos residenciais e comerciais de alto padrão.' },
  { nome: 'Atlas Hub', cargo: 'Curadoria e estruturação', bio: 'Curadoria técnica, financeira e jurídica da oportunidade.' },
];

const DOCS: readonly (readonly ['matriculaUrl' | 'alvaraUrl' | 'memorialUrl' | 'plantaUrl', string])[] = [
  ['matriculaUrl', 'matricula.pdf'],
  ['alvaraUrl', 'alvara.pdf'],
  ['memorialUrl', 'memorial.pdf'],
  ['plantaUrl', 'planta.pdf'],
];

interface DocumentosSeed {
  matriculaUrl?: string;
  alvaraUrl?: string;
  memorialUrl?: string;
  plantaUrl?: string;
  outrosUrls?: string[];
}

function viabilidade(p: SeedProjeto): Record<string, unknown> {
  const vgv = Math.round(p.valorCaptar * 1.6);
  const investimentoTotal = p.valorCaptar;
  const retornoLiquido = vgv - investimentoTotal;
  const roiPercent = Number(((retornoLiquido / investimentoTotal) * 100).toFixed(1));
  return {
    inputs: {
      unidades: p.unidades,
      custoObra: p.valorCaptar,
      precoMedioUnidade: Math.round(vgv / Math.max(p.unidades, 1)),
      prazoMeses: p.prazoObra,
    },
    outputs: {
      vgv,
      custoPorUnidade: Math.round(p.valorCaptar / Math.max(p.unidades, 1)),
      custoTerrenoEstimado: 0,
      investimentoTotal,
      retornoLiquido,
      roiPercent,
      fluxoMensal: [{ mes: Math.round(p.prazoObra / 2), valor: -Math.round(investimentoTotal / 2) }, { mes: p.prazoRetorno, valor: vgv }],
    },
    atualizadoEm: now,
  };
}

async function run(): Promise<void> {
  console.log(`Seed de projetos — stage=${stage} região=${region} bucket=${bucket}`);

  await db.send(new PutCommand({
    TableName: incorporadorasTable,
    Item: {
      id: INCORP_ID,
      cnpj: '12345678000195',
      razaoSocial: 'Atlas Demo Incorporadora',
      nomeResponsavel: 'Atlas Demo',
      cpfResponsavel: '00000000000',
      cargoResponsavel: 'Diretor',
      email: 'demo@atlascomp.com.br',
      telefone: '11999999999',
      emailConfirmado: true,
      descricao: 'Incorporadora de demonstração para o ambiente de testes da Atlas Hub.',
      site: 'https://www.atlascomp.com.br',
      endereco: 'Av. Paulista, 1000 — São Paulo/SP',
      criadoEm: now,
      atualizadoEm: now,
    },
  }));
  console.log(`✓ incorporadora seed criada (${INCORP_ID})`);

  const docPdf = readFileSync(join(imgDir, 'doc.pdf'));

  for (const p of PROJETOS) {
    const key = `incorporadoras/${INCORP_ID}/projetos/${p.id}/capa.jpg`;
    await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: readFileSync(join(imgDir, p.imagem)), ContentType: 'image/jpeg' }));
    const location = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

    const documentos: DocumentosSeed = { outrosUrls: [] };
    for (const [campo, arquivo] of DOCS) {
      const docKey = `incorporadoras/${INCORP_ID}/projetos/${p.id}/documentos/${arquivo}`;
      await s3.send(new PutObjectCommand({ Bucket: bucket, Key: docKey, Body: docPdf, ContentType: 'application/pdf' }));
      documentos[campo] = `https://${bucket}.s3.${region}.amazonaws.com/${docKey}`;
    }
    const extraKey = `incorporadoras/${INCORP_ID}/projetos/${p.id}/documentos/apresentacao.pdf`;
    await s3.send(new PutObjectCommand({ Bucket: bucket, Key: extraKey, Body: docPdf, ContentType: 'application/pdf' }));
    documentos.outrosUrls = [`https://${bucket}.s3.${region}.amazonaws.com/${extraKey}`];

    await db.send(new PutCommand({
      TableName: projetosTable,
      Item: {
        id: p.id,
        incorporadoraId: INCORP_ID,
        status: 'OFERTA_CRIADA',
        revisao: 1,
        nome: p.nome,
        modelo: p.modelo,
        tipoImovel: p.tipoImovel,
        tipoOferta: p.tipoOferta,
        cidade: p.cidade,
        estado: p.estado,
        endereco: p.endereco,
        descricao: p.descricao,
        fotosUrls: [
          location,
          `https://${bucket}.s3.${region}.amazonaws.com/incorporadoras/${INCORP_ID}/projetos/${p.id}/ambientes.jpg`,
        ],
        valorTotal: Math.round(p.valorCaptar * 1.6),
        valorCaptar: p.valorCaptar,
        rentabilidadeEstimada: p.rentabilidadeEstimada,
        prazoObra: p.prazoObra,
        prazoRetorno: p.prazoRetorno,
        modeloRetorno: 'SCP',
        planoSaida: 'Distribuição proporcional do lucro após a venda das unidades e encerramento da SPE.',
        parcelado: false,
        documentos,
        viabilidade: viabilidade(p),
        equipe: EQUIPE,
        ofertaLink: 'https://www.atlascomp.com.br',
        ofertaConfirmadaEm: now,
        aprovadoEm: now,
        criadoEm: now,
        atualizadoEm: now,
      },
    }));

    const ambientesKey = `incorporadoras/${INCORP_ID}/projetos/${p.id}/ambientes.jpg`;
    await s3.send(new PutObjectCommand({ Bucket: bucket, Key: ambientesKey, Body: readFileSync(join(imgDir, p.imagem)), ContentType: 'image/jpeg' }));

    console.log(`✓ ${p.nome} (${p.cidade}/${p.estado}) — ${p.imagem} + docs + equipe + viabilidade`);
  }

  console.log(`\n✓ ${PROJETOS.length} projetos publicados em ${projetosTable}`);
}

void run().catch((err) => {
  console.error('Erro no seed:', err);
  process.exit(1);
});
