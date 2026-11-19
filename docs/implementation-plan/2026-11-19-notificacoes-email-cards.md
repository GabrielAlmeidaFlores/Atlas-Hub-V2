# 2026-11-19 — Notificações por e-mail em cards

**Status:** implementado localmente; pendente de commit, validação manual e deploy.
**Feature:** notificações configuráveis por quadro para criação, movimentação, alteração, arquivamento e remoção de cards.
**Changelog:** [`CHANGELOG.md`](../../CHANGELOG.md).
**Validação local:** `npm run build` e `npm test` no backend; `npm run build` no frontend; deploy não executado.

## 1. Objetivo

Permitir que owner/admin de um quadro configure regras para enviar e-mail quando:

- um card for criado;
- um card for movido para uma coluna específica;
- um card for alterado em campos relevantes;
- um card for arquivado;
- um card for removido definitivamente.

O administrador escolhe os destinatários entre os participantes do quadro, incluindo o criador. O envio não pode bloquear a operação do card, não pode disparar em massa e não pode duplicar mensagens em retries.

Cada tipo de evento deve ter um e-mail com os detalhes relevantes daquele evento. Título e descrição do card continuam sendo o conteúdo principal; informações específicas como coluna anterior, coluna nova, campos alterados, responsável e horário entram apenas quando fizerem sentido para o evento.

## 2. Decisões fechadas

| Tema | Decisão |
|---|---|
| Configuração | Por quadro, salva em `notificationRules` |
| Eventos | `CARD_CREATED`, `CARD_MOVED_TO_COLUMN`, `CARD_UPDATED`, `CARD_ARCHIVED` e `CARD_REMOVED` |
| Regras | Uma regra por evento; movimentação tem uma regra por coluna |
| Destinatários | Participantes atuais, incluindo o criador |
| Lead público | Criação de lead pelo site também dispara |
| Qualificação pública | Dispara ao mover para a coluna de qualificados |
| Arquivamento | Card arquivado gera e-mail específico, sem tratar como remoção |
| Remoção | Exclusão definitiva gera e-mail específico, com confirmação explícita |
| Alteração | Mudanças em título, descrição, template, campos, labels ou responsáveis geram e-mail; reordenação não gera |
| Reentrada | Saiu e voltou para a coluna: dispara novamente |
| Reordenação | Mesma coluna: não dispara |
| Arquitetura | DynamoDB Streams → dispatcher → SQS FIFO → worker → Resend |
| Concorrência de envio | FIFO com grupo único, `batchSize: 1` e `maximumConcurrency: 2` |
| Concorrência de configuração | Versão otimista em `notificationRulesVersion` |
| Idempotência | `MessageDeduplicationId` + `Idempotency-Key` do Resend |
| Stack | Nova stack `serverless-notifications.yml`; sem fila no core |
| SLA | Até 60 minutos após a persistência do card, com baseline de 200 cards por hora |
| Conteúdo do e-mail | Título e descrição como base, com detalhes específicos do evento, em template padrão do Atlas |
| Permissão | Configuração somente para owner/admin do quadro |

## 3. Requisitos

### 3.1 Funcionais

- **RF-01:** cada quadro tem sua própria lista de regras.
- **RF-02:** uma regra `CARD_CREATED` dispara quando um card é criado em qualquer coluna.
- **RF-03:** uma regra `CARD_MOVED_TO_COLUMN` dispara somente ao entrar na coluna configurada.
- **RF-04:** uma regra `CARD_UPDATED` dispara quando campos relevantes do card mudam.
- **RF-05:** uma regra `CARD_ARCHIVED` dispara quando o card é arquivado.
- **RF-06:** uma regra `CARD_REMOVED` dispara quando o card é excluído definitivamente.
- **RF-07:** cada evento tem no máximo uma regra por quadro; movimentação tem uma regra por coluna.
- **RF-08:** destinatários são escolhidos entre participantes; o criador também pode ser selecionado.
- **RF-09:** cada regra pode ser ativada ou desativada.
- **RF-10:** lead criado pelo site dispara `CARD_CREATED`.
- **RF-11:** qualificação pública dispara `CARD_MOVED_TO_COLUMN` ao mover o lead.
- **RF-12:** sair e voltar para a coluna dispara `CARD_MOVED_TO_COLUMN` novamente.
- **RF-13:** reordenar dentro da mesma coluna não dispara `CARD_UPDATED` nem `CARD_MOVED_TO_COLUMN`.
- **RF-14:** retries não podem duplicar o e-mail.
- **RF-15:** e-mails de vários destinatários são processados um por vez.
- **RF-16:** cada e-mail contém título e descrição do card e os detalhes relevantes do evento.
- **RF-17:** dois administradores não sobrescrevem as regras silenciosamente.
- **RF-18:** exclusão de coluna ou remoção de membro limpa regras relacionadas.

### 3.2 Detalhes por evento

| Evento | Detalhes no e-mail |
|---|---|
| `CARD_CREATED` | Título, descrição, coluna de destino, responsável pela criação, data/hora |
| `CARD_MOVED_TO_COLUMN` | Título, descrição, coluna anterior, coluna nova, responsável pela movimentação, data/hora |
| `CARD_UPDATED` | Título e descrição atuais, labels dos campos alterados, responsável, data/hora. Não enviar todos os valores de campos personalizados |
| `CARD_ARCHIVED` | Título, descrição, coluna anterior, responsável pelo arquivamento, data/hora |
| `CARD_REMOVED` | Título, descrição, coluna anterior, responsável pela remoção, data/hora |

O e-mail não deve expor telefone, e-mail do lead, UTMs, respostas de qualificação ou o conteúdo completo de campos personalizados. Quando título ou descrição forem alterados, o novo valor pode ser exibido.

### 3.3 Não funcionais

- O envio não faz parte da transação de criação, movimentação, alteração, arquivamento ou remoção.
- Falha do Resend não desfaz a operação do card.
- Falha do dispatcher é reprocessada pelo stream.
- Falha do worker é reprocessada pela fila; após o limite, vai para DLQ.
- A configuração é validada na API, não apenas na interface.
- Logs não expõem corpo de e-mail, token ou payload sensível.
- Funciona em `dev` e `prod` com configurações separadas.
- Nenhum recurso novo no core além do stream da tabela.
- O e-mail deve ser enviado em até 60 minutos após a persistência do evento, no cenário de 200 cards por hora.
- Não há projeção de custo nesta fase.

### 3.4 Critérios de aceite

- [ ] Owner/admin acessa `Configurar → Notificações`.
- [ ] Cria regra de criação.
- [ ] Cria regra de movimentação por coluna.
- [ ] Cria regra de alteração.
- [ ] Cria regra de arquivamento.
- [ ] Cria regra de remoção.
- [ ] Configuração inválida retorna erro no backend.
- [ ] Marketing `write` não vê nem altera a aba.
- [ ] Card criado manualmente gera e-mail.
- [ ] Lead público criado gera e-mail.
- [ ] Movimentação para a coluna gera e-mail.
- [ ] Qualificação pública gera e-mail.
- [ ] Alteração de título, descrição, template, campo, label ou responsável gera e-mail.
- [ ] Reordenação não gera.
- [ ] Arquivamento gera e-mail de arquivamento, não de alteração.
- [ ] Remoção definitiva gera e-mail de remoção, não de arquivamento.
- [ ] Reentrada gera novo e-mail de movimentação.
- [ ] Vários destinatários são processados um por vez.
- [ ] Retry não duplica e-mail.
- [ ] Conflito de versão retorna 409 e a UI recarrega.
- [ ] Nenhum e-mail é enviado durante a requisição do card.
- [ ] O e-mail usa o template visual padrão do Atlas.
- [ ] Com 200 cards por hora, o e-mail é entregue em até 60 minutos.

### 3.5 Semântica e casos de borda

| Caso | Comportamento |
|---|---|
| Card criado manualmente | Dispara `CARD_CREATED` |
| Lead criado pelo site | Dispara `CARD_CREATED` |
| Lead duplicado | Não cria card e não dispara |
| Card movido para a coluna | Dispara `CARD_MOVED_TO_COLUMN` |
| Card reordenado na mesma coluna | Não dispara |
| Card sai e volta para a coluna | Dispara novamente |
| Card criado diretamente na coluna | Dispara apenas criação |
| Qualificação atualiza campos e move | Dispara apenas movimentação |
| Título/descrição/template/campos/labels/responsáveis alterados | Dispara `CARD_UPDATED` |
| Apenas `position` alterada | Não dispara |
| Card arquivado | Dispara `CARD_ARCHIVED` |
| Card excluído definitivamente | Dispara `CARD_REMOVED` |
| Card já arquivado é excluído definitivamente | Dispara `CARD_REMOVED` |
| Regra desativada | Não dispara |
| Regra sem destinatários | Não pode ser salva |
| Destinatário removido antes do processamento | Não entra na fila |
| Coluna removida | Regra é limpa; dispatcher ignora referência inválida |

### 3.6 Fora do escopo

- Notificações no sino do Atlas.
- Digest ou agrupamento.
- Destinatários externos ao quadro.
- Regras por label, responsável, template ou valor de campo.
- Regras para comentários.
- Controle de versão de outras configurações do quadro.
- Dashboard de entregas de e-mail.
- Recuperação de card removido definitivamente.

## 4. Arquitetura

```text
AtlasBoardItems — DynamoDB Streams (NEW_AND_OLD_IMAGES)
        ↓
Notification Dispatcher Lambda
        ↓
SQS FIFO + DLQ
        ↓
Email Worker Lambda — batchSize 1, maximumConcurrency 2
        ↓
Resend
```

### 4.1 Por que stream

- O handler de card não carrega regras, não acessa SQS e não chama Resend.
- O fluxo público de leads grava em `AtlasBoardItems`; o stream cobre admin e site.
- Se o dispatcher falhar, o stream mantém o registro e reprocessa.
- O stream fornece um `eventID` estável para idempotência.
- A fila absorve picos e o worker serializa os envios.

### 4.2 Componentes

**DynamoDB Stream**

- tabela `AtlasBoardItems`;
- `StreamViewType: NEW_AND_OLD_IMAGES`;
- output `BoardItemsStreamArn` no core;
- sem tabela nova.

**Notification Dispatcher**

- Lambda na stack de notificações;
- timeout 30s;
- `batchSize: 10`;
- `bisectBatchOnFunctionError: true`;
- `maximumRetryAttempts: 10`;
- lê stream, classifica card, carrega quadro, resolve regras e destinatários, envia mensagens.

**SQS FIFO**

- fila `atlas-hub-board-notifications-{stage}.fifo`;
- DLQ `atlas-hub-board-notifications-dlq-{stage}.fifo`;
- `FifoQueue: true`;
- `ContentBasedDeduplication: false`;
- `VisibilityTimeout: 60`;
- retenção 14 dias;
- SSE gerenciado pelo SQS;
- redrive para DLQ com `maxReceiveCount: 5`;
- a DLQ também precisa ter `FifoQueue: true`;
- `MessageGroupId = board-notifications` (grupo único da fila);
- `MessageDeduplicationId = sha256(streamEventId + "|" + recipientEmail)`.

**Email Worker**

- Lambda na stack de notificações;
- `batchSize: 1`;
- `maximumConcurrency: 2` no event source;
- timeout 20s;
- grupo FIFO único para serializar um e-mail por vez;
- sem acesso a DynamoDB;
- valida payload, renderiza template, envia com idempotência, remove mensagem ou lança erro.

**Resend**

- `sendEmail` recebe `idempotencyKey` opcional;
- header `Idempotency-Key`;
- janela de idempotência de 24h;
- retries do SQS dentro da janela não duplicam.

### 4.3 Classificação do evento

O dispatcher classificará cada registro do stream nesta ordem:

Criação:

```text
eventName = INSERT
itemKey começa com CARD#
newImage.archivedAt ausente
→ CARD_CREATED
```

Arquivamento:

```text
eventName = MODIFY
itemKey começa com CARD#
oldImage.archivedAt ausente
newImage.archivedAt presente
→ CARD_ARCHIVED
```

Movimentação:

```text
eventName = MODIFY
itemKey começa com CARD#
oldImage.columnId != newImage.columnId
arquivamento não detectado
→ CARD_MOVED_TO_COLUMN
```

Alteração:

```text
eventName = MODIFY
itemKey começa com CARD#
oldImage.columnId == newImage.columnId
arquivamento não detectado
mudança em title, description, templateId, fieldValues, labelIds ou assigneeEmails
→ CARD_UPDATED
```

Remoção definitiva:

```text
eventName = REMOVE
itemKey começa com CARD#
→ CARD_REMOVED
```

Ignorados:

- `COLUMN#`, `LABEL#`, `TEMPLATE#`;
- `MODIFY` apenas de `position`;
- `MODIFY` apenas de `updatedAt`, `updatedBy` ou `history` sem mudança de conteúdo;
- eventos sem transição de estado relevante.

Uma movimentação não gera `CARD_UPDATED`. Um arquivamento não gera `CARD_UPDATED`. Uma remoção não gera `CARD_ARCHIVED`.

### 4.3.1 Arquivar versus remover

O fluxo atual de `DELETE /admin/boards/{boardId}/cards/{cardId}` arquiva o card. Para que existam os dois eventos distintos, o plano prevê:

- **Arquivar:** mantém o item no DynamoDB com `archivedAt`; gera `CARD_ARCHIVED`.
- **Remover definitivamente:** nova operação explícita, restrita a owner/admin, com confirmação, que apaga o item do DynamoDB; gera `CARD_REMOVED`.

A rota prevista para remoção definitiva é:

```http
DELETE /admin/boards/{boardId}/cards/{cardId}/permanent
```

Sem essa nova operação, o evento `CARD_REMOVED` não existe no fluxo atual.

### 4.4 Resolução do quadro

O dispatcher lê `AtlasBoards` e `AtlasBoardItems` para obter:

- `notificationRules`;
- nome do quadro;
- nomes das colunas;
- criador e membros atuais.

Permissões: somente leitura nas tabelas e envio para a fila.

### 4.5 Regras e destinatários

1. Filtrar regras `enabled: true`.
2. Selecionar a regra correspondente ao evento classificado.
3. Para movimentação, exigir que `rule.columnId` seja a coluna de destino.
4. Coletar e-mails das regras correspondentes.
5. Normalizar e remover duplicados.
6. Manter somente criador e membros atuais.
7. Limitar a 20 destinatários por disparo.
8. Gerar uma mensagem por destinatário.

Eventos sem coluna usam a regra global do evento. `CARD_MOVED_TO_COLUMN` é o único evento com regra por coluna.

Sem regra ou destinatário válido, nenhuma mensagem é enfileirada.

### 4.6 Dados do e-mail

Título e descrição são a base de todos os eventos. Os detalhes específicos são:

- `CARD_CREATED`: coluna de destino, responsável e data/hora;
- `CARD_MOVED_TO_COLUMN`: coluna anterior, coluna nova, responsável e data/hora;
- `CARD_UPDATED`: labels dos campos alterados, responsável e data/hora;
- `CARD_ARCHIVED`: coluna anterior, responsável e data/hora;
- `CARD_REMOVED`: coluna anterior, responsável e data/hora.

Não enviar:

- telefone;
- e-mail do lead;
- UTMs;
- respostas de qualificação;
- valores completos de campos personalizados;
- labels de classificação do card;
- qualquer campo não relacionado ao evento.

Para `CARD_UPDATED`, o dispatcher compara as imagens antiga e nova e envia apenas os nomes dos campos alterados. Se o título ou a descrição mudarem, o novo valor é exibido. Campos personalizados aparecem apenas pelo label, não pelo valor completo.

### 4.7 Template

Assuntos:

```text
Novo card em {quadro}: {título}
Card movido para {coluna} em {quadro}
Card alterado em {quadro}: {título}
Card arquivado em {quadro}: {título}
Card removido em {quadro}: {título}
```

O corpo deve seguir o template visual padrão do Atlas e exibir:

- título;
- descrição, quando existir;
- bloco específico do evento;
- responsável;
- data/hora;
- botão `Abrir quadro`.

O template base existente (logo, navy, dourado, tipografia e rodapé) deve ser reutilizado. O bloco específico do evento é renderizado de forma condicional; descrição vazia deve ser omitida.

Link:

```text
{APP_URL}/admin/boards/{boardId}
```

### 4.8 Idempotência e retry

- o mesmo `eventID` gera o mesmo `notificationId`;
- FIFO deduplica por 5 minutos;
- Resend deduplica por 24 horas;
- worker lança erro para falhas transitórias;
- após 5 recebimentos, a mensagem vai para DLQ;
- replay manual da DLQ deve considerar a janela de 24h do Resend;
- saída e retorno do card geram novo `eventID` e novo e-mail.

### 4.9 Disparo em massa

O worker:

- recebe uma mensagem por execução;
- usa `maximumConcurrency: 2` no event source;
- usa um único `MessageGroupId`, o que mantém apenas uma mensagem em processamento por vez;
- envia um único e-mail por execução;
- busca a próxima mensagem somente após concluir.

Um card com 20 destinatários gera 20 mensagens, processadas sequencialmente.

A conta AWS não permite reservar `reservedConcurrency: 1` porque a concorrência não reservada ficaria abaixo do mínimo de 10. A serialização é garantida pelo grupo FIFO único; `maximumConcurrency: 2` limita os pollers sem reservar concorrência da conta.

### 4.10 Nova stack e impacto

Criar `backend/serverless-notifications.yml` com:

- SQS FIFO;
- DLQ;
- dispatcher;
- worker;
- roles;
- event source mappings.

Core:

- apenas `StreamSpecification`;
- output do stream;
- nenhuma fila, Lambda ou tabela nova.

Analytics: sem mudança de recursos.

### 4.11 Ordem de deploy

1. Core com stream e output.
2. Stack de notificações.
3. Analytics.
4. Frontend.

O stream retém eventos por 24h. Eventos gerados entre o deploy do core e o deploy das notificações ficam pendentes.

### 4.12 Alternativas descartadas

- **Enfileirar no handler:** adiciona latência e pode perder evento se o SQS falhar após salvar o card.
- **Enviar e-mail no handler:** acopla card ao Resend e não controla volume.
- **Fila sem stream:** exigiria outbox ou publicação no request.
- **Um e-mail com todos:** expõe os e-mails dos participantes.

## 5. Modelo de dados e API

### 5.1 Board

```ts
interface Board {
  notificationRules?: readonly BoardNotificationRule[];
  notificationRulesVersion?: number;
}

interface BoardNotificationRule {
  id: string;
  event: "CARD_CREATED" | "CARD_MOVED_TO_COLUMN" | "CARD_UPDATED" | "CARD_ARCHIVED" | "CARD_REMOVED";
  columnId?: string;
  recipientEmails: string[];
  enabled: boolean;
}
```

`notificationRulesVersion` ausente equivale a `0`.

### 5.2 Regras de unicidade

- uma regra `CARD_CREATED` por quadro;
- uma regra `CARD_UPDATED` por quadro;
- uma regra `CARD_ARCHIVED` por quadro;
- uma regra `CARD_REMOVED` por quadro;
- uma regra `CARD_MOVED_TO_COLUMN` por coluna;
- IDs únicos;
- e-mails normalizados e sem duplicatas.

### 5.3 Limites

- 30 regras por quadro;
- 20 destinatários por regra;
- 64 KB de configuração;
- `columnId` deve existir;
- destinatário deve ser criador ou membro atual.

### 5.4 API

Rota existente:

```http
PUT /admin/boards/{boardId}
```

Payload de regras:

```json
{
  "notificationRules": [
    {
      "id": "1ba2f0e5-50d8-4648-8e2e-3b1fe7f0b1a1",
      "event": "CARD_CREATED",
      "recipientEmails": [
        "admin@atlascomp.com.br",
        "comercial@atlascomp.com.br"
      ],
      "enabled": true
    },
    {
      "id": "65d8fcb0-a4a7-48e9-9a7a-3ed9c54a9bf2",
      "event": "CARD_MOVED_TO_COLUMN",
      "columnId": "6ed7f9b4-7c66-4f6e-a010-8f34d117db9d",
      "recipientEmails": [
        "comercial@atlascomp.com.br"
      ],
      "enabled": true
    },
    {
      "id": "e0c2c2a0-8e70-4f5d-9b8f-8d2f25f9e2a1",
      "event": "CARD_UPDATED",
      "recipientEmails": ["comercial@atlascomp.com.br"],
      "enabled": true
    },
    {
      "id": "f55cf0ab-60ef-4f61-9f4b-3c2a2f1b1e31",
      "event": "CARD_ARCHIVED",
      "recipientEmails": ["comercial@atlascomp.com.br"],
      "enabled": true
    },
    {
      "id": "4a0f3a0e-4d9c-4f8e-9c6c-8a9e4f7b2d12",
      "event": "CARD_REMOVED",
      "recipientEmails": ["comercial@atlascomp.com.br"],
      "enabled": true
    }
  ],
  "expectedNotificationRulesVersion": 3
}
```

Resposta, mantendo o envelope atual da rota:

```json
{
  "board": {
    "notificationRules": [],
    "notificationRulesVersion": 4
  }
}
```

O frontend já consome `response.board` em `boardsApi.update`; não alterar o envelope.

Validações:

- os dois campos são enviados juntos;
- um sem o outro retorna `400`;
- `notificationRules` não mistura com campos gerais;
- versão é inteiro maior ou igual a zero;
- movimentação exige coluna;
- criação, alteração, arquivamento e remoção não aceitam coluna;
- lista de destinatários não pode ser vazia;
- `enabled` é obrigatório;
- lista vazia remove todas as regras.

### 5.5 Schema Zod

```ts
const boardNotificationRuleSchema = z.object({
  id: z.string().uuid(),
  event: z.enum(["CARD_CREATED", "CARD_MOVED_TO_COLUMN", "CARD_UPDATED", "CARD_ARCHIVED", "CARD_REMOVED"]),
  columnId: z.string().uuid().optional(),
  recipientEmails: z
    .array(z.string().trim().toLowerCase().email().max(254))
    .min(1)
    .max(20),
  enabled: z.boolean(),
}).strict().superRefine((rule, ctx) => {
  if (rule.event === "CARD_MOVED_TO_COLUMN" && rule.columnId === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["columnId"],
      message: "Informe a coluna da regra",
    });
  }
  if (rule.event !== "CARD_MOVED_TO_COLUMN" && rule.columnId !== undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["columnId"],
      message: "Somente regras de movimentação aceitam coluna",
    });
  }
});
```

### 5.6 Mensagem da fila

```json
{
  "schemaVersion": 1,
  "notificationId": "sha256-do-evento-e-destinatario",
  "event": "CARD_UPDATED",
  "boardId": "ed0ddd27-086e-4c09-8efa-4da53bad2c25",
  "boardName": "Leads",
  "cardId": "3d6abdc4-8f6a-4f61-b6ec-2f7f1d9c7b5c",
  "cardTitle": "Rodrigo Fracari",
  "cardDescription": "Lead interessado em captação para incorporação.",
  "columnId": "6ed7f9b4-7c66-4f6e-a010-8f34d117db9d",
  "columnName": "Qualificado",
  "recipientEmail": "comercial@atlascomp.com.br",
  "actorLabel": "Admin Master",
  "occurredAt": "2026-11-19T18:00:00.000Z",
  "changedFields": ["Título", "Descrição"]
}
```

Campos específicos:

- `fromColumnName` e `toColumnName` em movimentação;
- `fromColumnName` em arquivamento e remoção;
- `changedFields` em alteração;
- `actorLabel` e `occurredAt` em todos os eventos.

```text
MessageGroupId         = board-notifications
MessageDeduplicationId = sha256(streamEventId + "|" + recipientEmail)
Idempotency-Key        = mesmo valor
```

### 5.7 Migração

- `notificationRules` ausente significa nenhuma regra.
- `notificationRulesVersion` ausente significa `0`.
- primeiro salvamento cria versão `1`.
- novos quadros podem ser criados com versão `0`.
- sem migração obrigatória.

## 6. Backend

### 6.1 Arquivos

Core:

- `backend/src/shared/board/types.ts`
- `backend/src/shared/board/validation.ts`
- `backend/src/shared/board/service.ts`
- `backend/src/shared/board/repository.ts`
- `backend/src/shared/board/dynamo-repository.ts`
- `backend/src/shared/board/testing/memory-repository.ts`
- `backend/src/functions/admin-boards.ts`
- `backend/serverless.yml`
- `backend/package.json`
- `backend/package-lock.json`

Stack de notificações:

- `backend/serverless-notifications.yml`
- `backend/src/functions/board-notification-dispatcher.ts`
- `backend/src/functions/board-notification-worker.ts`
- `backend/src/shared/board/notification-event.ts`
- `backend/src/shared/board/notification-message.ts`
- `backend/src/shared/board/notification-recipients.ts`

E-mail:

- `backend/src/shared/email/index.ts`
- `backend/src/shared/email/templates/notificacao-card.html`

Workflows:

- `.github/workflows/deploy-dev.yml`
- `.github/workflows/deploy-prod.yml`

### 6.2 Tipos e schema

Adicionar `BoardNotificationRule`, `notificationRules` e `notificationRulesVersion` ao board.

O enum de eventos deve incluir:

```ts
type BoardNotificationEvent =
  | "CARD_CREATED"
  | "CARD_MOVED_TO_COLUMN"
  | "CARD_UPDATED"
  | "CARD_ARCHIVED"
  | "CARD_REMOVED";
```

No schema:

- `boardNotificationRuleSchema`;
- `notificationRules`;
- `expectedNotificationRulesVersion`;
- exigir os dois juntos;
- bloquear mistura com campos gerais;
- manter `.strict()`;
- atualizar o `refine` de “ao menos um campo”.

Validação de colunas e participantes fica no service, pois depende do quadro atual.

### 6.3 Service

Em `BoardService.updateBoard`:

1. se houver regras, carregar itens;
2. validar colunas;
3. validar participantes;
4. validar unicidade;
5. validar limites;
6. chamar atualização condicional;
7. em conflito, lançar `BoardConflictError`.

Método auxiliar:

```ts
private validateNotificationRules(
  board: Board,
  items: readonly BoardItemRecord[],
  rules: readonly BoardNotificationRule[],
): BoardNotificationRule[]
```

Responsabilidades:

- normalizar e-mails;
- remover duplicados;
- ordenar regras;
- verificar colunas;
- verificar criador/membros;
- limitar quantidades;
- rejeitar IDs repetidos;
- rejeitar evento/coluna duplicado.

### 6.3.1 Remoção definitiva

Adicionar uma operação explícita de remoção definitiva:

```http
DELETE /admin/boards/{boardId}/cards/{cardId}/permanent
```

Regras:

- exigir permissão `manage` no quadro;
- exigir confirmação explícita na UI;
- localizar o card e apagar o item de `AtlasBoardItems`;
- não usar `archivedAt`;
- gerar `REMOVE` no stream e, consequentemente, `CARD_REMOVED`;
- manter o `DELETE` atual como arquivamento.

O service deve expor `deleteCardPermanent`; o repositório já possui `deleteItem`, mas a operação precisa validar o card, o quadro e a permissão antes de apagar. Não deve existir restauração automática.

### 6.4 Limpeza

**Excluir coluna:**

- após excluir, remover regras da coluna;
- salvar com versão lida;
- em conflito, recarregar e repetir até 3 vezes;
- se falhar, registrar log;
- dispatcher ignora coluna inexistente.

**Remover membro:**

- remover e-mail das regras;
- remover regras sem destinatários;
- salvar versão;
- repetir em conflito.

### 6.5 Repositório

Novo contrato:

```ts
updateBoardNotificationRules(
  boardId: string,
  rules: readonly BoardNotificationRule[],
  expectedVersion: number,
  updatedAt: string,
): Promise<Board | null>;
```

DynamoDB:

```text
SET notificationRules = :rules,
    notificationRulesVersion = :nextVersion,
    updatedAt = :updatedAt
```

`nextVersion = expectedVersion + 1`.

Condição para expected maior que zero:

```text
attribute_exists(boardId)
AND notificationRulesVersion = :expectedVersion
```

Condição para expected zero:

```text
attribute_exists(boardId)
AND (
  attribute_not_exists(notificationRulesVersion)
  OR notificationRulesVersion = :expectedVersion
)
```

A condição de zero aceita tanto quadro antigo sem versão quanto quadro novo que tenha sido criado com versão `0`.

`null` significa conflito; o service já chamou `requireBoard`.

Memória: mesma checagem e atualização de versão.

### 6.6 Stream no core

```yaml
StreamSpecification:
  StreamViewType: NEW_AND_OLD_IMAGES
```

Output:

```yaml
BoardItemsStreamArn:
  Value: !GetAtt AtlasBoardItemsTable.StreamArn
  Export:
    Name: atlas-hub-board-items-stream-arn-${self:provider.stage}
```

Sem fila, Lambda ou SQS no core.

### 6.7 Stack de notificações

Configuração:

- `service: atlas-hub-notifications`;
- `serverless-esbuild`;
- tags do projeto;
- variáveis `RESEND_API_KEY`, `EMAIL_FROM`, `APP_URL`;
- `BOARDS_TABLE`, `BOARD_ITEMS_TABLE`;
- `BOARD_NOTIFICATION_QUEUE_URL` no dispatcher, vindo de `!Ref BoardNotificationQueue`;
- stream ARN do core.

Recursos:

- fila + DLQ;
- role do dispatcher;
- dispatcher;
- role do worker;
- worker;
- event source mapping do stream;
- event source mapping da fila;
- log groups.

Dispatcher:

```yaml
events:
  - stream:
      type: dynamodb
      arn: ${cf:atlas-hub-backend-${self:provider.stage}.BoardItemsStreamArn}
      batchSize: 10
      bisectBatchOnFunctionError: true
      maximumRetryAttempts: 10
```

Permissões:

- `dynamodb:DescribeStream`, `GetRecords`, `GetShardIterator`, `ListStreams`;
- `dynamodb:GetItem`, `Query` em boards e itens;
- `sqs:SendMessage`.

Worker:

```yaml
events:
  - sqs:
      arn: !GetAtt BoardNotificationQueue.Arn
      batchSize: 1
```

Permissões:

- `sqs:ReceiveMessage`, `DeleteMessage`, `ChangeMessageVisibility`, `GetQueueAttributes`;
- sem DynamoDB.

Não é necessária `QueuePolicy` para o cenário atual, pois dispatcher e worker estão na mesma conta e usam roles IAM. Se a fila passar a receber produtores de outra conta, uma policy explícita será obrigatória.

### 6.8 Dispatcher

Para cada record:

1. desmontar `NewImage` e `OldImage` com `unmarshall` quando existirem;
2. ignorar item que não seja `CARD#`;
3. classificar o evento na ordem: remoção, arquivamento, movimentação, alteração, criação;
4. carregar quadro e template quando necessário;
5. obter regras e nomes de colunas;
6. coletar destinatários;
7. deduplicar;
8. enfileirar uma mensagem por destinatário com os detalhes do evento;
9. falhar o lote se o envio falhar para o stream reprocessar.

Campos de detalhe:

- `CARD_CREATED`: coluna de destino;
- `CARD_MOVED_TO_COLUMN`: coluna anterior e coluna nova;
- `CARD_UPDATED`: labels dos campos alterados;
- `CARD_ARCHIVED`: coluna anterior;
- `CARD_REMOVED`: coluna anterior.

Para `CARD_UPDATED`, comparar `title`, `description`, `templateId`, `fieldValues`, `labelIds` e `assigneeEmails`. Ignorar `position`, `updatedAt`, `updatedBy` e `history` quando forem a única diferença. Para campos do template, traduzir a chave para o label usando o template do quadro.

IDs:

```ts
const notificationId = sha256(`${record.eventID}|${recipientEmail}`);
```

Envio em blocos de até 10 com `SendMessageBatch` FIFO, incluindo `MessageGroupId` e `MessageDeduplicationId`.

### 6.9 Worker

1. ler mensagem;
2. validar schema;
3. validar e-mail;
4. renderizar;
5. enviar com idempotência;
6. confirmar.

Erros:

- 429, 5xx e falha de rede: lançar para retry;
- 409 `concurrent_idempotent_requests`: lançar para retry;
- 409 `invalid_idempotent_request`: tratar como permanente, logar e descartar;
- 400/422 permanentes: logar e descartar ou enviar para DLQ operacional;
- payload inválido ou schema desconhecido: descartar para não travar a fila.

Não logar corpo completo nem e-mail do destinatário.

### 6.10 E-mail

Adicionar:

- `idempotencyKey?: string` em `EmailParams`;
- header `Idempotency-Key`;
- `emailBoardCardNotification`.

Assinatura sugerida:

```ts
emailBoardCardNotification({
  to,
  boardName,
  cardTitle,
  cardDescription,
  event,
  actorLabel,
  occurredAt,
  fromColumnName,
  toColumnName,
  changedFields,
  boardUrl,
  idempotencyKey,
})
```

O template deve:

- usar título e descrição como conteúdo base;
- omitir descrição vazia;
- renderizar o bloco específico do evento;
- exibir responsável e data/hora;
- escapar HTML;
- preservar quebras de linha da descrição com `<br>` ou `white-space: pre-line` após o escape;
- remover quebras do assunto;
- seguir o template base do Atlas;
- usar `APP_URL` no botão.

Exibir `fromColumnName` e `toColumnName` em movimentação, `fromColumnName` em arquivamento/remoção e `changedFields` em alteração. Não renderizar valores de campos personalizados.

### 6.11 Observabilidade

Logs do dispatcher:

- eventID;
- boardId;
- cardId;
- tipo;
- quantidade enfileirada;
- erro sem payload.

Logs do worker:

- notificationId;
- messageId;
- resultado;
- status do Resend.

Métricas obrigatórias:

- enviados;
- DLQ;
- idade da mensagem mais antiga;
- falhas do dispatcher;
- falhas do worker.

Alarmes mínimos:

- fila acima de 45 minutos: aviso;
- fila acima de 60 minutos: incidente de SLA;
- DLQ maior que zero;
- falhas do worker acima de 5% em 10 minutos.

### 6.12 Erros de API

- configuração inválida: 400;
- conflito: 409;
- sem permissão: 403;
- quadro inexistente: 404.

Mensagem de conflito:

```text
As regras de notificação foram alteradas por outro administrador. Recarregue o quadro e tente novamente.
```

## 7. Frontend

### 7.1 Arquivos

- `frontend/src/types/domain.ts`
- `frontend/src/services/boards.ts`
- `frontend/src/features/admin/boards/components/board-settings.tsx`
- `frontend/src/features/admin/boards/participants.ts` (reutilizar)
- `frontend/src/features/admin/boards/detalhe/page/index.tsx` se necessário

### 7.2 Tipos

Adicionar `BoardNotificationEvent`, `BoardNotificationRule`, `notificationRules` e `notificationRulesVersion` em `Board`.

Em `BoardUpdateInput`:

```ts
notificationRules?: readonly BoardNotificationRule[];
expectedNotificationRulesVersion?: number;
```

A configuração usa a rota existente. A remoção definitiva do card exige uma nova rota, descrita em 6.3.1.

### 7.3 Aba

Adicionar `Notificações` em `BoardSettings`, ao lado de Geral, Labels, Colunas e Templates.

A aba só é acessível porque `BoardSettings` já é renderizado apenas para `canManage`.

Layout:

- explicação de que os e-mails vão para participantes;
- botão `Nova notificação`;
- lista de regras;
- estado vazio;
- ativar/desativar;
- editar;
- excluir;
- salvar notificações;
- botão desabilitado sem alterações.

Formulário:

- evento, com as opções `Card criado`, `Card movido para uma coluna`, `Card alterado`, `Card arquivado` e `Card removido`;
- coluna, apenas para movimentação;
- destinatários, incluindo criador;
- ativo;
- pelo menos um destinatário;
- limite de 20.

Validações de UI:

- sem destinatário;
- movimentação sem coluna;
- duas regras para mesma coluna;
- mais de uma regra para o mesmo evento sem coluna;
- mais de 30 regras;
- aviso de participante removido.

A UI do card deve expor uma ação de remoção definitiva separada do arquivamento, com confirmação explícita e restrita a owner/admin.

### 7.4 Estado

```ts
const [notificationRules, setNotificationRules] =
  useState<readonly BoardNotificationRule[]>(board.board.notificationRules ?? []);

const [expectedVersion, setExpectedVersion] =
  useState(board.board.notificationRulesVersion ?? 0);
```

Incluir notificações em `settingsDirty`. Ao fechar sem salvar, restaurar.

### 7.5 Salvamento

```json
{
  "notificationRules": [],
  "expectedNotificationRulesVersion": 3
}
```

Após sucesso:

1. atualizar regras com a resposta;
2. atualizar versão;
3. chamar `onSaved`;
4. toast.

### 7.6 Conflito

Usar `ApiRequestError` e `code === "CONFLICT"`.

Comportamento:

- não sobrescrever;
- mostrar mensagem;
- recarregar;
- restaurar rascunho com servidor;
- manter aba aberta para revisão.

Se o reload não atualizar o estado local de forma síncrona, fechar e reabrir a aba é aceitável.

### 7.7 Critérios de UI

- [ ] Aba visível só para owner/admin.
- [ ] Criar regra de criação.
- [ ] Criar regra de movimentação.
- [ ] Criar regra de alteração.
- [ ] Criar regra de arquivamento.
- [ ] Criar regra de remoção.
- [ ] Selecionar múltiplos participantes.
- [ ] Incluir criador.
- [ ] Ativar/desativar.
- [ ] Excluir.
- [ ] Bloquear inválidas.
- [ ] Tratar 409.
- [ ] Proteger alterações não salvas.

## 8. Concorrência otimista

### 8.1 Modelo

- `notificationRulesVersion` ausente = 0;
- incrementa quando regras mudam;
- não muda por card, nome, descrição, labels, colunas ou templates;
- outras configurações continuam last-write-wins.

### 8.2 Fluxo

```text
Admin A lê versão 3
Admin B lê versão 3
Admin A salva → grava versão 4
Admin B salva → condição 3 falha → 409
```

### 8.3 Limpeza

Exclusão de coluna e remoção de membro:

1. ler quadro/versão;
2. calcular regras limpas;
3. salvar com expected version;
4. em conflito, reler e repetir até 3 vezes;
5. se falhar, logar; dispatcher ignora regra inválida.

### 8.4 Fora do escopo

Nome, descrição, `labelDisplayMode`, labels, colunas, templates e `metricsDashboard` continuam sem versão.

### 8.5 Testes

- duas gravações com mesma versão: uma sucesso, uma 409;
- quadro antigo sem versão aceita expected 0;
- quadro com `notificationRulesVersion = 0` aceita expected 0;
- versão antiga rejeitada;
- update geral não altera versão;
- exclusão de coluna incrementa;
- remoção de membro incrementa;
- regra vazia é removida;
- conflito na limpeza é reaplicado;
- frontend trata 409.

## 9. Testes

### 9.1 Backend

- schema de regras para os cinco eventos;
- criação, alteração, arquivamento e remoção sem coluna;
- movimentação com coluna;
- regra vazia;
- mais de 20 destinatários;
- duplicidade por evento/coluna;
- destinatário fora do quadro;
- coluna inexistente;
- limite de 64 KB;
- atualização condicional;
- expected 0 com versão ausente e com versão 0;
- conflito 409;
- limpeza de coluna/membro;
- remoção definitiva exige manage e apaga o item.

Arquivos de teste previstos:

- `backend/src/shared/board/notification-rules.test.ts` (novo);
- `backend/src/shared/board/service.test.ts` (extensão);
- `backend/src/functions/board-notification-dispatcher.test.ts` (novo);
- `backend/src/functions/board-notification-worker.test.ts` (novo);
- `backend/src/functions/publico-leads.test.ts` (novo, se ainda não existir);
- `frontend/src/features/admin/boards/components/board-settings.test.tsx` (novo).

### 9.2 Dispatcher

- `INSERT` gera criação;
- `MODIFY` com coluna gera movimentação;
- `MODIFY` com campos relevantes gera alteração;
- `MODIFY` apenas de posição não gera;
- `MODIFY` de `archivedAt` gera arquivamento;
- `REMOVE` gera remoção;
- coluna/label/template não geram;
- inativa não gera;
- duplicados geram uma mensagem;
- criador é destinatário;
- removido não entra;
- lead público funciona;
- IDs corretos;
- falha de batch propaga.

### 9.3 Worker

- envio feliz;
- `Idempotency-Key`;
- HTML escapado;
- bloco de título/descrição;
- descrição vazia omitida;
- bloco de coluna anterior/nova em movimentação;
- lista de campos alterados em alteração;
- coluna anterior em arquivamento/remoção;
- nenhum valor completo de campo personalizado no HTML;
- template Atlas aplicado;
- payload inválido;
- 429/5xx propaga;
- erro permanente;
- sem DynamoDB.

### 9.4 Frontend

- `yarn build`;
- permissões;
- CRUD de regras para os cinco eventos;
- criador;
- validações;
- conflito;
- dirty guard;
- ação de remoção definitiva separada do arquivamento.

### 9.5 Roteiro manual em dev

1. configurar criação para dois usuários;
2. criar card;
3. verificar duas mensagens e dois e-mails;
4. confirmar processamento unitário;
5. configurar coluna `Qualificado`;
6. mover card;
7. verificar e-mail;
8. confirmar que o corpo contém título, descrição e detalhes do evento;
9. alterar título/descrição e verificar e-mail de alteração;
10. reordenar;
11. verificar ausência de envio;
12. arquivar card e verificar e-mail de arquivamento;
13. remover definitivamente outro card e verificar e-mail de remoção;
14. sair e voltar à coluna;
15. verificar novo e-mail de movimentação;
16. criar lead pelo site;
17. verificar criação;
18. qualificar lead;
19. verificar movimentação;
20. desativar regra;
21. verificar ausência;
22. remover destinatário;
23. verificar limpeza;
24. excluir coluna;
25. verificar limpeza;
26. abrir dois navegadores;
27. salvar no primeiro;
28. salvar no segundo;
29. verificar 409.

### 9.6 Idempotência

- reprocessar mensagem;
- Resend não duplica;
- falhar após envio e antes do delete;
- retry não duplica;
- reentrada gera novo e-mail.

### 9.7 Capacidade

Teste de carga com:

- 200 cards por hora;
- até 20 destinatários por card;
- pior caso de 4.000 mensagens por hora;
- worker unitário;
- tempo médio do Resend;
- tempo de drenagem da fila;
- comportamento da DLQ.

Critério de aprovação:

- todos os e-mails do cenário entregues em até 60 minutos após a persistência do card;
- nenhuma mensagem inesperada na DLQ.

Se o critério falhar, a liberação fica bloqueada até ajuste de limite, concorrência ou desenho.

## 10. Deploy e rollout

### 10.1 Dependências

Adicionar:

- `@aws-sdk/client-sqs`;
- `@aws-sdk/util-dynamodb`.

Atualizar lockfile.

O `serverless-esbuild` atual externaliza `@aws-sdk/*`. Na stack de notificações, confirmar que os dois pacotes estão disponíveis no runtime da Lambda ou removê-los da lista de `external` para que sejam empacotados no bundle. Não deixar essa decisão implícita.

### 10.2 Ordem

1. core com stream e output;
2. stack de notificações;
3. analytics;
4. frontend.

### 10.3 Workflows

Atualizar `deploy-dev.yml` e `deploy-prod.yml`:

- carregar secrets;
- deploy da stack de notificações após core;
- deploy antes do analytics;
- health check opcional de fila e worker.

### 10.4 Variáveis

- `RESEND_API_KEY`;
- `EMAIL_FROM`;
- `APP_URL`;
- `BOARDS_TABLE`;
- `BOARD_ITEMS_TABLE`;
- ARN do stream;
- `BOARD_NOTIFICATION_QUEUE_URL` no dispatcher, resolvido internamente na stack com `!Ref BoardNotificationQueue`.

### 10.5 Primeiro deploy

- nenhuma regra por padrão;
- nenhum e-mail disparado;
- stream captura eventos;
- liberar configuração gradualmente;
- validar em dev.

### 10.6 Observabilidade

Verificar fila, DLQ, idade da mensagem, erros do dispatcher/worker e status do Resend. Não registrar corpo, token ou e-mail sem necessidade.

### 10.7 Rollback

- worker com falha: fila retém; corrigir e redeployar;
- DLQ: inspecionar e reprocessar;
- stream: desabilitar apenas se necessário;
- frontend: esconder aba ou reverter sem afetar cards;
- regras salvas permanecem.

### 10.8 Riscos residuais

| Risco | Mitigação |
|---|---|
| Regra criada depois do card pode notificar evento recente | Baixo impacto |
| Membro removido após enfileiramento recebe | Janela curta; revalidação no dispatcher |
| DLQ após 24h pode duplicar | Revisar idade antes do replay |
| Limite de 20 destinatários insuficiente | Ajustar com teste |
| Stream ativo sem worker | Eventos retidos por 24h |
| Evento de stream venenoso após 10 retries | Monitorar logs; adicionar destino de falha do stream em fase posterior |
| Outras configurações last-write-wins | Fora do escopo |

### 10.9 Capacidade e SLA

Premissa operacional:

- 200 cards por hora;
- até 20 destinatários por card;
- sem projeção de custo nesta fase;
- envio em até 60 minutos após a persistência do card.

Pior caso teórico:

```text
200 cards/hora × 20 destinatários = 4.000 e-mails/hora
```

O SLA é medido da persistência do card até o aceite do envio pelo Resend.

O worker unitário precisa drenar essa carga dentro de 60 minutos. Isso exige um teste de carga antes da liberação em produção. Se o tempo de resposta do Resend ou o volume real não permitir cumprir o SLA:

- reduzir o limite de destinatários;
- revisar a concorrência do worker;
- ou alterar o desenho da fila.

Nenhuma dessas alterações deve ser feita silenciosamente; a decisão precisa ser registrada.

Alarmes mínimos:

- mensagem mais antiga da fila acima de 45 minutos: aviso;
- mensagem mais antiga da fila acima de 60 minutos: incidente de SLA;
- DLQ maior que zero: investigar;
- falhas do worker acima de 5% em 10 minutos: investigar.

## 11. Ordem de implementação

Base já implementada localmente:

- [x] 1. Tipos, schema e versão para criação e movimentação.
- [x] 2. Repositório condicional.
- [x] 3. Validação e limpeza da base.
- [x] 4. Stream e output.
- [x] 5. Stack de notificações.
- [x] 6. Dispatcher para criação e movimentação.
- [x] 7. Worker, template Atlas e idempotência.
- [x] 8. Aba e conflito 409 no frontend.
- [x] 9. Testes unitários da base.
- [x] 10. Workflows de deploy.
- [x] 11. Documentação inicial.

Extensão planejada:

- [x] 12. Adicionar `CARD_UPDATED`, `CARD_ARCHIVED` e `CARD_REMOVED` ao enum, schema e validação.
- [x] 13. Criar a operação de remoção definitiva e a rota `/permanent`.
- [x] 14. Classificar `REMOVE`, arquivamento e alterações no dispatcher.
- [x] 15. Calcular campos alterados para `CARD_UPDATED`.
- [x] 16. Enviar detalhes específicos de cada evento no template.
- [x] 17. Atualizar a aba com os cinco tipos de evento.
- [x] 18. Adicionar testes dos três novos eventos e da remoção definitiva.
- [ ] 19. Validar em dev, incluindo arquivamento e remoção com confirmação.
- [ ] 20. Atualizar README após o rollout; CHANGELOG, SCOPE e este plano já foram atualizados.

## 12. Definição de pronto

- Criação, movimentação, alteração, arquivamento e remoção sem latência de e-mail.
- Lead público e qualificação cobertos.
- Detalhes específicos de cada evento no e-mail.
- Remoção definitiva distinta de arquivamento.
- Mensagens individuais e sequenciais.
- Retry sem duplicidade.
- Conflito 409 sem sobrescrita.
- Configuração restrita a owner/admin.
- Build frontend e backend passam.
- Testes unitários e roteiro dev passam.
- Logs sem dados sensíveis.
- Documentação de estado atualizada.

## 13. Estado da documentação

Os cinco eventos estão implementados no working tree. Alarmes CloudWatch, testes dedicados de dispatcher/worker, validação manual, teste de carga e deploy permanecem pendentes. `docs/SCOPE.md`, `CHANGELOG.md` e este documento refletem o estado atual.
