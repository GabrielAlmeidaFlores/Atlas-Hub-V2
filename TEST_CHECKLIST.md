# 🧪 Checklist de Testes - Atlas Hub V2

## ✅ Testes Automatizados Backend

```bash
cd backend
npm test
```

**Cobertura:**
- ✅ Normalização de webhooks Divify (7 cenários)
- ✅ Eventos com/sem `offerId`
- ✅ Payloads aninhados (`data.attributes`, `offer.id`)
- ✅ Conversão de valores (reais → centavos)
- ✅ Variações de nomes de eventos
- ✅ Auth webhook (secret, bearer token)
- ✅ Status rank de compras

---

## 🖥️ Testes Manuais Frontend

### 1. **Landing Page** (`/`)
- [ ] Exibe apresentação do Atlas Hub
- [ ] Botão "Entrar" redireciona para `/login`
- [ ] Botão "Cadastrar" redireciona para `/cadastro`

### 2. **Cadastro Incorporadora** (`/cadastro`)
- [ ] Formulário valida CNPJ (14 dígitos)
- [ ] Formulário valida CPF responsável (11 dígitos)
- [ ] Validação de e-mail único
- [ ] Senha mínimo 8 caracteres
- [ ] Após cadastro exibe tela de confirmação de e-mail

### 3. **Login** (`/login`)
- [ ] Login com e-mail + senha
- [ ] Mensagem de erro genérica para credenciais inválidas
- [ ] Redireciona para dashboard após login bem-sucedido
- [ ] Link "Esqueci minha senha" funciona

### 4. **Dashboard Incorporadora** (`/dashboard`)
- [ ] Cards de resumo: Rascunhos, Aguardando análise, Requer atenção, Aprovados, Publicados
- [ ] Lista de projetos com status, modelo, tipo, valor
- [ ] Botão "Novo Projeto" abre wizard

### 5. **Wizard de Projeto** (`/projetos/novo`)
- [ ] **Etapa 1:** Dados gerais (nome, modelo, tipo, cidade, endereço, descrição)
- [ ] **Etapa 2:** Dados financeiros (valor total, valor a captar, prazo obra, rentabilidade)
- [ ] **Etapa 3:** Upload de documentos (matrícula, alvará, memorial, planta)
- [ ] **Etapa 4:** Equipe do projeto (mínimo 1 membro)
- [ ] **Etapa 5:** Revisão + submissão (checklist visual, modal de confirmação)
- [ ] Progresso salvo automaticamente em cada etapa
- [ ] Pode voltar e editar etapas anteriores

### 6. **Detalhe do Projeto** (`/projetos/:id`)
- [ ] Painel lateral: status atual, linha do tempo, analista responsável
- [ ] Abas: Visão Geral, Documentos, Equipe, Histórico
- [ ] Se `AJUSTE_SOLICITADO`: campos editáveis + botão "Resubmeter"
- [ ] Se `OFERTA_CRIADA`: exibe ID e link da oferta

### 7. **Perfil da Empresa** (`/perfil`)
- [ ] Edição de dados cadastrais (endereço, site, descrição)
- [ ] Upload de contrato social e comprovante CNPJ
- [ ] Salvar alterações

---

## 👨‍💼 Testes Admin

### 8. **Fila de Curadoria** (`/admin/curadoria`)
- [ ] Lista projetos `SUBMETIDO` e `EM_ANALISE`
- [ ] Filtros: status, analista, prioridade
- [ ] Busca por nome do projeto
- [ ] Ordena por data de submissão
- [ ] Botão "Iniciar análise" só em `SUBMETIDO`

### 9. **Análise de Projeto** (`/admin/curadoria/:id`)
- [ ] Scorecard com 5 critérios (mercado, viabilidade, documentação, equipe, jurídico)
- [ ] Checklist pré-aprovação (todos itens devem estar marcados)
- [ ] Notas internas (admin → admin)
- [ ] Histórico completo de análises anteriores
- [ ] Ações: Solicitar Ajuste, Reprovar (com justificativa), Aprovar

### 10. **Registro de Oferta** (`/admin/curadoria/:id` após `APROVADO`)
- [ ] Formulário: ID da oferta, link da oferta
- [ ] Modal de confirmação
- [ ] Transição para `OFERTA_CRIADA`
- [ ] Incorporadora recebe notificação com link

### 11. **CRM Incorporadoras** (`/admin/incorporadoras`)
- [ ] Lista todas incorporadoras cadastradas
- [ ] Filtro por status (e-mail confirmado, pendente)
- [ ] Busca por razão social ou CNPJ
- [ ] Visualizar projetos da incorporadora
- [ ] Ver histórico completo

### 12. **Gestão de Usuários Admin** (`/admin/usuarios`)
- [ ] Lista admins (ANALISTA, ADMIN_MASTER)
- [ ] ADMIN_MASTER pode criar novos usuários
- [ ] Senha temporária gerada automaticamente
- [ ] Ativar/desativar usuário

---

## 💰 Testes Financeiro (Admin)

### 13. **Lista de Contas** (`/admin/financeiro`)
- [ ] Card Tesouraria Atlas
- [ ] Lista contas SPE por projeto (`OFERTA_CRIADA`)
- [ ] KPIs: Total em contas, Saldo tesouraria
- [ ] Botão "Abrir conta SPE" (só se há projetos elegíveis)
- [ ] Valida CNPJ SPE (14 dígitos)

### 14. **Detalhe da Conta** (`/admin/financeiro/:projetoId`)
- [ ] KPIs: Saldo, Entradas, Saídas
- [ ] Extrato (ledger) com data, tipo, valor
- [ ] Solicitações de Pix (pendentes, aprovadas, executadas, rejeitadas)
- [ ] Trilha de auditoria
- [ ] **ADMIN_MASTER:**
  - [ ] Botão "Solicitar Pix"
  - [ ] Botão "Cadastrar split"
  - [ ] Aprovar Pix (se houver pendente de outro master)
  - [ ] Rejeitar Pix

### 15. **Split Receiver** (`/admin/financeiro/:projetoId`)
- [ ] Modal "Cadastrar beneficiário de split"
- [ ] Campos: Nome, CPF/CNPJ, Chave Pix
- [ ] Validação mínima (CPF 11 dígitos, CNPJ 14)
- [ ] Toast de sucesso com `receiverId`
- [ ] Exibe "Último beneficiário de split: rec_xyz"

### 16. **Dupla Aprovação Pix**
- [ ] Admin Master 1 solicita Pix
- [ ] Status: `PENDENTE`
- [ ] Admin Master 2 aprova → status `EXECUTADA`, Pix enviado
- [ ] Admin Master 2 rejeita → status `REJEITADA`
- [ ] Mesmo admin não pode aprovar própria solicitação

---

## 📊 Testes Captação (Admin)

### 17. **Lista de Ofertas** (`/admin/captacao`)
- [ ] KPIs: Captado total, Compras aprovadas, Ofertas ativas
- [ ] Lista ofertas publicadas (`OFERTA_CRIADA`)
- [ ] Status: "Em captação" / "Sucesso" / "Insucesso"
- [ ] Progresso: % captado sobre meta
- [ ] Compras aprovadas, expiradas, investidores
- [ ] Eventos recentes (últimos 60)
- [ ] Warning se webhook não configurado
- [ ] Warning se API Divify não configurada

### 18. **Detalhe da Oferta** (`/admin/captacao/:ofertaId`)
- [ ] KPIs: Captado, Compras aprovadas, Encerramento, ID da oferta
- [ ] Se oferta encerrada: badge "Sucesso" ou "Insucesso" + data
- [ ] Link para projeto vinculado (`/admin/curadoria/:id`)
- [ ] Lista de compras (purchaseId, investorId, status, valor)
- [ ] Lista de eventos da oferta

---

## 🔗 Testes de Integração

### 19. **Webhook Divify** (simulado localmente)

```bash
curl -X POST http://localhost:3000/webhooks/divify \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: test-secret" \
  -d '{
    "event": "PurchaseApprovedEvent",
    "offerId": "offer-test",
    "purchaseId": "buy-001",
    "investorId": "inv-001",
    "amountCents": 100000,
    "status": "APPROVED"
  }'
```

- [ ] Resposta 200 com `{ received: true, id, tipo }`
- [ ] Evento persistido em `AtlasCaptacaoEventos`
- [ ] Compra persistida em `AtlasCaptacaoCompras`
- [ ] Vínculo ao projeto via `ofertaId`

### 20. **Webhook Stark Bank** (simulado localmente)

```bash
curl -X POST http://localhost:3000/webhooks/starkbank \
  -H "Content-Type: application/json" \
  -H "Digital-Signature: mock-signature" \
  -d '{
    "event": "deposit",
    "log": {
      "deposit": {
        "amount": 50000,
        "description": "Depósito teste"
      }
    }
  }'
```

- [ ] Resposta 200
- [ ] Entrada conciliada no ledger

---

## 🎨 Testes Visuais

### 21. **Design System**
- [ ] Tokens de cor (navy, gold, status-*)
- [ ] Botões: radius 0, Poppins
- [ ] Cards: border radius correto
- [ ] Badges de status coloridos
- [ ] Modal centralizado, overlay escuro
- [ ] Toast de sucesso/erro aparece e desaparece

### 22. **Responsividade**
- [ ] Desktop (1440px+): layout completo
- [ ] Tablet (768px): menu adaptado
- [ ] Mobile (375px): menu hamburger, cards empilhados

### 23. **Navegação**
- [ ] Breadcrumbs corretos em todas as páginas
- [ ] Sidebar ativa no item correto
- [ ] Links funcionam (não quebram com URL encoding)
- [ ] Voltar mantém contexto

---

## 🚀 Smoke Tests Pós-Deploy

### DEV
```bash
curl https://[api-dev].execute-api.sa-east-1.amazonaws.com/dev/health
# Esperado: { status: "ok", ... }

curl https://[api-dev].execute-api.sa-east-1.amazonaws.com/dev/webhooks/divify \
  -X POST -H "X-Webhook-Secret: ..." -d '...'
# Esperado: 200 ou 401 (se secret inválido)
```

### PROD
```bash
curl https://[api-prod].execute-api.sa-east-1.amazonaws.com/prod/health
# Esperado: { status: "ok", ... }
```

---

## 📋 Checklist Pré-PR

- [ ] Backend typecheck passa (`cd backend && npm run build`)
- [ ] Frontend build passa (`cd frontend && yarn build`)
- [ ] Testes de integração passam (`cd backend && npm test`)
- [ ] Linter clean nos arquivos modificados
- [ ] Mocks atualizados (`frontend/src/mocks/handlers/index.ts`)
- [ ] Docs atualizados (`README.md`, `SCOPE.md`, `pending.md`)
- [ ] `.env.example` atualizado com novas variáveis
- [ ] Git diff revisado (sem secrets, sem console.logs)

---

## ⚠️ Testes que ficam para depois

- [ ] E2E com Playwright/Cypress
- [ ] Testes unitários componentes React
- [ ] Testes de carga (webhooks em alta frequência)
- [ ] Testes de segurança (pentest, OWASP)
- [ ] Testes de acessibilidade (a11y)
