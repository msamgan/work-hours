<?php

declare(strict_types=1);

namespace App\Http\QueryFilters\Task;

use Closure;
use Psr\Container\ContainerExceptionInterface;
use Psr\Container\NotFoundExceptionInterface;

final class TagFilter
{
    /**
     * @throws ContainerExceptionInterface
     * @throws NotFoundExceptionInterface
     */
    public function handle($builder, Closure $next)
    {
        if (request()->has('tag') && request('tag') !== 'all') {
            $builder->whereHas('tags', function ($query): void {
                $query->where('tags.id', request('tag'));
            });
        }

        return $next($builder);
    }
}
