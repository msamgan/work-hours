<?php

declare(strict_types=1);

namespace App\Http\QueryFilters\Project;

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
            $builder->whereDate('created_at', '>=', request('created-date-from'));
        }

        return $next($builder);
    }
}
