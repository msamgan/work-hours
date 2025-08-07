<?php

declare(strict_types=1);

namespace App\Http\QueryFilters\Project;

use Closure;
use Psr\Container\ContainerExceptionInterface;
use Psr\Container\NotFoundExceptionInterface;

final class TeamMemberFilter
{
    /**
     * @throws ContainerExceptionInterface
     * @throws NotFoundExceptionInterface
     */
    public function handle($builder, Closure $next)
    {
        if (request()->has('team-member') && request('team-member') !== '') {
            $builder->whereHas('teamMembers', function ($query): void {
                $query->where('users.id', request('team-member'));
            });
        }

        return $next($builder);
    }
}
