<?php

declare(strict_types=1);

namespace App\Http\QueryFilters\TimeLog;

use Closure;
use Psr\Container\ContainerExceptionInterface;
use Psr\Container\NotFoundExceptionInterface;

final class IsPaidFilter
{
    /**
     * @throws ContainerExceptionInterface
     * @throws NotFoundExceptionInterface
     */
    public function handle($request, Closure $next)
    {
        $builder = $next($request);

        if (request()->get('is-paid') && request('is-paid') !== '') {
            $isPaid = request('is-paid') === 'true' || request('is-paid') === '1';
            $builder->where('is_paid', $isPaid);
        }

        return $builder;
    }
}
