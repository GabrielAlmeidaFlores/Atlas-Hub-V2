# AGENTS.md — frontend/src

## Estrutura

- `app/` shells e providers
- `features/` páginas por portal (incorporadora | admin | auth | landing)
- `components/ui` primitivos; `components/shared` domínio compartilhado
- `lib/` helpers puros (upload, viabilidade, utils)
- `services/api.ts` único cliente HTTP
- `types/` contratos alinhados ao backend
- `mocks/` apenas desenvolvimento local

## Regras

- Sem comentários.
- Novos tipos de domínio espelham `backend/src/shared/core/types`.
- Persistência de projeto (incl. `viabilidade`, `documentos`) só por `PUT /projetos/:id` nos status editáveis.
- Rotas: declarar rotas estáticas (`/projetos/:id/editar`) **antes** de `/projetos/:id`.
- Textos de formulário: estados string no form; converter número na hora do `api.put`.
