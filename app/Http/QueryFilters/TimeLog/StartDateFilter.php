<?php

declare(strict_types=1);

namespace App\Http\QueryFilters\TimeLog;

use Closure;
use Psr\Container\ContainerExceptionInterface;
use Psr\Container\NotFoundExceptionInterface;

final class StartDateFilter
{
    /**
     * @throws ContainerExceptionInterface
     * @throws NotFoundExceptionInterface
     */
    public function handle($request, Closure $next)
    {
        $builder = $next($request);

        if (request()->get('start_date')) {
            $builder->whereDate('start_timestamp', '>=', request('start_date'));
        }

        return $builder;
    }
}
