import { VITE_API_URL } from "@/lib/env";
import type { ApiErrorCode } from "@/types";

const API_ERROR_PREFIX = "API_ERROR::";

function isApiErrorCode(value: unknown): value is ApiErrorCode {
  return (
    value === "UNAUTHENTICATED" ||
    value === "FORBIDDEN" ||
    value === "VALIDATION_ERROR" ||
    value === "NOT_FOUND" ||
    value === "CONFLICT" ||
    value === "INVALID_STATUS_TRANSITION" ||
    value === "INTERNAL_ERROR"
  );
}

function extractCode(body: unknown): ApiErrorCode {
  if (body !== null && typeof body === "object" && "code" in body) {
    const candidate = body.code;
    if (isApiErrorCode(candidate)) return candidate;
  }
  return "INTERNAL_ERROR";
}

function extractMessage(body: unknown, fallback: string): string {
  if (body !== null && typeof body === "object" && "message" in body && typeof body.message === "string") {
    return (body as { message: string }).message;
  }
  return fallback;
}

function throwApiError(errorCode: ApiErrorCode, message: string): never {
  throw new Error(`${API_ERROR_PREFIX}${String(errorCode)}::${message}`);
}

const COGNITO_MESSAGES: Record<string, string> = {
  UsernameExistsException: "Este e-mail já está cadastrado. Faça login ou use outro e-mail.",
  AliasExistsException: "Este e-mail já está em uso. Faça login ou use outro e-mail.",
  UserNotFoundException: "Conta não encontrada para este e-mail.",
  UserNotConfirmedException: "Confirme seu e-mail antes de entrar.",
  NotAuthorizedException: "E-mail ou senha incorretos.",
  InvalidPasswordException: "A senha deve ter no mínimo 8 caracteres e conter ao menos 1 número.",
  InvalidParameterException: "Dados inválidos. Confira as informações e tente novamente.",
  CodeMismatchException: "Código inválido. Confira o código e tente novamente.",
  ExpiredCodeException: "Código expirado. Solicite um novo código.",
  LimitExceededException: "Muitas tentativas. Aguarde um momento e tente de novo.",
  TooManyRequestsException: "Muitas tentativas. Aguarde um momento e tente de novo.",
  TooManyFailedAttemptsException: "Muitas tentativas incorretas. Aguarde um momento e tente novamente.",
  PasswordResetRequiredException: "É preciso redefinir a senha antes de entrar.",
  UserAlreadyAuthenticatedException: "Já existe uma sessão ativa. Atualize a página e tente novamente.",
  CodeDeliveryFailureException: "Não foi possível enviar o código por e-mail. Tente novamente.",
  UserLambdaValidationException: "Não foi possível concluir a operação. Tente novamente.",
  UnexpectedLambdaException: "Não foi possível concluir a operação. Tente novamente.",
  ResourceNotFoundException: "Recurso não encontrado. Tente novamente.",
  ForbiddenException: "Você não tem permissão para esta ação.",
  InternalErrorException: "Erro interno. Tente novamente em instantes.",
  NetworkError: "Não foi possível conectar. Verifique sua internet e tente novamente.",
  ServiceUnavailableException: "Serviço indisponível no momento. Tente novamente.",
};

const GENERIC_ERROR = "Não foi possível concluir a operação. Tente novamente.";

export function getApiErrorMessage(err: unknown): string {
  if (!(err instanceof Error)) return "Erro interno. Tente novamente.";
  const msg = err.message;

  if (msg.startsWith(API_ERROR_PREFIX)) {
    const rest = msg.slice(API_ERROR_PREFIX.length);
    const separatorIndex = rest.indexOf("::");
    return separatorIndex === -1 ? "Erro interno. Tente novamente." : rest.slice(separatorIndex + 2);
  }

  const name = "name" in err && typeof err.name === "string" ? err.name : "";
  const lower = msg.toLowerCase();

  if (name !== "" && COGNITO_MESSAGES[name] !== undefined) return COGNITO_MESSAGES[name];

  for (const [code, friendly] of Object.entries(COGNITO_MESSAGES)) {
    if (lower.includes(code.toLowerCase())) return friendly;
  }

  if (lower.includes("failed to fetch") || lower.includes("network") || lower.includes("load failed") || lower.includes("timeout")) {
    return "Não foi possível conectar. Verifique sua internet e tente novamente.";
  }
  if (lower.includes("incorrect username or password") || lower.includes("incorrect password")) {
    return "E-mail ou senha incorretos.";
  }
  if (lower.includes("already a signed in user")) {
    return "Já existe uma sessão ativa. Atualize a página e tente novamente.";
  }
  if (lower.includes("password") && (lower.includes("conform") || lower.includes("requirements") || lower.includes("policy") || lower.includes("length"))) {
    return COGNITO_MESSAGES["InvalidPasswordException"] ?? GENERIC_ERROR;
  }

  if (/[áàâãéêíóôõúüç]/i.test(msg) || /\b(não|senha|conta|código|e-mail|tente|inválid|incorret)/i.test(msg)) {
    return msg;
  }
  return GENERIC_ERROR;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  try {
    const text = await response.text();
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const { fetchAuthSession } = await import("@aws-amplify/auth");
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    if (token === undefined || token === "") return {};
    return { Authorization: `Bearer ${token}` };
  } catch {
    return {};
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(`${VITE_API_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...authHeaders },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const raw = await parseResponseBody(response);
    if (!path.startsWith("/analytics")) {
      void import("@/lib/analytics").then(({ analytics }) => {
        analytics.track("api_error", { code: extractCode(raw), route: path, status: response.status });
      });
    }
    throwApiError(extractCode(raw), extractMessage(raw, response.statusText));
  }

  const responseBody = await parseResponseBody(response);
  return responseBody as T;
}

export const api = {
  get: async <T>(path: string): Promise<T> => request<T>("GET", path),
  post: async <T>(path: string, body: unknown): Promise<T> => request<T>("POST", path, body),
  put: async <T>(path: string, body: unknown): Promise<T> => request<T>("PUT", path, body),
  delete: async <T>(path: string): Promise<T> => request<T>("DELETE", path),
};
