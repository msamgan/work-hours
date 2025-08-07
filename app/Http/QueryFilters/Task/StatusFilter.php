<?php

declare(strict_types=1);

namespace App\Http\QueryFilters\Task;

use Closure;
use Psr\Container\ContainerExceptionInterface;
use Psr\Container\NotFoundExceptionInterface;

final class StatusFilter
{
    /**
     * @throws ContainerExceptionInterface
     * @throws NotFoundExceptionInterface
     */
    public function handle($builder, Closure $next)
    {
        if (request()->has('status')) {
            $status = request('status');
            if ($status === 'incomplete') {
                $builder->where('status', '!=', 'completed');
            } elseif ($status !== 'all') {
                $builder->where('status', $status);
            }
        } else {
            $builder->where('status', '!=', 'completed');
        }

        return $next($builder);
    }
}
