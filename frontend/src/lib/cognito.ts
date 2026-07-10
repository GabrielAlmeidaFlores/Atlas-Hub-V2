import { Amplify } from "aws-amplify";
import { VITE_AWS_REGION, VITE_COGNITO_CLIENT_ID, VITE_COGNITO_USER_POOL_ID } from "@/lib/env";

export function configureAmplify(): void {
  if (VITE_COGNITO_USER_POOL_ID === "" || VITE_COGNITO_CLIENT_ID === "") return;
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: VITE_COGNITO_USER_POOL_ID,
        userPoolClientId: VITE_COGNITO_CLIENT_ID,
        region: VITE_AWS_REGION,
      },
    },
  });
}
