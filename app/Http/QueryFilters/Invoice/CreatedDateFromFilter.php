<?php

declare(strict_types=1);

namespace App\Http\QueryFilters\Invoice;

use Closure;
use Psr\Container\ContainerExceptionInterface;
use Psr\Container\NotFoundExceptionInterface;

final class CreatedDateFromFilter
{
    /**
     * @throws ContainerExceptionInterface
     * @throws NotFoundExceptionInterface
     */
    public function handle($builder, Closure $next)
    {
        if (request()->has('created-date-from') && request('created-date-from') !== '' && request('created-date-from') !== 'null' && request('created-date-from') !== null) {
            $dateFrom = request('created-date-from');
            $builder->whereDate('created_at', '>=', $dateFrom);
        }

        return $next($builder);
    }
}
