<?php

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Route configuration
    |--------------------------------------------------------------------------
    | The path the SPA panel is mounted at and the middleware guarding it.
    */
    'path' => env('PRICE_INTELLIGENCE_ADMIN_PATH', 'admin/price-intelligence'),

    // `auth:sanctum` authenticates both Sanctum SPA cookie sessions and bearer
    // personal-access-tokens (bare `auth` would reject token requests, breaking the
    // documented headless fallback). `price-intelligence-admin` then enforces the
    // admin ability (token ability or Gate). Host apps can override via env/publish.
    'middleware' => ['web', 'auth:sanctum', 'price-intelligence-admin'],

    /*
    |--------------------------------------------------------------------------
    | API base URL
    |--------------------------------------------------------------------------
    | Where the core package exposes its REST API. Injected into the SPA at
    | runtime so the client knows where to call.
    */
    'api_base_url' => env('PRICE_INTELLIGENCE_ADMIN_API_BASE_URL', '/api/v1'),

    /*
    |--------------------------------------------------------------------------
    | Authentication mode
    |--------------------------------------------------------------------------
    | 'cookie' = Sanctum SPA (same domain/subdomain). 'bearer' = headless token.
    */
    'auth_mode' => env('PRICE_INTELLIGENCE_ADMIN_AUTH_MODE', 'cookie'),

    /*
    |--------------------------------------------------------------------------
    | Real-time driver
    |--------------------------------------------------------------------------
    | 'sse' (default) enables the live EventSource stream in cookie/SPA mode. Any
    | other value — including bearer auth or no EventSource — makes the panel use
    | the interval polling fallback. ('echo'/Reverb is reserved; not yet wired in
    | the frontend, so it currently behaves as the polling fallback.)
    */
    'realtime' => env('PRICE_INTELLIGENCE_ADMIN_REALTIME', 'sse'),

    /*
    |--------------------------------------------------------------------------
    | Polling fallback cadence (ms)
    |--------------------------------------------------------------------------
    | When SSE can't be used (bearer/headless auth, or no EventSource), the panel
    | polls the alerts endpoint on this interval. Floored to 1000ms client-side.
    */
    'realtime_poll_interval_ms' => (int) env('PRICE_INTELLIGENCE_ADMIN_REALTIME_POLL_MS', 15000),
];
