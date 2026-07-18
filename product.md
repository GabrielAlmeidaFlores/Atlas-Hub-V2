# Atlas Hub V2 — Documento de Produto

---

## 1. Visão Geral

O **Atlas Hub** é uma plataforma de crowdfunding imobiliário regulada pela **CVM Resolução 88**. Atua como intermediária entre incorporadoras que precisam captar recursos para seus empreendimentos e investidores que buscam rentabilidade no setor imobiliário.

O Atlas Hub opera como **originador de projetos**: capta projetos de incorporadoras, realiza curadoria interna e, após aprovação, publica as ofertas de investimento sob a **marca Atlas Hub**. A infraestrutura regulatória e financeira (KYC, escrow, tokenização, vitrine) roda em stack white-label — o investidor vê apenas Atlas Hub.

### 1.1 Modelo de Negócio

- O Atlas Hub cobra **10% sobre o valor captado** em cada oferta, cobrado progressivamente conforme o capital entra — não é success fee
- A operação é homologada pela CVM via stack white-label; o Atlas Hub é identificado por um `x-tenant-id` (UUID) em todas as chamadas de API
- A taxa de 10% é configurada diretamente no spread da oferta dentro do painel da plataforma
- O emissor (SPE/SCP da incorporadora) recebe os recursos líquidos após a dedução da taxa

### 1.2 Modelos de Investimento

O sistema deve suportar três modelos. O **MVP foca exclusivamente no Modelo 1**:

| Modelo | Descrição | MVP |
|---|---|---|
| **Modelo 1 — Construção para Venda** | O imóvel é construído e vendido. O retorno vem da participação no lucro da venda ou de uma dívida pré-fixada | ✅ Sim |
| **Modelo 2 — Construção para Renda** | O imóvel é construído para ser alugado. Investidores recebem participação proporcional nos aluguéis | ❌ Pós-MVP |
| **Modelo 3 — Modelo Misto** | Parte das unidades é vendida (lucro) e parte fica para renda. Ex: resort com 50 unidades vendidas e 50 para aluguel gerido | ❌ Pós-MVP |

### 1.3 Elegibilidade das Incorporadoras

Conforme a CVM Resolução 88, apenas empresas com **receita bruta anual de até R$40 milhões** (podendo chegar a R$80 milhões em casos específicos previstos na norma) podem captar via crowdfunding. Esse critério deve ser verificado durante a curadoria.

### 1.4 Requisitos Contratuais Obrigatórios

Todo projeto aprovado deve atender os seguintes requisitos antes da oferta ir ao ar:

- **Patrimônio de afetação por projeto**: cláusula obrigatória no contrato com a incorporadora — o patrimônio do projeto fica segregado do patrimônio pessoal do incorporador
- **Seguro de obra por projeto**: apresentação de apólice de seguro de obra antes da publicação da oferta — em caso de não conclusão, o seguro cobre a retomada por outra empresa
- **SPE ou SCP constituída**: a estrutura jurídica do projeto (Sociedade de Propósito Específico ou Sociedade em Conta de Participação) deve ser apresentada durante a curadoria ou constituída antes da oferta ir ao ar

---

## 2. Divisão de Responsabilidades: originador vs. infraestrutura

### 2.1 O que a infraestrutura white-label entrega (não construímos neste repo)

A stack white-label (experiência 100% Atlas Hub) já entrega o abaixo — não construímos neste repositório:

**Para o investidor (marca Atlas Hub):**
- Landing page com vitrine de ofertas (cards com progresso de captação, rentabilidade, investimento mínimo)
- Página de detalhe de cada oferta (vídeo YouTube embed, fotos em carrossel, pitch deck, documentos CVM, equipe, FAQ, fórum)
- Fluxo de cadastro completo (PF e PJ) com KYC automatizado — PF aprovação instantânea, PJ até 2 dias úteis
- Login com autenticação de dois fatores
- Dashboard de carteira: investimentos ativos, rendimentos recebidos, extrato, chaves PIX
- Fluxo de investimento: seleção de cotas, assinatura do termo de adesão, pagamento via PIX, opção de parcelas (capitalização mensal)
- Cancelamento de investimento no prazo legal de 5 dias (CVM 88) — botão some automaticamente no 6º dia
- Mercado secundário: cessão de cotas P2P entre investidores do mesmo projeto (parâmetros configuráveis por oferta)
- Acompanhamento de ativo: comunicados da oferta, relatórios RI, prestação semestral
- Informe de rendimentos anual (para declaração de IR) — gerado automaticamente
- Interface 100% responsiva (mobile-first, sem app nativo)

**Para o admin Atlas Hub (via painel da plataforma):**
- Criação de ofertas públicas (CVM 88) e privadas (club deal, até 15 investidores)
- Validação jurídica da oferta pelo time da plataforma (até 3 dias úteis — apenas oferta pública)
- Gerenciamento de status das ofertas
- Lista completa de investidores com dados KYC e documentos
- Monitoramento de transações em tempo real
- Distribuição de rendimentos (semi-manual: Atlas Hub informa o valor, plataforma emite invoice e distribui automaticamente)
- Moderação do fórum de cada oferta
- Envio de comunicados e relatórios RI
- Gerenciamento de equipe interna com diferentes perfis de acesso
- Controle de comissões e receitas da plataforma
- Configuração visual da plataforma (logo, cores primárias/secundárias, banners/carrossel, domínio)

**Infraestrutura:**
- Escrow automático por oferta (conta ECO criada a cada oferta abertura)
- Tokenização das cotas (blockchain Polygon, R$10 por token, lote mínimo configurável)
- Triggers CVM automáticos: ao atingir 2/3 do valor alvo + prazo OK → libera para o emissor; insucesso → devolve 100% automaticamente para todos os investidores
- Compliance CVM 88 embutido em toda a operação
- Segurança anti-lavagem: valida CPF/CNPJ de origem e destino; nunca transfere para terceiros

### 2.2 O que o Atlas Hub constrói

- **Portal da Incorporadora** — onde incorporadoras se cadastram, submetem projetos, acompanham o status e recebem feedbacks
- **Painel de Curadoria (Admin)** — onde a equipe interna analisa, pontua e aprova projetos; funciona também como CRM de projetos e incorporadoras

Fronteira de escopo MVP (o que não construir): [`docs/SCOPE.md`](docs/SCOPE.md).  
Checklist operacional de curadoria (atas históricas → scorecard): [`docs/curadoria-checklist.md`](docs/curadoria-checklist.md).

---

## 3. Usuários do Sistema Atlas Hub

### 3.1 Incorporadora

- Empresa identificada por CNPJ com receita bruta anual de até R$40M (CVM 88)
- Acessa exclusivamente o **Portal da Incorporadora**
- Não tem acesso ao painel de curadoria interno nem ao painel da plataforma
- Pode: criar conta, completar perfil da empresa, submeter projetos, acompanhar status, responder ajustes solicitados, receber feedbacks e visualizar link da oferta publicada
- Um CNPJ = uma conta. Múltiplos usuários por empresa não são suportados no MVP

### 3.2 Analista (Admin Interno — equipe Atlas Hub)

- Membro da equipe interna do Atlas Hub
- Acessa exclusivamente o **Painel de Curadoria**
- Pode: visualizar todos os projetos submetidos, iniciar análises, preencher scorecard, deixar notas internas, solicitar ajustes, aprovar ou reprovar projetos, confirmar a criação de ofertas na plataforma e gerenciar o cadastro de incorporadoras
- Contas de analista são criadas manualmente por um administrador master — não há cadastro público

---

## 4. Fluxo Completo de um Projeto

```
[INCORPORADORA]
Cria conta no Portal Atlas Hub (confirma e-mail)
        ↓
Preenche wizard de submissão (5 etapas)
        ↓
Submete o projeto → status: SUBMETIDO
        ↓
[ANALISTA]
Recebe na fila de curadoria
        ↓
Clica em "Iniciar análise" → status: EM_ANALISE
(projeto atribuído a este analista)
        ↓
Visualiza dados, documentos, equipe e histórico de análises anteriores
        ↓
Preenche scorecard manual (5 critérios ponderados)
Pode adicionar notas internas (não visíveis à incorporadora)
        ↓
        ├── [Ajuste necessário]
        │   Analista escreve o que precisa ser corrigido
        │   Status → AJUSTE_SOLICITADO
        │   Incorporadora recebe notificação + e-mail
        │           ↓
        │   Incorporadora edita os campos desbloqueados e resubmete
        │   Status → SUBMETIDO → volta para a fila
        │   Novo ciclo de análise começa (analista vê scorecard anterior)
        │
        ├── [Reprovar]
        │   Analista preenche scorecard completo + parecer
        │   Status → REPROVADO
        │   Incorporadora recebe justificativa por notificação + e-mail
        │   Incorporadora pode corrigir e resubmeter sem limite de tentativas
        │
        └── [Aprovar]
              Analista preenche scorecard completo + parecer
              Status → APROVADO
              Incorporadora recebe notificação + e-mail
                      ↓
              [PRÉ-REQUISITO — antes de ir para a plataforma]
              Verificar se SPE/SCP está constituída e registrada na plataforma como emissora
              Se não estiver, orientar incorporadora a cadastrar PJ na plataforma
              (KYC PJ da plataforma: até 2 dias úteis)
                      ↓
              [ANALISTA — ação manual fora do sistema]
              Acessa painel da plataforma
              Cria a oferta com os dados do projeto aprovado
              Define: tipo (pública ou privada), contrato, taxas, parâmetros
              Para oferta pública: aguarda validação jurídica da plataforma (até 3 dias úteis)
              Copia o ID da oferta gerado pela plataforma
                      ↓
              Retorna ao Painel de Curadoria Atlas Hub
              Preenche o campo "ID da oferta" e "Link da oferta"
              Confirma a publicação
                      ↓
              Status → OFERTA_CRIADA
              Incorporadora recebe notificação final com link da oferta
```

---

## 5. Status de um Projeto

| Status | Quem aciona | Descrição |
|---|---|---|
| `RASCUNHO` | Incorporadora | Projeto criado mas ainda não submetido. Todos os campos são editáveis |
| `SUBMETIDO` | Incorporadora | Projeto submetido. Campos bloqueados para edição. Aguarda analista |
| `EM_ANALISE` | Analista | Analista iniciou a revisão. Projeto atribuído a ele |
| `AJUSTE_SOLICITADO` | Analista | Analista identificou pendências. Campos voltam a ser editáveis para a incorporadora |
| `REPROVADO` | Analista | Projeto reprovado com justificativa. Incorporadora pode corrigir e resubmeter |
| `APROVADO` | Analista | Projeto aprovado. Aguarda criação da oferta na plataforma |
| `OFERTA_CRIADA` | Analista | Oferta criada e publicada na plataforma. ID e link da oferta registrados no sistema |

### Regras de Transição

| De | Para | Quem | Condição |
|---|---|---|---|
| `RASCUNHO` | `SUBMETIDO` | Incorporadora | Etapas 1, 2, 3 e 4 completas |
| `SUBMETIDO` | `EM_ANALISE` | Analista | Clicar em "Iniciar análise" |
| `EM_ANALISE` | `AJUSTE_SOLICITADO` | Analista | Texto de ajuste preenchido |
| `EM_ANALISE` | `REPROVADO` | Analista | Todos os critérios preenchidos + parecer |
| `EM_ANALISE` | `APROVADO` | Analista | Todos os critérios preenchidos + parecer |
| `AJUSTE_SOLICITADO` | `SUBMETIDO` | Incorporadora | Editar e resubmeter |
| `REPROVADO` | `SUBMETIDO` | Incorporadora | Corrigir e resubmeter |
| `APROVADO` | `OFERTA_CRIADA` | Analista | ID e link da oferta preenchidos + confirmação |

### Regras de Reatribuição

- Se o analista responsável por um projeto `EM_ANALISE` precisar ser substituído, um **administrador master** pode reatribuir o projeto para outro analista
- Ao reatribuir, o status permanece `EM_ANALISE` e o novo analista herda o scorecard parcial já preenchido
- O histórico registra a troca de analista com data, hora e motivo

---

## 6. Portal da Incorporadora

### 6.1 Telas e Rotas

| Tela | Rota | Descrição |
|---|---|---|
| Landing / Login | `/` | Apresentação da plataforma com CTA para cadastro e login |
| Cadastro | `/cadastro` | Formulário de criação de conta |
| Confirmação de e-mail | `/confirmar-email` | Instrução para verificar o e-mail recebido |
| Recuperação de senha | `/esqueci-senha` | Formulário para solicitar e-mail de recuperação |
| Redefinição de senha | `/redefinir-senha?token=` | Formulário para criar nova senha via token |
| Dashboard | `/dashboard` | Visão geral dos projetos e seus status |
| Novo Projeto | `/projetos/novo` | Wizard em 5 etapas |
| Detalhe do Projeto | `/projetos/:id` | Acompanhamento, histórico e feedbacks |
| Perfil da Empresa | `/perfil` | Dados cadastrais e documentos |
| Notificações | `/notificacoes` | Central de notificações |

---

### 6.2 Landing Page

A landing deve comunicar:
- O que é o Atlas Hub e como funciona (passo a passo: submeter → curadoria → captar)
- Diferenciais em relação ao financiamento bancário tradicional:
  - Sem taxas de cartório
  - Custo previsível (10% sobre o captado, sem juros mensais durante a obra)
  - Acesso a capital sem depender de banco
  - Imóvel em obra atrai mais investidores do que projeto no papel
- Call-to-action para incorporadoras cadastrarem seus projetos
- Botão de login para incorporadoras já cadastradas

---

### 6.3 Cadastro da Incorporadora

**Campos obrigatórios:**

| Campo | Validação |
|---|---|
| Razão social | Texto livre |
| CNPJ | Formato válido + dígito verificador |
| Nome do responsável | Texto livre |
| CPF do responsável | Formato válido + dígito verificador |
| Cargo do responsável | Texto livre |
| E-mail corporativo | Formato válido, único no sistema |
| Telefone | Formato com DDD |
| Senha | Mínimo 8 caracteres |
| Confirmação de senha | Idêntica à senha |

**Regras:**
- CNPJ não pode estar duplicado no sistema
- E-mail não pode estar duplicado no sistema
- Ao concluir, um e-mail de confirmação é enviado automaticamente
- Sem confirmação de e-mail, o acesso fica bloqueado — tela de aviso é exibida ao tentar logar
- Ao confirmar o e-mail, o usuário é redirecionado para o Dashboard

---

### 6.4 Login e Recuperação de Senha

**Login:**
- E-mail + senha
- Exibe mensagem de erro genérica em caso de credencial inválida (sem indicar qual campo está errado)
- Após 5 tentativas erradas consecutivas, exibe CAPTCHA

**Recuperação de senha:**
- Rota `/esqueci-senha`: campo de e-mail — sistema envia link de redefinição se o e-mail existir (sem confirmar se existe ou não, por segurança)
- Rota `/redefinir-senha?token=`: exibe formulário de nova senha + confirmação
- Token de redefinição expira em 1 hora
- Após redefinir, sessões anteriores são invalidadas

---

### 6.5 Perfil da Empresa

Complementa o cadastro inicial. Pode ser preenchido a qualquer momento.

| Campo | Obrigatório | Observação |
|---|---|---|
| Endereço completo (rua, número, bairro, cidade, estado, CEP) | Não | |
| Site | Não | |
| Descrição da empresa | Não | Apresentada ao analista durante a curadoria |
| Histórico de projetos anteriores | Não | Projetos concluídos fora da plataforma |
| Contrato social | Não | Upload PDF — recomendado antes do 1º projeto |
| Comprovante de CNPJ | Não | Upload PDF — recomendado antes do 1º projeto |

**Especificações de upload:**
- Formatos aceitos: PDF, JPG, PNG
- Tamanho máximo por arquivo: 20 MB

---

### 6.6 Dashboard da Incorporadora

**Cards de resumo rápido:**

| Card | Status agrupados |
|---|---|
| Rascunhos | `RASCUNHO` |
| Aguardando análise | `SUBMETIDO` + `EM_ANALISE` |
| Requer atenção | `AJUSTE_SOLICITADO` + `REPROVADO` |
| Aprovados (aguardando publicação) | `APROVADO` |
| Publicados | `OFERTA_CRIADA` |
| Total de projetos | Todos |

**Lista de projetos:**

| Coluna | Descrição |
|---|---|
| Nome do projeto | |
| Modelo | Venda / Renda / Misto |
| Tipo de oferta | Pública / Privada |
| Valor a captar | |
| Data de submissão | |
| Status | Com cor e ícone |
| Ação | Ver detalhes |

---

### 6.7 Submissão de Projeto — Wizard (5 Etapas)

O progresso é salvo automaticamente como rascunho ao avançar cada etapa. A incorporadora pode fechar e retomar a qualquer momento.

#### Etapa 1 — Dados Gerais

| Campo | Obrigatório | Observação |
|---|---|---|
| Nome do projeto | Sim | |
| Modelo de investimento | Sim | MVP aceita apenas Venda |
| Tipo de imóvel | Sim | Residencial / Comercial / Misto |
| Cidade | Sim | |
| Estado | Sim | |
| Endereço do terreno | Sim | |
| Descrição do projeto | Sim | Mínimo 200 caracteres |
| Fotos do terreno / local | Não | Upload de imagens — até 10 arquivos, máx 10 MB cada |
| Vídeo de apresentação | Não | Link YouTube |

#### Etapa 2 — Dados Financeiros

| Campo | Obrigatório | Observação |
|---|---|---|
| Valor total do projeto (R$) | Sim | Custo total estimado da obra |
| Valor que deseja captar (R$) | Sim | Deve ser ≤ R$15M (limite CVM 88 por SPE/ano) |
| Prazo estimado de obra (meses) | Sim | |
| Prazo estimado de retorno aos investidores (meses) | Sim | A partir do encerramento da captação |
| Rentabilidade estimada ao investidor (% ao ano) | Sim | |
| Modelo de retorno | Sim | Participação nos lucros da SPE (SCP) / Dívida (Nota Comercial) |
| Plano de saída | Sim | Como e quando os investidores receberão o retorno |
| Tipo de oferta desejada | Sim | Pública (CVM 88, ilimitado de investidores) / Privada (club deal, até 15 investidores) |
| Investimento parcelado | Não | Se sim: número de parcelas e % de entrada — configurado pelo analista na plataforma |

#### Etapa 3 — Documentos

| Documento | Obrigatório | Observação |
|---|---|---|
| Matrícula do terreno | Sim | Certidão atualizada (máx 90 dias) |
| Alvará de construção ou protocolo de aprovação | Sim | |
| Memorial descritivo | Sim | |
| Planta do empreendimento | Sim | |
| Planilha de viabilidade financeira | Sim | Assinada por responsável técnico |
| Planilha de orçamento de obra | Não | Recomendado — assinada por engenheiro responsável |
| Projeto 3D ou renderizações | Não | Recomendado — facilita a venda da oferta aos investidores |
| Contrato social da SPE ou SCP | Não | Se já constituída. Pode ser enviado depois |
| Certidões negativas de débito (CND) | Não | Federal, estadual e municipal |
| Outros documentos relevantes | Não | |

**Especificações de upload (documentos):**
- Formatos aceitos: PDF, JPG, PNG
- Tamanho máximo por arquivo: 50 MB
- Múltiplos arquivos podem ser enviados por campo

#### Etapa 4 — Equipe

Para cada membro da equipe do projeto:

| Campo | Obrigatório |
|---|---|
| Nome completo | Sim |
| Cargo / função no projeto | Sim |
| Mini bio (experiência relevante) | Sim |
| Foto | Não |
| LinkedIn | Não |

- Permite adicionar múltiplos membros
- Mínimo 1 responsável técnico cadastrado

#### Etapa 5 — Revisão e Envio

- Exibe resumo completo organizado de todas as etapas
- Permite voltar e editar qualquer etapa antes de submeter
- Exibe checklist visual de documentos obrigatórios (✅ enviado / ❌ faltando)
- Botão "Submeter projeto" habilitado apenas quando todos os obrigatórios estiverem cumpridos
- Modal de confirmação antes de submeter
- Ao confirmar: status → `SUBMETIDO` e incorporadora recebe notificação

**Regras gerais do wizard:**
- Rascunho salvo automaticamente ao avançar cada etapa
- A incorporadora pode retornar ao rascunho a qualquer momento
- Após submissão, todos os campos ficam bloqueados
- Se o analista solicitar ajuste, os campos voltam a ser editáveis
- Ao resubmeter após ajuste, os campos voltam a ser bloqueados
- Projeto reprovado pode ser corrigido e resubmetido sem limite de tentativas
- O histórico de todas as análises anteriores fica visível para a incorporadora

---

### 6.8 Detalhe do Projeto — Acompanhamento

Tela completa com todas as informações e painel lateral de status.

**Painel lateral de status:**
- Status atual (com cor, ícone e descrição do que significa)
- Linha do tempo visual dos status
- Data e hora da última atualização
- Nome do analista responsável (sem dados de contato)

**Abas do projeto:**

| Aba | Conteúdo |
|---|---|
| Visão Geral | Dados gerais, financeiros e modelo de investimento |
| Documentos | Todos os documentos enviados — visualização inline + download |
| Equipe | Membros com foto, cargo e bio |
| Histórico | Linha do tempo completa: status, datas, horas e mensagens |

**Quando status = `AJUSTE_SOLICITADO`:**
- Banner laranja no topo com texto completo do analista
- Botão "Editar projeto" que reabre o wizard
- Após editar, botão "Resubmeter projeto"

**Quando status = `REPROVADO`:**
- Banner vermelho com justificativa completa do analista
- Botão "Resubmeter com correções" que reabre o wizard

**Quando status = `APROVADO`:**
- Banner verde informando que o projeto foi aprovado
- Mensagem: "Estamos criando sua oferta — em breve você receberá o link para compartilhar com investidores"

**Quando status = `OFERTA_CRIADA`:**
- Banner verde de confirmação
- Link direto para a oferta Atlas Hub
- Instrução para compartilhar o link com potenciais investidores

---

### 6.9 Notificações

A incorporadora recebe notificações **in-app** e por **e-mail** nos seguintes eventos:

| Evento | Canal | Conteúdo |
|---|---|---|
| Cadastro realizado | E-mail | E-mail de confirmação de conta |
| E-mail confirmado | In-app | Boas-vindas ao painel |
| Projeto submetido | In-app + E-mail | Confirmação com nome do projeto |
| Análise iniciada | In-app | Um analista iniciou a revisão |
| Ajuste solicitado | In-app + E-mail | Nome do projeto + texto completo do analista |
| Projeto reprovado | In-app + E-mail | Nome do projeto + justificativa completa |
| Projeto aprovado | In-app + E-mail | Parabéns — oferta será criada em breve |
| Oferta publicada | In-app + E-mail | Link direto para a oferta na plataforma |

---

## 7. Painel de Curadoria (Admin)

O painel admin serve como **CRM de projetos e incorporadoras** da equipe interna do Atlas Hub. Centraliza a fila de curadoria, histórico de decisões e gestão de parceiros.

### 7.1 Telas e Rotas

| Tela | Rota | Descrição |
|---|---|---|
| Login | `/admin` | Acesso restrito |
| Dashboard | `/admin/dashboard` | Métricas e funil de projetos |
| Fila de Curadoria | `/admin/curadoria` | Projetos pendentes de análise |
| Detalhe + Scorecard | `/admin/curadoria/:id` | Análise completa + scorecard |
| Histórico | `/admin/historico` | Projetos já decididos |
| Incorporadoras | `/admin/incorporadoras` | Lista de todas as incorporadoras |
| Detalhe da Incorporadora | `/admin/incorporadoras/:id` | Perfil + histórico de projetos |

---

### 7.2 Login e Gestão de Usuários Admin

**Login:**
- E-mail + senha
- Sem cadastro público — contas criadas apenas por um **administrador master**

**Criação de usuários admin (administrador master):**
- O administrador master tem acesso a uma área restrita de gestão de usuários (`/admin/usuarios`)
- Pode criar, desativar e reatribuir projetos de analistas
- Ao criar um novo analista: nome, e-mail, senha temporária — o analista redefine no primeiro acesso

---

### 7.3 Dashboard

**Cards de métricas:**

| Métrica | Período |
|---|---|
| Projetos submetidos | Mês atual / Acumulado |
| Em análise agora | Tempo real |
| Aguardando ajuste da incorporadora | Tempo real |
| Aprovados | Mês atual / Acumulado |
| Reprovados | Mês atual / Acumulado |
| Aguardando publicação na plataforma | Tempo real |
| Ofertas publicadas | Mês atual / Acumulado |
| Tempo médio de análise (dias) | Mês atual |

**Funil visual:**

```
Submetidos → Em Análise → Aprovados → Oferta Criada
                ↘ Ajuste Solicitado → (retorna)
                ↘ Reprovados
```

---

### 7.4 Fila de Curadoria

Lista todos os projetos com status `SUBMETIDO`, `EM_ANALISE` e `AJUSTE_SOLICITADO`.

**Colunas:**

| Coluna | Descrição |
|---|---|
| Nome do projeto | |
| Incorporadora | |
| Modelo | Venda / Renda / Misto |
| Tipo de oferta | Pública / Privada |
| Valor a captar | |
| Data de submissão | |
| Dias aguardando | Calculado automaticamente a partir da submissão |
| Status | Com cor e ícone |
| Analista | Nome do responsável (se atribuído) |
| Ação | Iniciar análise / Continuar / Ver |

**Filtros:**
- Por status
- Por analista responsável
- Por intervalo de datas de submissão
- Por modelo de investimento
- Por tipo de oferta (pública / privada)

**Ordenação padrão:** data de submissão mais antiga primeiro (FIFO)

**Regra de atribuição:** ao clicar em "Iniciar análise", o projeto é atribuído ao analista logado e o status muda para `EM_ANALISE`. Outro analista não pode iniciar uma análise já atribuída — apenas visualizar.

---

### 7.5 Detalhe do Projeto + Scorecard

#### Cabeçalho

- Nome do projeto, incorporadora, status atual, data de submissão, analista responsável
- Botão para voltar à fila
- Indicador de quantas vezes o projeto foi resubmetido (ex: "Revisão 3")

#### Abas de informação (somente leitura)

| Aba | Conteúdo |
|---|---|
| Dados Gerais | Campos da Etapa 1 + tipo de oferta desejada |
| Dados Financeiros | Campos da Etapa 2 + modelo de retorno + plano de saída |
| Documentos | Cada documento com: nome, data de envio, visualização inline, download. Indicador obrigatório / opcional |
| Equipe | Membros com foto, cargo, bio e LinkedIn |
| Incorporadora | Dados cadastrais, documentos da empresa, histórico de decisões anteriores na plataforma |
| Histórico | Linha do tempo completa de ações no projeto com data, hora e usuário |
| Notas Internas | Notas privadas adicionadas por analistas — não visíveis à incorporadora |

#### Notas Internas

- Campo de texto livre visível apenas para a equipe interna
- Qualquer analista pode adicionar uma nota
- Cada nota exibe: autor, data e hora
- Não podem ser editadas ou excluídas após publicadas (imutabilidade para auditoria)

#### Scorecard Manual

| Critério | Peso | O que avaliar |
|---|---|---|
| Localização | 25% | Demanda da região, infraestrutura local, potencial de valorização, facilidade de venda em até 6 meses |
| Viabilidade financeira | 25% | Consistência do orçamento, margem de lucro, cronograma financeiro, histórico do incorporador |
| Qualidade da documentação | 20% | Completude, validade das certidões, regularidade da matrícula, qualidade do memorial |
| Experiência da equipe | 15% | Projetos concluídos anteriormente, qualificação técnica, reputação no mercado |
| Risco do projeto | 15% | Risco de mercado (absorção das unidades), risco de execução (prazo/custo), risco jurídico |

- **Nota de cada critério:** 1 a 10 + campo de comentário obrigatório
- **Nota geral:** média ponderada calculada automaticamente — não editável
- **Parecer final:** texto livre obrigatório antes de qualquer decisão

**Observação sobre o score:** não existe nota mínima automática para aprovação. Toda decisão é humana. O score serve como referência e registro histórico. Um projeto resubmetido exibe o scorecard da análise anterior como referência para o analista.

#### Checklist Pré-Aprovação

Antes de aprovar, o analista deve confirmar:
- [ ] Patrimônio de afetação: cláusula será exigida no contrato com a incorporadora
- [ ] Seguro de obra: apólice será exigida antes da oferta ir ao ar
- [ ] SPE/SCP: estrutura jurídica está constituída ou em processo
- [ ] Elegibilidade CVM 88: receita bruta da incorporadora ≤ R$40M

#### Ações do Analista

| Ação | Pré-condição | O que acontece |
|---|---|---|
| Salvar rascunho | Nenhuma | Salva scorecard sem alterar status |
| Solicitar ajuste | Parecer preenchido | Status → `AJUSTE_SOLICITADO`. Incorporadora notificada |
| Reprovar | Scorecard completo (5 critérios) + parecer | Status → `REPROVADO`. Incorporadora recebe justificativa |
| Aprovar | Scorecard completo + checklist marcado + parecer | Status → `APROVADO`. Incorporadora notificada |

#### Fluxo Pós-Aprovação

Após aprovação, a tela exibe um **card de instruções** para criar a oferta na plataforma:

**Pré-requisito:** verificar se a SPE/SCP da incorporadora já está cadastrada como emissora na plataforma
- Se não estiver: orientar incorporadora a fazer o cadastro PJ na plataforma (KYC até 2 dias úteis)

**Passos na plataforma (manual):**
1. Acessar o painel da plataforma
2. Nova oferta → responder questionário CVM 88
3. Preencher CNPJ da SPE/SCP emissora
4. Definir tipo: **pública** (CVM 88) ou **privada** (club deal — conforme indicado pelo projeto)
5. Selecionar tipo de contrato (SCP ou Nota Comercial — conforme modelo de retorno do projeto)
6. Configurar parâmetros: valor de captação, lote mínimo (R$10/token), prazo, spread Atlas Hub (10%)
7. Configurar valor mobiliário: % de lucro distribuído, periodicidade, simulação de fluxo
8. Configurar mercado secundário: se permite cessão, quem pode negociar
9. Se parcelas (capitalização mensal): configurar entrada e número de parcelas
10. Upload de materiais: fotos, vídeo, pitch deck, documentos adicionais
11. Construir página da oferta: título, texto, FAQ
12. Para oferta pública: pagar taxa de lançamento → aguardar validação jurídica (até 3 dias úteis)
13. Após aprovação: definir data e hora de abertura
14. Copiar o ID da oferta e o link público gerados pela plataforma

**Registro no Atlas Hub:**
1. Preencher campo "ID da oferta"
2. Preencher campo "Link da oferta"
3. Clicar em "Confirmar publicação"

Ao confirmar:
- Status → `OFERTA_CRIADA`
- Data e hora registradas
- Incorporadora recebe notificação com link

---

### 7.6 Histórico de Decisões

Lista todos os projetos com status `APROVADO`, `OFERTA_CRIADA` ou `REPROVADO`.

**Colunas:**

| Coluna | Descrição |
|---|---|
| Nome do projeto | |
| Incorporadora | |
| Modelo | |
| Tipo de oferta | Pública / Privada |
| Valor (meta) | |
| Analista responsável | |
| Nota geral | |
| Decisão | Aprovado / Reprovado |
| Data da decisão | |
| ID da oferta | Quando aplicável |
| Link da oferta | Quando aplicável |
| Ações | Ver análise completa |

**Filtros:** por decisão, por analista, por intervalo de datas, por tipo de oferta

---

### 7.7 Incorporadoras

Lista todas as incorporadoras cadastradas.

**Colunas:**

| Coluna | Descrição |
|---|---|
| Razão social | |
| CNPJ | |
| Responsável | |
| Data de cadastro | |
| Total de projetos | |
| Status do último projeto | |
| Ações | Ver perfil |

---

### 7.8 Detalhe da Incorporadora

- Dados cadastrais completos
- Documentos enviados (contrato social, CNPJ)
- Descrição e histórico de projetos anteriores declarados
- Todos os projetos submetidos: nome, status, nota final, decisão, datas
- Resumo: submetidos / aprovados / reprovados / publicados

---

## 8. Integração white-label (plataforma de investimento)

### 8.1 Modelo de Integração

O Atlas Hub é um **tenant white-label** da plataforma. Toda autenticação com a API usa o header `x-tenant-id` (UUID da plataforma Atlas Hub).

A API disponível (`docs-third`) cobre operações do investidor. A gestão de ofertas e a criação de emissores são feitas pelo painel da plataforma.

### 8.2 Endpoints Disponíveis na API da plataforma de investimento

No MVP, **nenhum desses endpoints é chamado pelo sistema Atlas Hub** — o investidor usa a interface nativa da plataforma. Documentados aqui para referência futura.

#### Autenticação

| Endpoint | Método | Descrição |
|---|---|---|
| `/user/auth` | POST | Login CPF/CNPJ + senha → `access_token`, `refresh_token`, `rpt_token` |
| `/user/auth/code` | POST | Validar código 2FA |
| `/user/auth/refresh-token` | POST | Renovar token |
| `/user/auth/logout` | POST | Encerrar sessão |

#### Cadastro do Investidor (11 steps)

| Endpoint | Método | Descrição |
|---|---|---|
| `/user/regular/verify-cpf` | GET | Verificar se CPF existe (`?value=`) |
| `/user/regular/step-1` | PUT | Nome, sobrenome, telefone, nascimento, estado civil |
| `/user/regular/step-2` | PUT | Nacionalidade, gênero, nome da mãe, RG/passaporte |
| `/user/step-3` | PATCH | E-mail |
| `/user/step-4` | POST | Validar código de e-mail |
| `/user/regular/step-5` | PUT | Ocupação |
| `/user/regular/step-6` | PUT | Documento (frente + verso via URLs S3) |
| `/user/regular/step-7` | PUT | Comprovante de endereço |
| `/user/step-8` | PUT | Endereço completo |
| `/user/regular/step-9` | PUT | Patrimônio total |
| `/user/step-10` | PUT | Perfil de investidor CVM + declaração de investimentos |
| `/user/step-11` | PUT | Confirmação do perfil |

#### Gerenciamento de E-mail

| Endpoint | Método | Descrição |
|---|---|---|
| `/user/email/is-cpf-available` | GET | E-mail vinculado ao CPF (`?document=`) |
| `/user/email` | PATCH | Atualizar e-mail |
| `/user/email/request-confirmation-code` | POST | Reenviar código de confirmação |
| `/user/email/confirm-code` | POST | Confirmar novo e-mail |
| `/user/email/confirm` | POST | Confirmar e-mail |

#### PIN / Assinatura Eletrônica

| Endpoint | Método | Descrição |
|---|---|---|
| `/user/pin` | POST | Criar PIN 6 dígitos (sem sequência, sem repetição, sem parte do CPF/telefone/nascimento) |
| `/user/pin` | PUT | Atualizar PIN |
| `/user/pin/assign` | POST | Assinar operação → retorna `hash` usado em compras e saques |

#### Upload de Documentos

| Endpoint | Método | Descrição |
|---|---|---|
| `/user/regular/document/pre-sign` | POST | URL pré-assinada S3 (válida 15 min) para upload de imagens/PDFs |

#### Chaves PIX

| Endpoint | Método | Descrição |
|---|---|---|
| `/user/bank-account` | POST | Cadastrar chave PIX |
| `/user/bank-account` | GET | Listar chaves (paginado) |
| `/user/bank-account/{id}` | GET | Detalhes de uma chave |
| `/user/bank-account/{id}` | DELETE | Remover chave |

#### Carteira / Saldo

| Endpoint | Método | Descrição |
|---|---|---|
| `/balance` | GET | Saldo atual |
| `/balance/invested` | GET | Total investido (nome da plataforma + valor) |
| `/config/tax/purchase` | GET | Taxas de compra atuais (`?amount=`) |

#### Depósito via PIX

| Endpoint | Método | Descrição |
|---|---|---|
| `/balance/cash-in/pix` | POST | Gerar QR Code / BRCode para depósito |
| `/balance/cash-in/{id}` | GET | Status do depósito (`status`, `brcode`, `qrcode`, `dueDate`) |
| `/balance/cash-in` | GET | Histórico de depósitos (paginado) |

#### Saque via PIX

| Endpoint | Método | Descrição |
|---|---|---|
| `/balance/cash-out` | POST | Realizar saque (requer `pinHash`) |
| `/balance/cash-out/{id}` | GET | Status do saque |

#### Investimento (Compra de Cotas)

| Endpoint | Método | Descrição |
|---|---|---|
| `/balance/offer/{offerId}/purchase` | POST | Comprar cotas (`quantity`, `tax`, `affiliateId`, `saleChannelId`) |
| `/balance/offer/{offerId}/purchase/{id}/refunde` | PUT | Cancelar compra em até 5 dias (`reasonForCancellation`, `pinHash`) |
| `/balance/offer/{offerId}/purchase/{id}/detailed` | GET | Detalhes: `offer`, `quotas`, `amount`, `status`, `total`, `tax`, `contract`, `date`, `refund` |

**Status de uma compra:** `PENDING` `CANCELED` `FAILED` `FAILED_REFUND` `APPROVED` `EXPIRED` `REFUNDED` `COMPLETED`

**Status de uma oferta:** `DRAFT` `EXCLUDED` `WAITING_TAX_PAYMENT` `IN_APPROVAL` `IN_APPROVAL_CORRECTION` `WAITING_DOCUMENTS_SIGNATURE` `WAITING_RELEASE` `SCHEDULED_CAPTURE` `APPROVED_CAPTURE` `PAUSED` `CANCELLED` `FINISHING_CAPTURE` `FINISHED_SUCCESS` `FINISHED_UNSUCCESS` `CONCLUDED`

#### Contrato de Adesão

| Endpoint | Método | Descrição |
|---|---|---|
| `/balance/offer/{offerId}/purchase/{purchaseId}/contract` | GET | Visualizar termo (`id`, `hash`, `markdown`, `acceptedAt`) |
| `/balance/offer/{offerId}/purchase/{purchaseId}/contract/accept` | PUT | Aceitar termo (`pinHash`) |

### 8.3 Lacunas Conhecidas da API

| Funcionalidade ausente | Impacto |
|---|---|
| Listagem de investimentos por usuário | Sem armazenar `purchaseId` localmente, portfolio não é acessível |
| Dados do perfil autenticado (`GET /user/me`) | Não é possível recuperar dados do investidor após login |
| Recuperação de senha | Fluxo de "esqueci minha senha" não existe na API |
| Criação/gestão de ofertas | Somente via painel da plataforma |
| Histórico de rendimentos | Não disponível na API |
| Webhooks de eventos | Status desconhecido — a confirmar com o fornecedor da stack |

### 8.4 Modelos de contrato na plataforma

| Tipo | Uso recomendado |
|---|---|
| **SCP (Sociedade em Conta de Participação)** | Participação nos lucros — Modelo 1 (Venda). Não exige garantidor |
| **Nota Comercial** | Dívida pré-fixada. Exige aval dos sócios como garantia |
| **Mútuo Conversível** | Dívida convertível em participação societária |
| **Compartilhamento de Receita** | % da receita da emissora |
| **CPRF** | Agronegócio — não aplicável ao Atlas Hub |

Para o MVP (Modelo 1 — Venda): recomendados **SCP** ou **Nota Comercial**.

### 8.5 Tipos de oferta na plataforma

| Tipo | Regras | Quando usar |
|---|---|---|
| **Pública** | CVM 88 completo: validação jurídica (3 dias úteis), ilimitado de investidores, triggers automáticos, fórum obrigatório | Projetos com captação ampla |
| **Privada (club deal)** | Sem publicação CVM 88, até 15 investidores, lista controlada, contratos próprios permitidos, resgate parcial permitido antes do encerramento | Projetos para grupos fechados de investidores |

### 8.6 Checklist de setup da plataforma de investimento (pré go-live)

Antes de o sistema Atlas Hub entrar em produção, o seguinte deve estar configurado no painel da plataforma:

- [ ] Logo da plataforma Atlas Hub
- [ ] Cores primárias e secundárias
- [ ] Domínio customizado configurado
- [ ] Banner da home (ou carrossel)
- [ ] Equipe interna cadastrada com permissões adequadas
- [ ] Módulo de atendimento configurado
- [ ] `x-tenant-id` obtido e armazenado com segurança

---

## 9. Regras de Negócio

### 9.1 Regras CVM Resolução 88

| Regra | Valor | Quem controla |
|---|---|---|
| Receita bruta máxima do emissor | R$40M/ano (até R$80M em casos específicos) | Curadoria Atlas Hub |
| Captação máxima por oferta pública | R$15M por SPE por ano | Configurado na criação da oferta (plataforma) |
| Prazo máximo de captação pública | 180 dias | plataforma |
| Desistência do investidor | 5 dias após a compra | plataforma (botão some no 6º dia) |
| Trigger de sucesso | Mínimo 2/3 do valor alvo | plataforma (automático) |
| Insucesso | Não atingiu 2/3 no prazo | plataforma (devolução automática) |
| Fórum obrigatório | Por oferta | plataforma |
| Prestação de informações semestral | 6 meses após encerramento | plataforma (agenda automática) + Atlas Hub (envia o conteúdo) |

### 9.2 Regras Financeiras

- Taxa da plataforma: **10% sobre o valor captado**, cobrada progressivamente durante a captação
- Configurada no spread da oferta no painel da plataforma
- O emissor recebe líquido após dedução da taxa
- Recursos durante a captação ficam em conta ECO (escrow plataforma) — Atlas Hub não tem acesso
- Após sucesso: recursos liberados para a wallet do emissor → emissor faz cash-out via PIX para conta bancária da SPE
- **Proibido durante a captação:** aplicar os recursos em CDB ou qualquer investimento — CVM 88 proíbe gestão discricionária dos recursos dos investidores durante a captação

### 9.3 Regras do Período de Carência (Incorporadora)

Lei da Incorporação — prazo de 180 dias após o registro da incorporação para desistência:
- Todos os valores pagos pelos investidores devem ser devolvidos com correção monetária e juros
- A taxa de captação (10%) é devolvida com multa ao incorporador
- Os rendimentos do período ficam com os investidores
- Os demais encargos são de responsabilidade do incorporador

### 9.4 Regras de Curadoria

- Um projeto só pode estar atribuído a um analista por vez
- O analista que clica em "Iniciar análise" é o responsável até a decisão final
- Reatribuição só por administrador master, com registro do motivo
- Não existe nota mínima para aprovação — decisão sempre humana
- Projeto reprovado pode ser resubmetido sem limite de tentativas
- A cada nova análise, o analista vê o scorecard e notas internas das análises anteriores
- O checklist pré-aprovação deve estar totalmente marcado para habilitar o botão "Aprovar"

### 9.5 Regras de Upload de Documentos

| Parâmetro | Documentos do projeto | Fotos do projeto | Documentos da empresa |
|---|---|---|---|
| Formatos aceitos | PDF, JPG, PNG | JPG, PNG | PDF, JPG, PNG |
| Tamanho máximo por arquivo | 50 MB | 10 MB | 20 MB |
| Quantidade máxima | 1 por campo (exceto "outros") | 10 fotos | 1 por campo |

### 9.6 Regras de Auditoria

Todas as ações abaixo são registradas com: usuário, data, hora e descrição:

- Criação de conta (incorporadora ou analista)
- Confirmação de e-mail
- Login e logout
- Criação de rascunho de projeto
- Submissão de projeto
- Início de análise (atribuição)
- Reatribuição de projeto
- Salvamento de rascunho do scorecard
- Adição de nota interna
- Solicitação de ajuste
- Reprovação
- Aprovação
- Registro do ID e link da oferta
- Confirmação de publicação

---

## 10. Impedimentos para Produção

Itens que não bloqueiam o desenvolvimento mas devem estar resolvidos antes do go-live:

| Impedimento | Impacto |
|---|---|
| Contrato white-label não assinado | Sem `x-tenant-id`, a stack de investimento não é configurada e aprovações não resultam em ofertas publicadas |
| Pessoa jurídica Atlas Hub não constituída | Necessária para assinar a stack white-label e operar como licenciado CVM 88 |
| Storage de arquivos não provisionado | Sem S3 (ou equivalente), uploads de documentos não funcionam |
| Serviço de e-mail transacional não configurado | Notificações e confirmação de cadastro não são enviadas |

---

## 11. Pós-MVP — Funcionalidades Futuras

| Funcionalidade | Descrição |
|---|---|
| Modelos 2 e 3 (Renda e Misto) | Construção para aluguel e modelo misto com distribuição de aluguéis |
| Múltiplos usuários por incorporadora | Equipe da incorporadora com diferentes permissões no portal |
| Automação da criação de oferta na plataforma | Via API quando plataforma disponibilizar o endpoint |
| Webhooks da plataforma → Atlas Hub | Sincronização automática: captação encerrada, distribuição paga, etc. |
| Curadoria com dados de APIs externas | Urbit, Zoneval ou CASAFARI para enriquecer a análise do analista |
| Governance / Votação | Mecanismo para investidores votarem em decisões relevantes (ex: mudança de modelo) |
| Acompanhamento de obra | Painel com progresso físico da obra (integração com Arquis ou similar) |
| KPIs para incorporadores | Análises de mercado por região, produtos mais vendidos, tendências |
| App mobile nativo | iOS e Android |
| Tokens como crédito interno | Sistema de reinvestimento usando créditos da plataforma (para saídas antecipadas) |
| Tokenização via blockchain proprietária | Dependente de aprovação regulatória no Brasil (em discussão no Senado) |
| Score automático | Algoritmo de avaliação automática de projetos com base em APIs externas |
| Limite de captação configurável | Threshold mínimo de captação antes de liberar início da obra (a definir) |
