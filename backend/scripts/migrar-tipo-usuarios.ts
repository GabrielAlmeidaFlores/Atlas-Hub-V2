import {
  AdminUpdateUserAttributesCommand,
  CognitoIdentityProviderClient,
  ListUsersInGroupCommand,
  type UserType,
} from '@aws-sdk/client-cognito-identity-provider';

const region = process.env['REGION'] ?? 'sa-east-1';
const poolId = process.env['POOL_ID'] ?? '';
const dryRun = process.argv.includes('--dry-run');

const GRUPOS: readonly [string, string][] = [
  ['INVESTIDOR', 'investidor'],
  ['INCORPORADORA', 'incorporadora'],
];

if (poolId === '') {
  console.error('Informe POOL_ID');
  process.exit(1);
}

const cognito = new CognitoIdentityProviderClient({ region });

function atributo(user: UserType, name: string): string {
  return user.Attributes?.find((item) => item.Name === name)?.Value ?? '';
}

async function migrarGrupo(group: string, tipo: string): Promise<number> {
  let alterados = 0;
  let token: string | undefined;
  do {
    const res = await cognito.send(new ListUsersInGroupCommand({
      UserPoolId: poolId,
      GroupName: group,
      ...(token !== undefined ? { NextToken: token } : {}),
    }));
    for (const user of res.Users ?? []) {
      if (user.Username === undefined) continue;
      if (atributo(user, 'custom:tipo') !== '') continue;
      if (dryRun) {
        console.log(`[dry-run] ${group} ${user.Username} -> ${tipo}`);
        alterados += 1;
        continue;
      }
      await cognito.send(new AdminUpdateUserAttributesCommand({
        UserPoolId: poolId,
        Username: user.Username,
        UserAttributes: [{ Name: 'custom:tipo', Value: tipo }],
      }));
      console.log(`${group} ${user.Username} -> ${tipo}`);
      alterados += 1;
    }
    token = res.NextToken;
  } while (token !== undefined);
  return alterados;
}

async function main(): Promise<void> {
  let total = 0;
  for (const [group, tipo] of GRUPOS) {
    total += await migrarGrupo(group, tipo);
  }
  console.log(`${dryRun ? 'Simulados' : 'Atualizados'}: ${String(total)}`);
}

void main();
