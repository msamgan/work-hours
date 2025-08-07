<?php

declare(strict_types=1);

namespace App\Http\QueryFilters\Client;

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
            $builder->whereDate('created_at', '<=', request('created-date-to'));
        }

        return $next($builder);
    }
}
