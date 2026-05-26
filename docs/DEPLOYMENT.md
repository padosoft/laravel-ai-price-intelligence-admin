# Deployment guide

How to install, configure and serve the admin panel in production. The panel is a Laravel package
that ships a built React SPA; it is a pure consumer of the
[`padosoft/laravel-ai-price-intelligence`](https://github.com/padosoft/laravel-ai-price-intelligence)
core API.

## Requirements

- PHP **8.3+**, Laravel **11 / 12 / 13**
- `padosoft/laravel-ai-price-intelligence` **^1.5** installed and migrated in the same app (or
  reachable at a known `/api/v1` base URL)
- `laravel/sanctum` ^4 for SPA cookie auth (or a personal-access-token flow for headless/bearer)
- Node ≥ 24 **only if you rebuild assets** — releases ship a prebuilt `resources/dist`

## Install

```bash
composer require padosoft/laravel-ai-price-intelligence-admin
php artisan migrate            # core tables, if not already migrated
```

The service provider auto-registers. Assets are served from the published Vite manifest, so no build
step is required for a tagged release.

## Configure (runtime config injected into the page)

The Blade wrapper injects `window.__PI_ADMIN__`. Provide it via the package config / env:

| Key | Meaning | Example |
|---|---|---|
| `apiBaseUrl` | Core REST base | `/api/v1` |
| `auth.mode` | `cookie` (Sanctum SPA, **recommended**) or `bearer` (headless) | `cookie` |
| `csrfCookie` | XSRF cookie name (cookie mode) | `XSRF-TOKEN` |
| `locale` | Initial UI locale (`en*` → English, else Italian) | `it` |
| `realtime.driver` | `sse` (live stream) or `echo` | `sse` |
| `realtime.pollIntervalMs` | Polling-fallback cadence (ms, floored to 1000) | `15000` |
| `useMocks` | Serve in-app fixtures instead of the live API (dev/demo only) | `false` |

### Auth modes

- **Cookie / SPA (recommended)** — same-domain Sanctum. The client sends the `X-XSRF-TOKEN` header on
  mutations and credentials on every request; **SSE live alerts work** (EventSource sends the cookie).
- **Bearer / headless** — cross-domain or token clients. Set `auth.mode = bearer` and store the
  token (`pi-admin-token`). SSE is unavailable (EventSource can't set an `Authorization` header), so
  the panel **automatically falls back to interval polling** of alerts.

### Access control

Routes are gated by Sanctum auth + an `EnsureAdmin` gate. Define the `price-intelligence-admin`
ability (or your own gate) in the host app to control who can open the panel. The core additionally
enforces per-API-key scopes (e.g. `apikeys:manage`); the panel hides actions the caller can't perform
(resolved from `GET /tenants/me` abilities).

## Reverse proxy / SSE notes

- The alert stream (`GET /api/v1/alerts/stream`) is a short-lived SSE response (emits backlog + a
  heartbeat, then closes; the browser reconnects with `Last-Event-ID`) — FPM/proxy-friendly. Ensure
  the proxy does not buffer `text/event-stream`.
- Streamed CSV export (`…:export`) uses chunked `streamDownload`; disable response buffering for those
  routes if your proxy buffers large bodies.

## Rebuilding assets (only if you fork/customise)

```bash
npm install
npm run build        # → resources/dist (tsc + vite build)
```

## Upgrading

Bump the package and re-run migrations:

```bash
composer update padosoft/laravel-ai-price-intelligence-admin padosoft/laravel-ai-price-intelligence
php artisan migrate
```

See [`../CHANGELOG.md`](../CHANGELOG.md) for version-by-version changes.
