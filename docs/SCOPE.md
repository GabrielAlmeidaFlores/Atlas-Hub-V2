# Escopo MVP — Atlas Hub V2 (modelo white-label)

Documento de fronteira de produto. Spec completa: [`product.md`](../product.md). Pendências: [`pending.md`](../pending.md).

## MVP (este repositório)

| Superfície | Inclui |
|---|---|
| **Portal da Incorporadora** | Cadastro, perfil, wizard 5 etapas + editar, equipe, viabilidade simplificada, barra de progresso, upload/download S3, acompanhamento de status, notificações, link da oferta quando `OFERTA_CRIADA`, **cronograma da obra** (etapas + orçado; gastos após `APROVADO`/`OFERTA_CRIADA`) |
| **Painel de Curadoria (Admin)** | Fila, scorecard (5 critérios), checklist pré-aprovação (validado na API), notas internas, ajuste / reprovar / aprovar, CRM incorporadoras, usuários (master + senha temporária), registro manual de ID/link da oferta |
| **Financeiro (Admin, pós-sucesso)** | Conta tesouraria Atlas + workspace por projeto/SPE (mesmo CNPJ Atlas), saldo, extrato, Pix (solicitação + dupla aprovação de dois `ADMIN_MASTER`), split, extrato público para integração, conciliação via webhook, trilha de auditoria. **Preparação do cartão:** limite sugerido por etapa do cronograma + registro interno da solicitação. Emissão, CDI, cashback e SPE como cliente Stark **não** entram. O dinheiro da oferta **não** passa por aqui durante a captação. |
| **Captação (Admin)** | Ingestão de webhooks Divify (`UserActiveEvent`, `InvestorCreatedEvent`, `PurchaseApprovedEvent`, `PurchaseExpiredEvent`, oferta encerrada sucesso/insucesso), vínculo ao projeto via `ofertaId`, progresso por oferta, enrich opcional via API docs-third. SmartEscrow, sucesso→CNPJ emissor e split de rendimentos ficam na Divify. Sem cadastro/KYC/carteira de investidor neste repo. |
| **Analytics (Admin)** | Coleta nativa LP+app, funil Atlas, dashboard, heatmaps, jornada do usuário, segmentação, export CSV, alertas, replay (metadados/opt-in). Catálogo: [`analytics.md`](analytics.md) |
| **Cronograma (obra)** | Etapas físicas (previsto/real, %, desvio de prazo) + orçado × realizado por etapa, gastos vinculados à etapa (comprovante opcional). Execução **não** reabre curadoria. Distinto do Financeiro Stark (conta/Pix/split). |

**Oferta no MVP:** criação **manual** no painel da plataforma após `APROVADO`. Sem API de criação de oferta obrigatória no Atlas.

**Storage:** buckets `atlas-hub-documents-dev` / `atlas-hub-documents-prod` — PUT (upload) e GET (download) via URLs pré-assinadas.

**Financeiro no MVP:** integração bancária **somente no pós-sucesso**. Workspaces isolam saldo por projeto sob a organization Atlas. O CNPJ da SPE é metadado de conciliação — a chave Pix da conta é a do workspace (CNPJ Atlas). Escrow e dinheiro do investidor durante a oferta permanecem na plataforma regulada. Inclui:
- Abertura de contas (tesouraria + workspaces SPE por projeto)
- Consulta de saldos e extratos via API
- Transferências Pix com dupla aprovação
- Split (beneficiários para dividir recebíveis)
- Extrato público para integração/investidor (autenticação via token)
- Webhooks para eventos bancários (depósito, transferência, etc)
- Preparação do cartão da obra: limite = orçado da etapa; pedido interno (`SOLICITADO`) com checklist (titular SPE, fatura integral, sem rotativo, cashback na SPE). Sem emitir cartão, aplicar CDI ou creditar cashback.

**Captação no MVP:** o Atlas **não** opera a compra. Consome webhooks da Divify (`UserActiveEvent`, `InvestorCreatedEvent`, `PurchaseApprovedEvent`, `PurchaseExpiredEvent`), persiste compras/eventos e mostra progresso no admin. Aportes ficam na SmartEscrow; no sucesso o repasse vai ao CNPJ emissor sem passar pela Atlas; no insucesso a devolução é automática; split de rendimentos (incl. fluxo mensal) é automático na Divify. Portal do investidor continua 100% na plataforma. Enrich de compra via `GET /balance/offer/{offerId}/purchase/{id}/detailed` quando `DIVIFY_API_*` estiver configurado.

## Fora do MVP Atlas (experiência investidor Atlas — fora deste repo)

- Landing / vitrine de ofertas para investidor
- Cadastro / KYC investidor (PF/PJ)
- Carteira, PIX, cotas, escrow, triggers CVM **durante a captação**
- Mercado secundário, informe de rendimentos, fórum da oferta
- Distribuição de rendimentos e admin de oferta (painel da plataforma)
- Cartão corporativo colateralizado em CDI (emissão, issuing Stark, garantia e cashback)
- Abertura de conta bancária no CNPJ da SPE (gate jurídico / banco)

## Fase 2 (bloqueada)

Portal investidor customizado no domínio Atlas **somente** após respostas sobre APIs da stack de investimento — ver `pending.md` §2. A ingestão dos três webhooks de captação (admin) **já está no MVP**.

**Regra:** não reabrir backlog de features de investidor do “Plano A” (docs em Downloads/.../atlas-hub/documents) neste repositório até essa seção estar desbloqueada.

## Docs históricos

Pasta local `~/Downloads/personal/projects/atlas-hub/documents` = **Plano A (plataforma completa)**. Índice: `documents/README.md` nessa pasta.

Referência Escalada (UX/viabilidade, não clonar): [`docs/escalada-referencias.md`](escalada-referencias.md).
