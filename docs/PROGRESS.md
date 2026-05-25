# PROGRESS — laravel-ai-price-intelligence-admin

> Live resume state. Update after every meaningful step.

## Status
Building the web admin panel for the core. One PR per phase, strict local-Copilot → CI →
GitHub-Copilot loop, auto-merge authorized. Core consumed: **v1.2.0** (competitor-products list +
match candidate metadata, released 2026-05-25).

## Roadmap (live) — ALL COMPLETE ✅
- [x] **A0** — repo scaffold + tooling (PR #1).
- [x] **A1** — design system + shell + charts.
- [x] **A2** — API client + Sanctum auth + TS types + i18n IT/EN + TanStack Query + mock layer.
- [x] **A3** — Dashboard, Catalog, Targets (pages-a) — PR #6.
- [x] **A4** — Matches (swipe deck), Competitors, CompetitorDetail, Prices (pages-b) — PR #7.
      Required core **v1.2.0** backfill (`GET /competitor-products` + match candidate metadata).
- [x] **A5** — Anomalies, Forecasts, Narrative, Assortment, ContentGap, Reviews (pages-c) — PR #8.
- [x] **A6** — Repricer, Alerts, Webhooks, ApiKeys, Compliance, Settings (pages-d) — PR #9.
- [x] **A7** — Real-time SSE alerts + i18n switcher + WCAG-AA contrast (color-contrast enforced in
      axe) — PR #10. `heading-order` (global h1→h3 card-title) is the one deferred best-practice item.
- [x] **A8** — README (screenshot gallery) + LESSON consolidated into AGENTS.md + tag v1.0.0.

All 19 screens shipped, wired to the live core API; 55 Vitest + 8 Playwright (+axe) green.

## B-phase roadmap (admin) — consumes core v1.5.0
> The CORE B-phases are DONE and released: **v1.3.0** (LLM layer), **v1.4.0** (marketplace API
> adapters), **v1.5.0** (API gaps + enterprise scale: observations host filter + stock/promo history,
> `GET /ai-decisions`, `/facets/hosts`+`/facets/categories`, streamed CSV export `:export`,
> `PATCH /tenants/me/settings`, daily aggregates). Core dep bumped here to **^1.5**.
- [x] **(prep)** bump `padosoft/laravel-ai-price-intelligence` → `^1.5` in composer.json.
- [x] **B4** — real test harness (PR #12 merged): `tests/Feature/CoreIntegrationTest.php` boots the
  panel + core providers against a real migrated sqlite DB, seeds data, exercises the v1.5 endpoints;
  Playwright **visual regression** (`tests/e2e/visual.spec.ts` + `playwright.visual.config.ts`,
  `toHaveScreenshot` on Dashboard/Catalog/Competitors/Compliance, live-pill masked) on a dedicated
  **windows-latest `visual` CI job** (baselines are OS-matched); default ubuntu e2e ignores visual.
- [x] **B5** — wire placeholder actions/forms (see "B5 wiring progress" below): all actions wired,
  optimistic+rollback, per-action vitest; no dead buttons remain. Required core **v1.6.0** anomaly-ack
  backfill (PR #16). On `feat/admin-b5-wire-actions`.
- [ ] **B6** — enterprise UX (500k SKU): infinite-scroll/cursor pagination on every list; table
  **virtualization** (`@tanstack/react-virtual`); Competitors **host-count chips** (`/facets/hosts`);
  **AI-decision-log viewer** in Compliance (`GET /ai-decisions`).
- [ ] **B7** — SSE **bearer/polling fallback**: interval refetch of `['alerts']` when EventSource is
  unavailable (bearer/headless); keep cookie-mode SSE primary; both tested.
- [ ] **B8** — release hygiene: admin **CHANGELOG.md**, deploy + user/admin guides, consolidate
  B-phase lessons into AGENTS.md/.claude/rules; tag admin **v1.1.0** + release.

### B5 wiring progress — COMPLETE ✅ (74 vitest green, typecheck/lint/build OK)
- [x] **Settings write** → `PATCH /tenants/me/settings` (`useUpdateSettings`, optimistic merge of
  `['tenants','me']` + rollback). Editable General (alert email + density) + Notification channels.
- [x] **New target** → `POST /targets` (modal; `useTargetActions.create`, optimistic via reusable
  `useOptimisticCreate` helper). **Add-by-URL** → `POST /competitor-products`; **Trigger discovery**
  → `POST /targets/{id}/discover:now` (`useCompetitorActions`).
- [x] **New SKU** → `POST /catalog/products:bulk`; **Import CSV** → multipart `POST
  /catalog/products:csv` (client now passes FormData through). **New rule** → `POST /rules`.
  **New webhook** → `POST /webhook-subscriptions`.
- [x] **Exports**: Catalog/Prices **Export CSV** → `GET …:export` (client `fetchBlob`/`saveBlob`/
  `downloadCsv` + `useCsvExport`; mock synthesizes the streamed CSV). Dashboard digest / Narrative
  PDF / Compliance attestation → `printDocument()` (browser print-to-PDF of real content; PDF-deferred
  per spec). Assortment Export → client-side CSV of loaded gaps. Dashboard Refresh → invalidate.
  Alerts "Channels" → navigate to Settings.
- [x] **Anomalies acknowledge + bulk** → `POST /anomalies/{id}/ack` + `POST /anomalies:ack`
  (`useAnomalyActions`). **Required core backfill v1.6.0** (PR #16): anomaly-ack endpoints didn't
  exist — implemented+released in core first per the gap-backfill policy, then wired here.
- Reusable `useOptimisticCreate(prefix, fn, buildTemp)` (operate.ts): optimistic prepend across all
  cursor-page caches matching the key prefix, rollback on error, settle-invalidate; guards against
  non-list sibling caches (e.g. `['competitor-products', id]` detail). Temp rows use negative ids.

### (historical) Next action (B5) — pre-B5 resume analysis
> SUPERSEDED by "B5 wiring progress — COMPLETE" above. Kept for history; the gaps below were all
> implemented during B5 (mutation hooks, wired forms, mock handlers, per-action tests).
At B5 start the api client (`resources/js/lib/api/client.ts`) already had `api.post/patch/delete` +
XSRF/bearer handling but **no `useMutation` hooks and no wired forms yet** — action screens were
read-only. B5 added a mutation-hook layer (TanStack `useMutation` + queryClient invalidation,
optimistic+rollback) and wired each action, **plus the matching handler in the MSW mock layer**
(`resources/js/lib/api/mocks.ts`) so vitest/e2e/visual stay green, plus per-action tests.
Actions to wire (core endpoint in parens) — "no dead buttons remain":
- **Settings write** — `Settings.tsx` is fully read-only; add an editable General/notifications form →
  `PATCH /tenants/me/settings` (B3). Expose `me().tenant.settings`.
- **Export** CSV — Catalog + Prices "Export" → `GET /catalog/products:export` / `/observations/prices:export` (B3 streamed download).
- **New target** (`POST /targets`), **Add-by-URL** (`POST /competitor-products`), **Trigger discovery**
  (`POST /targets/{id}/discover:now`) + **scrape now** (`POST /targets/{id}/scrape:now`) — Targets/Competitors.
- **New SKU / Import CSV** — Catalog → `POST /catalog/products:bulk` / `:csv`.
- **New repricing rule** (Repricer editor) → `POST/PATCH /rules`; **simulate** → `POST /rules/{id}/simulate`.
- **New webhook subscription** → `POST /webhook-subscriptions` + test button → `.../test`.
- **Compliance** risk-register/attestation — surface; export attestation (doc/PDF deferred per spec if heavy).
On `feat/admin-b5-wire-actions`. Strict per-phase loop (AGENTS.md). Then B6 (virtualization/facets/
ai-decision viewer — `@tanstack/react-virtual` already a dep; `/facets/hosts` + `GET /ai-decisions`),
B7 (SSE bearer/polling fallback), B8 (CHANGELOG + guides + tag admin v1.1.0).

### (historical) Next action (B4)
On `feat/admin-b4-test-harness`: after `composer update` to pull core ^1.5, build a Testbench test
app that registers BOTH `PriceIntelligenceServiceProvider` and this panel's provider, migrates the
core schema into a real (sqlite/mysql) DB, seeds realistic catalog+competitor+observation data, and
serves `/api/v1`. Add a Playwright **integration** project (separate from the mock project) that runs
the SPA against that live API, plus `toHaveScreenshot` visual-regression baselines on Dashboard /
Competitors / Matches / Compliance. Wire both into CI. Spec: core
`docs/superpowers/specs/2026-05-25-b-phases-design.md` §B4. Strict per-phase loop (AGENTS.md).

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
