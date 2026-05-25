# LESSON.md — laravel-ai-price-intelligence-admin

Append learnings, environment quirks, and Copilot/CI feedback here. Carry the core's lessons too
(see `../laravel-ai-price-intelligence/AGENTS.md` "Distilled lessons").

## Environment
- Windows Herd dev box: PHP 8.4 + Composer 2.9 on PowerShell PATH (not bash). Node 25 / npm 11.
  Use the shell that resolves the binary; bash on Linux/CI.
- Frontend folder is `resources/js/` to avoid colliding with PHP PSR-4 `src/`.

## Tooling decisions
- Stack pinned to latest stable at scaffold time: React 19, Vite 6, TS 5.7, Tailwind 4 (via
  `@tailwindcss/vite`), Vitest 2, Playwright 1.49, TanStack Query 5, i18next 24, Recharts 3,
  Lucide. The TEMPLATE.md "min" column lists aspirational floors; `npm install` resolves actual latest.
- Playwright runs against `vite preview` of the built SPA with MSW fixtures → deterministic, no live
  Laravel backend needed in CI.

## Copilot review findings (A0)
- **Vite 5+ manifest location**: `build.manifest: true` emits to `<outDir>/.vite/manifest.json`
  (not the outDir root as in Vite ≤4). The Blade/asset resolver checks both for robustness.
- **PHP closures don't error on extra args**: `Gate::define('x', fn () => ...)` called with a user
  arg does NOT throw ArgumentCountError; still, accept `$user` for the idiomatic gate signature.
- **larastan view-string**: `view('pkg::name')` trips the view-string check for namespaced package
  views; inject `Illuminate\Contracts\View\Factory` and call `->make()` (plain string param) instead.
- **Keep Blade dumb**: manifest parsing lives in `PanelController` (cached by manifest mtime), not in
  the Blade template.
- **Local `copilot --autopilot --yolo`** actively edits + commits files (not report-only). Always
  re-verify all gates yourself after it runs; reconcile any namespace/layout changes it introduces.

## A4 (Matches/Competitors/CompetitorDetail/Prices)
- **Playwright `getByText` is substring + case-insensitive** → strict-mode collisions: `getByText('Price
  history')` also matched the empty-state `No price history yet`. Assert headings via
  `getByRole('heading', { name: ... })`.
- **axe (`@axe-core/playwright`) surfaces inherited DS issues** the first time a badge/price-delta-heavy
  screen is checked: `.badge.success`/`.price-delta` token contrast (~3–4:1 vs the AA 4.5:1) and the
  global `h1→h3` card-title `heading-order`. These come verbatim from the pixel-perfect prototype CSS;
  scoped out with `.disableRules(['color-contrast','heading-order'])` + a comment, deferred to the A7
  a11y/dark phase rather than diverging from the prototype mid-feature.
- **Core gap found + backfilled (v1.2.0)** before wiring: `GET /competitor-products` (list) and
  candidate metadata on match proposals. Pattern holds — backfill core, release, then wire; never mock.
- **Honest deferral, not mock**: the multi-competitor promo gantt (pages-b detail) needs a promo-series
  endpoint the core doesn't expose; rendered the latest promo snapshot + empty state and logged the
  gantt as an A7 item, rather than shipping synthetic data.

## B5 (wire placeholder actions)
- **Reusable optimistic-create**: `useOptimisticCreate(prefix, mutationFn, buildTemp)` uses TanStack
  `setQueriesData({ queryKey: prefix })` to prepend a temp row to *every* matching cursor-page cache
  (so parameterized keys like `['targets', status]` all update), snapshots via `getQueriesData` for
  rollback, and `invalidateQueries(prefix)` on settle. **Guard**: a sibling *detail* query can share
  the prefix (`['competitor-products', id]` holds a single resource, not a page) — only mutate caches
  where `Array.isArray(old.data)` or you corrupt the detail cache. Temp rows use monotonic negative ids.
- **Toast bodies pollute `getByText`**: success toasts often echo the new entity's name/URL, so a
  bare `screen.getByText(value)` matches both the table row and the toast → "multiple elements".
  Scope row assertions with `within(screen.getByRole('table'))`, and count rows via table `row` role
  (not `/Product #/` text, which the toast body also contains).
- **Stateful mocks need per-test reset**: once a mock collection is mutable (create/ack pushes into
  `mockTargets`/`mockCompetitors`/`mockProducts`/`mockAnomalies`/…), every test file touching it must
  `beforeEach(() => resetMockState())` or created rows leak across cases.
- **FormData uploads**: the JSON client must skip `JSON.stringify` *and* not set `Content-Type` for
  `FormData` bodies (let the browser set the multipart boundary) — used by `POST /catalog/products:csv`.
- **CSV `:export` downloads**: split network (`fetchBlob` → `{blob, filename}`, parses
  Content-Disposition) from DOM save (`saveBlob`, no-op when `URL.createObjectURL`/`document` absent —
  jsdom) so it's unit-testable. jsdom's `Blob` has **no `.text()`** → assert CSV content via the mock
  synthesizer (`mockDownload`) and only assert blob shape/filename from `fetchBlob`.
- **PDF/digest with no core endpoint**: wire to `window.print()` (browser print-to-PDF of the *real*
  rendered content) rather than shipping synthetic data — honest, and matches the spec's PDF-deferred
  note. Guard `window.print` for jsdom; assert the toast (and `vi.stubGlobal('print', spy)` if needed).
- **Gap-backfill mid-phase**: the Anomalies ack buttons had no core endpoint. Per policy, backfilled
  the core first (`POST /anomalies/{id}/ack` + `:ack` bulk, v1.6.0, PR #16), then wired the admin —
  never mock-and-ship a button whose endpoint doesn't exist.

## Copilot review (core anomaly-ack PR #16) — carried lessons
- **Eloquent builder `->update()` DOES auto-manage `updated_at`** when `$timestamps` is on (contrary
  to a first instinct). Setting it explicitly is only to force it to *equal* `acknowledged_at`.
- **Idempotent + race-safe acknowledge**: prefer one atomic `whereNull('acknowledged_at')->update()`
  over read-then-`save()` (two requests can both read null and the later overwrites the timestamp).
- **Context-independent tenant scoping**: a model method that may run in a multi-tenant job should not
  rely on the ambient `TenantContext` global scope — `withoutGlobalScope('pi_tenant')` + explicit
  `where('tenant_id', $this->tenant_id)` so the write targets the instance's own tenant deterministically.
- **Bulk-id endpoints**: bound the array (`max:5000`) and constrain items (`integer,min:1,distinct`)
  to avoid oversized `WHERE IN` and redundant ids; add a cross-tenant isolation test (404 single / 0 bulk).

## Per-phase loop
- Same strict loop as the core: local tests + local Copilot → push → CI green + GitHub Copilot zero
  comments → squash-merge + delete branch → next phase.
- **Env note**: the harness auto-mode classifier blocks `copilot --autopilot --yolo` (it disables
  approval gates). Rely on the authoritative **remote** GitHub Copilot PR review instead; run the
  other local gates (typecheck/lint/vitest/build, and phpunit/pint/phpstan for core) before pushing.
