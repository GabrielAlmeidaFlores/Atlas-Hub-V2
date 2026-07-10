import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminAddUserToGroupCommand,
  AdminSetUserPasswordCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const region  = process.env['REGION'] ?? 'sa-east-1';
const poolId  = process.env['POOL_ID'] ?? '';
const email   = process.env['ADMIN_EMAIL'] ?? '';
const table   = process.env['ADMINS_TABLE'] ?? 'AtlasAdmins-prod';
const tempPwd = `Atlas@${Math.random().toString(36).slice(2, 10)}!`;

if (!poolId || !email) {
  console.error('POOL_ID e ADMIN_EMAIL são obrigatórios');
  process.exit(1);
}

const cognito = new CognitoIdentityProviderClient({ region });
const db      = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));

async function run(): Promise<void> {
  console.log(`Criando admin master: ${email}`);

  const result = await cognito.send(new AdminCreateUserCommand({
    UserPoolId: poolId,
    Username: email,
    UserAttributes: [
      { Name: 'email',          Value: email },
      { Name: 'email_verified', Value: 'true' },
    ],
    TemporaryPassword: tempPwd,
    MessageAction: 'SUPPRESS',
  }));

  const userId = result.User?.Username ?? '';

  await cognito.send(new AdminAddUserToGroupCommand({
    UserPoolId: poolId,
    Username: email,
    GroupName: 'ADMIN_MASTER',
  }));

  await db.send(new PutCommand({
    TableName: table,
    Item: {
      id: userId,
      nome: 'Admin Master',
      email,
      perfil: 'ADMIN_MASTER',
      ativo: true,
      criadoPor: 'seed',
      criadoEm: new Date().toISOString(),
    },
  }));

  console.log('');
  console.log('✓ Admin Master criado com sucesso!');
  console.log(`  E-mail: ${email}`);
  console.log(`  Senha temporária: ${tempPwd}`);
  console.log('  → No primeiro login, será solicitado trocar a senha.');
  console.log('');
}

void run().catch((err) => {
  console.error('Erro:', err);
  process.exit(1);
});
