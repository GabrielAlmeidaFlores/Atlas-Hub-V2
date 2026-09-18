# 🧪 Como Testar o Atlas Hub Localmente

## ✅ Frontend Rodando

**URL:** http://localhost:5175/

---

## 🔑 **Login - MODO MOCK ATIVO**

### Qualquer credencial funciona!

```
E-mail: qualquer@email.com
Senha: 123
```

### Exemplos de teste rápido:

| E-mail | Senha | Perfil Detectado |
|--------|-------|------------------|
| `admin@atlashub.master` | `1` | ADMIN_MASTER |
| `analista@atlashub` | `a` | ANALISTA |
| `joao@empresa.com` | `123` | INCORPORADORA |

---

## 🎭 Como funciona o modo mock:

1. **Cognito desabilitado:** `.env.local` tem as variáveis vazias
2. **Auth store detecta:** Se não há Cognito configurado, ativa modo mock
3. **Login aceita tudo:** QUALQUER e-mail + QUALQUER senha
4. **Perfil automático:** Detectado pelo formato do e-mail

---

## 🔍 Verificar se está funcionando:

1. **Abra o console do navegador** (F12)
2. **Acesse:** http://localhost:5175/login
3. **Digite qualquer coisa e entre**
4. **Veja no console:**
   ```
   🎭 Modo Mock: Cognito não configurado
   🎭 Mock login: seu@email.com como PERFIL
   ```

---

## 🚨 Se ainda der erro:

### 1. Limpe o cache do navegador
```
Cmd+Shift+R (Mac) ou Ctrl+Shift+R (Windows)
```

### 2. Verifique o `.env.local`
```bash
cat frontend/.env.local
```

Deve estar assim:
```
VITE_COGNITO_USER_POOL_ID=
VITE_COGNITO_CLIENT_ID=
VITE_API_URL=
VITE_AWS_REGION=sa-east-1
VITE_MODE=development
```

### 3. Reinicie o Vite
```bash
cd frontend
yarn dev
```

### 4. Abra em aba anônima
- Chrome: Cmd+Shift+N
- Firefox: Cmd+Shift+P

---

## 📋 Roteiro de Teste

### 1. Login e Dashboard
- [ ] Login com qualquer credencial
- [ ] Dashboard carrega
- [ ] Projetos mockados aparecem

### 2. Testar como Incorporadora
```
Login: joao@empresa.com / 123
```
- [ ] Ver dashboard
- [ ] Clicar em "Novo Projeto"
- [ ] Navegar pelas 5 etapas
- [ ] Ver projeto em detalhes

### 3. Testar como Analista
```
Login: analista@atlashub / abc
```
- [ ] Acessar `/admin/curadoria`
- [ ] Ver fila de projetos
- [ ] Clicar em um projeto
- [ ] Ver scorecard

### 4. Testar como Admin Master
```
Login: admin@atlashub.master / 1
```
- [ ] Acessar `/admin/financeiro`
- [ ] Ver contas SPE
- [ ] Clicar em "Cadastrar split"
- [ ] Preencher e enviar
- [ ] Ver toast de sucesso
- [ ] Acessar `/admin/captacao`
- [ ] Ver ofertas e eventos

---

## 🐛 Erros Comuns

### "Auth UserPool not configured"
**Causa:** O Vite ainda está usando o `.env` antigo com Cognito configurado.

**Solução:**
1. Confirme que `.env.local` existe com valores vazios
2. Pare o Vite (Ctrl+C)
3. Reinicie: `yarn dev`
4. Limpe cache do navegador (Cmd+Shift+R)

### "Credenciais inválidas"
**Causa:** O modo mock não está ativo.

**Solução:**
1. Abra console do navegador (F12)
2. Procure por: `🎭 Modo Mock: Cognito não configurado`
3. Se não aparecer, o `.env.local` não está sendo lido
4. Verifique se está na pasta `frontend/` (não na raiz)

### Página em branco
**Causa:** Erro de JavaScript.

**Solução:**
1. Abra console do navegador
2. Veja o erro
3. Tente em aba anônima
4. Limpe cache + hard reload

---

## ✅ Checklist Rápido

- [ ] Frontend rodando em http://localhost:5175/
- [ ] Console mostra: `🎭 Modo Mock: Cognito não configurado`
- [ ] Login com `teste@teste.com` / `123` funciona
- [ ] Dashboard carrega após login
- [ ] Navegação entre páginas funciona
- [ ] Nenhum erro no console do navegador

---

## 📞 Suporte

Se continuar com problemas:
1. Tire print do erro no console
2. Mostre o conteúdo de `frontend/.env.local`
3. Mostre a URL que está acessando
