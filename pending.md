# Atlas Hub V2 — Decisões Pendentes

## 0. Escopo travado (não reabrir sem desbloquear §2)

O MVP deste repositório é **somente** Portal Incorporadora + Painel de Curadoria. A oferta na plataforma é **manual** após `APROVADO`.

**Não implementar no Atlas até §2 estar respondido (Fase 2):**

- Portal / vitrine / dashboard do investidor no domínio Atlas
- Carteira, PIX, cotas, suitability, ranking de investidores
- Features do “Plano A” (docs históricos mai–jun/2026 em `~/Downloads/.../atlas-hub/documents`)

A ingestão admin dos webhooks de captação (`UserActiveEvent`, `InvestorCreatedEvent`, `PurchaseApprovedEvent`, `PurchaseExpiredEvent`) **já está no MVP**. Sem portal de investidor neste repo.

Referência: [`docs/SCOPE.md`](docs/SCOPE.md).

---

## 1. Contratuais / Operacionais

- [ ] **Contrato white-label** — sem isso o `x-tenant-id` não existe e aprovações não resultam em ofertas publicadas
- [ ] **Constituição da PJ** — necessária para assinar a stack white-label e operar como licenciado CVM 88
- [ ] **Domínio da plataforma** — afeta configuração do SES (precisa validar domínio para enviar e-mail)
- [ ] **Custos da infraestrutura white-label confirmados:** setup R$4.800 único + R$870/mês SaaS + 3% success fee (ou 1,5% fixo no cadastro) + ofertas privadas 0,3% a 0,5%

---

## 2. Aguardando resposta do Danillo (stack white-label) — gate da Fase 2

Estas perguntas **bloqueiam** o portal do investidor no Atlas. Enquanto não houver resposta, o investidor permanece 100% na plataforma.

- [x] **Webhooks de captação (admin)** — eventos: `UserActiveEvent`, `InvestorCreatedEvent`, `PurchaseApprovedEvent`, `PurchaseExpiredEvent`, oferta encerrada (`FINISHED_SUCCESS` / `FINISHED_UNSUCCESS`). Auth: `X-Webhook-Secret` (ou `Authorization: Bearer`) com `DIVIFY_WEBHOOK_SECRET` (≥16 chars). HMAC da plataforma ainda a confirmar se for o esquema deles.
- [x] **Fluxo financeiro Divify (Danillo 11/09)** — SmartEscrow durante a oferta; sucesso → CNPJ emissor (sem Atlas); insucesso → devolução automática; SPE por contrato Atlas/emissor; split de rendimentos automático na Divify (fluxo mensal).
- [x] **Cliente API docs-third** — enrich de compra via `GET /balance/offer/{offerId}/purchase/{id}/detailed` quando `DIVIFY_API_BASE_URL` + `DIVIFY_API_TOKEN` + `DIVIFY_TENANT_ID` estiverem setados. Endpoints de investidor (auth/KYC/carteira) **não** são chamados pelo Atlas.
- [x] **UserActive com offerId** — só conta no progresso por oferta quando o evento traz `offerId` (ou `offer.id`). Sem oferta, o evento é gravado mas não entra no KPI do projeto.
- [ ] **Endpoint de listagem de investimentos por usuário** — existe `GET /balance/purchases` ou similar?
- [ ] **Endpoint de dados de oferta por ID** — existe `GET /offers/{id}` com progresso de captação e status?
- [ ] **Endpoint de histórico de rendimentos** — existe?
- [ ] **Endpoint de perfil do usuário autenticado** — existe `GET /user/me`?
- [ ] **Benchmarks via API** — conseguem disponibilizar dados de Selic e IBOV para o dashboard comparativo?
- [ ] **Endpoint para criação de ofertas** — existe endpoint de API ou é sempre manual pelo painel?

> Impacto: sem essas respostas não é possível planejar a fase 2 (portal do investidor customizado). Se não puderem disponibilizar, a parceria segue com investidor só na plataforma e oferta manual no MVP.

---

## 3. Decisões de Produto (a confirmar com os sócios)

- [ ] **Atualizações de obra no MVP?** — Gabriel confirmou que entra, Felipe pediu explicitamente. Precisa ser confirmado formalmente para entrar no escopo de desenvolvimento *(se for só para incorporadora/admin no Atlas; visão investidor = plataforma)*
- [ ] **Visibilidade da incorporadora sobre a captação no MVP** — o **admin** já vê progresso via webhooks. A incorporadora continua vendo só o link da oferta. Confirmar se no MVP ela também vê números (hoje: não).
- [ ] **Limite mínimo de captação para iniciar a obra** — Felipe mencionou que precisamos definir um threshold. Valor ainda não definido *(regra de negócio; não exige feature de investidor no Atlas)*

---

## 4. Infraestrutura AWS (a provisionar antes do deploy)

- [x] **Bucket S3** — `atlas-hub-documents-dev` / `atlas-hub-documents-prod` (sa-east-1); PUT (upload) + GET (download via `POST /documentos/download-url`); frontend em wizard, perfil, editar
- [ ] **SES configurado** — domínio validado + templates de e-mail criados
- [ ] **SSM Parameter Store** — secrets sensíveis (ex: chaves de integração futura)
- [ ] **Conta AWS** — confirmar qual conta será usada (a mesma do Syntonia ou uma nova?)
- [ ] **Deploy alinhado ao código** — garantir DEV/PRD com viabilidade, download-url, checklist no aprovar, equipe

---

## 5. Decisões Técnicas

- [x] **Cognito: um pool com grupos** — `INCORPORADORA`, `ANALISTA`, `ADMIN_MASTER` (adotado no V2)
- [x] **Stack:** AWS Amplify + Lambda + DynamoDB + S3 + SES + Cognito + Serverless Framework (mesma linha Syntonia)
- [x] **Monorepo** — `frontend/` + `backend/` na raiz (padrão Syntonia)

---

## 6. Cartão corporativo (preparação Atlas)

- [x] **Proposta de limite por etapa** — pedido único; valor atualiza com o cronograma (auditoria `CARTAO_LIMITE_ATUALIZADO`); não reabre curadoria
- [x] **Liberação só da etapa em andamento** — incorporadora solicita, admin master confirma; teto vigente não é a soma das etapas
- [x] **Comissão Atlas** — % fixo sobre o volume captado (8% Atlas / 3% parceiro no modelo fechado); cashback 1,5% é da SPE e não entra na comissão
- [x] **Avisos à incorporadora** — pedido habilitado, liberação confirmada e recusada (in-app)
- [ ] **Conta Stark** — KYC/organization aberta e issuing habilitado
- [ ] **SPE como cliente Stark** — conta/onboarding no CNPJ da SPE; workspace Atlas não serve
- [ ] **Aditivo contratual** — sem rotativo, fatura integral automática, garantia CDI
- [ ] **NF / comprovante** por transação do cartão

