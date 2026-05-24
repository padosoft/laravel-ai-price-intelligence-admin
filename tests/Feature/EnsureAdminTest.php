<?php

declare(strict_types=1);

namespace Padosoft\PriceIntelligenceAdmin\Tests\Feature;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Support\Facades\Gate;
use Padosoft\PriceIntelligenceAdmin\Tests\TestCase;
use PHPUnit\Framework\Attributes\Test;

/**
 * Covers EnsureAdmin's authorization (Gate) behaviour, which is uniform across auth
 * modes since it acts on the resolved request user:
 *  - unauthenticated requests are rejected (401);
 *  - an authenticated user is denied (403) both when no gate is defined (deny by
 *    default) and when the gate explicitly denies;
 *  - an authenticated user the gate allows reaches the panel (200).
 *
 * Token-ability/scope enforcement (Sanctum abilities middleware) is layered in A2.
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
    public function authenticated_user_is_forbidden_when_no_gate_is_defined(): void
    {
        // Deny-by-default: with the 'price-intelligence:admin' ability undefined,
        // Gate::allows() returns false → 403. This is the secure default for hosts
        // that haven't wired up the ability yet.
        $this->actingAs(new FakeAdminUser)
            ->get('/admin/price-intelligence')
            ->assertForbidden();
    }

    #[Test]
    public function authenticated_user_denied_by_gate_is_forbidden(): void
    {
        // Gate explicitly denies → 403. (Gate closures receive the authenticated user
        // as the first argument; accept and ignore it for the idiomatic signature.)
        Gate::define('price-intelligence:admin', fn ($user) => false);

        $this->actingAs(new FakeAdminUser)
            ->get('/admin/price-intelligence')
            ->assertForbidden();
    }

    #[Test]
    public function authenticated_user_with_gate_can_access_panel(): void
    {
        Gate::define('price-intelligence:admin', fn ($user) => true);

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
