<?php

declare(strict_types=1);

namespace Padosoft\PriceIntelligenceAdmin\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

/**
 * Guards the panel: the request must be authenticated and the user must hold the
 * `price-intelligence:admin` ability (Sanctum token ability or Gate). Host apps
 * may swap this for their own middleware via config.
 *
 * Two auth paths:
 *  - Bearer token (Sanctum PAT): the token itself must carry the `price-intelligence:admin` ability.
 *  - Cookie / session (Sanctum SPA or plain Laravel auth): the `price-intelligence:admin` Gate
 *    must return true. Host apps define this gate (e.g. checking an is_admin flag or role).
 *    Undefined gates default to denied.
 */
final class EnsureAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null) {
            abort(Response::HTTP_UNAUTHORIZED);
        }

        // Sanctum bearer-token path: check the token carries the admin ability directly.
        // Calling can() on the PersonalAccessToken avoids calling tokenCan() on a type
        // that PHPStan doesn't know has that method (HasApiTokens trait users).
        // In SPA/cookie mode, currentAccessToken() returns a TransientToken (not a PAT)
        // so this branch is skipped and we fall through to the Gate check.
        $token = method_exists($user, 'currentAccessToken') ? $user->currentAccessToken() : null;
        if ($token instanceof PersonalAccessToken) {
            if (! $token->can('price-intelligence:admin')) {
                abort(Response::HTTP_FORBIDDEN);
            }

            return $next($request);
        }

        // Cookie / session auth: delegate to the Gate.
        // Host apps must define the 'price-intelligence:admin' Gate ability; if not
        // defined Laravel defaults to denied, keeping the panel secure.
        if (! Gate::allows('price-intelligence:admin')) {
            abort(Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}
