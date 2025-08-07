<?php

declare(strict_types=1);

namespace App\Http\QueryFilters\TimeLog;

use Closure;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

final readonly class TagFilter
{
    public function __construct(private Request $request) {}

    public function handle(Builder $query, Closure $next): Builder
    {
        $tag = $this->request->query('tag');

        if (! $tag) {
            return $next($query);
        }

        $query->whereHas('tags', function ($query) use ($tag): void {
            $query->where('tags.id', $tag)->where('tags.user_id', auth()->id());
        });

        return $next($query);
    }
}
