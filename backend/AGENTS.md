# AGENTS.md — backend

## Stack

Serverless Framework 3, Lambda Node 20, DynamoDB, S3, SES, Cognito, esbuild, Zod.

## Obrigatório

- Sem comentários no código.
- Handlers em `src/functions/`; shared em `src/shared/` (http, db, storage, email, core).
- Validar body com Zod em `src/shared/http/validators.ts`.
- Respostas via helpers `ok` / `created` / `badRequest` / etc.
- Auth: `getUserId` + `requirePerfil` / `requireAdminMaster`.
- IAM por função (least privilege) no `serverless.yml`.
- `DOCUMENTS_BUCKET: atlas-hub-documents-${stage}`; presign com `s3:PutObject` no prefixo certo.
- Status de projeto: editar só `RASCUNHO` | `AJUSTE_SOLICITADO` | `REPROVADO`.

## Anti-padrões

- Credenciais AWS no código ou `.env` commitado.
- Bucket/URL S3 hardcodados sem stage.
- Aceitar `any` no body sem schema.
- Logar tokens ou PII sensível.
