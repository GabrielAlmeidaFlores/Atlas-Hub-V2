# 🧭 Roteiro de Teste de Navegação

Execute este roteiro no frontend rodando em http://localhost:5173/

## 1. Landing → Cadastro → Dashboard
1. Acesse http://localhost:5173/
2. Clique em "Cadastrar"
3. Preencha formulário (use mocks do MSW)
4. Após submeter, deve redirecionar para tela de confirmação de e-mail

## 2. Login → Dashboard → Novo Projeto
1. Volte para `/login`
2. Faça login (MSW aceita qualquer credencial)
3. Dashboard deve exibir projetos mockados
4. Clique em "Novo Projeto"
5. Navegue pelas 5 etapas do wizard
6. Salve rascunho e veja se mantém dados ao retornar

## 3. Admin → Curadoria → Aprovar
1. Acesse `/admin/curadoria` (precisa ser admin)
2. Veja fila de projetos SUBMETIDO
3. Clique em um projeto
4. Preencha scorecard
5. Marque checklist
6. Aprove o projeto
7. Registre ID e link da oferta

## 4. Admin → Financeiro → Split
1. Acesse `/admin/financeiro`
2. Clique em uma conta SPE
3. Veja extrato, solicitações, auditoria
4. Se for ADMIN_MASTER:
   - Clique em "Cadastrar split"
   - Preencha formulário (nome, CPF/CNPJ, Pix)
   - Submeta e veja toast de sucesso
   - Verifique "Último beneficiário: rec_xyz"

## 5. Admin → Captação → Ofertas
1. Acesse `/admin/captacao`
2. Veja KPIs (captado, compras, ofertas)
3. Veja eventos recentes
4. Clique em uma oferta
5. Veja detalhe: KPIs, compras, eventos
6. Verifique status de encerramento (se houver)

## 6. Verificações Gerais
- [ ] Nenhum erro no console do navegador
- [ ] Nenhum warning de React no console
- [ ] Todas as navegações funcionam
- [ ] Breadcrumbs corretos
- [ ] Botões habilitados/desabilitados conforme lógica
- [ ] Toasts aparecem e desaparecem
- [ ] Modais abrem e fecham
- [ ] Loading states exibidos durante chamadas API
