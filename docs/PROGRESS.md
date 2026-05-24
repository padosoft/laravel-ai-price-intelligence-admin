# PROGRESS — laravel-ai-price-intelligence-admin

> Live resume state. Update after every meaningful step.

## Status
Building the web admin panel for the core (released v1.0.0). One PR per phase, strict local-Copilot →
CI → GitHub-Copilot loop, auto-merge authorized.

## Roadmap
- [ ] **A0 — Repo scaffold + tooling** (branch `feat/admin-a0-scaffold`): package.json
  (React 19 / Vite / TS / Tailwind 4 / Vitest / Playwright / Lucide / TanStack Query / i18next /
  Recharts), tsconfig, vite/vitest/playwright/eslint configs, globals.css, main.tsx/App.tsx boot,
  composer.json (require core ^1.0), ServiceProvider + PanelController + EnsureAdmin + config + Blade
  wrapper, PHPUnit (Testbench) panel route test, Vitest + Playwright boot tests, CI (php-tests,
  php-quality, frontend, e2e), AGENTS/CLAUDE/rules, LESSON/PROGRESS.
- [ ] A1 — Design system (port styles.css tokens to Tailwind 4) + ds/ primitives + shell
  (Sidebar/Topbar/CommandPalette/TenantSwitcher/Toast) + chart kit + dark/light.
- [ ] A2 — API client + Sanctum auth + TS types + i18n IT/EN + TanStack Query + mock layer.
- [ ] A3 — Screens: Dashboard, Catalog, Targets (pages-a).
- [ ] A4 — Screens: Matches, Competitors, CompetitorDetail, Prices (pages-b).
- [ ] A5 — Screens: Anomalies, Forecasts, Narrative, Assortment, ContentGap, Reviews (pages-c).
- [ ] A6 — Screens: Repricer, Alerts, Webhooks, ApiKeys, Compliance, Settings (pages-d).
- [ ] A7 — Real-time alerts (SSE) + i18n polish + a11y/dark parity.
- [ ] A8 — README wow + screenshots, consolidate LESSON, tag v1.0.0 + release.

## Next action
Finish A0: `npm install`, `composer install`, run Vitest + PHPUnit + build locally green, local
Copilot review, then push branch `feat/admin-a0-scaffold` and open the PR.

## Key facts
- Frontend lives in `resources/js/` (avoids clash with PHP PSR-4 `src/`). Alias `@/*`.
- Vite `base` = `/vendor/price-intelligence-admin/`; build → `resources/dist`; Blade reads the
  Vite manifest from the published assets.
- UI source of truth: `~/Downloads/ai-price-intelligence-web-panel/project/` (~8000 lines, 19 screens).
- Core API contract: `laravel-ai-price-intelligence/docs/PROJECT.md` §7 + `/api/v1`.
