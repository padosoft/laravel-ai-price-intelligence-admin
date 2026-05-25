<?php

declare(strict_types=1);

namespace Padosoft\PriceIntelligenceAdmin\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Orchestra\Testbench\TestCase as Orchestra;
use Padosoft\PriceIntelligence\Enums\MatchStatus;
use Padosoft\PriceIntelligence\Models\AiDecisionLog;
use Padosoft\PriceIntelligence\Models\ApiKey;
use Padosoft\PriceIntelligence\Models\CompetitorProduct;
use Padosoft\PriceIntelligence\Models\CompetitorSource;
use Padosoft\PriceIntelligence\Models\MonitoringTarget;
use Padosoft\PriceIntelligence\Models\PriceObservation;
use Padosoft\PriceIntelligence\Models\Product;
use Padosoft\PriceIntelligence\Models\PromoObservation;
use Padosoft\PriceIntelligence\Models\StockObservation;
use Padosoft\PriceIntelligence\Models\Tenant;
use Padosoft\PriceIntelligence\PriceIntelligenceServiceProvider;
use Padosoft\PriceIntelligence\Support\Tenant\TenantContext;
use Padosoft\PriceIntelligenceAdmin\PriceIntelligenceAdminServiceProvider;
use PHPUnit\Framework\Attributes\Test;

/**
 * Real Laravel + DB integration: boots the admin panel provider ALONGSIDE the live core
 * (PriceIntelligenceServiceProvider), migrates the core schema into a real (sqlite) DB, seeds
 * realistic data, and exercises the v1.5 endpoints the admin consumes — proving the panel's host
 * app and the core API integrate end to end (not against mocks).
 */
final class CoreIntegrationTest extends Orchestra
{
    use RefreshDatabase;

    /**
     * @return array<int, class-string>
     */
    protected function getPackageProviders($app): array
    {
        return [
            PriceIntelligenceServiceProvider::class,
            PriceIntelligenceAdminServiceProvider::class,
        ];
    }

    protected function defineEnvironment($app): void
    {
        $app['config']->set('app.key', 'base64:'.base64_encode(random_bytes(32)));
        $app['config']->set('database.default', 'testing');
        $app['config']->set('database.connections.testing', [
            'driver' => 'sqlite',
            'database' => ':memory:',
            'prefix' => '',
            'foreign_key_constraints' => true,
        ]);
    }

    private function seedAndAuth(): string
    {
        $tenant = Tenant::create(['code' => 'acme', 'name' => 'Acme']);
        [, $key] = ApiKey::issue($tenant->id, 'panel', ['*']);
        app(TenantContext::class)->set($tenant->id);

        $product = Product::create([
            'external_id' => 'SKU-1', 'name' => 'Widget Pro', 'brand' => 'Acme',
            'currency' => 'EUR', 'our_price_cents' => 9900, 'categories' => ['Electronics', 'Gadgets'],
        ]);
        $amazon = CompetitorSource::create(['host' => 'amazon.it', 'adapter_code' => 'amazon', 'robots_policy' => 'respect']);
        $ebay = CompetitorSource::create(['host' => 'ebay.it', 'adapter_code' => 'ebay', 'robots_policy' => 'respect']);
        $target = MonitoringTarget::create(['product_id' => $product->id, 'country' => 'IT', 'status' => 'active', 'priority' => 10]);

        foreach ([$amazon, $ebay] as $src) {
            $cp = CompetitorProduct::create([
                'monitoring_target_id' => $target->id,
                'competitor_source_id' => $src->id,
                'url' => 'https://'.$src->host.'/dp/X',
                'match_status' => MatchStatus::Confirmed,
                'match_confidence' => 95,
            ]);
            PriceObservation::create(['competitor_product_id' => $cp->id, 'captured_at' => now(), 'price_cents' => 8900, 'currency' => 'EUR', 'price_base_cents' => 8900, 'available' => true]);
            StockObservation::create(['competitor_product_id' => $cp->id, 'captured_at' => now(), 'available' => true, 'qty_estimate' => 12]);
            PromoObservation::create(['competitor_product_id' => $cp->id, 'captured_at' => now(), 'promo_type' => 'sale', 'effective_discount_pct' => 10.0]);
        }

        AiDecisionLog::create(['feature' => 'narrative', 'model' => 'fake', 'output' => ['x' => 1], 'human_reviewed' => false]);

        return $key;
    }

    #[Test]
    public function tenants_me_returns_features_and_settings_object(): void
    {
        $key = $this->seedAndAuth();

        $this->withHeader('X-Api-Key', $key)
            ->getJson('/api/v1/tenants/me')
            ->assertOk()
            ->assertJsonStructure(['data' => ['tenant' => ['id', 'code', 'name', 'settings'], 'features', 'abilities']]);
    }

    #[Test]
    public function facets_count_hosts_and_categories(): void
    {
        $key = $this->seedAndAuth();

        $this->withHeader('X-Api-Key', $key)->getJson('/api/v1/facets/hosts')
            ->assertOk()
            ->assertJsonPath('data.0.count', 1);

        $this->withHeader('X-Api-Key', $key)->getJson('/api/v1/facets/categories')
            ->assertOk()
            ->assertJsonPath('data.0.category', 'Electronics');
    }

    #[Test]
    public function observation_history_endpoints_respond(): void
    {
        $key = $this->seedAndAuth();

        $this->withHeader('X-Api-Key', $key)->getJson('/api/v1/observations/prices?host=amazon.it')->assertOk()->assertJsonCount(1, 'data');
        $this->withHeader('X-Api-Key', $key)->getJson('/api/v1/observations/stock')->assertOk()->assertJsonPath('data.0.qty_estimate', 12);
        $this->withHeader('X-Api-Key', $key)->getJson('/api/v1/observations/promos')->assertOk()->assertJsonPath('data.0.effective_discount_pct', 10);
    }

    #[Test]
    public function ai_decisions_and_export_and_settings_round_trip(): void
    {
        $key = $this->seedAndAuth();

        $this->withHeader('X-Api-Key', $key)->getJson('/api/v1/ai-decisions')->assertOk()->assertJsonCount(1, 'data');

        $csv = $this->withHeader('X-Api-Key', $key)->get('/api/v1/catalog/products:export');
        $csv->assertOk();
        $this->assertStringContainsString('Widget Pro', $csv->streamedContent());

        $this->withHeader('X-Api-Key', $key)
            ->patchJson('/api/v1/tenants/me/settings', ['settings' => ['currency_base' => 'EUR']])
            ->assertOk()
            ->assertJsonPath('data.settings.currency_base', 'EUR');
    }
}
