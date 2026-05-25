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

## Per-phase loop
- Same strict loop as the core: local tests + local Copilot → push → CI green + GitHub Copilot zero
  comments → squash-merge + delete branch → next phase.
