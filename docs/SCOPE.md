# Escopo MVP — Atlas Hub V2 (modelo white-label)

Documento de fronteira de produto. Spec completa: [`product.md`](../product.md). Pendências: [`pending.md`](../pending.md).

## MVP (este repositório)

| Superfície | Inclui |
|---|---|
| **Portal da Incorporadora** | Cadastro, perfil, wizard de projeto, acompanhamento de status, notificações, link da oferta quando `OFERTA_CRIADA` |
| **Painel de Curadoria (Admin)** | Fila, scorecard (5 critérios), notas internas, ajuste / reprovar / aprovar, CRM incorporadoras, usuários (master), registro manual de ID/link da oferta |

**Oferta no MVP:** criação **manual** no painel da plataforma após `APROVADO`. Sem API de criação de oferta obrigatória no Atlas.

## Fora do MVP Atlas (experiência investidor Atlas — fora deste repo)

- Landing / vitrine de ofertas para investidor
- Cadastro / KYC investidor (PF/PJ)
- Carteira, PIX, cotas, escrow, triggers CVM
- Mercado secundário, informe de rendimentos, fórum da oferta
- Distribuição de rendimentos e admin de oferta (painel da plataforma)

## Fase 2 (bloqueada)

Portal investidor customizado no domínio Atlas e sync de progresso de captação **somente** após respostas sobre webhooks/APIs da stack de investimento — ver `pending.md` §2.

**Regra:** não reabrir backlog de features de investidor do “Plano A” (docs em Downloads/.../atlas-hub/documents) neste repositório até essa seção estar desbloqueada.

## Docs históricos

Pasta local `~/Downloads/personal/projects/atlas-hub/documents` = **Plano A (plataforma completa)**. Índice: `documents/README.md` nessa pasta.
