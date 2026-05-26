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
# Publish the prebuilt SPA assets to public/vendor/price-intelligence-admin
php artisan vendor:publish --tag=price-intelligence-admin-assets
php artisan vendor:publish --tag=price-intelligence-admin-config   # optional
```

The service provider auto-registers. A tagged release ships the prebuilt `resources/dist`, so **no
Node/build step is required** — only publish the assets (above) so they're served from
`public/vendor/price-intelligence-admin` via the Vite manifest. Re-run the assets publish (with
`--force`) after upgrading.

## Configure (runtime config injected into the page)

The Blade wrapper injects `window.__PI_ADMIN__`. Provide it via the package config / env:

The `PanelController` injects `window.__PI_ADMIN__` from `config/price-intelligence-admin.php`
(publish + edit, or set the env vars). The injected keys and their config sources:

| Injected key | Config key / env | Meaning | Default |
|---|---|---|---|
| `apiBaseUrl` | `api_base_url` / `PRICE_INTELLIGENCE_ADMIN_API_BASE_URL` | Core REST base | `/api/v1` |
| `auth.mode` | `auth_mode` / `PRICE_INTELLIGENCE_ADMIN_AUTH_MODE` | `cookie` (Sanctum SPA, **recommended**) or `bearer` (headless) | `cookie` |
| `locale` | from the host app's `App::getLocale()` — `en*` → English, else Italian | host app locale |
| `realtime.driver` | `realtime` / `PRICE_INTELLIGENCE_ADMIN_REALTIME` | `sse` enables the live EventSource stream (cookie mode). Any other value (or bearer auth / no EventSource) → the panel uses the polling fallback. | `sse` |
| `realtime.pollIntervalMs` | `realtime_poll_interval_ms` / `PRICE_INTELLIGENCE_ADMIN_REALTIME_POLL_MS` | Polling-fallback cadence (ms, floored to 1000) | `15000` |
| `csrfCookie` | fixed `XSRF-TOKEN` (Sanctum default) | XSRF cookie name (cookie mode) | `XSRF-TOKEN` |

> `useMocks` is **not** a production config key — it's a frontend dev/test fallback (the in-app MSW
> fixtures) and is never injected by the PHP side in production.

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
