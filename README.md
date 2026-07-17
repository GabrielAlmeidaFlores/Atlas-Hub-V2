# Atlas Hub V2

Plataforma de **crowdfunding imobiliário** regulada pela **CVM Resolução 88**. O Atlas Hub origina e faz a curadoria de projetos de incorporadoras; a infraestrutura do investidor (KYC, escrow, tokenização, ofertas) fica a cargo da **Divify** (white-label).

Este repositório cobre o **MVP de originador + curadoria**:

- **Portal da Incorporadora** — cadastro, perfil, submissão de projetos, acompanhamento
- **Painel de Curadoria (Admin)** — fila de análise, scorecard, aprovação/reprovação, CRM

> Spec de produto: [`product.md`](product.md) · Deploy: [`deploy.md`](deploy.md) · Pendências: [`pending.md`](pending.md)

---

## Ambientes

### Produção (PRD)

| Recurso | Valor |
|---|---|
| **Frontend** | https://master.d3vqf6k21x668r.amplifyapp.com |
| **API** | https://lmhbubwn7e.execute-api.sa-east-1.amazonaws.com/prod |
| **Health check** | https://lmhbubwn7e.execute-api.sa-east-1.amazonaws.com/prod/health |
| **Cognito User Pool** | `sa-east-1_QyeSOhG1N` |
| **Cognito Client ID** | `ecg5pr2qoiqk7njeegqhdjqnc` |
| **Amplify App** | `atlas-hub-prod` (`d3vqf6k21x668r`) |
| **Amplify branch** | `master` |
| **S3 documentos** | `atlas-hub-documents-prod` |
| **Região AWS** | `sa-east-1` |
| **Conta AWS** | `228228361045` |
| **Admin master** | `gabrielalmeidaflores@hotmail.com` |
| **Repositório** | https://github.com/GabrielAlmeidaFlores/Atlas-Hub-V2 |

**Tabelas DynamoDB (prod):** `AtlasIncorporadoras-prod`, `AtlasAdmins-prod`, `AtlasProjetos-prod`, `AtlasScorecard-prod`, `AtlasNotificacoes-prod`, `AtlasAuditoria-prod`, `AtlasNotas-prod`

### Desenvolvimento (DEV)

| Recurso | Valor |
|---|---|
| **Frontend** | https://dev.dng6v0yvgarue.amplifyapp.com |
| **API** | https://9oyxstx009.execute-api.sa-east-1.amazonaws.com/dev |
| **Health check** | https://9oyxstx009.execute-api.sa-east-1.amazonaws.com/dev/health |
| **Cognito User Pool** | `sa-east-1_FyjlSJmHK` |
| **Cognito Client ID** | `4qjkgtkmslm15hhvlb5d5sc2bv` |
| **Amplify App** | `atlas-hub-dev` (`dng6v0yvgarue`) |
| **Amplify branch** | `dev` |
| **S3 documentos** | `atlas-hub-documents-dev` |

---

## Arquitetura

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│  React (Vite)   │────▶│ API Gateway  │────▶│ Lambda (Node 20)│
│  AWS Amplify    │     └──────────────┘     └────────┬────────┘
└────────┬────────┘                                   │
         │                                            ├── DynamoDB
         ▼                                            ├── S3
   Amazon Cognito                                     └── SES
```

| Camada | Stack |
|---|---|
| Frontend | React 18, TypeScript, Vite 6, Tailwind, Radix UI, Zustand, AWS Amplify v6 |
| Backend | Node.js 20 (Lambda), Serverless Framework 4, Zod, AWS SDK v3 |
| Auth | Cognito (1 pool, grupos `INCORPORADORA`, `ANALISTA`, `ADMIN_MASTER`) |
| Dados | DynamoDB (PAY_PER_REQUEST) |
| Storage | S3 |
| E-mail | SES |
| Hosting | AWS Amplify (SPA) |
| CI/CD | GitHub Actions |

Monorepo: `frontend/` + `backend/`.

---

## Fluxo de um projeto

```
RASCUNHO → SUBMETIDO → EM_ANALISE → APROVADO → OFERTA_CRIADA
                         │
                         ├── AJUSTE_SOLICITADO → (resubmete) → SUBMETIDO
                         └── REPROVADO → (resubmete) → SUBMETIDO
```

Após `APROVADO`, a criação da oferta na Divify é **manual** no MVP: o analista cria a oferta no painel Divify e registra ID + link no Atlas Hub (`OFERTA_CRIADA`).

---

## Funcionalidades do sistema

### 1. Área pública e autenticação

| Funcionalidade | Descrição | Rota / onde |
|---|---|---|
| Landing page | Apresentação do Atlas Hub, diferenciais vs. financiamento bancário, CTA para cadastro e login | `/` |
| Cadastro de incorporadora | Razão social, CNPJ (único), responsável (nome/CPF/cargo), e-mail corporativo (único), telefone, senha | `/cadastro` |
| Confirmação de e-mail | Bloqueia acesso até confirmar; redireciona ao dashboard após confirmação | `/confirmar-email` |
| Login | E-mail + senha (erro genérico; CAPTCHA após 5 tentativas) | `/login` |
| Recuperação de senha | Solicita link por e-mail (sem revelar se o e-mail existe) | `/esqueci-senha` |
| Redefinição de senha | Nova senha via token (expira em 1h); invalida sessões anteriores | `/redefinir-senha` |
| Controle de acesso por perfil | Cognito com grupos `INCORPORADORA`, `ANALISTA`, `ADMIN_MASTER`; rotas protegidas | Guards no router |

---

### 2. Portal da Incorporadora

#### 2.1 Perfil da empresa

| Funcionalidade | Descrição |
|---|---|
| Dados cadastrais complementares | Endereço, site, descrição da empresa, histórico de projetos anteriores |
| Upload de documentos da empresa | Contrato social e comprovante de CNPJ (PDF/JPG/PNG, até 20 MB) via URL pré-assinada S3 |
| Edição a qualquer momento | Perfil pode ser preenchido/atualizado independentemente dos projetos |

#### 2.2 Dashboard

| Funcionalidade | Descrição |
|---|---|
| Cards de resumo | Contagens por: Rascunhos, Aguardando análise, Requer atenção, Aprovados, Publicados, Total |
| Lista de projetos | Nome, modelo, tipo de oferta, valor a captar, data de submissão, status, link para detalhe |

#### 2.3 Wizard de submissão (5 etapas)

Progresso salvo automaticamente como **rascunho** ao avançar cada etapa. Pode fechar e retomar.

| Etapa | O que cobre |
|---|---|
| **1 — Dados gerais** | Nome, modelo (MVP: só Venda), tipo de imóvel, cidade/UF, endereço do terreno, descrição (≥200 chars), fotos (até 10×10 MB), vídeo YouTube |
| **2 — Dados financeiros** | Valor total, valor a captar (≤ R$15M CVM), prazos de obra/retorno, rentabilidade estimada, modelo de retorno (lucros SPE/SCP ou dívida), plano de saída, tipo de oferta (pública/privada), opção de investimento parcelado |
| **3 — Documentos** | Matrícula, alvará/protocolo, memorial, planta, planilha de viabilidade (obrigatórios); orçamento, 3D, SPE/SCP, CNDs, outros (opcionais). PDF/JPG/PNG até 50 MB |
| **4 — Equipe** | Múltiplos membros: nome, cargo, bio; foto e LinkedIn opcionais. Mínimo 1 responsável técnico |
| **5 — Revisão e envio** | Resumo completo, checklist de obrigatórios, confirmação modal → status `SUBMETIDO` |

**Regras do wizard:** após submissão os campos bloqueiam; em ajuste voltam editáveis; reprovado pode ser corrigido e resubmetido sem limite; histórico de análises fica visível.

#### 2.4 Detalhe e acompanhamento do projeto

| Funcionalidade | Descrição |
|---|---|
| Painel lateral de status | Status atual, linha do tempo, última atualização, nome do analista (sem contato) |
| Aba Visão geral | Dados gerais, financeiros e modelo |
| Aba Documentos | Visualização inline + download |
| Aba Equipe | Membros com foto, cargo e bio |
| Aba Histórico | Timeline de status, datas e mensagens |
| Banner de ajuste | Texto do analista + editar + resubmeter (`AJUSTE_SOLICITADO`) |
| Banner de reprovação | Justificativa + resubmeter com correções (`REPROVADO`) |
| Banner de aprovação | Aviso de criação da oferta (`APROVADO`) |
| Banner de oferta publicada | Link direto da oferta na Divify (`OFERTA_CRIADA`) |

#### 2.5 Notificações (incorporadora)

| Evento | In-app | E-mail |
|---|---|---|
| Cadastro / confirmação de e-mail | ✓ (boas-vindas) | ✓ (confirmação) |
| Projeto submetido | ✓ | ✓ |
| Análise iniciada | ✓ | — |
| Ajuste solicitado | ✓ | ✓ (texto completo) |
| Projeto reprovado | ✓ | ✓ (justificativa) |
| Projeto aprovado | ✓ | ✓ |
| Oferta publicada | ✓ | ✓ (com link) |
| Marcar notificação como lida | ✓ | — |

---

### 3. Painel de Curadoria (Admin)

#### 3.1 Gestão de usuários admin (`ADMIN_MASTER`)

| Funcionalidade | Descrição | API |
|---|---|---|
| Listar usuários admin | Analistas e masters | `GET /admin/usuarios` |
| Criar analista | Nome, e-mail, senha temporária; redefine no 1º acesso | `POST /admin/usuarios` |
| Desativar usuário | Remove acesso | `PUT /admin/usuarios/{id}/desativar` |
| Reatribuir projeto | Troca analista responsável (com motivo); scorecard parcial é herdado | `POST /admin/curadoria/{id}/reatribuir` |

#### 3.2 Dashboard admin

| Funcionalidade | Descrição |
|---|---|
| Métricas | Submetidos, em análise, aguardando ajuste, aprovados, reprovados, aguardando Divify, ofertas publicadas (mês / acumulado) |
| Tempo médio de análise | Em dias (mês atual) |
| Funil visual | Submetidos → Em análise → Aprovados → Oferta criada (com desvios para ajuste/reprovação) |

#### 3.3 Fila de curadoria

| Funcionalidade | Descrição |
|---|---|
| Lista de pendentes | Status `SUBMETIDO`, `EM_ANALISE`, `AJUSTE_SOLICITADO` |
| Colunas | Projeto, incorporadora, modelo, tipo de oferta, valor, data, dias aguardando, status, analista |
| Filtros | Status, analista, intervalo de datas, modelo, tipo de oferta |
| Ordenação FIFO | Mais antigo primeiro |
| Iniciar análise | Atribui ao analista logado → `EM_ANALISE`; outros só visualizam |

#### 3.4 Análise, scorecard e decisão

| Funcionalidade | Descrição |
|---|---|
| Abas somente leitura | Dados gerais, financeiros, documentos, equipe, incorporadora, histórico |
| Notas internas | Texto livre, autor + data/hora; imutáveis; **não** visíveis à incorporadora |
| Scorecard (5 critérios) | Localização 25%, Viabilidade 25%, Documentação 20%, Equipe 15%, Risco 15% — nota 1–10 + comentário; média ponderada automática |
| Parecer final | Obrigatório antes de decidir |
| Checklist pré-aprovação | Patrimônio de afetação, seguro de obra, SPE/SCP, elegibilidade CVM (≤ R$40M) |
| Salvar rascunho do scorecard | Sem mudar status |
| Solicitar ajuste | → `AJUSTE_SOLICITADO` + notificação |
| Reprovar | Scorecard completo + parecer → `REPROVADO` |
| Aprovar | Scorecard + checklist + parecer → `APROVADO` |
| Confirmar publicação Divify | Registra ID + link da oferta → `OFERTA_CRIADA` |
| Histórico de resubmissões | Exibe “Revisão N” e scorecards anteriores |

#### 3.5 Histórico de decisões

| Funcionalidade | Descrição |
|---|---|
| Lista de decididos | `APROVADO`, `OFERTA_CRIADA`, `REPROVADO` |
| Colunas | Projeto, incorporadora, modelo, oferta, valor, analista, nota, decisão, data, ID/link Divify |
| Filtros | Decisão, analista, datas, tipo de oferta |
| Ver análise completa | Abre o detalhe com scorecard e notas |

#### 3.6 CRM de incorporadoras

| Funcionalidade | Descrição |
|---|---|
| Lista de incorporadoras | Razão social, CNPJ, responsável, data de cadastro, total de projetos, status do último |
| Detalhe | Dados cadastrais, documentos, histórico declarado, todos os projetos com status/nota/decisão |
| Resumo | Contagens: submetidos / aprovados / reprovados / publicados |

---

### 4. API backend (endpoints)

#### Saúde e incorporadora

| Método | Path | Função |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` / `PUT` | `/incorporadora/perfil` | Ler / atualizar perfil |
| `POST` | `/incorporadora/documentos/pre-sign` | URL pré-assinada S3 (docs da empresa) |

#### Projetos

| Método | Path | Função |
|---|---|---|
| `POST` | `/projetos` | Criar rascunho |
| `GET` | `/projetos` | Listar projetos da incorporadora |
| `GET` / `PUT` | `/projetos/{id}` | Detalhe / atualizar rascunho |
| `POST` | `/projetos/{id}/submeter` | Submeter |
| `POST` | `/projetos/{id}/resubmeter` | Resubmeter após ajuste/reprovação |
| `POST` | `/projetos/{id}/documentos/pre-sign` | Upload de docs/fotos do projeto |

#### Notificações

| Método | Path | Função |
|---|---|---|
| `GET` | `/notificacoes` | Listar |
| `PUT` | `/notificacoes/{id}/lida` | Marcar como lida |

#### Curadoria e admin

| Método | Path | Função |
|---|---|---|
| `GET` | `/admin/curadoria` | Fila |
| `GET` | `/admin/curadoria/{id}` | Detalhe completo |
| `POST` | `/admin/curadoria/{id}/iniciar` | Iniciar análise |
| `PUT` | `/admin/curadoria/{id}/scorecard` | Salvar scorecard |
| `POST` | `/admin/curadoria/{id}/ajuste` | Solicitar ajuste |
| `POST` | `/admin/curadoria/{id}/reprovar` | Reprovar |
| `POST` | `/admin/curadoria/{id}/aprovar` | Aprovar |
| `POST` | `/admin/curadoria/{id}/confirmar-publicacao` | Confirmar oferta Divify |
| `POST` | `/admin/curadoria/{id}/notas` | Nota interna |
| `POST` | `/admin/curadoria/{id}/reatribuir` | Reatribuir (master) |
| `GET` | `/admin/historico` | Histórico de decisões |
| `GET` | `/admin/incorporadoras` | Lista CRM |
| `GET` | `/admin/incorporadoras/{id}` | Detalhe CRM |
| `GET` | `/admin/dashboard/metricas` | Métricas do dashboard |
| `GET` / `POST` | `/admin/usuarios` | Listar / criar admin |
| `PUT` | `/admin/usuarios/{id}/desativar` | Desativar admin |

Trigger Cognito: `onIncorporadoraSignup` — cria registro da incorporadora no DynamoDB após signup.

---

### 5. Infraestrutura e transversal

| Funcionalidade | Descrição |
|---|---|
| Auth Cognito | Pool único com 3 grupos; JWT nas rotas autenticadas |
| Upload S3 | Pré-assinatura para documentos da empresa e do projeto |
| E-mail SES | Confirmação de conta e notificações de curadoria |
| Auditoria | Log de ações (cadastro, login, submissão, análise, decisão, publicação, etc.) com usuário, data e descrição |
| Validação Zod | Schemas de entrada nas Lambdas |
| CI/CD | Typecheck → deploy Serverless → health checks → build Amplify → (prod) admin master |

---

### 6. Integração Divify (MVP)

No MVP a integração é **operacional/manual**, não via API:

1. Analista aprova no Atlas Hub  
2. Cria a oferta no painel admin Divify (pública ou privada, SCP/Nota Comercial, spread 10%)  
3. Registra ID + link no Atlas Hub → `OFERTA_CRIADA`  
4. Incorporadora recebe o link para compartilhar com investidores  

O que a Divify entrega (fora deste repo): vitrine, KYC, investimento PIX, escrow, tokenização, mercado secundário, triggers CVM.

---

### 7. Pós-MVP (não implementado)

| Funcionalidade | Descrição |
|---|---|
| Modelos 2 e 3 | Construção para renda e modelo misto |
| Multi-usuário por incorporadora | Equipe com permissões no portal |
| Automação Divify | Criação de oferta via API + webhooks |
| APIs externas na curadoria | Urbit, Zoneval, CASAFARI |
| Acompanhamento de obra | Progresso físico (ex.: Arquis) |
| Score automático | Avaliação assistida por algoritmo |
| App mobile nativo | iOS / Android |
| Governance / votação | Decisões dos investidores |

---

## Estrutura do repositório

```
Atlas-Hub-V2/
├── frontend/                 # SPA React (atlas-hub-frontend)
│   └── src/
│       ├── features/         # landing, auth, incorporadora, admin
│       ├── app/              # layouts
│       ├── router/           # rotas
│       ├── stores/           # Zustand
│       └── services/         # cliente HTTP
├── backend/                  # API serverless (atlas-hub-backend)
│   ├── src/functions/        # ~31 handlers Lambda
│   ├── src/shared/           # auth, db, http, email, storage
│   └── serverless.yml        # IaC AWS
├── scripts/
│   └── setup-prod.sh         # primeiro deploy local de produção
├── .github/workflows/
│   ├── deploy-dev.yml        # push → develop
│   └── deploy-prod.yml       # push → master
├── product.md
├── deploy.md
└── pending.md
```

### Rotas principais (frontend)

| Área | Paths |
|---|---|
| Pública | `/`, `/login`, `/cadastro`, `/confirmar-email`, `/esqueci-senha` |
| Incorporadora | `/dashboard`, `/projetos/novo`, `/projetos/:id`, `/perfil`, `/notificacoes` |
| Admin | `/admin`, `/admin/curadoria`, `/admin/historico`, `/admin/incorporadoras` |

---

## Desenvolvimento local

### Pré-requisitos

- Node.js **≥ 22**
- Yarn Classic (`npm install -g yarn@1.22.22`)
- AWS CLI com profile `atlas-hub` (para deploy)
- Conta Cognito / API já provisionadas **ou** mocks MSW no frontend

### Backend (API em `:3000`)

```bash
cd backend
npm ci --legacy-peer-deps
npm run dev          # serverless offline --stage dev
```

Scripts úteis:

```bash
npm run build          # typecheck
npm run deploy:dev
npm run deploy:prod
```

### Frontend (Vite em `:5173`)

```bash
cd frontend
cp .env.example .env   # ajustar com Cognito/API de DEV ou mocks
yarn install
yarn dev
```

Variáveis (`frontend/.env`):

```env
VITE_API_URL=http://localhost:3000/dev
VITE_COGNITO_USER_POOL_ID=sa-east-1_XXXXXXXXX
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_AWS_REGION=sa-east-1
VITE_MODE=development
```

Para apontar o frontend local à API de DEV:

```env
VITE_API_URL=https://9oyxstx009.execute-api.sa-east-1.amazonaws.com/dev
VITE_COGNITO_USER_POOL_ID=sa-east-1_FyjlSJmHK
VITE_COGNITO_CLIENT_ID=4qjkgtkmslm15hhvlb5d5sc2bv
VITE_AWS_REGION=sa-east-1
VITE_MODE=development
```

```bash
yarn build
yarn lint
yarn typecheck
```

---

## CI/CD

| Branch | Workflow | Stage |
|---|---|---|
| `develop` | [Deploy — Dev](.github/workflows/deploy-dev.yml) | `dev` |
| `master` | [Deploy — Prod](.github/workflows/deploy-prod.yml) | `prod` |

Fluxo em cada push:

1. Typecheck do backend  
2. Deploy Serverless (`--stage dev|prod`)  
3. Health check (DynamoDB, S3, Cognito, Lambdas, `GET /health`)  
4. Build do frontend com outputs do CloudFormation  
5. Deploy no Amplify  
6. (Só prod) criação do admin master se o pool estiver vazio  

### Secrets e variables (GitHub Actions)

**Secrets**

| Nome | Descrição |
|---|---|
| `AWS_ACCESS_KEY_ID` | Access key IAM (`atlas-hub-github-action`) |
| `AWS_SECRET_ACCESS_KEY` | Secret key IAM |

**Variables**

| Nome | Valor (prod) |
|---|---|
| `AWS_REGION` | `sa-east-1` |
| `VITE_AWS_REGION` | `sa-east-1` |
| `AMPLIFY_APP_ID` | `d3vqf6k21x668r` |
| `ADMIN_MASTER_EMAIL` | `gabrielalmeidaflores@hotmail.com` |

---

## Deploy manual de produção

Primeiro setup (ou re-deploy local):

```bash
export AWS_PROFILE=atlas-hub
bash scripts/setup-prod.sh
```

Criar admin master manualmente:

```bash
cd backend
POOL_ID="sa-east-1_QyeSOhG1N" \
ADMIN_EMAIL="gabrielalmeidaflores@hotmail.com" \
ADMINS_TABLE="AtlasAdmins-prod" \
REGION="sa-east-1" \
npx tsx scripts/create-admin-master.ts
```

Verificações rápidas:

```bash
curl https://lmhbubwn7e.execute-api.sa-east-1.amazonaws.com/prod/health

aws dynamodb list-tables --region sa-east-1 --profile atlas-hub | grep Atlas

aws cognito-idp list-groups \
  --user-pool-id sa-east-1_QyeSOhG1N \
  --region sa-east-1 \
  --profile atlas-hub
```

---

## Perfis de usuário

| Perfil | Acesso | Como entra |
|---|---|---|
| `INCORPORADORA` | Portal da incorporadora | Cadastro público (1 CNPJ = 1 conta no MVP) |
| `ANALISTA` | Painel de curadoria | Criado por admin master |
| `ADMIN_MASTER` | Curadoria + gestão de usuários | Script / pipeline no primeiro deploy |

---

## Atlas Hub vs Divify

| Atlas Hub (este repo) | Divify (não construímos) |
|---|---|
| Portal da Incorporadora | Vitrine e fluxo de investimento |
| Painel de Curadoria | KYC, escrow, tokenização |
| Scorecard, notas, notificações | Triggers CVM e carteira do investidor |

Modelo de negócio (Atlas): **10% do valor captado**, cobrado progressivamente. MVP foca no **Modelo 1 — Construção para Venda**.

---

## Documentação adicional

| Arquivo | Conteúdo |
|---|---|
| [`product.md`](product.md) | Spec completa de produto (~958 linhas) |
| [`deploy.md`](deploy.md) | Guia detalhado de produção AWS |
| [`pending.md`](pending.md) | Decisões abertas (Divify, SES, produto) |

---

## Licença

Projeto privado — todos os direitos reservados.
