import {
  AdminListGroupsForUserCommand,
  CognitoIdentityProviderClient,
  ListUsersCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { getInvestidor, putInvestidor } from "../src/shared/db/index.js";
import type { Investidor } from "../src/shared/core/types/index.js";

const region = process.env["AWS_REGION"] ?? "sa-east-1";
const userPoolId =
  process.env["USER_POOL_ID"] ?? process.env["COGNITO_USER_POOL_ID"] ?? "";
const cognito = new CognitoIdentityProviderClient({ region });

function attr(
  attributes: { Name?: string; Value?: string }[] | undefined,
  name: string,
): string {
  return attributes?.find((item) => item.Name === name)?.Value?.trim() ?? "";
}

async function groups(username: string): Promise<string[]> {
  const result = await cognito.send(
    new AdminListGroupsForUserCommand({
      UserPoolId: userPoolId,
      Username: username,
    }),
  );
  return (result.Groups ?? []).map((group) => group.GroupName ?? "");
}

async function main(): Promise<void> {
  if (userPoolId === "")
    throw new Error("Defina USER_POOL_ID ou COGNITO_USER_POOL_ID");
  let token: string | undefined;
  let scanned = 0;
  let upserted = 0;
  do {
    const page = await cognito.send(
      new ListUsersCommand({
        UserPoolId: userPoolId,
        PaginationToken: token,
        Limit: 60,
      }),
    );
    for (const user of page.Users ?? []) {
      scanned++;
      const userName = user.Username ?? "";
      if (userName === "" || !(await groups(userName)).includes("INVESTIDOR"))
        continue;
      const id = attr(user.Attributes, "sub") || userName;
      const existing = await getInvestidor(id);
      const now = new Date().toISOString();
      const email = attr(user.Attributes, "email");
      const telefone = attr(user.Attributes, "phone_number");
      const termosAceitosEm = attr(user.Attributes, "custom:termos_aceitos");
      const termosVersao = attr(user.Attributes, "custom:termos_versao");
      const item: Investidor = {
        id,
        email,
        nome: attr(user.Attributes, "name") || email || userName,
        ...(telefone.length > 0 ? { telefone } : {}),
        marketingOptIn:
          attr(user.Attributes, "custom:marketing_optin") === "true",
        ...(termosAceitosEm.length > 0 ? { termosAceitosEm } : {}),
        ...(termosVersao.length > 0 ? { termosVersao } : {}),
        wantsOpportunityAlerts: existing?.wantsOpportunityAlerts ?? false,
        ...(existing?.interestUpdatedAt !== undefined
          ? { interestUpdatedAt: existing.interestUpdatedAt }
          : {}),
        criadoEm:
          existing?.criadoEm ?? user.UserCreateDate?.toISOString() ?? now,
        atualizadoEm: now,
      };
      await putInvestidor(item);
      upserted++;
    }
    token = page.PaginationToken;
  } while (token !== undefined && token !== "");
  console.log(JSON.stringify({ scanned, upserted }, null, 2));
}

void main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
