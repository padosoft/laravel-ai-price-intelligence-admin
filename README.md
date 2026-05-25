# laravel-ai-price-intelligence-admin

[![PHP](https://img.shields.io/badge/PHP-8.3%2B-777bb4.svg?style=flat-square)](https://www.php.net/)
[![Laravel](https://img.shields.io/badge/Laravel-11%20%7C%2012%20%7C%2013-ff2d20.svg?style=flat-square)](https://laravel.com/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg?style=flat-square)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646cff.svg?style=flat-square)](https://vitejs.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8.svg?style=flat-square)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/github/actions/workflow/status/padosoft/laravel-ai-price-intelligence-admin/ci.yml?branch=main&label=tests&style=flat-square)](https://github.com/padosoft/laravel-ai-price-intelligence-admin/actions)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg?style=flat-square)](LICENSE)

> **The web admin panel for [`padosoft/laravel-ai-price-intelligence`](https://github.com/padosoft/laravel-ai-price-intelligence)** —
> a React 19 + TypeScript single-page app that turns the core's REST API into a fast, accessible,
> EU-compliant competitor-monitoring cockpit. **This is the self-hostable panel Netrivals and
> Competitoor don't give you.**

![Dashboard](screenshoots/laravel-ai-price-intelligence-Web-Panel-Dashboard.png)

---

## Table of Contents

- [Highlights](#highlights)
- [Screens](#screens)
- [Tech stack](#tech-stack)
- [Quick start](#quick-start)
- [How it talks to the core](#how-it-talks-to-the-core)
- [Real-time alerts (SSE)](#real-time-alerts-sse)
- [Internationalisation](#internationalisation)
- [Accessibility & theming](#accessibility--theming)
- [Testing](#testing)
- [License](#license)

---

## Highlights

- **19 screens** covering the full workflow — catalog, monitoring targets, AI match review,
  competitors, price explorer, anomalies, forecasts, weekly narrative, assortment & content gaps,
  review sentiment, repricer, alerts, webhooks, API keys, compliance and settings.
- **Live by design** — a single Server-Sent-Events subscription (`/alerts/stream`) streams new
  alerts into every open screen in real time.
- **AI-transparent** — every AI-generated output (matches, forecasts, narrative, sentiment) carries
  an `AI` badge and the screens surface the EU AI Act disclosures the core logs.
- **WCAG AA & dark mode** — AA-contrast tokens, keyboard-accessible controls, `aria-*` state on
  every toggle, and a first-class dark theme. Axe runs in CI on every screen.
- **IT / EN** — i18next-powered, switchable from the top bar; the host injects the tenant's locale.
- **Typed end-to-end** — a hand-written TypeScript mirror of the core v1.x API, TanStack Query for
  caching/mutations, and a dev mock layer so the panel runs with zero backend.
- **Feature-gated** — Reviews, Repricer and Compliance appear only when the tenant has the matching
  core feature flag (`GET /tenants/me`).

## Screens

| Dashboard (dark) | AI match review | Competitors |
|---|---|---|
| ![Dashboard dark](screenshoots/laravel-ai-price-intelligence-Web-Panel-Dashboard-dark.png) | ![Matches](screenshoots/laravel-ai-price-intelligence-Web-Panel-matches.png) | ![Competitors](screenshoots/laravel-ai-price-intelligence-Web-Panel-competitor.png) |

| Price explorer | Anomaly detection | Price forecasts |
|---|---|---|
| ![Prices](screenshoots/laravel-ai-price-intelligence-Web-Panel-price-explorer.png) | ![Anomalies](screenshoots/laravel-ai-price-intelligence-Web-Panel-anomaly-detection.png) | ![Forecasts](screenshoots/laravel-ai-price-intelligence-Web-Panel-forcast.png) |

| Weekly AI narrative | Assortment gaps (treemap) | Content gap analysis |
|---|---|---|
| ![Narrative](screenshoots/laravel-ai-price-intelligence-Web-Panel-weekly-narrative.png) | ![Assortment](screenshoots/laravel-ai-price-intelligence-Web-Panel-assortment-gap-treemap.png) | ![Content gap](screenshoots/laravel-ai-price-intelligence-Web-Panel-content-gap-analisis.png) |

| Review insights (GDPR-safe) | Repricer (advisory) | EU AI Act compliance |
|---|---|---|
| ![Reviews](screenshoots/ai-price-intelligence-Web-Panel-review-insights.png) | ![Repricer](screenshoots/ai-price-intelligence-Web-Panel-repricer.png) | ![Compliance](screenshoots/ai-price-intelligence-Web-Panel-compilance-Ai-act.png) |

| Alerts inbox | Webhooks | API keys |
|---|---|---|
| ![Alerts](screenshoots/ai-price-intelligence-Web-Panel-alerts.png) | ![Webhooks](screenshoots/ai-price-intelligence-Web-Panel-webhooks.png) | ![API keys](screenshoots/ai-price-intelligence-Web-Panel-API-key.png) |

<details>
<summary>More screens</summary>

- [Catalog](screenshoots/laravel-ai-price-intelligence-Web-Panel-catalog.png) ·
  [Competitor detail — price](screenshoots/laravel-ai-price-intelligence-Web-Panel-catalog-detail-price.png) ·
  [— stock](screenshoots/laravel-ai-price-intelligence-Web-Panel-catalog-detail-stock.png) ·
  [— promo](screenshoots/laravel-ai-price-intelligence-Web-Panel-catalog-detail-promo-details.png)
- [Targets](screenshoots/laravel-ai-price-intelligence-Web-Panel-targets.png) ·
  [Settings](screenshoots/ai-price-intelligence-settings.png)

</details>

## Tech stack

React 19 · TypeScript · Vite · Tailwind CSS 4 · TanStack Query 5 · i18next · custom SVG charts ·
Lucide icons · Vitest · Playwright (+ `@axe-core/playwright`). PHP side: a thin Laravel service
provider serving the built SPA behind a Sanctum-authenticated, `EnsureAdmin`-gated route.

## Quick start

```bash
# Install JS + PHP deps
npm install
composer install

# Dev server (uses the in-app mock layer — no backend required)
npm run dev

# Quality gates
npm run typecheck && npm run lint && npm run test && npm run build
npm run test:e2e        # Playwright + axe against the built preview
```

Mount it from your host app by `composer require padosoft/laravel-ai-price-intelligence-admin`; the
service provider publishes the panel and the runtime config (`apiBaseUrl`, `auth.mode`, `locale`,
`realtime.driver`) is injected by the Blade wrapper.

## How it talks to the core

The panel is a pure consumer of the core's `/api/v1` REST API. A typed `api` client (cookie +
`X-XSRF-TOKEN` in SPA mode, or `Bearer` headless) wraps `fetch`, maps RFC-7807 problem+json errors,
and feeds TanStack Query hooks (`useCatalog`, `useMatches`, `useCompetitors`, `useForecasts`,
`useRules`, …). In dev/test a mock layer (`useMocks`) serves fixtures so the UI renders with no
backend; in production those same hooks hit the live core.

## Real-time alerts (SSE)

`AlertStreamProvider` opens **one** `EventSource` to `GET /api/v1/alerts/stream` for the whole app
(cookie credentials in SPA mode), listens for the core's named `alert` events and prepends them into
the cached alert pages — so the inbox and dashboard update live. It degrades gracefully (a
"Reconnecting" pill) and no-ops in bearer/headless or mock environments.

## Internationalisation

i18next with Italian and English. The active locale comes from the host-injected
`runtimeConfig.locale` (`en*` → English, otherwise Italian) and is switchable from the top bar;
`<html lang>` stays in sync for assistive tech.

## Accessibility & theming

Light and dark themes via `[data-theme]`, AA-contrast color tokens, keyboard-operable rows and
toggles with `aria-pressed`/`aria-current`/`aria-live`, and a single page `h1` per screen. Axe
(`color-contrast` enforced) runs against every screen in the Playwright suite.

## Testing

- **Vitest** — DS primitives, hooks, the API client, and every screen.
- **Playwright + axe** — each screen renders via the sidebar, key interactions (match approve,
  competitor drill-down, API-key generation, language switch) and an accessibility scan.
- CI runs `composer validate`, PHPUnit, Pint, PHPStan, `tsc`, ESLint, Vitest, `vite build` and
  Playwright on every push.

## License

Apache-2.0 © [Padosoft](https://padosoft.com). Companion to
[`padosoft/laravel-ai-price-intelligence`](https://github.com/padosoft/laravel-ai-price-intelligence).
