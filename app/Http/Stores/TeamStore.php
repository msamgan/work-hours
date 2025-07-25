<?php

declare(strict_types=1);

namespace App\Http\Stores;

use App\Models\Team;
use Illuminate\Support\Collection;

final class TeamStore
{
    public static function teamMembersIds(int $userId): Collection
    {
        return Team::query()->where('user_id', $userId)->pluck('member_id');
    }

    public static function teamMemberCount(int $userId): int
    {
        return Team::query()->where('user_id', $userId)->count();
    }

    public static function teamMembers(int $userId, bool $map = true): Collection|null
    {
        $team = Team::query()
            ->where('user_id', $userId)
            ->with('member')
            ->get();

        if ($map) {
            return $team->map(fn ($team): array => [
                'id' => $team->member->id,
                'name' => $team->member->name,
                'email' => $team->member->email,
            ]);
        }

        return $team;
    }

    public static function teamEntry(int $userId, int $memberId): ?Team
    {
        return Team::query()
            ->where('user_id', $userId)
            ->where('member_id', $memberId)
            ->first();
    }
}
