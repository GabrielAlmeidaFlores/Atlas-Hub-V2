import "./local-env.js";
import http from "node:http";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { handler as health } from "./src/functions/health.js";
import { handler as webhookDivify } from "./src/functions/webhook-divify.js";
import { handler as analyticsCollect } from "./src/functions/analytics-collect.js";
import { handler as publicoProjetos } from "./src/functions/publico-projetos-listar.js";

process.env.DIVIFY_WEBHOOK_SECRET ??= "local-webhook-secret";
process.env.STAGE ??= "dev";
process.env.AWS_REGION ??= "sa-east-1";
type LambdaHandler = (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;

const routes: Array<{ method: string; match: RegExp; handler: LambdaHandler }> = [
  { method: "GET", match: /^\/(?:dev\/)?health\/?$/, handler: health },
  { method: "GET", match: /^\/(?:dev\/)?publico\/projetos\/?$/, handler: publicoProjetos },
  { method: "POST", match: /^\/(?:dev\/)?webhooks\/divify\/?$/, handler: webhookDivify },
  { method: "POST", match: /^\/(?:dev\/)?analytics\/collect\/?$/, handler: analyticsCollect },
];

function toEvent(req: http.IncomingMessage, body: string, url: URL): APIGatewayProxyEvent {
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === "string") headers[key] = value;
    else if (Array.isArray(value) && value[0] !== undefined) headers[key] = value[0];
  }
  const queryStringParameters: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    queryStringParameters[key] = value;
  });
  return {
    body,
    headers,
    httpMethod: req.method ?? "GET",
    isBase64Encoded: false,
    path: url.pathname,
    queryStringParameters,
    multiValueHeaders: {},
    multiValueQueryStringParameters: null,
    pathParameters: null,
    requestContext: {} as APIGatewayProxyEvent["requestContext"],
    resource: url.pathname,
    stageVariables: null,
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
        res.writeHead(204, {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Webhook-Secret,x-tenant-id",
          "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        });
        res.end();
        return;
      }
      const route = routes.find((r) => r.method === method && r.match.test(url.pathname));
      if (route === undefined) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Not Found", path: url.pathname }));
        return;
      }
      const body = Buffer.concat(chunks).toString("utf8");
      const result = await route.handler(toEvent(req, body, url));
      const headers = { ...(result.headers ?? {}) } as Record<string, string>;
      res.writeHead(result.statusCode, headers);
      res.end(result.body);
    })().catch((err: unknown) => {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err instanceof Error ? err.message : "server error" }));
    });
  });
});

const port = Number(process.env.PORT ?? "3000");
server.listen(port, "127.0.0.1", () => {
  process.stdout.write(`local-http http://127.0.0.1:${String(port)}\n`);
});
