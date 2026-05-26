# AGENTS.md — laravel-ai-price-intelligence-admin

Web admin panel (React 19 + Vite + TypeScript + Tailwind 4) for the core package
`padosoft/laravel-ai-price-intelligence`. A single Composer package ships both the PHP side
(ServiceProvider serving the SPA) and the React frontend (built with Vite into `resources/dist`).

## Layout
- `src/` — PHP (PSR-4 `Padosoft\PriceIntelligenceAdmin\`): ServiceProvider, PanelController, EnsureAdmin.
- `resources/js/` — React app (TS). `@/*` alias → `resources/js/*`.
- `resources/views/app.blade.php` — SPA wrapper, injects `window.__PI_ADMIN__` runtime config.
- `config/price-intelligence-admin.php` — path, api_base_url, auth_mode, realtime driver.
- `tests/Feature` — PHPUnit (Orchestra Testbench). `tests/unit` — Vitest. `tests/e2e` — Playwright.
- `docs/TEMPLATE.md` (design/UX), `docs/IMPLEMENTATION.md` (runtime), `docs/LESSON.md`, `docs/PROGRESS.md`.

## Source of truth for the UI
The realized prototype lives at `C:\Users\lopad\Downloads\ai-price-intelligence-web-panel\project\`
(styles.css, ui.jsx, charts.jsx, data.jsx, shell.jsx, pages-a..d.jsx, app.jsx). Recreate it
**pixel-perfect** in the production stack — match the visual output, not the prototype's internal
structure. Screenshots to mirror: `screenshoots/`.

## Tooling (use the shell that resolves the binary)
- Windows Herd dev box: PowerShell for `php`/`composer`/`vendor\bin\*`; bash on Linux/CI.
- Frontend: `npm run typecheck | lint | test | build | e2e`. Node ≥ 24.
- PHP: `vendor\bin\phpunit`, `vendor\bin\pint`, `vendor\bin\phpstan analyse --memory-limit=1G`.

## Core API gaps — backfill, never mock-and-ship
If a screen/interaction needs a `/api/v1` endpoint, filter, field, or option the core
`padosoft/laravel-ai-price-intelligence` does not yet expose: do NOT leave the admin mocked or
incomplete. Flag it, switch to the core repo, implement + release the missing feature (core's strict
per-phase loop, tag + Packagist), then return here, bump the core dependency, and finish the screen
against the real API. MSW/mocks are a dev-render convenience only — never the final state of a
shipped screen.

## Definition of done (every gate, locally + CI)
`composer validate` · PHPUnit · Pint · PHPStan level 5 · `tsc --noEmit` · ESLint · Vitest ·
`vite build` · Playwright (+ axe). The admin requires **Playwright scenarios for every screen and
every api/button interaction**.

## STRICT per-phase delivery loop (mandatory — same as the core)
For EVERY phase, in order:
1. Implement the phase.
2. **Local loop until clean**: run all relevant test suites AND the local Copilot CLI review; fix
   every issue; repeat until clean. Do NOT push before local is clean.
   - Local Copilot CLI (exact): `copilot --autopilot --yolo -p "/review the changes on this branch
     vs origin/main (git diff origin/main...HEAD); list concrete actionable bugs/edge-cases/
     React-TS/Laravel best-practice issues only; reply 'NO ISSUES' if none."`
3. Commit on a per-phase branch (`feat/admin-aN-...`) — one PR per phase.
4. Push, open/update the PR, request GitHub Copilot review (REST:
   `gh api --method POST repos/<o>/<r>/pulls/<n>/requested_reviewers -f "reviewers[]=copilot-pull-request-reviewer[bot]"`).
5. **Remote loop until green**: CI green AND GitHub Copilot review with zero actionable comments.
   Fix → push → re-check, looping until both pass. Verify reviewer findings against framework
   semantics; push back with a clarifying comment when they are wrong rather than churning code.
6. Record every Copilot/CI learning in `docs/LESSON.md`.
7. **AUTO-MERGE & ADVANCE (authorized)**: squash-merge (`gh pr merge <n> --squash --delete-branch`),
   sync `main`, mark the phase done, start the next phase — until the admin roadmap is 100% complete,
   then tag v1.0.0 + GitHub release.

## Distilled lessons (A0–A8 — consolidated from docs/LESSON.md + PR review loops)

**Environment / tooling**
- Windows Herd box: PHP/Composer are on the **PowerShell** PATH, not bash. Run `php`/`composer`/
  `vendor\bin\*` via PowerShell; use Bash for git/npm/`gh`. Node ≥ 24.
- `vendor\bin\phpunit --filter "A|B"` breaks in PowerShell (the `|` hits the batch wrapper) — run
  test files by path. PHPStan OOMs at the default worker limit — use `--memory-limit=1G`.
- git `autocrlf` rewrites line endings; Pint/commit warnings about LF→CRLF are harmless. Pint's
  repo-wide `line_ending` "fails" locally but CI (LF) is clean — verify only changed files locally.
- The local `copilot --autopilot --yolo` review **edits + commits**; always re-run *all* gates after
  it (it skips build + Playwright), and reconcile its changes.

**Testing**
- Playwright `getByText` is substring + case-insensitive → strict-mode collisions. Assert headings
  via `getByRole('heading', { name, level })`; use `{ exact: true }` for ambiguous substrings.
- Headings that embed an `AiBadge`/badge have a composite accessible name — match with a regex, or
  pin `level: 1` for the page title.
- Vitest isolates modules per file; Playwright resets per page-load — but stateful mocks still need
  a `beforeEach(resetMockState())` within a file once mutations are involved.
- Screens using `useAuth`/`useAlertStream` need their provider in the test wrapper (or a manual
  `AuthContext.Provider`) — e.g. the API-keys access-denied branch.

**React / architecture**
- A file that exports a component **and** a hook trips `react-refresh/only-export-components`. Split
  context/hooks into a `*-context.ts` and keep the provider in its own `*.tsx` (mirror AuthProvider).
- Module-level constants used in a `useEffect` must **not** be added to the dep array
  (`exhaustive-deps` rejects them). If a reviewer insists, build the value inside the effect or call
  a module function so there's no captured symbol — keep `max-warnings=0` green.
- Optimistic mutations: gate the success toast on `onSuccess` and roll back on `onError`; coordinate
  a timed "advance" with the rollback (closure-local flags) so a failed item is restored exactly once.
- Always validate scraped/external URLs with `safeHttpUrl()` before an `href` (reject
  `javascript:`/`data:`). Use `price_base_cents ?? price_cents`; treat `0` as valid (`!= null`, not
  truthiness). Cap live-prepended caches to the page size.

**API / realtime / i18n**
- Backfill the **core** for any missing API/option, release it, then wire the admin — never mock a
  gap. Type response envelopes that carry `meta` (e.g. `/reviews` `meta.enabled`).
- The core SSE stream emits **named** events (`event: alert`/`heartbeat`) — use
  `addEventListener('alert', …)`, not `onmessage`. Wrap `new EventSource(...)` in try/catch.
  Subscribe **once** app-wide via a provider, not per-route.
- Normalise the API base once (`config.apiBase`, strips trailing slashes) and reuse it everywhere
  (client + stream URL). Locale matching uses `startsWith('en')` so `en-US` resolves to English; keep
  `<html lang>` synced on `languageChanged`.

**a11y**
- AA contrast: the prototype's bright `--status-*`/`--price-*`/`--accent` greens/reds fail 4.5:1 on
  their tints in light theme — darken the light-theme foregrounds (dark theme already passes) and
  keep the `-bg` tints on the same hue. Expose selection state with `aria-pressed`/`aria-current`,
  live regions with `aria-live`, and keep one `<h1>` per page (`heading-order` for the global
  `h1→h3` card-title pattern is the one deferred best-practice item).

## Distilled lessons (B4–B8 — enterprise hardening)

**Enterprise lists (500k SKU)**
- Virtualize big tables with `@tanstack/react-virtual` using the **spacer-row** technique (top/bottom
  padding `<tr>`s) so `<table>`/`.tbl` semantics survive. jsdom has no `ResizeObserver` (stub a no-op
  in test setup) and no measurable viewport, so the virtualizer yields an empty window — make the
  component **fall back to rendering all rows** when `getVirtualItems()` is empty (also good for SSR).
  Make the scroll container focusable (`tabIndex=0` + `role`/`aria-label`).
- Infinite cursor lists: `getNextPageParam` must return **`undefined`** (not the core's `null`) at
  end-of-list, else `hasNextPage` stays truthy and `fetchNextPage()` loops on page 1. Gate the
  prefetch effect on a real window (`items.length > 0`, `lastIndex` sentinel `-1`).
- Push **filters server-side** (brand/host as query params) and source chip counts from **SQL facet
  endpoints** (`/facets/hosts`, `/facets/brands`) — never count a loaded page. Facets have a
  `staleTime`, so list-mutating actions must also invalidate the facet keys (`useOptimisticCreate`'s
  `alsoInvalidate`).

**Mutations / forms (no dead buttons)**
- One reusable `useOptimisticCreate(prefix, fn, buildTemp, appliesTo?, alsoInvalidate?)`: prepends a
  temp row (negative id) across matching cursor-page caches, rolls back on error, settle-invalidates.
  **Guard** `Array.isArray(old.data)` so a sibling detail cache (`['x', id]`) isn't corrupted; use
  `appliesTo` so a filtered list (e.g. paused targets) doesn't flash an item that doesn't match.
- Capture trimmed/parsed form values into locals **before** `mutate` — inputs stay editable while
  pending, so callbacks/toasts must reflect what was submitted. Preserve a valid `0` (priority) —
  parse + NaN-check, don't `Number(x) || default`.
- CSV export client: split `fetchBlob` (network → `{blob, filename}`) from `saveBlob` (DOM; no-op in
  jsdom; defer `revokeObjectURL` a tick after `click()`). Serializer must guard **formula injection**
  (neutralize leading `= + - @`, incl. leading whitespace) and quote CR/LF. jsdom `Blob` has no
  `.text()` — assert CSV via the synthesizer. For PDF/digest with no endpoint, `window.print()` the
  real content (no synthetic data).

**Realtime fallback**
- EventSource can't send a Bearer header → bearer/headless (or no `EventSource`) degrades to interval
  **polling** (`invalidateQueries(['alerts'])`); cookie SPA keeps SSE primary. Model an explicit
  transport `mode` ('sse'|'polling'|'off'); clamp the poll cadence to a sane floor. Test polling by
  `vi.mock`-ing `@/config` to bearer + fake timers + spying `invalidateQueries`.

**Review loop**
- The harness auto-mode classifier blocks `copilot --autopilot --yolo` (it disables approval gates) —
  rely on the **remote** GitHub Copilot PR review; run all other local gates before pushing.
- Copilot/Codex findings on the B PRs were almost all valid (cursor-end loop, facet invalidation,
  ai_act gating, formula injection, poll clamp). Push back only with evidence — e.g. `pages.flatMap`
  for infinite+virtual is the canonical TanStack pattern; manual accumulation desyncs on refetch.

## Final task — DONE
LESSON.md learnings consolidated above (A0–A8 and B4–B8). Admin roadmap complete through B8; tag
**v1.1.0**. CHANGELOG.md, docs/DEPLOYMENT.md and docs/ADMIN-GUIDE.md shipped.
