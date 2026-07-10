#!/usr/bin/env bash
# =============================================================================
# Atlas Hub — Setup do ambiente de produção (primeiro deploy)
# Uso: bash scripts/setup-prod.sh
# =============================================================================
set -euo pipefail

REGION="sa-east-1"
STAGE="prod"
STACK="atlas-hub-backend-${STAGE}"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

ok()   { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
fail() { echo -e "${RED}✗${NC} $1"; exit 1; }
step() { echo -e "\n${YELLOW}══${NC} $1"; }

# ── Pré-requisitos ─────────────────────────────────────────────────
step "Verificando pré-requisitos"

command -v aws      >/dev/null 2>&1 || fail "AWS CLI não encontrado. Instale: https://aws.amazon.com/cli/"
command -v node     >/dev/null 2>&1 || fail "Node.js não encontrado."
command -v npm      >/dev/null 2>&1 || fail "npm não encontrado."

aws sts get-caller-identity --region "$REGION" >/dev/null 2>&1 || \
  fail "Credenciais AWS não configuradas. Execute: aws configure"

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text --region "$REGION")
ok "AWS Account: $ACCOUNT_ID"
ok "Região: $REGION"

# ── Deploy backend ─────────────────────────────────────────────────
step "Deploy do backend (Serverless Framework)"

cd "$(dirname "$0")/../backend"
npm ci --legacy-peer-deps --silent
npx serverless@4 deploy --stage "$STAGE" --region "$REGION"
ok "Backend deployado"

# ── Ler outputs do CloudFormation ──────────────────────────────────
step "Lendo outputs do CloudFormation"

get_cf_output() {
  aws cloudformation describe-stacks \
    --stack-name "$STACK" \
    --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" \
    --output text --region "$REGION"
}

API_ID=$(aws cloudformation describe-stack-resource \
  --stack-name "$STACK" \
  --logical-resource-id ApiGatewayRestApi \
  --query 'StackResourceDetail.PhysicalResourceId' \
  --output text --region "$REGION")

API_URL="https://${API_ID}.execute-api.${REGION}.amazonaws.com/${STAGE}"
USER_POOL_ID=$(get_cf_output "UserPoolId")
CLIENT_ID=$(get_cf_output "UserPoolClientId")
BUCKET=$(get_cf_output "DocumentsBucketName")

ok "API URL: $API_URL"
ok "User Pool ID: $USER_POOL_ID"
ok "Client ID: $CLIENT_ID"
ok "S3 Bucket: $BUCKET"

# ── Health check ───────────────────────────────────────────────────
step "Health check da API"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/health")
if [ "$HTTP_CODE" = "200" ]; then
  ok "GET /health: 200 OK"
else
  fail "GET /health retornou HTTP $HTTP_CODE"
fi

# ── Criar app no Amplify ───────────────────────────────────────────
step "Configurando AWS Amplify"

APP_NAME="atlas-hub-${STAGE}"
EXISTING=$(aws amplify list-apps --region "$REGION" \
  --query "apps[?name=='${APP_NAME}'].appId" --output text 2>/dev/null || echo "")

if [ -z "$EXISTING" ] || [ "$EXISTING" = "None" ]; then
  AMPLIFY_APP_ID=$(aws amplify create-app \
    --name "$APP_NAME" \
    --region "$REGION" \
    --platform WEB \
    --query 'app.appId' \
    --output text)

  # Criar branch prod
  aws amplify create-branch \
    --app-id "$AMPLIFY_APP_ID" \
    --branch-name "$STAGE" \
    --region "$REGION" >/dev/null

  ok "Amplify app criado: $AMPLIFY_APP_ID"
else
  AMPLIFY_APP_ID="$EXISTING"
  ok "Amplify app já existe: $AMPLIFY_APP_ID"
fi

# ── Build do frontend ──────────────────────────────────────────────
step "Build do frontend"

cd "$(dirname "$0")/../frontend"

# Criar .env.local com os valores reais
cat > .env.local << EOF
VITE_API_URL=${API_URL}
VITE_COGNITO_USER_POOL_ID=${USER_POOL_ID}
VITE_COGNITO_CLIENT_ID=${CLIENT_ID}
VITE_AWS_REGION=${REGION}
VITE_MODE=production
EOF

npm install -g yarn@1.22.22 --silent 2>/dev/null || true
yarn install --frozen-lockfile --silent
yarn build
ok "Frontend buildado"

# ── Deploy frontend ────────────────────────────────────────────────
step "Deploy do frontend → Amplify"

cd dist && zip -r /tmp/atlas-hub-dist.zip . && cd ..

DEPLOY=$(aws amplify create-deployment \
  --app-id "$AMPLIFY_APP_ID" \
  --branch-name "$STAGE" \
  --region "$REGION" \
  --output json)

JOB_ID=$(echo "$DEPLOY" | python3 -c "import sys,json; print(json.load(sys.stdin)['jobId'])")
UPLOAD_URL=$(echo "$DEPLOY" | python3 -c "import sys,json; print(json.load(sys.stdin)['zipUploadUrl'])")

curl -s -o /dev/null -w "Upload: HTTP %{http_code}\n" \
  -X PUT -H "Content-Type: application/zip" \
  --data-binary @/tmp/atlas-hub-dist.zip \
  "$UPLOAD_URL"

aws amplify start-deployment \
  --app-id "$AMPLIFY_APP_ID" \
  --branch-name "$STAGE" \
  --job-id "$JOB_ID" \
  --region "$REGION" >/dev/null

ok "Deploy iniciado (job: $JOB_ID)"

# Aguardar
echo -n "Aguardando deploy "
for i in $(seq 1 30); do
  STATUS=$(aws amplify get-job \
    --app-id "$AMPLIFY_APP_ID" \
    --branch-name "$STAGE" \
    --job-id "$JOB_ID" \
    --region "$REGION" --output json \
    | python3 -c "import sys,json; print(json.load(sys.stdin)['job']['summary']['status'])")
  echo -n "."
  if [ "$STATUS" = "SUCCEED" ]; then echo " ✓"; break; fi
  if [ "$STATUS" = "FAILED" ] || [ "$STATUS" = "CANCELLED" ]; then
    echo ""
    fail "Deploy Amplify falhou"
  fi
  sleep 10
done

FRONTEND_URL="https://${STAGE}.${AMPLIFY_APP_ID}.amplifyapp.com"

# ── Criar Admin Master ─────────────────────────────────────────────
step "Criando usuário Admin Master"

cd "$(dirname "$0")/../backend"

read -r -p "  E-mail do admin master: " ADMIN_EMAIL

POOL_ID="$USER_POOL_ID" \
ADMIN_EMAIL="$ADMIN_EMAIL" \
ADMINS_TABLE="AtlasAdmins-${STAGE}" \
REGION="$REGION" \
npx tsx scripts/create-admin-master.ts

# ── Resumo final ───────────────────────────────────────────────────
echo ""
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Atlas Hub — Ambiente de produção pronto!  ${NC}"
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo ""
echo "  Frontend:       $FRONTEND_URL"
echo "  API:            $API_URL"
echo "  User Pool ID:   $USER_POOL_ID"
echo "  Client ID:      $CLIENT_ID"
echo "  Amplify App ID: $AMPLIFY_APP_ID"
echo "  S3 Bucket:      $BUCKET"
echo ""
echo -e "${YELLOW}Próximos passos para o CI/CD (GitHub Actions):${NC}"
echo ""
echo "  Secrets (Settings → Secrets → Actions):"
echo "    AWS_ACCESS_KEY_ID     = <sua access key>"
echo "    AWS_SECRET_ACCESS_KEY = <sua secret key>"
echo ""
echo "  Variables (Settings → Variables → Actions):"
echo "    AWS_REGION            = $REGION"
echo "    VITE_AWS_REGION       = $REGION"
echo "    AMPLIFY_APP_ID        = $AMPLIFY_APP_ID"
echo "    ADMIN_MASTER_EMAIL    = $ADMIN_EMAIL"
echo ""
