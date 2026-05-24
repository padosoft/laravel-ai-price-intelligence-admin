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

    // The `auth` middleware ensures only authenticated users reach the panel.
    // The `price-intelligence-admin` alias enforces the Gate / token-ability check.
    'middleware' => ['web', 'auth', 'price-intelligence-admin'],

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
    | 'sse' (default, zero extra infra) or 'echo' (Reverb / laravel-websockets).
    */
    'realtime' => env('PRICE_INTELLIGENCE_ADMIN_REALTIME', 'sse'),
];
