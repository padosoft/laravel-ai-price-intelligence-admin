<?php

declare(strict_types=1);

namespace Padosoft\PriceIntelligenceAdmin\Tests\Feature;

use Padosoft\PriceIntelligenceAdmin\Tests\TestCase;
use PHPUnit\Framework\Attributes\Test;

final class PanelRouteTest extends TestCase
{
    #[Test]
    public function the_panel_route_is_registered_at_the_configured_path(): void
    {
        $this->assertTrue(
            $this->app['router']->has('price-intelligence-admin.panel'),
            'Panel catch-all route should be registered.',
        );
    }

    #[Test]
    public function the_panel_serves_the_spa_wrapper_with_injected_runtime_config(): void
    {
        $response = $this->get('/admin/price-intelligence');

        $response->assertOk();
        // Js::from() wraps in JSON.parse('…') with unicode-escaped quotes; check
        // structural markers rather than literal quote characters.
        $response->assertSee('window.__PI_ADMIN__', false);
        $response->assertSee('JSON.parse(', false);
        $response->assertSee('apiBaseUrl', false);
        // The realtime block (driver + polling-fallback cadence) is injected from config.
        $response->assertSee('pollIntervalMs', false);
        $response->assertSee('id="root"', false);
    }

    #[Test]
    public function the_poll_interval_is_taken_from_config(): void
    {
        // Use a distinctive value that won't occur incidentally, so seeing it proves it flowed from
        // config into the injected payload (the default is 15000). Js::from() escapes the JSON
        // string's quotes (to ") but leaves the bare number, so the key and value render
        // adjacent as `…pollIntervalMs":73313`.
        config()->set('price-intelligence-admin.realtime_poll_interval_ms', 73313);
        $response = $this->get('/admin/price-intelligence')->assertOk();
        $response->assertSee('pollIntervalMs', false);
        $response->assertSee('73313', false);
    }

    #[Test]
    public function deep_links_resolve_to_the_same_spa_wrapper(): void
    {
        $this->get('/admin/price-intelligence/catalog/123')->assertOk()->assertSee('id="root"', false);
    }
}
