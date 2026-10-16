import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

const region = process.env['REGION'] ?? 'sa-east-1';
const stage = process.env['STAGE'] ?? 'dev';
const table = `AtlasDocumentoCatalogo-${stage}`;

const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));

type Item = {
  key: string;
  categoria: 'EPROJ' | 'SOCIO_ADMIN' | 'PROPRIETARIO' | 'IMOVEL';
  scope: 'EMPRESA' | 'PROJETO';
  label: string;
  obrigatorio: boolean;
  condicional?: string;
  validadeDias?: number;
  ordem: number;
  ativo: boolean;
};

const ITENS: Item[] = [
  { key: 'empresa.contratoSocial', categoria: 'EPROJ', scope: 'EMPRESA', label: 'Contrato social consolidado e alterações posteriores', obrigatorio: true, ordem: 1, ativo: true },
  { key: 'empresa.cartaoCnpj', categoria: 'EPROJ', scope: 'EMPRESA', label: 'Cartão CNPJ', obrigatorio: true, ordem: 2, ativo: true },
  { key: 'empresa.fichaCadastralJunta', categoria: 'EPROJ', scope: 'EMPRESA', label: 'Ficha cadastral simplificada da Junta Comercial', obrigatorio: true, ordem: 3, ativo: true },
  { key: 'empresa.procuracao', categoria: 'EPROJ', scope: 'EMPRESA', label: 'Procuração', obrigatorio: false, condicional: 'Se quem assinar não for o administrador', ordem: 4, ativo: true },

  { key: 'empresa.socioRgCpf', categoria: 'SOCIO_ADMIN', scope: 'EMPRESA', label: 'RG ou CNH e CPF dos sócios e administradores', obrigatorio: true, ordem: 1, ativo: true },
  { key: 'empresa.socioComprovante', categoria: 'SOCIO_ADMIN', scope: 'EMPRESA', label: 'Comprovante de endereço', obrigatorio: true, ordem: 2, ativo: true },
  { key: 'empresa.socioEstadoCivil', categoria: 'SOCIO_ADMIN', scope: 'EMPRESA', label: 'Certidão de casamento, união estável ou nascimento', obrigatorio: true, ordem: 3, ativo: true },

  { key: 'projeto.propRgCpf', categoria: 'PROPRIETARIO', scope: 'PROJETO', label: 'RG ou CNH e CPF do proprietário e cônjuge', obrigatorio: true, ordem: 1, ativo: true },
  { key: 'projeto.propComprovante', categoria: 'PROPRIETARIO', scope: 'PROJETO', label: 'Comprovante de endereço', obrigatorio: true, ordem: 2, ativo: true },
  { key: 'projeto.propEstadoCivil', categoria: 'PROPRIETARIO', scope: 'PROJETO', label: 'Certidão de casamento, união estável ou nascimento', obrigatorio: true, ordem: 3, ativo: true },
  { key: 'projeto.propPjDocs', categoria: 'PROPRIETARIO', scope: 'PROJETO', label: 'Documentos da empresa proprietária', obrigatorio: false, condicional: 'Se o proprietário for pessoa jurídica', ordem: 4, ativo: true },
  { key: 'projeto.propEspolio', categoria: 'PROPRIETARIO', scope: 'PROJETO', label: 'Termo de inventariante ou formal de partilha', obrigatorio: false, condicional: 'Se o proprietário for espólio', ordem: 5, ativo: true },

  { key: 'projeto.matriculaInteiroTeor', categoria: 'IMOVEL', scope: 'PROJETO', label: 'Certidão de inteiro teor da matrícula com ônus e ações reipersecutórias', obrigatorio: true, validadeDias: 30, ordem: 1, ativo: true },
  { key: 'projeto.certidaoVintenaria', categoria: 'IMOVEL', scope: 'PROJETO', label: 'Certidão vintenária', obrigatorio: true, validadeDias: 30, ordem: 2, ativo: true },
  { key: 'projeto.cndIptu', categoria: 'IMOVEL', scope: 'PROJETO', label: 'Certidão negativa de débitos de IPTU', obrigatorio: true, validadeDias: 30, ordem: 3, ativo: true },
  { key: 'projeto.carneIptuValorVenal', categoria: 'IMOVEL', scope: 'PROJETO', label: 'Carnê do IPTU ou ficha do cadastro imobiliário (valor venal)', obrigatorio: true, ordem: 4, ativo: true },
  { key: 'projeto.zoneamento', categoria: 'IMOVEL', scope: 'PROJETO', label: 'Certidão de zoneamento / uso e ocupação do solo', obrigatorio: true, validadeDias: 30, ordem: 5, ativo: true },
  { key: 'projeto.defesaCivil2024', categoria: 'IMOVEL', scope: 'PROJETO', label: 'Declaração da Defesa Civil sobre a cheia de 2024', obrigatorio: false, condicional: 'Quando aplicável à região', ordem: 6, ativo: true },
  { key: 'projeto.levantamentoTopografico', categoria: 'IMOVEL', scope: 'PROJETO', label: 'Levantamento topográfico', obrigatorio: false, condicional: 'Se houver', ordem: 7, ativo: true },
  { key: 'projeto.projetoArquitetonicoAlvara', categoria: 'IMOVEL', scope: 'PROJETO', label: 'Projeto arquitetônico aprovado e alvará de construção', obrigatorio: false, condicional: 'Se já houver', ordem: 8, ativo: true },
];

async function run(): Promise<void> {
  console.log(`Seed catálogo de documentos — ${table}`);
  const now = new Date().toISOString();
  for (const item of ITENS) {
    const existing = await db.send(new GetCommand({ TableName: table, Key: { key: item.key } }));
    const criadoEm = (existing.Item?.['criadoEm'] as string | undefined) ?? now;
    await db.send(new PutCommand({
      TableName: table,
      Item: { ...item, criadoEm, atualizadoEm: now },
    }));
    console.log(`  ✓ ${item.key}`);
  }
  console.log(`✓ ${String(ITENS.length)} itens`);
}

void run().catch((err) => {
  console.error('Erro no seed do catálogo:', err);
  process.exit(1);
});
