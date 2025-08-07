<?php

declare(strict_types=1);

namespace App\Http\QueryFilters\Invoice;

use Closure;
use Psr\Container\ContainerExceptionInterface;
use Psr\Container\NotFoundExceptionInterface;

final class CreatedDateToFilter
{
    /**
     * @throws ContainerExceptionInterface
     * @throws NotFoundExceptionInterface
     */
    public function handle($builder, Closure $next)
    {

        if (request()->has('created-date-to') && request('created-date-to') !== '' && request('created-date-to') !== 'null' && request('created-date-to') !== null) {
            $dateTo = request('created-date-to');
            $builder->whereDate('created_at', '<=', $dateTo);
        }

        return $next($builder);
    }
}
