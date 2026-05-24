<?php

declare(strict_types=1);

namespace Padosoft\PriceIntelligenceAdmin\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Guards the panel: the request must be authenticated and the user must hold the
 * `price-intelligence:admin` ability (Sanctum token ability or Gate). Host apps
 * may swap this for their own middleware via config.
 */
final class EnsureAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null) {
            abort(Response::HTTP_UNAUTHORIZED);
        }

        if (method_exists($user, 'tokenCan') && ! $user->tokenCan('price-intelligence:admin')) {
            abort(Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}
