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

export function getApiErrorMessage(err: unknown): string {
  if (!(err instanceof Error)) return "Erro interno. Tente novamente.";
  const msg = err.message;
  if (!msg.startsWith(API_ERROR_PREFIX)) return "Erro interno. Tente novamente.";
  const rest = msg.slice(API_ERROR_PREFIX.length);
  const separatorIndex = rest.indexOf("::");
  if (separatorIndex === -1) return "Erro interno. Tente novamente.";
  return rest.slice(separatorIndex + 2);
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
