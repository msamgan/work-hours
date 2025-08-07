<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

final class AdminMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $adminIds = config('app.admin_ids', []);

        if (Auth::check() && in_array(Auth::id(), $adminIds)) {
            return $next($request);
        }

        return redirect()->route('dashboard')->with('error', 'You do not have permission to access the admin area.');
    }
}
