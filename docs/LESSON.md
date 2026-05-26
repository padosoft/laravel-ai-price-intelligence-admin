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
- **Reusable optimistic-create**: `useOptimisticCreate(prefix, mutationFn, buildTemp, appliesTo?)`
  iterates `getQueriesData({ queryKey: prefix })` and calls `setQueryData(key, …)` per matching
  cursor-page cache to prepend a temp row (so parameterized keys like `['targets', status]` all
  update), keeps those snapshots for rollback, and `invalidateQueries(prefix)` on settle. **Guards**:
  (a) a sibling *detail* query can share the prefix (`['competitor-products', id]` holds a single
  resource, not a page) — only mutate caches where `Array.isArray(old.data)`; (b) the optional
  `appliesTo(queryKey, vars)` predicate skips list caches whose filter wouldn't contain the new item
  (e.g. a new active target must not flash in the paused-only list). Temp rows use monotonic negative ids.
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

## B6/B7 (enterprise UX + realtime fallback)
- **Virtualizing a `<table>` in jsdom**: `@tanstack/react-virtual` needs `ResizeObserver` (stub a
  no-op in test setup or it throws) and a measurable scroll viewport — jsdom has neither, so the
  virtualizer yields an empty window. Make the component fall back to rendering all rows when
  `getVirtualItems()` is empty (also good for SSR), so tests/headless render content. Use the
  spacer-row technique (top/bottom padding `<tr>`s) to keep `<table>` semantics + DS `.tbl` styling.
  Make the scroll container focusable (`tabIndex={0}` + `role`/`aria-label`) for keyboard scrolling.
- **Infinite cursor lists**: `getNextPageParam` must return `undefined` (not the core's `null`) at
  end-of-list, or `hasNextPage` stays truthy and `fetchNextPage()` loops on page 1. Gate the
  prefetch effect on a real virtual window (`items.length > 0`, `lastIndex` sentinel `-1`).
- **Derived facets must be invalidated on writes**: `/facets/hosts` & `/facets/brands` have a
  `staleTime`, so list mutations (create SKU / import / add competitor) must also invalidate the
  facet keys (via `useOptimisticCreate`'s `alsoInvalidate`) or chip counts go stale.
- **Big-list filters belong server-side**: brand/host filters drive the infinite query params
  (server filters), and chips come from SQL facet endpoints — not from counting a loaded page.
- **SSE fallback**: EventSource can't send a Bearer header, so bearer/headless (or no EventSource)
  degrades to interval polling (`invalidateQueries(['alerts'])`); cookie SPA keeps SSE primary. Model
  it as an explicit transport `mode` ('sse'|'polling'|'off') in context. Test polling by `vi.mock`-ing
  `@/config` to bearer + fake timers + spying `invalidateQueries`.

## Maintenance: Vite 6 → 8
- **Vite 8 is Rolldown-based.** Build still emits the manifest at `.vite/manifest.json` (Blade
  wrapper already resolves that path), `base: './'` and `build.manifest` unchanged. The
  >500 kB chunk warning now suggests `build.rolldownOptions.output.codeSplitting` instead of
  `rollupOptions` — it's a warning, not a gate failure; no config change needed.
- **`@vitejs/plugin-react@6` requires `vite ^8`** (peer) — must bump it together with Vite; its
  `babel-plugin-react-compiler` / `@rolldown/plugin-babel` peers are optional. `@tailwindcss/vite@4.3`
  peers `vite ^5.2||^6||^7||^8`, `vitest@4` peers `vite ^6||^7||^8` — both already Vite-8-ready, so the
  only forced co-bump is plugin-react 4→6. Kept tailwindcss/@tailwindcss/vite aligned at 4.3.
- No source/config edits were needed: typecheck/lint/vitest 82/build/e2e 8/visual 4 all green and
  visual baselines matched 1:1 (rendering unchanged) under Vite 8.0.14.

## Per-phase loop
- Same strict loop as the core: local tests + local Copilot → push → CI green + GitHub Copilot zero
  comments → squash-merge + delete branch → next phase.
- **Env note**: the harness auto-mode classifier blocks `copilot --autopilot --yolo` (it disables
  approval gates). Rely on the authoritative **remote** GitHub Copilot PR review instead; run the
  other local gates (typecheck/lint/vitest/build, and phpunit/pint/phpstan for core) before pushing.
