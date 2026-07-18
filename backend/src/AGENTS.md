# AGENTS.md — backend/src

## Funções

- Um handler exportado `handler` por arquivo em `functions/`.
- Nome do arquivo = domínio-ação (`projeto-atualizar.ts`).
- Logger: `createLogger('nomeCurto')`.

## Shared

- `core/types` — contratos DynamoDB
- `core/env` — env vars tipadas
- `http/auth|response|validators` — borda HTTP
- `db` — acesso DynamoDB
- `storage` — presign S3
- `email` — SES

## Regras

- Sem comentários.
- Novos campos em `Projeto` exigem: tipo em `core/types`, schema Zod em `validators`, e uso explícito no handler.
- Presign retorna `{ url, location }`; nunca fazer upload do arquivo dentro da Lambda.
- Transições de status inválidas → `badRequest` com `INVALID_STATUS_TRANSITION`.
