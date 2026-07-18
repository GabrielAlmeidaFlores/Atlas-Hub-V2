# AGENTS.md — frontend

## Stack

React 18, Vite, React Router, Tailwind 3, Amplify Auth (Cognito), TypeScript.

## Obrigatório

- Sem comentários no código.
- Sem MSW/mocks fora de `src/mocks`. Em `main.tsx`, mocks só se `import.meta.env.DEV` e `VITE_MODE === "development"`.
- Builds de PRD/CI devem usar `VITE_MODE=production` (já nos workflows).
- Chamadas HTTP só via `src/services/api.ts` (Bearer Cognito).
- Upload S3 só via `src/lib/upload.ts` (presign API + PUT). Nunca hardcodar URL de bucket fake.
- Design: `DESIGN.md` — radius 0, Poppins, `status-*`, navy `#1B2B5E`, gold `#C49020`.
- Features em `src/features/<portal>/<domínio>/page/`. Shared UI em `src/components/`.
- Não usar `useMemo`/`useCallback` por padrão; seguir padrões já existentes no repo.

## Anti-padrões

- Stub de upload com mensagem “S3 não configurado”.
- Progresso/checklist marcado `done: true` sem dado real.
- Cards/sombras/pills genéricos que violem o design system.
- Importar handlers MSW em código de feature.
