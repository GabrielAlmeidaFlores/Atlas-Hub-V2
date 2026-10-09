import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const region = process.env['REGION'] ?? 'sa-east-1';
const stage = process.env['STAGE'] ?? 'dev';
const day = process.env['HEAT_DAY'] ?? new Date().toISOString().slice(0, 10);

const table = `AtlasAnalyticsHeatmaps-${stage}`;
const COLS = 100;
const ROWS = 200;

const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));

type Click = readonly [number, number, number];

const NAV = (y: number): Click[] => [
  [0.442, y, 24], [0.515, y, 20], [0.588, y, 16], [0.658, y, 12], [0.776, y, 58], [0.878, y, 72],
];

const CLICKS: Record<string, Click[]> = {
  '/': [
    ...NAV(0.010),
    [0.175, 0.305, 48], [0.619, 0.305, 53],
    [0.209, 0.424, 28], [0.498, 0.424, 22], [0.787, 0.424, 19],
    [0.498, 0.483, 26],
    [0.798, 0.627, 14],
    [0.525, 0.809, 11], [0.677, 0.809, 9],
    [0.963, 0.190, 12],
    [0.151, 0.907, 10], [0.312, 0.907, 8],
  ],
  '/para-incorporadoras': [
    ...NAV(0.020),
    [0.166, 0.246, 57],
    [0.521, 0.837, 72],
    [0.963, 0.374, 10],
  ],
  '/para-investidores': [
    ...NAV(0.016),
    [0.161, 0.190, 58],
    [0.117, 0.514, 16], [0.362, 0.514, 13], [0.606, 0.514, 11], [0.851, 0.514, 9],
    [0.476, 0.602, 22], [0.520, 0.602, 19],
    [0.798, 0.661, 12],
    [0.525, 0.863, 10], [0.677, 0.863, 8],
    [0.963, 0.300, 9],
  ],
  '/projetos': [
    ...NAV(0.016),
    [0.123, 0.186, 55],
    [0.173, 0.655, 20], [0.390, 0.655, 17], [0.606, 0.655, 14], [0.823, 0.655, 12],
    [0.173, 0.799, 16], [0.390, 0.799, 13], [0.606, 0.799, 11], [0.823, 0.799, 9],
    [0.963, 0.294, 9],
  ],
  '/quem-somos': [
    ...NAV(0.017),
    [0.158, 0.198, 47],
    [0.781, 0.690, 15],
    [0.963, 0.309, 9],
  ],
};

const SCROLLS: readonly [string, number][] = [
  ['25', 142],
  ['50', 98],
  ['75', 57],
  ['100', 29],
];

async function clearPage(pageKey: string): Promise<number> {
  let startKey: Record<string, unknown> | undefined;
  let removed = 0;
  do {
    const res = await db.send(new QueryCommand({
      TableName: table,
      KeyConditionExpression: 'pageKey = :pk',
      ExpressionAttributeValues: { ':pk': pageKey },
      ...(startKey !== undefined ? { ExclusiveStartKey: startKey } : {}),
    }));
    for (const item of res.Items ?? []) {
      await db.send(new DeleteCommand({ TableName: table, Key: { pageKey, cellKey: item['cellKey'] } }));
      removed += 1;
    }
    startKey = res.LastEvaluatedKey;
  } while (startKey !== undefined);
  return removed;
}

async function put(pageKey: string, cellKey: string, count: number): Promise<void> {
  await db.send(new PutCommand({
    TableName: table,
    Item: { pageKey, cellKey, count, updatedAt: new Date().toISOString() },
  }));
}

async function seedPath(path: string, clicks: Click[]): Promise<{ clicks: number; cleared: number }> {
  const pageKey = `${path}#${day}`;
  const cleared = await clearPage(pageKey);
  const cells = new Map<string, number>();
  for (const [xf, yf, count] of clicks) {
    const x = Math.min(COLS - 1, Math.max(0, Math.floor(xf * COLS)));
    const y = Math.min(ROWS - 1, Math.max(0, Math.floor(yf * ROWS)));
    const key = `click:${String(x)}:${String(y)}`;
    cells.set(key, (cells.get(key) ?? 0) + count);
  }
  for (const [key, count] of cells) {
    await put(pageKey, key, count);
  }
  for (const [band, count] of SCROLLS) {
    await put(pageKey, `scroll:${band}`, count);
  }
  return { clicks: cells.size, cleared };
}

async function run(): Promise<void> {
  console.log(`Seed heatmap — ${table} · dia ${day}`);
  for (const [path, clicks] of Object.entries(CLICKS)) {
    const r = await seedPath(path, clicks);
    console.log(`  ${path}: ${String(r.clicks)} pontos + ${String(SCROLLS.length)} rolagens (limpou ${String(r.cleared)})`);
  }
  console.log('✓ concluído');
}

void run().catch((err) => {
  console.error('Erro no seed do heatmap:', err);
  process.exit(1);
});
