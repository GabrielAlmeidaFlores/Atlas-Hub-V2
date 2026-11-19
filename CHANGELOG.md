# Changelog

Todas as mudanças planejadas e entregues do Atlas Hub V2.

Este arquivo registra planos e implementações do Atlas Hub V2. A seção `[Não lançado]` não representa código publicado em produção.

## [Não lançado] — Notificações por e-mail em cards

**Status:** implementado no working tree; pendente de commit, validação manual e deploy.
**Planejado em:** 2026-11-19
**Implementado localmente em:** 2026-11-19
**Plano completo:** [docs/implementation-plan/2026-11-19-notificacoes-email-cards.md](docs/implementation-plan/2026-11-19-notificacoes-email-cards.md)

### Resumo

Adicionar configuração por quadro para enviar e-mail quando um card for criado, movido para uma coluna específica, alterado, arquivado ou removido definitivamente. O administrador escolhe os participantes do quadro que devem receber, incluindo o criador.

A entrega cobre cards criados manualmente, leads do formulário público e qualificação pública. Cada evento tem detalhes próprios no e-mail, sem expor todos os campos do card.

A implementação local cobre criação, movimentação, alteração, arquivamento e remoção definitiva.

### Decisões principais

- Configuração salva no próprio quadro em `notificationRules`.
- Eventos: `CARD_CREATED`, `CARD_MOVED_TO_COLUMN`, `CARD_UPDATED`, `CARD_ARCHIVED` e `CARD_REMOVED`.
- Uma regra por evento; movimentação tem uma regra por coluna.
- Até 30 regras por quadro e 20 destinatários por regra.
- SLA de envio de até 60 minutos, com baseline de 200 cards por hora.
- Sem projeção de custo nesta fase.
- O e-mail usa título e descrição como base e adiciona detalhes relevantes do evento, no template padrão do Atlas.
- Reordenação dentro da mesma coluna não notifica.
- Alterações de conteúdo geram evento de alteração.
- Arquivamento e remoção definitiva são eventos distintos.
- Saída e retorno à coluna notificam novamente.
- O envio não acontece dentro da requisição de criação/movimentação.
- Arquitetura: DynamoDB Streams → dispatcher → SQS FIFO → worker → Resend.
- Worker com `batchSize: 1`, grupo FIFO único e `maximumConcurrency: 2` para processar um e-mail por vez.
- Uma mensagem por destinatário/card, com deduplicação por evento.
- Nova stack `serverless-notifications.yml`; sem fila, worker ou tabela nova no core.
- Regras protegidas por versão otimista (`notificationRulesVersion`) para evitar sobrescrita entre administradores.

### Entregas implementadas localmente

- [x] Tipos, schema e validação de regras.
- [x] Aba `Notificações` em `Configurar quadro`.
- [x] Seleção de participantes do quadro, incluindo o criador.
- [x] Regra de card criado.
- [x] Regra de card movido para coluna.
- [x] Regra de card alterado.
- [x] Regra de card arquivado.
- [x] Regra de card removido definitivamente.
- [x] Ativação e desativação de regra.
- [x] Stream da tabela `AtlasBoardItems` com imagem antiga e nova.
- [x] Dispatcher de eventos de card.
- [x] Fila SQS FIFO com DLQ.
- [x] Worker de e-mail serializado por grupo FIFO único.
- [x] Template visual padrão do Atlas com título e descrição do card.
- [x] Idempotência no SQS e no Resend.
- [x] Controle de versão otimista das regras.
- [x] Limpeza de regras ao excluir coluna ou remover membro.
- [x] Tratamento de conflito 409 no frontend.
- [x] Testes unitários.
- [ ] Roteiro manual, idempotência e teste de carga em dev.
- [ ] Deploy em dev e produção.

### Extensão implementada localmente

- [x] Adicionar `CARD_UPDATED`, `CARD_ARCHIVED` e `CARD_REMOVED` ao enum e ao schema.
- [x] Diferenciar arquivamento de remoção definitiva.
- [x] Criar operação de remoção definitiva com confirmação e permissão de gerenciamento.
- [x] Classificar `REMOVE`, arquivamento e alterações no dispatcher.
- [x] Calcular os campos alterados no evento de alteração.
- [x] Enviar coluna anterior, coluna nova, campos alterados, responsável e horário conforme o evento.
- [x] Exibir os cinco tipos na aba de configuração.
- [x] Testar alteração, arquivamento e remoção.
- [ ] Validar em dev.
- [ ] Atualizar README após o rollout.

### Arquitetura planejada

```text
AtlasBoardItems — DynamoDB Streams
        ↓
Notification Dispatcher Lambda
        ↓
SQS FIFO — uma mensagem por destinatário/card
        ↓
Email Worker Lambda — batchSize 1, maximumConcurrency 2, grupo FIFO único
        ↓
Resend
```

O fluxo de criação, movimentação, alteração, arquivamento e remoção do card não chama o Resend, não enfileira mensagens e não depende da disponibilidade do worker. O stream é a fonte durável do evento.

### Regras de comportamento

| Situação | Resultado |
|---|---|
| Card criado manualmente | Notifica criação |
| Lead público criado | Notifica criação |
| Lead público qualificado | Notifica movimentação para `Qualificado` |
| Lead duplicado | Não cria card e não notifica |
| Card movido para a coluna | Notifica |
| Card reordenado na mesma coluna | Não notifica |
| Card sai e volta para a coluna | Notifica novamente |
| Card arquivado | Notifica arquivamento |
| Card alterado em campos relevantes | Notifica alteração |
| Card removido definitivamente | Notifica remoção |
| Regra desativada | Não notifica |
| Destinatário removido | Não recebe |
| Coluna removida | Regra é limpa |

### Segurança e privacidade

- A configuração só pode ser alterada por owner/admin do quadro.
- Marketing com permissão de escrita não configura notificações.
- Destinatários precisam ser participantes atuais do quadro.
- Um e-mail é enviado separadamente para cada destinatário.
- Conteúdo dinâmico do e-mail deve ser escapado em HTML.
- Logs não devem conter corpo do e-mail, token do Resend ou payload sensível.
- A fila usa criptografia gerenciada pelo SQS.

### Documentação do plano

Convenção: cada feature tem um único arquivo em `docs/implementation-plan/`, prefixado por data no formato `YYYY-MM-DD-<slug>.md`.

- [Notificações por e-mail em cards](docs/implementation-plan/2026-11-19-notificacoes-email-cards.md)

### Fora do escopo

- Notificações internas no sino do Atlas.
- Digest ou agrupamento de e-mails.
- Destinatários externos ao quadro.
- Regras por label, responsável, template ou valor de campo.
- Controle de versão para outras configurações do quadro.
- Dashboard de entregas de e-mail.

### Próximo passo

Executar roteiro manual, teste de carga, deploy em dev/prod e atualizar o README.

### Estado da documentação existente

`docs/SCOPE.md`, este changelog e o plano refletem os cinco eventos implementados localmente. O deploy e a validação operacional ainda não foram executados.
