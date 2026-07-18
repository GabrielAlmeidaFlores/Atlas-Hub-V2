# Escopo MVP — Atlas Hub V2 (modelo Divify)

Documento de fronteira de produto. Spec completa: [`product.md`](../product.md). Pendências: [`pending.md`](../pending.md).

## MVP (este repositório)

| Superfície | Inclui |
|---|---|
| **Portal da Incorporadora** | Cadastro, perfil, wizard de projeto, acompanhamento de status, notificações, link da oferta quando `OFERTA_CRIADA` |
| **Painel de Curadoria (Admin)** | Fila, scorecard (5 critérios), notas internas, ajuste / reprovar / aprovar, CRM incorporadoras, usuários (master), registro manual de ID/link Divify |

**Oferta Divify no MVP:** criação **manual** no painel Divify após `APROVADO`. Sem API de criação de oferta obrigatória no Atlas.

## Fora do MVP Atlas (Divify entrega agora)

- Landing / vitrine de ofertas para investidor
- Cadastro / KYC investidor (PF/PJ)
- Carteira, PIX, cotas, escrow, triggers CVM
- Mercado secundário, informe de rendimentos, fórum da oferta
- Distribuição de rendimentos e admin de oferta (painel Divify)

## Fase 2 (bloqueada)

Portal investidor customizado no domínio Atlas e sync de progresso de captação **somente** após respostas sobre webhooks/APIs Divify — ver `pending.md` §2.

**Regra:** não reabrir backlog de features de investidor do “Plano A” (docs em Downloads/.../atlas-hub/documents) neste repositório até essa seção estar desbloqueada.

## Docs históricos

Pasta local `~/Downloads/personal/projects/atlas-hub/documents` = **Plano A pré-Divify**. Índice: `documents/README.md` nessa pasta.
