# Atlas Hub V2 — Decisões Pendentes

## 1. Contratuais / Operacionais

- [ ] **Contrato com a Divify** — sem isso o `x-tenant-id` não existe e aprovações não resultam em ofertas publicadas
- [ ] **Constituição da PJ** — necessária para assinar com a Divify e operar como licenciado CVM 88
- [ ] **Domínio da plataforma** — afeta configuração do SES (precisa validar domínio para enviar e-mail)
- [ ] **Custos Divify confirmados:** setup R$4.800 único + R$870/mês SaaS + 3% success fee (ou 1,5% fixo no cadastro) + ofertas privadas 0,3% a 0,5%

---

## 2. Aguardando resposta do Danillo (Divify)

- [ ] **Webhooks** — a plataforma tem suporte? Quais eventos são disparados? (investimento confirmado, KYC aprovado, rendimento distribuído, oferta encerrada)
- [ ] **Endpoint de listagem de investimentos por usuário** — existe `GET /balance/purchases` ou similar?
- [ ] **Endpoint de dados de oferta por ID** — existe `GET /offers/{id}` com progresso de captação e status?
- [ ] **Endpoint de histórico de rendimentos** — existe?
- [ ] **Endpoint de perfil do usuário autenticado** — existe `GET /user/me`?
- [ ] **Benchmarks via API** — conseguem disponibilizar dados de Selic e IBOV para o dashboard comparativo?
- [ ] **Endpoint para criação de ofertas** — existe endpoint de API ou é sempre manual pelo painel?

> Impacto: sem essas respostas não é possível planejar a fase 2 (portal do investidor customizado). Se não puderem disponibilizar, precisamos reavaliar a parceria.

---

## 3. Decisões de Produto (a confirmar com os sócios)

- [ ] **Atualizações de obra no MVP?** — Gabriel confirmou que entra, Felipe pediu explicitamente. Precisa ser confirmado formalmente para entrar no escopo de desenvolvimento
- [ ] **Visibilidade da incorporadora sobre a captação no MVP** — sem webhooks da Divify, a incorporadora não consegue ver quanto foi investido. Opções:
  - Só mostramos que a oferta está no ar com o link (mais simples)
  - Analista atualiza manualmente algum campo de progresso
  - Aguardamos resposta do Danillo antes de decidir
- [ ] **Monorepo ou repositórios separados?** — Syntonia usa monorepo (`backend/` + `frontend/` na mesma raiz). Manter o mesmo padrão?
- [ ] **Limite mínimo de captação para iniciar a obra** — Felipe mencionou que precisamos definir um threshold. Valor ainda não definido

---

## 4. Infraestrutura AWS (a provisionar antes do deploy)

- [ ] **Bucket S3** — para uploads de documentos, fotos de projeto e atualizações de obra
- [ ] **SES configurado** — domínio validado + templates de e-mail criados
- [ ] **SSM Parameter Store** — secrets sensíveis (ex: chaves de integração futura)
- [ ] **Conta AWS** — confirmar qual conta será usada (a mesma do Syntonia ou uma nova?)

---

## 5. Decisões Técnicas

- [ ] **Cognito: dois pools separados ou um pool com grupos?**
  - Opção A: dois pools (incorporadoras e admins) — mais isolado, mais seguro
  - Opção B: um pool com grupos (`INCORPORADORA`, `ANALISTA`, `ADMIN_MASTER`) — mais simples
- [ ] **Stack confirmada:** AWS Amplify + Lambda + DynamoDB + S3 + SES + Cognito + Serverless Framework (mesma do Syntonia)
