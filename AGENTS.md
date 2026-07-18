# AGENTS.md — Atlas Hub V2

Regras obrigatórias para qualquer agente ou humano alterando este repositório.

## Escopo do produto

- Este monorepo é o **MVP originador + curadoria** (incorporadora + admin).
- Spec: `product.md`. Fronteira: `docs/SCOPE.md`. Não reabrir backlog de investidor/Plano A.
- Escalada Imobiliária é **referência de UX**, não clone — ver `docs/escalada-referencias.md`.
- Mudança que **altera conteúdo de projeto** segue a máquina de status e curadoria. Feature que não altera projeto não cria ciclo de aprovação.

## Código — práticas obrigatórias

1. **Sem comentários no código** (sem `//`, sem `/* */`, sem JSDoc). Nomes e estrutura devem ser autoexplicativos. Exceções só se o usuário pedir explicitamente.
2. **Sem mocks, dados fake ou integrações falsas** em caminhos de produção. MSW apenas sob `frontend/src/mocks` e só com `import.meta.env.DEV`.
3. **TypeScript estrito**; sem `any` desnecessário; validar inputs na borda (Zod no backend).
4. Diff mínimo: não refatorar arquivos não relacionados à tarefa.
5. Não commitar secrets (`.env`, keys). Não fazer commit/push/deploy sem pedido explícito.
6. Região AWS: `sa-east-1`. Stages: `dev` / `prod`.

## Layout

| Pasta | Responsabilidade |
|---|---|
| `frontend/` | React 18 + Vite + Amplify + Cognito |
| `backend/` | Serverless Framework + Lambda + DynamoDB + S3 + SES |
| `docs/` | Escopo e referências de produto (não inventar features) |
| `.github/workflows/` | Deploy DEV/PRD |

Leia o `AGENTS.md` da pasta em que estiver trabalhando antes de editar.

## Definition of done

- `yarn build` (frontend) e `tsc --noEmit` (backend) passam.
- Sem alerts de stub S3 / “em breve” que mintam integração pronta.
- Upload de documentos: presign real → PUT S3 → persistir `location` via API.
- UI segue `frontend/DESIGN.md` (radius 0, Poppins, tokens `status-*`, navy/gold).
