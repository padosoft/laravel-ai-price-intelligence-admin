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

## Final task
Consolidate `docs/LESSON.md` learnings into this `AGENTS.md` and `.claude/rules`.
