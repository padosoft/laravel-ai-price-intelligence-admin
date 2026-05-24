<?php

declare(strict_types=1);

namespace Padosoft\PriceIntelligenceAdmin\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\Response;

/**
 * Guards the panel: the request must be authenticated and the authenticated user must
 * pass the `price-intelligence:admin` Gate. Host apps define that ability (e.g. an
 * is_admin flag or role); an undefined gate denies by default, keeping the panel secure.
 *
 * Authentication (cookie SPA session or Sanctum bearer token) is handled upstream by the
 * `auth:sanctum` middleware. Token-ability/scope enforcement (requiring the token itself
 * to carry the admin ability) is layered in the auth phase (A2) via Sanctum's abilities
 * middleware; here we authorize the resolved user uniformly for both auth modes.
 */
final class EnsureAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null) {
            abort(Response::HTTP_UNAUTHORIZED);
        }

        // Authorize the user resolved from THIS request (the panel may run under a
        // non-default guard, so forUser avoids the default resolver). Undefined gate => denied.
        if (! Gate::forUser($user)->allows('price-intelligence:admin')) {
            abort(Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}
