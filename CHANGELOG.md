# Changelog

All notable changes to `padosoft/laravel-ai-price-intelligence-admin` are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/) and the project adheres to
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.1.0] - 2026-05-26

The **B-phase**: turning the read-mostly v1.0 panel into a fully interactive, enterprise-scale,
gracefully-degrading cockpit. Core dependency bumped to **^1.5** (consumes core v1.6 anomaly-ack and
v1.7 brand facet). 82 Vitest + Playwright (e2e + visual regression) green.

### Added
- **B4 — real test harness**: `tests/Feature/CoreIntegrationTest.php` boots the panel + core service
  providers against a migrated SQLite DB, seeds data and exercises the live v1.5 endpoints; Playwright
  **visual-regression** baselines (`toHaveScreenshot`) on Dashboard/Catalog/Competitors/Compliance on a
  dedicated windows-latest CI job (OS-matched baselines, live-pill masked).
- **B5 — every action wired, no dead buttons**: Settings write (`PATCH /tenants/me/settings`), New
  target (`POST /targets`), Add-by-URL (`POST /competitor-products`), Trigger discovery
  (`/targets/{id}/discover:now`), New SKU (`/catalog/products:bulk`), Import CSV
  (`/catalog/products:csv`), New repricing rule (`POST /rules`) + simulate, New webhook
  (`POST /webhook-subscriptions`) + test, Anomaly acknowledge + bulk-acknowledge
  (`/anomalies/{id}/ack`, `/anomalies:ack`). Streamed **CSV exports** (Catalog/Prices via `:export`),
  print-to-PDF for narrative/digest/attestation, client-side CSV for assortment gaps. All forms
  validated, **optimistic + rollback** mutations (`useOptimisticCreate`).
- **B6 — enterprise scale (500k SKU)**: cursor-paginated **infinite scroll** + **table
  virtualization** (`@tanstack/react-virtual`, reusable `VirtualTable`) on Catalog and Competitors;
  exact **host & brand facet chips** (`GET /facets/hosts`, `GET /facets/brands`) instead of counting
  a loaded page; **AI-decision-log viewer** in Compliance (`GET /ai-decisions`, EU AI Act Art. 12).
  Server-side brand/host filters.
- **B7 — resilient real-time**: `AlertStreamProvider` resolves a transport `mode` — `sse` (cookie SPA,
  primary), **`polling`** fallback (bearer/headless or no `EventSource` → interval `['alerts']`
  refetch, clamped cadence), or `off` (dev/mock). The Alerts live-pill shows Live / Polling /
  Reconnecting.

### Changed
- Core dependency `padosoft/laravel-ai-price-intelligence` → `^1.5`.
- CSV serializer hardened against formula injection (neutralizes leading `= + - @`, incl. leading
  whitespace) and quotes CR/LF/CRLF.

## [1.0.0] - 2026-05-25

First public release: the full read-side admin panel (19 screens) for the core API.

### Added
- **A0–A2** — repo scaffold + CI, design system (dual theme, semantic component classes), typed API
  client (Sanctum cookie + bearer, RFC-7807 mapping), TanStack Query, i18next IT/EN, dev mock layer.
- **A3–A6** — 19 screens: Dashboard, Catalog, Targets, Matches (swipe-deck review), Competitors,
  Competitor detail, Prices explorer, Anomalies, Forecasts, Narrative, Assortment, Content gap,
  Reviews, Repricer, Alerts, Webhooks, API keys, Compliance, Settings.
- **A7** — real-time SSE alerts, i18n switcher, WCAG-AA contrast (axe `color-contrast` enforced in CI).
- **A8** — README with screenshot gallery, consolidated lessons into AGENTS.md.

[Unreleased]: https://github.com/padosoft/laravel-ai-price-intelligence-admin/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/padosoft/laravel-ai-price-intelligence-admin/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/padosoft/laravel-ai-price-intelligence-admin/releases/tag/v1.0.0
