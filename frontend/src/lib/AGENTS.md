# AGENTS.md — lib

- Funções puras e clientes finos (upload, viabilidade, env, utils).
- Sem comentários.
- Sem React hooks aqui.
- `upload.ts` fala com API real; falha de PUT S3 deve lançar Error clara.
- `viabilidade.ts` calcula localmente; persistência é responsabilidade da feature.
