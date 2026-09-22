import "./local-env.js";
import http from "node:http";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { handler as health } from "./src/functions/health.js";
import { handler as webhookDivify } from "./src/functions/webhook-divify.js";
import { handler as analyticsCollect } from "./src/functions/analytics-collect.js";
import { handler as publicoProjetos } from "./src/functions/publico-projetos-listar.js";
import { handler as cronogramaObter } from "./src/functions/cronograma-obter.js";
import { handler as cronogramaEtapaCriar } from "./src/functions/cronograma-etapa-criar.js";
import { handler as cronogramaEtapaAtualizar } from "./src/functions/cronograma-etapa-atualizar.js";
import { handler as cronogramaEtapaRemover } from "./src/functions/cronograma-etapa-remover.js";
import { handler as cronogramaLancamentoCriar } from "./src/functions/cronograma-lancamento-criar.js";
import { handler as cronogramaLancamentoAtualizar } from "./src/functions/cronograma-lancamento-atualizar.js";
import { handler as adminCronogramaListar } from "./src/functions/admin-cronograma-listar.js";
import { handler as adminCronogramaProjeto } from "./src/functions/admin-cronograma-projeto.js";
import { handler as adminFinanceiroContasListar } from "./src/functions/admin-financeiro-contas-listar.js";
import { handler as adminFinanceiroContasCriar } from "./src/functions/admin-financeiro-contas-criar.js";
import { handler as adminFinanceiroContasGet } from "./src/functions/admin-financeiro-contas-get.js";
import { handler as adminFinanceiroExtrato } from "./src/functions/admin-financeiro-extrato.js";
import { handler as adminFinanceiroMovimentos } from "./src/functions/admin-financeiro-movimentos.js";
import { handler as adminFinanceiroSolicitacaoCriar } from "./src/functions/admin-financeiro-solicitacao-criar.js";
import { handler as adminFinanceiroSolicitacaoAprovar } from "./src/functions/admin-financeiro-solicitacao-aprovar.js";
import { handler as adminFinanceiroSolicitacaoRejeitar } from "./src/functions/admin-financeiro-solicitacao-rejeitar.js";
import { handler as adminFinanceiroSplitCriar } from "./src/functions/admin-financeiro-split-criar.js";
import { handler as adminFinanceiroCartaoGet } from "./src/functions/admin-financeiro-cartao-get.js";
import { handler as adminFinanceiroCartaoSolicitar } from "./src/functions/admin-financeiro-cartao-solicitar.js";
import { handler as adminCaptacaoListar } from "./src/functions/admin-captacao-listar.js";
import { handler as adminCaptacaoOferta } from "./src/functions/admin-captacao-oferta.js";

process.env.DIVIFY_WEBHOOK_SECRET ??= "local-webhook-secret";
process.env.STAGE ??= "dev";
process.env.AWS_REGION ??= "sa-east-1";
process.env.CORS_ORIGINS ??= "*";

type LambdaHandler = (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;

interface Route {
  readonly method: string;
  readonly match: RegExp;
  readonly handler: LambdaHandler;
  readonly params: readonly string[];
}

const routes: Route[] = [
  { method: "GET", match: /^\/(?:dev\/)?health\/?$/, handler: health, params: [] },
  { method: "GET", match: /^\/(?:dev\/)?publico\/projetos\/?$/, handler: publicoProjetos, params: [] },
  { method: "POST", match: /^\/(?:dev\/)?webhooks\/divify\/?$/, handler: webhookDivify, params: [] },
  { method: "POST", match: /^\/(?:dev\/)?analytics\/collect\/?$/, handler: analyticsCollect, params: [] },
  { method: "GET", match: /^\/(?:dev\/)?admin\/cronograma\/projetos\/([^/]+)\/?$/, handler: adminCronogramaProjeto, params: ["projetoId"] },
  { method: "GET", match: /^\/(?:dev\/)?admin\/cronograma\/?$/, handler: adminCronogramaListar, params: [] },
  { method: "GET", match: /^\/(?:dev\/)?admin\/financeiro\/contas\/([^/]+)\/extrato\/?$/, handler: adminFinanceiroExtrato, params: ["projetoId"] },
  { method: "GET", match: /^\/(?:dev\/)?admin\/financeiro\/contas\/([^/]+)\/movimentos\/?$/, handler: adminFinanceiroMovimentos, params: ["projetoId"] },
  { method: "GET", match: /^\/(?:dev\/)?admin\/financeiro\/contas\/([^/]+)\/?$/, handler: adminFinanceiroContasGet, params: ["projetoId"] },
  { method: "GET", match: /^\/(?:dev\/)?admin\/financeiro\/contas\/?$/, handler: adminFinanceiroContasListar, params: [] },
  { method: "POST", match: /^\/(?:dev\/)?admin\/financeiro\/contas\/?$/, handler: adminFinanceiroContasCriar, params: [] },
  { method: "POST", match: /^\/(?:dev\/)?admin\/financeiro\/solicitacoes\/([^/]+)\/aprovar\/?$/, handler: adminFinanceiroSolicitacaoAprovar, params: ["id"] },
  { method: "POST", match: /^\/(?:dev\/)?admin\/financeiro\/solicitacoes\/([^/]+)\/rejeitar\/?$/, handler: adminFinanceiroSolicitacaoRejeitar, params: ["id"] },
  { method: "POST", match: /^\/(?:dev\/)?admin\/financeiro\/solicitacoes\/?$/, handler: adminFinanceiroSolicitacaoCriar, params: [] },
  { method: "POST", match: /^\/(?:dev\/)?admin\/financeiro\/split\/?$/, handler: adminFinanceiroSplitCriar, params: [] },
  { method: "POST", match: /^\/(?:dev\/)?admin\/financeiro\/cartoes\/([^/]+)\/solicitar\/?$/, handler: adminFinanceiroCartaoSolicitar, params: ["projetoId"] },
  { method: "GET", match: /^\/(?:dev\/)?admin\/financeiro\/cartoes\/([^/]+)\/?$/, handler: adminFinanceiroCartaoGet, params: ["projetoId"] },
  { method: "GET", match: /^\/(?:dev\/)?admin\/captacao\/ofertas\/([^/]+)\/?$/, handler: adminCaptacaoOferta, params: ["ofertaId"] },
  { method: "GET", match: /^\/(?:dev\/)?admin\/captacao\/?$/, handler: adminCaptacaoListar, params: [] },
  { method: "POST", match: /^\/(?:dev\/)?projetos\/([^/]+)\/cronograma\/etapas\/?$/, handler: cronogramaEtapaCriar, params: ["id"] },
  { method: "PUT", match: /^\/(?:dev\/)?projetos\/([^/]+)\/cronograma\/etapas\/([^/]+)\/?$/, handler: cronogramaEtapaAtualizar, params: ["id", "etapaId"] },
  { method: "DELETE", match: /^\/(?:dev\/)?projetos\/([^/]+)\/cronograma\/etapas\/([^/]+)\/?$/, handler: cronogramaEtapaRemover, params: ["id", "etapaId"] },
  { method: "POST", match: /^\/(?:dev\/)?projetos\/([^/]+)\/cronograma\/lancamentos\/?$/, handler: cronogramaLancamentoCriar, params: ["id"] },
  { method: "PUT", match: /^\/(?:dev\/)?projetos\/([^/]+)\/cronograma\/lancamentos\/([^/]+)\/?$/, handler: cronogramaLancamentoAtualizar, params: ["id", "lancamentoId"] },
  { method: "GET", match: /^\/(?:dev\/)?projetos\/([^/]+)\/cronograma\/?$/, handler: cronogramaObter, params: ["id"] },
];

function claimsFromAuthorization(header: string | undefined): Record<string, string> | undefined {
  if (header === undefined || !header.startsWith("Bearer ")) return undefined;
  const part = header.slice(7).split(".")[1];
  if (part === undefined) return undefined;
  try {
    const payload = JSON.parse(Buffer.from(part, "base64url").toString("utf8")) as Record<string, unknown>;
    const claims: Record<string, string> = {};
    for (const [key, value] of Object.entries(payload)) {
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        claims[key] = String(value);
      }
    }
    const groups = payload["cognito:groups"];
    if (Array.isArray(groups)) {
      claims["cognito:groups"] = groups.filter((g): g is string => typeof g === "string").join(",");
    }
    return claims;
  } catch {
    return undefined;
  }
}

function toEvent(
  req: http.IncomingMessage,
  body: string,
  url: URL,
  match: RegExp,
  paramNames: readonly string[],
): APIGatewayProxyEvent {
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === "string") headers[key] = value;
    else if (Array.isArray(value) && value[0] !== undefined) headers[key] = value[0];
  }
  const queryStringParameters: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    queryStringParameters[key] = value;
  });
  const captured = match.exec(url.pathname);
  const pathParameters: Record<string, string> | null = paramNames.length === 0 ? null : {};
  if (pathParameters !== null && captured !== null) {
    paramNames.forEach((name, index) => {
      const value = captured[index + 1];
      pathParameters[name] = value === undefined ? "" : decodeURIComponent(value);
    });
  }
  const claims = claimsFromAuthorization(headers["authorization"] ?? headers["Authorization"]);
  return {
    body,
    headers,
    httpMethod: req.method ?? "GET",
    isBase64Encoded: false,
    path: url.pathname,
    queryStringParameters,
    multiValueHeaders: {},
    multiValueQueryStringParameters: null,
    pathParameters,
    requestContext: {
      authorizer: claims === undefined ? {} : { claims },
    } as APIGatewayProxyEvent["requestContext"],
    resource: url.pathname,
    stageVariables: null,
  };
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Webhook-Secret,x-tenant-id",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
} as const;

const UPSTREAM = process.env["LOCAL_HTTP_UPSTREAM"] ?? "https://9oyxstx009.execute-api.sa-east-1.amazonaws.com";

async function proxyUpstream(
  req: http.IncomingMessage,
  url: URL,
  method: string,
  body: string,
): Promise<{ status: number; headers: Record<string, string>; body: string }> {
  const path = url.pathname.startsWith("/dev/") || url.pathname === "/dev"
    ? url.pathname
    : `/dev${url.pathname.startsWith("/") ? url.pathname : `/${url.pathname}`}`;
  const target = `${UPSTREAM}${path}${url.search}`;
  const headers: Record<string, string> = {};
  const auth = req.headers.authorization ?? req.headers["Authorization"];
  if (typeof auth === "string") headers.Authorization = auth;
  const contentType = req.headers["content-type"];
  if (typeof contentType === "string") headers["Content-Type"] = contentType;
  const response = await fetch(target, {
    method,
    headers,
    body: method === "GET" || method === "HEAD" ? undefined : body,
  });
  const text = await response.text();
  return {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("content-type") ?? "application/json",
      ...CORS,
    },
    body: text,
  };
}

const server = http.createServer((req, res) => {
  const chunks: Buffer[] = [];
  req.on("data", (chunk: Buffer) => {
    chunks.push(chunk);
  });
  req.on("end", () => {
    void (async () => {
      const url = new URL(req.url ?? "/", "http://127.0.0.1");
      const method = (req.method ?? "GET").toUpperCase();
      if (method === "OPTIONS") {
        res.writeHead(204, CORS);
        res.end();
        return;
      }
      const body = Buffer.concat(chunks).toString("utf8");
      const route = routes.find((r) => r.method === method && r.match.test(url.pathname));
      if (route === undefined) {
        const proxied = await proxyUpstream(req, url, method, body);
        res.writeHead(proxied.status, proxied.headers);
        res.end(proxied.body);
        return;
      }
      const result = await route.handler(toEvent(req, body, url, route.match, route.params));
      const headers = { ...(result.headers ?? {}) } as Record<string, string>;
      res.writeHead(result.statusCode, headers);
      res.end(result.body);
    })().catch((err: unknown) => {
      res.writeHead(500, { "Content-Type": "application/json", ...CORS });
      res.end(JSON.stringify({ error: err instanceof Error ? err.message : "server error" }));
    });
  });
});

const port = Number(process.env.PORT ?? "3000");
server.listen(port, "127.0.0.1", () => {
  process.stdout.write(`local-http http://127.0.0.1:${String(port)}\n`);
});

