<?php

declare(strict_types=1);

namespace App\Http\QueryFilters\Invoice;

use Closure;
use Psr\Container\ContainerExceptionInterface;
use Psr\Container\NotFoundExceptionInterface;

final class ClientFilter
{
    /**
     * @throws ContainerExceptionInterface
     * @throws NotFoundExceptionInterface
     */
    public function handle($builder, Closure $next)
    {
        if (request()->has('client') && request('client') !== '' && request('client') !== 'null' && request('client') !== null) {
            $clientId = request('client');
            $builder->where('client_id', $clientId);
        }

        return $next($builder);
    }
}
