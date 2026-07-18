# AGENTS.md — shared

- Código compartilhado entre Lambdas; sem handlers HTTP aqui.
- Sem comentários.
- Mudança em `core/types` exige alinhar frontend `types/domain.ts`.
- `storage` só gera URL assinada; CORS do bucket vive no `serverless.yml`.
