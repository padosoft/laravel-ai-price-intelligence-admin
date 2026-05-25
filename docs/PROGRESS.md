# PROGRESS — laravel-ai-price-intelligence-admin

> Live resume state. Update after every meaningful step.

## Status
Building the web admin panel for the core. One PR per phase, strict local-Copilot → CI →
GitHub-Copilot loop, auto-merge authorized. Core consumed: **v1.2.0** (competitor-products list +
match candidate metadata, released 2026-05-25).

## Roadmap (live)
- [x] **A0** — repo scaffold + tooling (PR #1).
- [x] **A1** — design system + shell + charts (merged).
- [x] **A2** — API client + Sanctum auth + TS types + i18n IT/EN + TanStack Query + mock layer (merged).
- [x] **A3** — Dashboard, Catalog, Targets (pages-a) — PR #6 merged.
- [~] **A4** — Matches (swipe deck), Competitors, CompetitorDetail (tabs), Prices (pages-b) —
  branch `feat/admin-a4-screens-pages-b`, IN PROGRESS. Wired against the live core v1.2 contract:
  `useMatches`/`useMatchActions` (approve/reject), `useCompetitors`, `useCompetitorDetail`,
  `useCompetitorPrices`, `useFetchLogs`. New types: MatchProposal/MatchEvidence/CompetitorListItem.
  40 Vitest + 4 Playwright (+axe) green; typecheck/lint/build clean. **Deferred to A7**: the
  multi-competitor promo gantt (needs a promo-series endpoint — candidate core gap, not mocked) and
  the `.badge`/`.price-delta` token contrast + `h1→h3` heading-order (prototype DS, a11y phase).
- [ ] A5 — Anomalies, Forecasts, Narrative, Assortment, ContentGap, Reviews (pages-c).
- [ ] A6 — Repricer, Alerts, Webhooks, ApiKeys, Compliance, Settings (pages-d).
- [ ] A7 — Real-time alerts (SSE) + i18n polish + a11y/dark parity (incl. contrast token + heading-order sweep).
- [ ] A8 — README wow + screenshots, consolidate LESSON, tag v1.0.0 + release.

## Superseded A1-era notes (kept for history)
- [x] **A0 — Repo scaffold + tooling** (PR #1 merged): full PHP+JS toolchain, CI 5 jobs green,
  EnsureAdmin (Gate-only, auth:sanctum), PanelController (manifest→assets cached), boot tests.
- [ ] **A1 — Design system + shell + charts** (branch `feat/admin-a1-design-system`, IN PROGRESS):
  - DONE: ported the prototype's full design system CSS verbatim → `resources/js/styles/design.css`
    (token system + dual theme via `[data-theme]` + all semantic component classes: .btn .card .kpi
    .badge .tbl .ai-badge .price-delta .conf .treemap .promo-gantt .match-* etc.), imported after
    Tailwind in `globals.css`. Build green (CSS bundle ~55KB).
  - NEXT: port `ui.jsx` → `resources/js/components/ds/` (Icon + I icon map; StatusBadge, Sparkline,
    Modal, Drawer, Kbd, ToastProvider/useToast, Skeleton; domain primitives Price, PriceDelta,
    AiBadge, ConfidenceBadge, Flag, HostChip, BrandMark, Tag) and `lib/format.ts` (fmtRelative/
    Time/DateTime/Duration/Num/Pct, jsonHighlight). Then `shell.jsx` → Sidebar/Topbar/CommandPalette/
    TenantSwitcher, and `charts.jsx` → chart kit. Vitest on primitives + theme toggle. Source of
    truth: `~/Downloads/ai-price-intelligence-web-panel/project/{ui,shell,charts}.jsx`.
- [ ] A2 — API client + Sanctum auth + TS types + i18n IT/EN + TanStack Query + mock layer.
- [ ] A3 — Screens: Dashboard, Catalog, Targets (pages-a).
- [ ] A4 — Screens: Matches, Competitors, CompetitorDetail, Prices (pages-b).
- [ ] A5 — Screens: Anomalies, Forecasts, Narrative, Assortment, ContentGap, Reviews (pages-c).
- [ ] A6 — Screens: Repricer, Alerts, Webhooks, ApiKeys, Compliance, Settings (pages-d).
- [ ] A7 — Real-time alerts (SSE) + i18n polish + a11y/dark parity.
- [ ] A8 — README wow + screenshots, consolidate LESSON, tag v1.0.0 + release.

## ⚠️ Core API gap (discovered at A2 start — 2026-05-24)
The core v1.0.0 exposes only: `/health`, catalog (index/show/bulk/csv/delete), targets
(index/store/update/discover:now), matches (index/approve/reject/competitor-products),
alerts (index/ack), webhook-subscriptions (CRUD/test). The admin's 19 screens + PROJECT.md §7
need MORE. Per the core-gap-backfill policy, these are implemented + released in the CORE first,
then the admin wires them (no mock-and-ship):

Missing core endpoints to backfill (grouped):
- **Auth/identity**: `GET /tenants/me` (tenant + features + abilities) — blocks AuthProvider.
- **Observations/analytics**: `GET /observations/prices`, `/observations/prices/diff`,
  `GET /competitor-products/{id}` (detail + latest snapshots), stock/promo/content snapshots.
- **Intelligence**: `GET /forecasts`, `/anomalies`, `/narratives`, `/content-gaps`,
  `/assortment-gaps`, `/reviews` (insights).
- **Pricing**: `GET/POST/PATCH/DELETE /rules`, `POST /rules/{id}/simulate`, `GET /rule-decisions`.
- **System**: `GET/POST /api-keys` (+revoke), `GET /audit/fetch-logs`, `GET /jobs/stats`,
  `POST /targets/{id}/scrape:now`, `GET /alerts/stream` (SSE), `GET /openapi.json`.

Plan: build A2 admin-side infra (types mirroring PROJECT §7, typed client, TanStack Query, i18n,
AuthProvider shape) now; backfill the core API + release (core v1.1.x); then A3–A6 wire each screen
against the real endpoints. Reviews/Repricer/Compliance reads gate on core feature flags.

## Next action (A2)
Build admin-side infra on `feat/admin-a2-api-auth-i18n`: TS types mirroring PROJECT §7, typed
fetch client (cookie + X-XSRF-TOKEN in SPA mode, Bearer token in headless mode; RFC-7807 error
mapping), TanStack Query provider + base hooks,
i18next IT/EN, AuthProvider (shape ready for `GET /tenants/me`). Then switch to the CORE repo to
backfill the missing API endpoints (start with `/tenants/me`) + release core v1.1.x, return here,
bump the core dependency, and wire the real auth/feature flags before A3.

---
### A1 (done) detail
A1 progress on `feat/admin-a1-design-system`: DONE so far — design.css port, ds primitives + Vitest,
shell nav config + Sidebar + Topbar + AppShell, App wired with theme persistence + routing + demo
identity, a11y fixes (main landmark, AA contrast tokens), font @import hoisted. All local gates green
(typecheck/lint/vitest 15/build/e2e+axe). REMAINING for A1: port `shell.jsx` CommandPalette +
TenantSwitcher (need catalog/competitor/tenant data — may pair with A2 mock layer) and `charts.jsx`
chart kit. Then local-Copilot loop → push → CI → GitHub-Copilot loop → squash-merge → A2.

## Key facts
- Frontend lives in `resources/js/` (avoids clash with PHP PSR-4 `src/`). Alias `@/*`.
- Vite `base` = `./` (relative — works under `vite preview` for e2e and when published under
  `/vendor/price-intelligence-admin/`); build → `resources/dist`; Blade resolves hashed asset URLs
  from the published Vite manifest via `asset()`. Vite 5+ emits the manifest at
  `.vite/manifest.json`; the Blade checks that path first and falls back to a root `manifest.json`
  for older Vite builds.
- UI source of truth: `~/Downloads/ai-price-intelligence-web-panel/project/` (~8000 lines, 19 screens).
- Core API contract: `laravel-ai-price-intelligence/docs/PROJECT.md` §7 + `/api/v1`.
