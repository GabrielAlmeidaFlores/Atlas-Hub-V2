# Escalada Imobiliária — referências para o Atlas Hub

Fonte completa (fora deste repo):  
`~/Downloads/personal/projects/atlas-hub/repository/atlas-crm/ESCALADA_PLATFORM_ANALYSIS.md`  
Plataforma: `escalada.thiagoincorporador.com.br`

## Relação

Escalada **estrutura** o incorporador (planejamento, pesquisa, viabilidade educativa).  
Atlas Hub **cura e origina** oferta CVM 88. São complementares — não portar a Escalada inteira.

## Regra de curadoria

| Tipo | Precisa de reavaliação admin? |
|---|---|
| Altera conteúdo do projeto (dados, docs, `viabilidade` persistida) | Sim — mesma máquina de status (`RASCUNHO` / ajuste / reprovado → submeter) |
| Só UX/plataforma (docs, barra derivada, tela admin leitura) | Não |

## O que entrou no Atlas (Fase 1)

1. **Calculadora de viabilidade simplificada** no wizard/editar — inputs + outputs salvos em `projeto.viabilidade`
2. **Exibição** desses números na curadoria (aba Financeiro)
3. **Checklist/barra de progresso** do incorporador, **derivada** de documentos e campos (sem API nova de toggle)

## Fora do escopo (não portar)

Comunidade, mentorias, mapa completo de pesquisa de mercado, Business Model Canvas, SSO/curso Hotmart, stack Rails/Turbo, fluxos de investidor/PIX.

## Fase 2 (opcional, pós-MVP)

Mapa Leaflet na curadoria (localização), centros de custo para validar orçamento — só se a operação pedir.
