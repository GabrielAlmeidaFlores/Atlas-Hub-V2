# 👤 Usuários de Teste - Atlas Hub

## 🏢 Incorporadora

**E-mail:** `joao@atlas.com.br` (ou qualquer e-mail sem `@atlashub`)  
**Senha:** `qualquer` (QUALQUER senha funciona em modo mock)  
**Perfil:** Incorporadora (detectado automaticamente)  
**Empresa:** Construtora Atlas Ltda  
**CNPJ:** 12.345.678/0001-95

### Projetos associados:
- **Residencial Jardins** (EM_ANALISE)
- **Comercial Faria Lima** (RASCUNHO)
- **Casa Verde Campinas** (OFERTA_CRIADA)

---

## 👨‍💼 Admin - Analista

**E-mail:** `felipe@atlashub.admin` (qualquer e-mail com `@atlashub` exceto "master")  
**Senha:** `qualquer` (QUALQUER senha funciona)  
**Perfil:** ANALISTA (detectado automaticamente)  
**Nome:** Felipe Analista

**Permissões:**
- ✅ Ver fila de curadoria
- ✅ Analisar projetos
- ✅ Aprovar/reprovar projetos
- ✅ Solicitar ajustes
- ✅ Registrar oferta
- ❌ Criar admins
- ❌ Dupla aprovação Pix

---

## 👨‍💼 Admin - Master

**E-mail:** `admin@atlashub.master` (qualquer e-mail com "master" ou "admin@atlashub")  
**Senha:** `qualquer` (QUALQUER senha funciona)  
**Perfil:** ADMIN_MASTER (detectado automaticamente)  
**Nome:** Admin Master

**Permissões:**
- ✅ Todas as permissões do Analista
- ✅ Criar/gerenciar usuários admin
- ✅ Solicitar Pix
- ✅ Aprovar Pix (dupla aprovação)
- ✅ Cadastrar split receivers
- ✅ Acessar financeiro completo
- ✅ Ver captação e ofertas

---

## 🧪 Como usar em DEV

### 1. Login no Frontend
```
URL: http://localhost:5173/login
E-mail: QUALQUER (o perfil é detectado automaticamente)
Senha: QUALQUER (não há validação em modo mock)
```

**Exemplos que funcionam:**
```
✅ teste@teste.com + senha: 123 → INCORPORADORA
✅ admin@atlashub.master + senha: abc → ADMIN_MASTER
✅ analista@atlashub + senha: 1 → ANALISTA
✅ joao@empresa.com + senha: qualquer → INCORPORADORA
```

### 2. Detecção Automática de Perfil
O sistema detecta seu perfil baseado no **e-mail**:

- **ADMIN_MASTER:** e-mail contém "master" OU começa com "admin@atlashub"
- **ANALISTA:** e-mail contém "@atlashub" (mas não "master")
- **INCORPORADORA:** todos os outros e-mails

### 3. Testar fluxos específicos

**Incorporadora:**
```
Login → Dashboard → Novo Projeto → Wizard 5 etapas
```

**Analista:**
```
Login → Admin → Curadoria → Selecionar projeto → Aprovar
```

**Admin Master:**
```
Login → Admin → Financeiro → Conta SPE → Cadastrar Split
Login → Admin → Financeiro → Conta SPE → Solicitar Pix
```

---

## 📝 Notas Importantes

1. **Modo Mock Ativo:** O frontend detecta que o Cognito não está configurado (`.env.local`) e ativa modo mock. QUALQUER login funciona!

2. **MSW ativo:** Mock Service Worker intercepta todas as chamadas API e retorna dados mockados.

3. **Sem validação:** Zero validação de senha. Pode usar "1", "a", qualquer coisa.

4. **Persistência:** Dados não persistem entre reloads. Cada refresh reseta para os mocks iniciais.

5. **Console do navegador:** Você verá `🎭 Mock login: email@exemplo.com como PERFIL` confirmando o modo mock.

4. **Backend real:** Quando conectar ao backend real (após deploy), você precisará:
   - Usuários criados no Cognito
   - E-mail confirmado
   - Senha válida (mínimo 8 caracteres)

---

## 🔐 Credenciais Produção (ainda não criadas)

Quando o backend for deployado e conectado:

### Admin Master inicial
Será criado automaticamente pelo Lambda `bootstrapAdmin` se o pool estiver vazio:
- E-mail: definido em deploy
- Senha: gerada temporariamente
- Perfil: ADMIN_MASTER

### Incorporadoras
Cadastram-se pelo formulário público (`/cadastro`):
- Preenchem dados completos
- Recebem e-mail de confirmação
- Confirmam e-mail para ativar conta

### Outros Admins
Admin Master cria via painel (`/admin/usuarios`):
- Define e-mail e perfil (ANALISTA ou ADMIN_MASTER)
- Sistema gera senha temporária
- Novo admin recebe e-mail com senha
