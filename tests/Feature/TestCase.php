<?php

declare(strict_types=1);

namespace Padosoft\PriceIntelligenceAdmin\Tests;

use Orchestra\Testbench\TestCase as Orchestra;
use Padosoft\PriceIntelligenceAdmin\PriceIntelligenceAdminServiceProvider;

abstract class TestCase extends Orchestra
{
    protected function getPackageProviders($app): array
    {
        return [
            PriceIntelligenceAdminServiceProvider::class,
        ];
    }

    protected function defineEnvironment($app): void
    {
        // The panel runs under the `web` middleware group; CSRF/session encryption
        // needs an app key in the test harness.
        $app['config']->set('app.key', 'base64:'.base64_encode(random_bytes(32)));
    }
}
