import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen, Braces, Check, ChevronDown, ChevronRight, Code2, Copy, Download,
  FileJson, Globe2, KeyRound, LockKeyhole, Search, Server, ShieldCheck, Sparkles, Terminal,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonPage } from "@/components/ui/skeleton";
import { VITE_API_URL } from "@/lib/env";
import { useToastStore } from "@/stores/toast";
import { cn } from "@/lib/utils";

type HttpMethod = "get" | "post" | "put" | "delete" | "patch" | "head";
type AuthMode = "cognito" | "token";

interface Schema {
  readonly $ref?: string;
  readonly type?: string;
  readonly format?: string;
  readonly description?: string;
  readonly properties?: Record<string, Schema>;
  readonly required?: readonly string[];
  readonly items?: Schema;
  readonly enum?: readonly unknown[];
  readonly oneOf?: readonly Schema[];
  readonly anyOf?: readonly Schema[];
  readonly allOf?: readonly Schema[];
  readonly additionalProperties?: boolean | Schema;
  readonly nullable?: boolean;
  readonly default?: unknown;
  readonly example?: unknown;
  readonly minimum?: number;
  readonly maximum?: number;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly pattern?: string;
}

interface Parameter {
  readonly name: string;
  readonly in: string;
  readonly required?: boolean;
  readonly description?: string;
  readonly schema?: Schema;
}

interface RequestBody {
  readonly required?: boolean;
  readonly content?: Record<string, { readonly schema?: Schema }>;
}

interface ResponseBody {
  readonly description?: string;
  readonly content?: Record<string, { readonly schema?: Schema }>;
}

interface Operation {
  readonly tags?: readonly string[];
  readonly summary?: string;
  readonly description?: string;
  readonly operationId?: string;
  readonly security?: readonly Record<string, readonly string[]>[];
  readonly parameters?: readonly Parameter[];
  readonly requestBody?: RequestBody;
  readonly responses?: Record<string, ResponseBody>;
  readonly "x-auth"?: string;
  readonly "x-required-roles"?: readonly string[];
  readonly "x-api-token-allowed"?: boolean;
}

interface OpenApiDocument {
  readonly openapi: string;
  readonly info: {
    readonly title: string;
    readonly version: string;
    readonly description?: string;
    readonly contact?: { readonly name?: string; readonly url?: string };
  };
  readonly servers?: readonly { readonly url: string; readonly description?: string }[];
  readonly tags?: readonly { readonly name: string; readonly description?: string }[];
  readonly paths: Record<string, Partial<Record<HttpMethod, Operation>>>;
  readonly components?: {
    readonly schemas?: Record<string, Schema>;
    readonly securitySchemes?: Record<string, { readonly description?: string; readonly scheme?: string; readonly bearerFormat?: string }>;
  };
}

interface FlatOperation {
  readonly key: string;
  readonly method: HttpMethod;
  readonly path: string;
  readonly operation: Operation;
}

const METHODS: readonly HttpMethod[] = ["get", "post", "put", "patch", "delete", "head"];
const METHOD_STYLES: Record<HttpMethod, string> = {
  get: "border-emerald-200 bg-emerald-50 text-emerald-700",
  post: "border-blue-200 bg-blue-50 text-blue-700",
  put: "border-amber-200 bg-amber-50 text-amber-700",
  patch: "border-violet-200 bg-violet-50 text-violet-700",
  delete: "border-red-200 bg-red-50 text-red-700",
  head: "border-slate-200 bg-slate-50 text-slate-600",
};
const STATUS_STYLES: Record<string, string> = {
  "2": "text-status-success",
  "4": "text-status-warning",
  "5": "text-status-danger",
};

function asSchema(value: unknown): Schema | undefined {
  return typeof value === "object" && value !== null ? (value as Schema) : undefined;
}

function refName(ref: string): string {
  return ref.split("/").pop() ?? ref;
}

function resolveSchema(schema: Schema | undefined, schemas: Record<string, Schema>): Schema | undefined {
  if (schema === undefined) return undefined;
  if (schema.$ref === undefined) return schema;
  const target = schemas[refName(schema.$ref)];
  if (target === undefined) return schema;
  return { ...target, description: schema.description ?? target.description };
}

function flattenSchema(schema: Schema | undefined, schemas: Record<string, Schema>, seen = new Set<string>()): Schema | undefined {
  const resolved = resolveSchema(schema, schemas);
  if (resolved === undefined) return undefined;
  if (resolved.$ref !== undefined && seen.has(resolved.$ref)) return resolved;
  if (resolved.$ref !== undefined) seen.add(resolved.$ref);
  if (resolved.allOf === undefined) return resolved;
  const merged: Schema = { ...resolved };
  const properties: Record<string, Schema> = {};
  const required: string[] = [];
  for (const part of resolved.allOf) {
    const next = flattenSchema(part, schemas, seen);
    if (next?.properties !== undefined) Object.assign(properties, next.properties);
    if (next?.required !== undefined) required.push(...next.required);
  }
  delete (merged as { allOf?: unknown }).allOf;
  return { ...merged, properties, required: [...new Set(required)] };
}

function schemaType(schema: Schema | undefined, schemas: Record<string, Schema>): string {
  if (schema === undefined) return "any";
  if (schema.$ref !== undefined) return refName(schema.$ref);
  if (schema.oneOf !== undefined) return `um de ${schema.oneOf.map((item) => schemaType(item, schemas)).join(" | ")}`;
  if (schema.anyOf !== undefined) return `um de ${schema.anyOf.map((item) => schemaType(item, schemas)).join(" | ")}`;
  if (schema.allOf !== undefined) return "composição";
  if (schema.type === "array") return `array<${schemaType(schema.items, schemas)}>`;
  if (schema.enum !== undefined) return schema.enum.map(String).join(" | ");
  return schema.type ?? "any";
}

function sampleFromSchema(schema: Schema | undefined, schemas: Record<string, Schema>, depth = 0, seen = new Set<string>()): unknown {
  if (schema === undefined || depth > 5) return null;
  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;
  if (schema.$ref !== undefined) {
    const name = refName(schema.$ref);
    if (seen.has(name)) return null;
    return sampleFromSchema(schemas[name], schemas, depth + 1, new Set([...seen, name]));
  }
  if (schema.oneOf !== undefined) return sampleFromSchema(schema.oneOf[0], schemas, depth + 1, seen);
  if (schema.anyOf !== undefined) return sampleFromSchema(schema.anyOf[0], schemas, depth + 1, seen);
  if (schema.allOf !== undefined) {
    const merged = flattenSchema(schema, schemas);
    return sampleFromSchema(merged, schemas, depth + 1, seen);
  }
  if (schema.enum !== undefined) return schema.enum[0] ?? null;
  if (schema.type === "object" || schema.properties !== undefined) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(schema.properties ?? {})) {
      result[key] = sampleFromSchema(value, schemas, depth + 1, seen);
    }
    return result;
  }
  if (schema.type === "array") return [sampleFromSchema(schema.items, schemas, depth + 1, seen)];
  if (schema.type === "boolean") return true;
  if (schema.type === "integer" || schema.type === "number") return 0;
  if (schema.type === "null") return null;
  if (schema.format === "date-time") return "2026-10-28T12:00:00.000Z";
  if (schema.format === "date") return "2026-10-28";
  if (schema.format === "uuid") return "00000000-0000-4000-8000-000000000000";
  if (schema.format === "email") return "usuario@atlas.com.br";
  if (schema.format === "uri") return "https://atlas-hub.example/arquivo.pdf";
  return "string";
}

function operationKey(method: HttpMethod, path: string): string {
  return `${method.toUpperCase()} ${path}`;
}

function pluralize(count: number, singular: string, plural: string): string {
  return `${String(count)} ${count === 1 ? singular : plural}`;
}

function MethodBadge({ method, small = false }: { readonly method: HttpMethod; readonly small?: boolean }): ReactNode {
  return (
    <span className={cn(
      "inline-flex shrink-0 items-center justify-center rounded-[5px] border font-mono font-bold uppercase tracking-wide",
      small ? "min-w-[42px] px-1.5 py-0.5 text-[9px]" : "min-w-[52px] px-2 py-1 text-[10px]",
      METHOD_STYLES[method],
    )}>
      {method}
    </span>
  );
}

function SchemaBlock({
  schema,
  schemas,
  depth = 0,
  seen = new Set<string>(),
}: {
  readonly schema?: Schema;
  readonly schemas: Record<string, Schema>;
  readonly depth?: number;
  readonly seen?: Set<string>;
}): ReactNode {
  const resolved = flattenSchema(schema, schemas);
  if (resolved === undefined) return <p className="text-xs text-muted-foreground">Sem schema definido.</p>;
  if (resolved.oneOf !== undefined || resolved.anyOf !== undefined) {
    return (
      <div className="space-y-2">
        {(resolved.oneOf ?? resolved.anyOf ?? []).map((item, index) => (
          <div key={`${index}-${schemaType(item, schemas)}`} className="rounded-[6px] border border-border bg-muted/20 p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Opção {String(index + 1)}</p>
            <SchemaBlock schema={item} schemas={schemas} depth={depth + 1} seen={seen} />
          </div>
        ))}
      </div>
    );
  }
  const properties = resolved.properties ?? {};
  if (Object.keys(properties).length === 0) {
    return (
      <div className="rounded-[6px] border border-border bg-muted/20 p-3 text-xs">
        <span className="font-mono text-foreground">{schemaType(resolved, schemas)}</span>
        {resolved.description !== undefined && <p className="mt-1 text-muted-foreground">{resolved.description}</p>}
      </div>
    );
  }
  const required = new Set(resolved.required ?? []);
  return (
    <div className="overflow-hidden rounded-[7px] border border-border">
      {Object.entries(properties).map(([name, child]) => {
        const childResolved = flattenSchema(child, schemas);
        const childRef = child.$ref !== undefined ? refName(child.$ref) : undefined;
        const nested = childResolved?.properties !== undefined && Object.keys(childResolved.properties).length > 0;
        return (
          <div key={name} className="border-b border-border last:border-0">
            <div className="flex flex-wrap items-start gap-x-3 gap-y-1 px-3 py-2.5 text-xs">
              <span className="min-w-[150px] font-mono font-semibold text-foreground">{name}</span>
              <span className="rounded-[4px] bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">{schemaType(child, schemas)}</span>
              {required.has(name) && <span className="text-[9px] font-semibold uppercase tracking-wide text-status-danger">obrigatório</span>}
              {child.description !== undefined && <span className="w-full text-[11px] leading-relaxed text-muted-foreground">{child.description}</span>}
              {childRef !== undefined && <span className="text-[10px] text-muted-foreground">→ {childRef}</span>}
            </div>
            {nested && depth < 2 && (
              <div className="border-t border-border bg-muted/10 px-3 py-2">
                <SchemaBlock schema={childResolved} schemas={schemas} depth={depth + 1} seen={seen} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CodeBlock({ code, onCopy, language = "bash" }: { readonly code: string; readonly onCopy: () => void; readonly language?: string }): ReactNode {
  return (
    <div className="overflow-hidden rounded-[8px] border border-slate-800 bg-slate-950">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-400">
          <Terminal className="h-3 w-3" /> {language}
        </span>
        <button type="button" className="flex items-center gap-1 text-[10px] font-medium text-slate-400 transition-colors hover:text-white" onClick={onCopy}>
          <Copy className="h-3 w-3" /> Copiar
        </button>
      </div>
      <pre className="max-h-[380px] overflow-auto p-4 text-[11px] leading-relaxed text-slate-200"><code>{code}</code></pre>
    </div>
  );
}

function Detail({
  item,
  schemas,
  baseUrl,
  onCopy,
}: {
  readonly item: FlatOperation;
  readonly schemas: Record<string, Schema>;
  readonly baseUrl: string;
  readonly onCopy: (value: string, label: string) => void;
}): ReactNode {
  const [authMode, setAuthMode] = useState<AuthMode>("cognito");
  const [openResponses, setOpenResponses] = useState<Record<string, boolean>>({});
  const parameters = item.operation.parameters ?? [];
  const bodySchema = asSchema(item.operation.requestBody?.content?.["application/json"]?.schema);
  const bodySample = bodySchema === undefined ? null : sampleFromSchema(bodySchema, schemas);
  const tags = item.operation.tags ?? [];
  const roles = item.operation["x-required-roles"] ?? [];
  const tokenAllowed = item.operation["x-api-token-allowed"] === true;
  const protectedOperation = (item.operation.security?.length ?? 0) > 0;
  const pathWithSample = item.path.replace(/\{([^}]+)\}/g, "<$1>");
  const url = `${baseUrl}${pathWithSample}`;
  const authHeader = authMode === "token" ? "<API_TOKEN>" : "<COGNITO_ID_TOKEN>";
  const curlParts = [`curl -X ${item.method.toUpperCase()} '${url}'`];
  if (protectedOperation) curlParts.push(`  -H 'Authorization: Bearer ${authHeader}'`);
  if (bodySample !== null) {
    curlParts.push("  -H 'Content-Type: application/json'");
    curlParts.push(`  -d '${JSON.stringify(bodySample)}'`);
  }
  const curl = curlParts.join(" \\\n");

  return (
    <article className="space-y-5">
      <div className="card overflow-hidden">
        <div className="border-b border-border bg-gradient-to-br from-navy/[0.04] via-card to-gold/[0.06] p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <MethodBadge method={item.method} />
            {tags.map((tag) => (
              <span key={tag} className="rounded-[9999px] border border-border bg-card px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
                {tag}
              </span>
            ))}
            <span className={cn("ml-auto flex items-center gap-1 text-[10px] font-medium", protectedOperation ? "text-navy" : "text-status-success")}>
              {protectedOperation ? <LockKeyhole className="h-3 w-3" /> : <Globe2 className="h-3 w-3" />}
              {protectedOperation ? "Protegido" : "Público"}
            </span>
          </div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">{item.operation.summary ?? item.key}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">{item.operation.description}</p>
            </div>
            <button type="button" className="btn btn-outline btn-sm shrink-0" onClick={() => onCopy(`${baseUrl}${item.path}`, "URL copiada")}>
              <Copy className="h-3.5 w-3.5" /> Copiar URL
            </button>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="rounded-[5px] bg-foreground px-2 py-1 font-mono text-[10px] font-semibold text-background">{item.method.toUpperCase()}</span>
            <code className="break-all rounded-[5px] border border-border bg-card px-2.5 py-1.5 font-mono text-[11px] text-foreground">{item.path}</code>
            {roles.length > 0 && (
              <span className="flex items-center gap-1 rounded-[5px] border border-border bg-card px-2 py-1 text-[10px] font-medium text-muted-foreground">
                <ShieldCheck className="h-3 w-3" /> {roles.join(" · ")}
              </span>
            )}
            {tokenAllowed && (
              <span className="flex items-center gap-1 rounded-[5px] border border-gold/40 bg-gold/10 px-2 py-1 text-[10px] font-medium text-navy">
                <KeyRound className="h-3 w-3" /> Aceita API token
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.7fr)]">
          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground">
                <Terminal className="h-3.5 w-3.5 text-gold" /> Exemplo com cURL
              </h3>
              {tokenAllowed && (
                <div className="flex rounded-[5px] border border-border bg-muted p-0.5">
                  {(["cognito", "token"] as const).map((mode) => (
                    <button key={mode} type="button" onClick={() => setAuthMode(mode)} className={cn("rounded-[4px] px-2 py-1 text-[10px] font-medium transition-colors", authMode === mode ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}>
                      {mode === "cognito" ? "ID token" : "API token"}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <CodeBlock code={curl} onCopy={() => onCopy(curl, "Comando copiado")} />
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              Substitua os valores entre <code className="rounded bg-muted px-1 py-0.5 font-mono">&lt;...&gt;</code> e use a URL base <code className="rounded bg-muted px-1 py-0.5 font-mono">{baseUrl}</code>.
            </p>
          </div>
          <div className="rounded-[8px] border border-border bg-muted/20 p-4">
            <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground">
              <LockKeyhole className="h-3.5 w-3.5 text-navy" /> Autenticação
            </h3>
            {!protectedOperation ? (
              <p className="text-xs leading-relaxed text-muted-foreground">Este endpoint é público e não exige header Authorization.</p>
            ) : (
              <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                <p>Envie <code className="rounded bg-card px-1 py-0.5 font-mono text-foreground">Authorization: Bearer &lt;token&gt;</code>.</p>
                <div className="space-y-2">
                  <p className="flex items-start gap-2"><Check className="mt-0.5 h-3 w-3 shrink-0 text-status-success" /> <span><strong className="text-foreground">Cognito ID token</strong> do usuário autenticado.</span></p>
                  {tokenAllowed && <p className="flex items-start gap-2"><Check className="mt-0.5 h-3 w-3 shrink-0 text-status-success" /> <span><strong className="text-foreground">API token</strong> com permissão read ou write.</span></p>}
                </div>
              </div>
            )}
            <div className="mt-3 border-t border-border pt-3">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Base URL</p>
              <code className="break-all text-[11px] text-foreground">{baseUrl}</code>
            </div>
          </div>
        </div>
      </div>

      {parameters.length > 0 && (
        <section className="card p-5 sm:p-6">
          <h3 className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-foreground"><Braces className="h-4 w-4 text-gold" /> Parâmetros</h3>
          <div className="overflow-x-auto rounded-[7px] border border-border">
            <table className="w-full min-w-[620px] text-left text-xs">
              <thead className="bg-muted/60 text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr><th className="px-3 py-2.5 font-semibold">Nome</th><th className="px-3 py-2.5 font-semibold">Local</th><th className="px-3 py-2.5 font-semibold">Tipo</th><th className="px-3 py-2.5 font-semibold">Descrição</th></tr>
              </thead>
              <tbody>
                {parameters.map((parameter) => (
                  <tr key={`${parameter.in}-${parameter.name}`} className="border-t border-border">
                    <td className="px-3 py-2.5 font-mono font-semibold text-foreground">{parameter.name}{parameter.required === true && <span className="ml-1 text-status-danger">*</span>}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{parameter.in}</td>
                    <td className="px-3 py-2.5 font-mono text-muted-foreground">{schemaType(parameter.schema, schemas)}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{parameter.description ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {bodySchema !== undefined && (
        <section className="grid gap-5 lg:grid-cols-2">
          <div className="card p-5 sm:p-6">
            <h3 className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-foreground"><FileJson className="h-4 w-4 text-gold" /> Corpo da requisição</h3>
            <SchemaBlock schema={bodySchema} schemas={schemas} />
          </div>
          <div className="card p-5 sm:p-6">
            <h3 className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-foreground"><Code2 className="h-4 w-4 text-gold" /> Exemplo de payload</h3>
            <CodeBlock language="json" code={JSON.stringify(bodySample, null, 2)} onCopy={() => onCopy(JSON.stringify(bodySample, null, 2), "Payload copiado")} />
          </div>
        </section>
      )}

      <section className="card p-5 sm:p-6">
        <h3 className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-foreground"><Server className="h-4 w-4 text-gold" /> Respostas</h3>
        <div className="space-y-2">
          {Object.entries(item.operation.responses ?? {}).sort(([a], [b]) => Number(a) - Number(b)).map(([status, response]) => {
            const schema = asSchema(response.content?.["application/json"]?.schema);
            const open = openResponses[status] === true;
            return (
              <div key={status} className="overflow-hidden rounded-[7px] border border-border">
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-xs hover:bg-muted/50"
                  onClick={() => setOpenResponses((current) => ({ ...current, [status]: !open }))}
                >
                  {open ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                  <span className={cn("font-mono font-bold", STATUS_STYLES[status[0] ?? ""] ?? "text-foreground")}>{status}</span>
                  <span className="text-muted-foreground">{response.description ?? "Resposta"}</span>
                </button>
                {open && (
                  <div className="border-t border-border bg-muted/10 p-3">
                    <SchemaBlock schema={schema} schemas={schemas} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </article>
  );
}

export default function AdminApiDocsPage({ embedded = false }: { readonly embedded?: boolean }): ReactNode {
  const addToast = useToastStore((state) => state.addToast);
  const [spec, setSpec] = useState<OpenApiDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [openTags, setOpenTags] = useState<Set<string>>(new Set());

  useEffect(() => {
    document.querySelector("main")?.scrollTo({ top: 0 });
    const url = `${import.meta.env.BASE_URL}docs/openapi.json`;
    void fetch(url)
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${String(response.status)}`);
        return (await response.json()) as OpenApiDocument;
      })
      .then((document) => setSpec(document))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Falha ao carregar a documentação"));
  }, []);

  const operations = useMemo<readonly FlatOperation[]>(() => {
    if (spec === null) return [];
    const result: FlatOperation[] = [];
    for (const [path, item] of Object.entries(spec.paths)) {
      for (const method of METHODS) {
        const operation = item[method];
        if (operation !== undefined) result.push({ key: operationKey(method, path), method, path, operation });
      }
    }
    return result;
  }, [spec]);

  const schemas = spec?.components?.schemas ?? {};
  const baseUrl = VITE_API_URL.length > 0 ? VITE_API_URL.replace(/\/$/, "") : (spec?.servers?.[0]?.url ?? "");
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (normalizedQuery.length === 0) return operations;
    return operations.filter((item) => {
      const haystack = `${item.method} ${item.path} ${item.operation.summary ?? ""} ${item.operation.description ?? ""} ${(item.operation.tags ?? []).join(" ")}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [normalizedQuery, operations]);

  const grouped = useMemo(() => {
    const map = new Map<string, FlatOperation[]>();
    for (const item of filtered) {
      const tag = item.operation.tags?.[0] ?? "Outros";
      const list = map.get(tag) ?? [];
      list.push(item);
      map.set(tag, list);
    }
    const order = spec?.tags?.map((tag) => tag.name) ?? [];
    return [...map.entries()].sort(([a], [b]) => {
      const ai = order.indexOf(a);
      const bi = order.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }, [filtered, spec?.tags]);

  useEffect(() => {
    if (selectedKey !== null) document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
  }, [selectedKey]);

  const selected = selectedKey === null ? undefined : operations.find((item) => item.key === selectedKey);
  const publicCount = operations.filter((item) => (item.operation.security?.length ?? 0) === 0).length;
  const tagCount = new Set(operations.map((item) => item.operation.tags?.[0] ?? "Outros")).size;

  function copy(value: string, label: string): void {
    void navigator.clipboard.writeText(value)
      .then(() => addToast({ type: "success", title: label }))
      .catch(() => addToast({ type: "error", title: "Não foi possível copiar", description: "Copie manualmente." }));
  }

  function select(key: string): void {
    const item = operations.find((candidate) => candidate.key === key);
    setSelectedKey(key);
    if (item !== undefined) {
      const tag = item.operation.tags?.[0];
      if (tag !== undefined) setOpenTags((current) => new Set([...current, tag]));
    }
  }

  if (error !== null) {
    return (
      <div className={embedded ? "" : "page-content"}>
        <div className="card border-status-danger-border bg-status-danger-subtle p-6 text-sm text-status-danger">
          Não foi possível carregar <code className="font-mono">/docs/openapi.json</code>: {error}
        </div>
      </div>
    );
  }
  if (spec === null) return <SkeletonPage />;

  return (
    <div className={embedded ? "" : "animate-in"}>
      {!embedded && (
        <PageHeader
          title="Documentação da API"
          description="Referência viva dos endpoints, autenticação, parâmetros e schemas da API do Atlas Hub."
          action={(
            <a className="btn btn-primary btn-sm rounded-[8px]" href={`${import.meta.env.BASE_URL}docs/openapi.json`} download="atlas-hub-openapi.json">
              <Download className="h-4 w-4" /> Baixar OpenAPI
            </a>
          )}
        />
      )}

      <div className={embedded ? "space-y-6" : "page-content-wide space-y-6 pb-12"}>
        <section className="relative overflow-hidden rounded-[14px] bg-navy p-6 text-white shadow-[0_18px_50px_-24px_rgba(15,38,74,0.55)] sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -bottom-28 right-10 h-72 w-72 rounded-full border border-gold/20" />
          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="max-w-2xl">
              <div className="mb-4 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">
                <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1"><BookOpen className="h-3 w-3 text-gold" /> API Reference</span>
                <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1"><Sparkles className="h-3 w-3 text-gold" /> OpenAPI {spec.openapi}</span>
              </div>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{spec.info.title}</h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/70">
                {spec.info.description?.split("\n\n")[0] ?? "Referência da API do Atlas Hub."}
              </p>
              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-xs text-white/60">
                <span><strong className="font-semibold text-white">{pluralize(operations.length, "endpoint", "endpoints")}</strong> documentados</span>
                <span><strong className="font-semibold text-white">{pluralize(tagCount, "grupo", "grupos")}</strong> funcionais</span>
                <span><strong className="font-semibold text-white">{pluralize(publicCount, "rota pública", "rotas públicas")}</strong></span>
                <span>Versão <strong className="font-semibold text-white">{spec.info.version}</strong></span>
              </div>
            </div>
            <div className="rounded-[10px] border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm">
              <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/50"><Server className="h-3 w-3" /> Base URL</p>
              <code className="block max-w-[330px] break-all font-mono text-[11px] leading-relaxed text-gold">{baseUrl}</code>
              <button type="button" className="mt-3 flex items-center gap-1.5 text-[10px] font-medium text-white/60 transition-colors hover:text-white" onClick={() => copy(baseUrl, "Base URL copiada")}>
                <Copy className="h-3 w-3" /> Copiar URL
              </button>
            </div>
          </div>
        </section>

        <div className="grid items-start gap-5 lg:grid-cols-[290px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-4">
            <div className="card overflow-hidden">
              <div className="border-b border-border p-4">
                <label className="relative block">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Buscar endpoint, tag ou descrição..."
                    className="input-base w-full pl-9 text-xs"
                    aria-label="Buscar na documentação"
                  />
                </label>
                <p className="mt-2 text-[10px] text-muted-foreground">{pluralize(filtered.length, "resultado", "resultados")}</p>
              </div>
              <div className="max-h-[calc(100vh-260px)] overflow-y-auto p-2">
                {grouped.length === 0 ? (
                  <div className="px-3 py-8 text-center text-xs text-muted-foreground">Nenhum endpoint encontrado.</div>
                ) : grouped.map(([tag, items]) => {
                  const open = normalizedQuery.length > 0 || openTags.has(tag);
                  return (
                    <div key={tag} className="mb-1">
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 rounded-[6px] px-2.5 py-2 text-left text-[11px] font-semibold text-foreground transition-colors hover:bg-muted"
                        onClick={() => setOpenTags((current) => {
                          const next = new Set(current);
                          if (next.has(tag)) next.delete(tag); else next.add(tag);
                          return next;
                        })}
                      >
                        {open ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                        <span className="min-w-0 flex-1 truncate">{tag}</span>
                        <span className="text-[9px] font-normal text-muted-foreground">{items.length}</span>
                      </button>
                      {open && (
                        <div className="ml-2 space-y-0.5 border-l border-border pl-2">
                          {items.map((item) => (
                            <button
                              key={item.key}
                              type="button"
                              onClick={() => select(item.key)}
                              className={cn(
                                "flex w-full items-center gap-2 rounded-[5px] px-2 py-1.5 text-left transition-colors",
                                selectedKey === item.key ? "bg-navy/[0.06]" : "hover:bg-muted",
                              )}
                            >
                              <MethodBadge method={item.method} small />
                              <span className="min-w-0 truncate font-mono text-[10px] text-muted-foreground">{item.path}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-3 rounded-[9px] border border-border bg-card p-4">
              <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"><KeyRound className="h-3 w-3 text-gold" /> Precisa de acesso?</p>
              <p className="text-[11px] leading-relaxed text-muted-foreground">Crie um token de API nas suas configurações para integrações externas.</p>
              <Link to="/admin/configuracoes?tab=tokens" className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-navy hover:underline">Gerenciar meus tokens <ChevronRight className="h-3 w-3" /></Link>
            </div>
          </aside>

          <div className="min-w-0">
            {selected === undefined ? (
              <div className="space-y-5">
                <div className="card p-6 sm:p-8">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-2xl">
                      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-[10px] bg-gold/15 text-gold"><BookOpen className="h-5 w-5" /></div>
                      <h2 className="text-xl font-semibold tracking-tight text-foreground">Explore a API por grupo</h2>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        Selecione um endpoint na navegação ao lado para ver URL, autenticação, parâmetros, exemplos de requisição e schemas de resposta. O documento é gerado a partir do OpenAPI mantido no repositório.
                      </p>
                    </div>
                    <div className="grid min-w-[190px] grid-cols-2 gap-2 text-center">
                      <div className="rounded-[8px] border border-border bg-muted/20 p-3"><p className="text-xl font-semibold text-navy">{operations.length}</p><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Endpoints</p></div>
                      <div className="rounded-[8px] border border-border bg-muted/20 p-3"><p className="text-xl font-semibold text-navy">{tagCount}</p><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Grupos</p></div>
                      <div className="rounded-[8px] border border-border bg-muted/20 p-3"><p className="text-xl font-semibold text-status-success">{publicCount}</p><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Públicos</p></div>
                      <div className="rounded-[8px] border border-border bg-muted/20 p-3"><p className="text-xl font-semibold text-navy">{operations.length - publicCount}</p><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Protegidos</p></div>
                    </div>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="card p-5">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground"><ShieldCheck className="h-4 w-4 text-navy" /> Como autenticar</h3>
                    <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                      <p><strong className="text-foreground">Frontend:</strong> use o ID token do Cognito no header <code className="rounded bg-muted px-1 py-0.5 font-mono">Authorization: Bearer &lt;token&gt;</code>.</p>
                      <p><strong className="text-foreground">Integrações:</strong> crie um API token em <code className="rounded bg-muted px-1 py-0.5 font-mono">/admin/configuracoes?tab=tokens</code>. Tokens read acessam GET/HEAD e downloads; write acessam todas as operações administrativas.</p>
                    </div>
                  </div>
                  <div className="card p-5">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground"><Braces className="h-4 w-4 text-gold" /> Formato de erro</h3>
                    <CodeBlock language="json" code={JSON.stringify({ code: "VALIDATION_ERROR", error: "Bad Request", message: "Dados inválidos", fields: [{ field: "nome", message: "Nome é obrigatório" }] }, null, 2)} onCopy={() => copy(JSON.stringify({ code: "VALIDATION_ERROR", error: "Bad Request", message: "Dados inválidos", fields: [{ field: "nome", message: "Nome é obrigatório" }] }, null, 2), "Exemplo copiado")} />
                  </div>
                </div>
              </div>
            ) : (
              <Detail key={selected.key} item={selected} schemas={schemas} baseUrl={baseUrl} onCopy={copy} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
