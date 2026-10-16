import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const region = process.env['REGION'] ?? 'sa-east-1';
const stage = process.env['STAGE'] ?? 'dev';

const INC = `AtlasIncorporadoras-${stage}`;
const PROJ = `AtlasProjetos-${stage}`;

const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));

const MAPA_PROJETO: readonly [string, string][] = [
  ['matriculaUrl', 'projeto.matriculaInteiroTeor'],
  ['alvaraUrl', 'projeto.projetoArquitetonicoAlvara'],
  ['cndUrl', 'projeto.cndIptu'],
];

async function migrarIncorporadoras(): Promise<number> {
  let migradas = 0;
  let startKey: Record<string, unknown> | undefined;
  do {
    const res = await db.send(new ScanCommand({ TableName: INC, ...(startKey !== undefined ? { ExclusiveStartKey: startKey } : {}) }));
    for (const item of res.Items ?? []) {
      const atual = (item['documentosEmpresa'] as Record<string, unknown> | undefined) ?? {};
      const patch: Record<string, unknown> = {};
      const cs = item['contratoSocialUrl'] as string | undefined;
      const cc = item['comprovanteCnpjUrl'] as string | undefined;
      if (cs !== undefined && cs !== '' && atual['empresa.contratoSocial'] === undefined) patch['empresa.contratoSocial'] = { url: cs };
      if (cc !== undefined && cc !== '' && atual['empresa.cartaoCnpj'] === undefined) patch['empresa.cartaoCnpj'] = { url: cc };
      if (Object.keys(patch).length === 0) continue;
      await db.send(new UpdateCommand({
        TableName: INC,
        Key: { id: item['id'] },
        UpdateExpression: 'SET documentosEmpresa = :m',
        ExpressionAttributeValues: { ':m': { ...atual, ...patch } },
      }));
      migradas += 1;
    }
    startKey = res.LastEvaluatedKey;
  } while (startKey !== undefined);
  return migradas;
}

async function migrarProjetos(): Promise<number> {
  let migrados = 0;
  let startKey: Record<string, unknown> | undefined;
  do {
    const res = await db.send(new ScanCommand({ TableName: PROJ, ...(startKey !== undefined ? { ExclusiveStartKey: startKey } : {}) }));
    for (const item of res.Items ?? []) {
      const docs = item['documentos'] as Record<string, unknown> | undefined;
      if (docs === undefined) continue;
      const atual = (item['documentosChecklist'] as Record<string, unknown> | undefined) ?? {};
      const patch: Record<string, unknown> = {};
      for (const [legacy, dest] of MAPA_PROJETO) {
        const url = docs[legacy];
        if (typeof url === 'string' && url !== '' && atual[dest] === undefined) patch[dest] = { url };
      }
      if (Object.keys(patch).length === 0) continue;
      await db.send(new UpdateCommand({
        TableName: PROJ,
        Key: { id: item['id'] },
        UpdateExpression: 'SET documentosChecklist = :m',
        ExpressionAttributeValues: { ':m': { ...atual, ...patch } },
      }));
      migrados += 1;
    }
    startKey = res.LastEvaluatedKey;
  } while (startKey !== undefined);
  return migrados;
}

async function run(): Promise<void> {
  console.log(`Migração de documentos legados — stage ${stage}`);
  const inc = await migrarIncorporadoras();
  const proj = await migrarProjetos();
  console.log(`  incorporadoras migradas: ${String(inc)}`);
  console.log(`  projetos migrados: ${String(proj)}`);
  console.log('✓ concluído');
}

void run().catch((err) => {
  console.error('Erro na migração:', err);
  process.exit(1);
});
