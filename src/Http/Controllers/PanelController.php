<?php

declare(strict_types=1);

namespace Padosoft\PriceIntelligenceAdmin\Http\Controllers;

use Illuminate\Contracts\Cache\Repository as Cache;
use Illuminate\Contracts\Config\Repository as Config;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Contracts\View\Factory as ViewFactory;
use Illuminate\Contracts\View\View;
use Padosoft\PriceIntelligenceAdmin\Support\ViteAssets;

final class PanelController
{
    private const PUBLIC_SUBDIR = 'vendor/price-intelligence-admin';

    private const CACHE_KEY = 'price-intelligence-admin.vite-assets';

    public function __construct(
        private readonly ViewFactory $view,
        private readonly Config $config,
        private readonly Application $app,
        private readonly Cache $cache,
    ) {}

    /**
     * Serve the SPA wrapper. Client-side routing handles every sub-path, so this
     * single view backs all panel URLs.
     */
    public function index(): View
    {
        return $this->view->make('price-intelligence-admin::app', [
            'runtime' => [
                'apiBaseUrl' => (string) $this->config->get('price-intelligence-admin.api_base_url', '/api/v1'),
                'auth' => ['mode' => (string) $this->config->get('price-intelligence-admin.auth_mode', 'cookie')],
                'locale' => $this->app->getLocale(),
                'csrfCookie' => 'XSRF-TOKEN',
                'realtime' => [
                    'driver' => (string) $this->config->get('price-intelligence-admin.realtime', 'sse'),
                    'pollIntervalMs' => (int) $this->config->get('price-intelligence-admin.realtime_poll_interval_ms', 15000),
                ],
            ],
            'assets' => $this->resolveAssets(),
            'assetBase' => rtrim(asset(self::PUBLIC_SUBDIR), '/').'/',
        ]);
    }

    /**
     * Resolve the entry assets from the published manifest, memoized in the cache so
     * the file isn't read + decoded on every request. A single fixed key stores both
     * the manifest mtime and the resolved assets; when the mtime changes (rebuild/
     * redeploy) the entry is recomputed in place — no unbounded growth of cache keys.
     *
     * @return array{js: string|null, css: array<int, string>}
     */
    private function resolveAssets(): array
    {
        $publicDir = public_path(self::PUBLIC_SUBDIR);
        $stamp = @filemtime($publicDir.'/.vite/manifest.json')
            ?: @filemtime($publicDir.'/manifest.json')
            ?: 0;

        if ($stamp === 0) {
            return ['js' => null, 'css' => []];
        }

        /** @var array{stamp: int, assets: array{js: string|null, css: array<int, string>}}|null $cached */
        $cached = $this->cache->get(self::CACHE_KEY);

        if ($cached === null || $cached['stamp'] !== $stamp) {
            $cached = ['stamp' => $stamp, 'assets' => ViteAssets::resolve($publicDir)];
            $this->cache->forever(self::CACHE_KEY, $cached);
        }

        return $cached['assets'];
    }
}
