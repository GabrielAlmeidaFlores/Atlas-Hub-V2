# AGENTS.md — functions

- Um arquivo = uma Lambda = um endpoint (ou família estreita).
- Sem comentários.
- Ordem típica: auth → path/body validate → regra de negócio → db/storage → response.
- Não duplicar schemas; importar de `shared/http/validators`.
