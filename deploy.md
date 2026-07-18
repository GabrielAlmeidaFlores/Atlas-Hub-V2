# Atlas Hub V2 — Guia de Produção

## Visão geral

O ambiente de produção usa a mesma stack da Syntonia:

| Serviço | Uso |
|---|---|
| **AWS Lambda** | ~32 funções (backend) |
| **API Gateway** | Endpoints REST |
| **DynamoDB** | 7 tabelas (PAY_PER_REQUEST) |
| **Cognito** | Autenticação (1 pool, 3 grupos) |
| **S3** | Documentos — PUT (upload) e GetObject (download) via presign |
| **SES** | E-mails transacionais |
| **AWS Amplify** | Frontend (SPA) |
| **Serverless Framework** | IaC + deploy do backend |
| **GitHub Actions** | CI/CD |

---

## Pré-requisitos

- AWS CLI instalado e configurado
- Node.js 22 instalado
- Yarn instalado (`npm install -g yarn`)
- Repositório no GitHub

---

## 1. Configurar credenciais AWS

### Opção A — Usar conta existente (Syntonia)
```bash
aws configure --profile atlas-hub
# AWS Access Key ID: <mesma da Syntonia ou nova>
# AWS Secret Access Key: <mesma da Syntonia ou nova>
# Default region name: sa-east-1
# Default output format: json
```

### Opção B — Conta nova recomendada para isolamento
1. Criar usuário IAM no AWS Console com permissões:
   - `AdministratorAccess` (para o primeiro deploy)
2. Gerar Access Key
3. `aws configure --profile atlas-hub`

---

## 2. Primeiro deploy (local)

Execute o script de setup — ele faz tudo:

```bash
export AWS_PROFILE=atlas-hub
cd repository/atlas-hub-v2
bash scripts/setup-prod.sh
```

O script vai:
1. Fazer deploy de todo o backend via Serverless Framework
2. Criar o app no AWS Amplify
3. Buildar e deployar o frontend
4. Criar o usuário Admin Master

---

## 3. Configurar CI/CD (GitHub Actions)

Após o primeiro deploy, configure o repositório para auto-deploy:

### Secrets (Settings → Secrets and variables → Actions → Secrets)

| Nome | Valor |
|---|---|
| `AWS_ACCESS_KEY_ID` | Access key do usuário IAM |
| `AWS_SECRET_ACCESS_KEY` | Secret key do usuário IAM |

### Variables (Settings → Secrets and variables → Actions → Variables)

| Nome | Valor |
|---|---|
| `AWS_REGION` | `sa-east-1` |
| `VITE_AWS_REGION` | `sa-east-1` |
| `AMPLIFY_APP_ID` | ID gerado no setup (ex: `d1abc123xyz`) |
| `ADMIN_MASTER_EMAIL` | E-mail do admin master |

### Branches

| Branch | Ambiente | Trigger |
|---|---|---|
| `develop` | Dev (`--stage dev`) | Push para `develop` |
| `main` | Prod (`--stage prod`) | Push para `main` |

---

## 4. Fluxo de deploy automático

```
push → develop
  ↓
  Typecheck backend
  ↓
  Deploy Lambda + DynamoDB + Cognito + S3 (dev)
  ↓
  Health check (7 tabelas + API /health + Cognito)
  ↓
  Build frontend (com vars do CloudFormation)
  ↓
  Deploy Amplify (dev branch)

push → main
  ↓
  (mesmo fluxo, stage=prod)
  ↓
  Create Admin Master (só no primeiro deploy)
```

---

## 5. Configurar SES para e-mails

O SES começa em modo sandbox — só envia para e-mails verificados.

### Sair do sandbox (produção)
1. AWS Console → SES → Account dashboard
2. "Request production access"
3. Preencher o formulário (caso de uso: notificações transacionais)
4. Aguardar aprovação (1-3 dias úteis)

### Verificar domínio (enquanto aguarda)
```bash
aws ses verify-domain-identity \
  --domain atlashub.com.br \
  --region sa-east-1
```
Adicionar os registros DNS retornados no provedor de domínio.

---

## 6. Configurar domínio customizado no Amplify

Após ter um domínio registrado:

1. AWS Console → Amplify → seu app → Domain management
2. "Add domain"
3. Inserir o domínio (ex: `atlashub.com.br`)
4. Amplify gera registros CNAME — adicionar no DNS
5. Aguardar propagação (até 24h)

---

## 7. Criar primeiro Admin Master (manual)

Se não usou o script de setup:

```bash
export AWS_PROFILE=atlas-hub
cd repository/atlas-hub-v2/backend

POOL_ID="sa-east-1_XXXXXXXXX" \
ADMIN_EMAIL="admin@atlashub.com.br" \
ADMINS_TABLE="AtlasAdmins-prod" \
REGION="sa-east-1" \
npx tsx scripts/create-admin-master.ts
```

---

## 8. Verificar deploy

```bash
# Checar backend
curl https://<api-id>.execute-api.sa-east-1.amazonaws.com/prod/health

# Checar tabelas DynamoDB
aws dynamodb list-tables --region sa-east-1 | grep Atlas

# Checar Cognito groups
aws cognito-idp list-groups \
  --user-pool-id <pool-id> \
  --region sa-east-1
```

---

## Custos estimados (AWS Free Tier + tráfego baixo)

| Serviço | Custo estimado/mês |
|---|---|
| Lambda (1M req free) | ~R$0 |
| DynamoDB (25 GB free) | ~R$0 |
| Cognito (50k MAU free) | ~R$0 |
| S3 (5 GB free) | ~R$0 |
| API Gateway (1M req free) | ~R$0 |
| Amplify hosting | ~R$0 |
| SES (62k e-mails free) | ~R$0 |
| **Total MVP** | **~R$0/mês** |

---

## Estrutura de arquivos de CI/CD

```
.github/
  workflows/
    deploy-dev.yml   ← push para develop
    deploy-prod.yml  ← push para main
scripts/
  setup-prod.sh              ← primeiro deploy (local)
  create-admin-master.ts     ← cria admin master no Cognito + DynamoDB
backend/
  serverless.yml             ← toda a infra AWS
frontend/
  amplify.yml                ← build spec do Amplify
```
