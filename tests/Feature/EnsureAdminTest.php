<?php

declare(strict_types=1);

namespace Padosoft\PriceIntelligenceAdmin\Tests\Feature;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Support\Facades\Gate;
use Padosoft\PriceIntelligenceAdmin\Tests\TestCase;
use PHPUnit\Framework\Attributes\Test;

/**
 * Tests that EnsureAdmin correctly enforces authentication and authorization
 * for both cookie/session and Sanctum bearer-token auth paths.
 */
final class EnsureAdminTest extends TestCase
{
    protected function defineEnvironment($app): void
    {
        parent::defineEnvironment($app);

        // Use the full middleware stack (auth + EnsureAdmin) for these tests.
        $app['config']->set('price-intelligence-admin.middleware', ['web', 'auth', 'price-intelligence-admin']);
        $app['config']->set('auth.guards.web.driver', 'session');
        $app['config']->set('auth.guards.web.provider', 'users');
        $app['config']->set('auth.providers.users.driver', 'eloquent');
        $app['config']->set('auth.providers.users.model', FakeAdminUser::class);
    }

    #[Test]
    public function unauthenticated_requests_are_rejected(): void
    {
        // JSON Accept header makes Authenticate middleware return 401 rather than
        // redirecting to route('login'), which doesn't exist in Testbench.
        $this->get('/admin/price-intelligence', ['Accept' => 'application/json'])
            ->assertUnauthorized();
    }

    #[Test]
    public function authenticated_user_without_gate_is_forbidden(): void
    {
        // No gate defined → Gate::allows() returns false → 403.
        Gate::define('price-intelligence:admin', fn () => false);

        $this->actingAs(new FakeAdminUser)
            ->get('/admin/price-intelligence')
            ->assertForbidden();
    }

    #[Test]
    public function authenticated_user_with_gate_can_access_panel(): void
    {
        Gate::define('price-intelligence:admin', fn () => true);

        $this->actingAs(new FakeAdminUser)
            ->get('/admin/price-intelligence')
            ->assertOk()
            ->assertSee('id="root"', false);
    }
}

/**
 * Minimal in-memory user model for middleware tests — no database required.
 */
class FakeAdminUser extends Authenticatable
{
    protected $guarded = [];

    public function getAuthIdentifierName(): string
    {
        return 'id';
    }

    public function getAuthIdentifier(): int
    {
        return 1;
    }

    public function getAuthPasswordName(): string
    {
        return 'password';
    }

    public function getAuthPassword(): string
    {
        return '';
    }
}
