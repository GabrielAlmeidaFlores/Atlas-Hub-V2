# Analytics Atlas — catálogo e funis

Módulo nativo de analytics (LP + portal + admin). Sem Mixpanel/PostHog.

## Coleta

- SDK: `frontend/src/lib/analytics/`
- Ingestão: `POST /analytics/collect` (batch, público na LP; autenticado no app)
- Identidade: cookie/localStorage `atlas_aid` → merge com `userId` após login
- Session: `atlas_sid`
- Replay opt-in: `localStorage atlas_replay_optin=1` (grava rrweb quando opt-in; player no admin)
- Segmentação admin: query `utm|device|os|browser|geo|userId` no dashboard/funnel
- Alertas: cron horário avalia regras e envia SES aos admins ativos
- Geo: SDK (timezone/idioma) + header `CloudFront-Viewer-Country` no collect
- Merge anônimo→user: atualiza sessões e reescreve `userId` nos eventos recentes

## Admin

| Rota UI | API |
|---|---|
| `/admin/analytics` | dashboard, funnel, heatmap, alerts, export, replay |
| `/admin/analytics/users/:userId` | perfil + timeline |

## Catálogo de eventos v1

| Evento | Origem | Props típicas |
|---|---|---|
| `page_view` | LP / app | — |
| `hero_view` | LP | — |
| `section_view` | LP | `section` |
| `scroll_25/50/75/100` | LP | `band` |
| `cta_click` | LP | `cta` |
| `whatsapp_click` / `email_click` / `phone_click` | LP | — |
| `form_view` / `form_start` / `form_submit` | Cadastro | `form` |
| `exit_page` | LP/app (beacon) | — |
| `heatmap_click` | LP (amostra ~15%) | `xNorm`, `yNorm` |
| `heatmap_scroll` | LP | `band` |
| `login` / `logout` / `signup` | Auth | — |
| `email_confirmed` | Auth | — |
| `password_recovery` | Auth | — |
| `profile_updated` | Perfil | — |
| `company_doc_uploaded` | Perfil | `doc` |
| `project_created` / `project_updated` | Wizard | `projectId` |
| `project_doc_uploaded` / `project_photo_uploaded` | Wizard | `projectId` |
| `project_submitted` / `project_resubmitted` | Wizard | `projectId` |
| `curation_started` / `curation_adjustment` / `curation_rejected` / `curation_approved` | Admin curadoria | `projectId` |
| `offer_published` | Admin curadoria | `projectId` |
| `api_error` | `api.ts` | `code`, `route`, `status` |
| `replay_chunk` | SDK (opt-in) | `optIn`, `sampled` |

## Funil padrão Atlas

1. `page_view` — Visitante LP  
2. `hero_view` — Visualizou Hero  
3. `section_view` — Seção chave  
4. `form_view` — Viu formulário  
5. `form_start` — Iniciou formulário  
6. `form_submit` — Enviou cadastro  
7. `email_confirmed` — Confirmou e-mail  
8. `login` — Primeiro login  
9. `profile_updated` — Completou perfil  
10. `project_created` — Criou projeto  
11. `project_submitted` — Submeteu curadoria  
12. `offer_published` — Oferta publicada  

## LGPD

- IP hasheado no collect
- Sem PII desnecessária em props
- Geo aproximado (timezone/idioma + CloudFront) quando disponível no contexto
- Replay só com opt-in + amostragem + retenção curta (eventos rrweb no Dynamo, limiar de tamanho)

## Persistência

Tabelas Dynamo (stage): Events, Sessions, DailyAgg, Heatmaps, Alerts, Replays.
