<?php

declare(strict_types=1);

namespace Padosoft\PriceIntelligenceAdmin;

use Illuminate\Routing\Router;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Padosoft\PriceIntelligenceAdmin\Http\Controllers\PanelController;
use Padosoft\PriceIntelligenceAdmin\Http\Middleware\EnsureAdmin;

final class PriceIntelligenceAdminServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(
            __DIR__.'/../config/price-intelligence-admin.php',
            'price-intelligence-admin',
        );
    }

    public function boot(Router $router): void
    {
        $this->loadViewsFrom(__DIR__.'/../resources/views', 'price-intelligence-admin');

        $router->aliasMiddleware('price-intelligence-admin', EnsureAdmin::class);

        $this->registerRoutes();
        $this->registerPublishing();
    }

    private function registerRoutes(): void
    {
        $config = $this->app['config'];

        Route::group([
            'prefix' => $config->get('price-intelligence-admin.path', 'admin/price-intelligence'),
            'middleware' => $config->get('price-intelligence-admin.middleware', ['web']),
        ], function (): void {
            // Catch-all so client-side routing works on deep links / refresh.
            Route::get('/{any?}', [PanelController::class, 'index'])
                ->where('any', '.*')
                ->name('price-intelligence-admin.panel');
        });
    }

    private function registerPublishing(): void
    {
        if (! $this->app->runningInConsole()) {
            return;
        }

        $this->publishes([
            __DIR__.'/../config/price-intelligence-admin.php' => $this->configPath('price-intelligence-admin.php'),
        ], 'price-intelligence-admin-config');

        $this->publishes([
            __DIR__.'/../resources/dist' => public_path('vendor/price-intelligence-admin'),
        ], 'price-intelligence-admin-assets');
    }

    private function configPath(string $file): string
    {
        return function_exists('config_path')
            ? config_path($file)
            : $this->app->basePath('config/'.$file);
    }
}
