<?php

declare(strict_types=1);

namespace Padosoft\PriceIntelligenceAdmin\Http\Controllers;

use Illuminate\Contracts\Config\Repository as Config;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Contracts\View\Factory as ViewFactory;
use Illuminate\Contracts\View\View;

final class PanelController
{
    public function __construct(
        private readonly ViewFactory $view,
        private readonly Config $config,
        private readonly Application $app,
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
                'realtime' => ['driver' => (string) $this->config->get('price-intelligence-admin.realtime', 'sse')],
            ],
        ]);
    }
}
