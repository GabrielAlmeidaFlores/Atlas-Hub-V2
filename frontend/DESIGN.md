# Frontend — Design System Atlas Hub

Espelha o system design do **PULSE-IPS**. Só a marca Atlas muda (navy/gold + logo).

## Não mudar

- Fluxos de negócio / rotas / contratos de API
- Navy `#1B2B5E`, gold `#C49020`
- `public/atlas-logo.png`, `public/atlas-icon.png`

## Regras de UI

1. **Radius 0** em chrome de produto (sidebar, tabelas, inputs, badges, dialogs).
2. **Poppins** como fonte única.
3. Labels de UI em **uppercase + tracking-widest**.
4. Status via tokens `status-success|warning|danger|info` — não usar `emerald`/`orange`/`blue`/`amber` soltos.
5. Superfícies: `bg-muted`, `border-border`, `text-foreground`, `text-muted-foreground` — evitar hex cinza ad hoc (`#E5E7EB`, `#F9FAFB`, etc.).
6. KPIs com `StatCard` (`border-l-4`) ou `kpi-strip`.
7. Listas: `FilterBar` + `DataTable` (`components/ui/filter-bar`, `data-table`) — chrome afiado PULSE.
8. Landing: utilitários `lp-*` + `AnimateIn`.
9. Ações positivas de decisão: `bg-status-success` ou `btn-primary` — não `green-600`.

## Status da paridade (2026-07-17)

Alinhado ao chrome PULSE: radius 0, Poppins, tokens `status-*`, shells `h-14`/`h-12`, `FilterBar`/`DataTable`, KPIs `border-l-4`, LP `lp-*`.

**Mantido de propósito (marca Atlas):** navy `#1B2B5E`, gold `#C49020`, logos.

**Diferenças estruturais aceitas (não são estilo de produto):** Vite+RR vs Next; toasts próprios vs `sonner`; Tailwind 3 vs 4.

## Onde editar

| O quê | Onde |
|---|---|
| Tokens / `.btn` / `.field` / `.table` | `src/styles/globals.css` |
| Tailwind theme | `tailwind.config.ts` |
| Badges helpers | `src/lib/badge-labels.ts` |
| Shells | `src/app/layouts/` |
| Toasts | `src/components/ui/toast-provider` |
| Tabelas / filtros | `src/components/ui/data-table`, `filter-bar` |

## Referência

`/Users/gabrielflores/Documents/projects/production/PULSE-IPS` — `src/app/globals.css`, `src/libs/design-system/*`.
