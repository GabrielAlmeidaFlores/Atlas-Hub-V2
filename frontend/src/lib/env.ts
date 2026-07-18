export const VITE_API_URL = import.meta.env["VITE_API_URL"] as string ?? "http://localhost:3000/dev";
export const VITE_COGNITO_USER_POOL_ID = import.meta.env["VITE_COGNITO_USER_POOL_ID"] as string ?? "";
export const VITE_COGNITO_CLIENT_ID = import.meta.env["VITE_COGNITO_CLIENT_ID"] as string ?? "";
export const VITE_AWS_REGION = import.meta.env["VITE_AWS_REGION"] as string ?? "sa-east-1";
export const VITE_MODE = import.meta.env["VITE_MODE"] as string ?? "development";
export const VITE_WHATSAPP_NUMBER = String(import.meta.env["VITE_WHATSAPP_NUMBER"] ?? "").replace(/\D/g, "");
