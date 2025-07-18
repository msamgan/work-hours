<?php

declare(strict_types=1);

namespace App\Http\Stores;

use App\Http\QueryFilters\TimeLog\EndDateFilter;
use App\Http\QueryFilters\TimeLog\IsPaidFilter;
use App\Http\QueryFilters\TimeLog\ProjectIdFilter;
use App\Http\QueryFilters\TimeLog\StartDateFilter;
use App\Http\QueryFilters\TimeLog\UserIdFilter;
use App\Models\Project;
use App\Models\Team;
use App\Models\TimeLog;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pipeline\Pipeline;

final class TimeLogStore
{
    public static function recentTeamLogs(array $teamMembersIds, int $limit = 5): Collection
    {
        return TimeLog::query()
            ->whereIn('user_id', $teamMembersIds)
            ->orderBy('start_timestamp', 'desc')
            ->with('user')
            ->take($limit)
            ->get(['start_timestamp', 'end_timestamp', 'duration', 'user_id']);
    }

    public static function totalHours(array $teamMembersIds): float
    {
        return TimeLog::query()
            ->whereIn('user_id', $teamMembersIds)
            ->sum('duration');
    }

    public static function unpaidHours(array $teamMembersIds)
    {
        return TimeLog::query()
            ->whereIn('user_id', $teamMembersIds)
            ->where('is_paid', false)
            ->sum('duration');
    }

    public static function unpaidAmount(array $teamMembersIds): array
    {
        $unpaidAmounts = [];
        foreach ($teamMembersIds as $memberId) {
            $unpaidLogs = self::unpaidTimeLog(teamMemberId: $memberId);
            $unpaidLogs->each(function ($log) use (&$unpaidAmounts, $memberId): void {
                $memberUnpaidHours = $log->duration;
                $hourlyRate = Team::memberHourlyRate(project: $log->project, memberId: $memberId);
                $currency = $log->currency ?? 'USD';

                if ($hourlyRate) {
                    if (! isset($unpaidAmounts[$currency])) {
                        $unpaidAmounts[$currency] = 0;
                    }
                    $unpaidAmounts[$currency] += $memberUnpaidHours * $hourlyRate;
                }
            });
        }

        // Round all amounts to 2 decimal places
        foreach ($unpaidAmounts as $currency => $amount) {
            $unpaidAmounts[$currency] = round($amount, 2);
        }

        return $unpaidAmounts;
    }

    public static function unpaidTimeLog(int $teamMemberId): Collection
    {
        return TimeLog::query()
            ->with('project')
            ->where('user_id', $teamMemberId)
            ->where('is_paid', false)
            ->get();
    }

    public static function paidAmount(array $teamMembersIds): array
    {
        $paidAmounts = [];
        foreach ($teamMembersIds as $memberId) {
            $paidLogs = self::paidTimeLog(teamMemberId: $memberId);
            $paidLogs->each(function ($log) use (&$paidAmounts, $memberId): void {
                $memberPaidHours = $log->duration;
                $hourlyRate = Team::memberHourlyRate(project: $log->project, memberId: $memberId);
                $currency = $log->currency ?? 'USD';

                if ($hourlyRate) {
                    if (! isset($paidAmounts[$currency])) {
                        $paidAmounts[$currency] = 0;
                    }
                    $paidAmounts[$currency] += $memberPaidHours * $hourlyRate;
                }
            });
        }

        // Round all amounts to 2 decimal places
        foreach ($paidAmounts as $currency => $amount) {
            $paidAmounts[$currency] = round($amount, 2);
        }

        return $paidAmounts;
    }

    public static function paidTimeLog(int $teamMemberId): Collection
    {
        return TimeLog::query()
            ->with('project')
            ->where('user_id', $teamMemberId)
            ->where('is_paid', true)
            ->get();
    }

    public static function unpaidAmountFromLogs(\Illuminate\Support\Collection $timeLogs): array
    {
        $unpaidAmounts = [];

        $timeLogs->each(function (TimeLog $timeLog) use (&$unpaidAmounts): void {
            $hourlyRate = Team::memberHourlyRate(project: $timeLog->project, memberId: $timeLog->user_id);
            $currency = $timeLog->currency ?? 'USD';

            if (! $timeLog['is_paid']) {
                if (! isset($unpaidAmounts[$currency])) {
                    $unpaidAmounts[$currency] = 0;
                }
                $unpaidAmounts[$currency] += $timeLog['duration'] * $hourlyRate;
            }
        });

        // Round all amounts to 2 decimal places
        foreach ($unpaidAmounts as $currency => $amount) {
            $unpaidAmounts[$currency] = round($amount, 2);
        }

        return $unpaidAmounts;
    }

    public static function paidAmountFromLogs(\Illuminate\Support\Collection $timeLogs): array
    {
        $paidAmounts = [];

        $timeLogs->each(function (TimeLog $timeLog) use (&$paidAmounts): void {
            $hourlyRate = Team::memberHourlyRate(project: $timeLog->project, memberId: $timeLog->user_id);
            $currency = $timeLog->currency ?? 'USD';

            if ($timeLog['is_paid']) {
                if (! isset($paidAmounts[$currency])) {
                    $paidAmounts[$currency] = 0;
                }
                $paidAmounts[$currency] += $timeLog['duration'] * $hourlyRate;
            }
        });

        // Round all amounts to 2 decimal places
        foreach ($paidAmounts as $currency => $amount) {
            $paidAmounts[$currency] = round($amount, 2);
        }

        return $paidAmounts;
    }

    public static function timeLogs(Builder $baseQuery)
    {
        return app(Pipeline::class)
            ->send($baseQuery)
            ->through([
                StartDateFilter::class,
                EndDateFilter::class,
                UserIdFilter::class,
                IsPaidFilter::class,
                ProjectIdFilter::class,
            ])
            ->thenReturn()
            ->with(['user', 'project'])->get();
    }

    public static function timeLogMapper(\Illuminate\Support\Collection $timeLogs): \Illuminate\Support\Collection
    {
        return $timeLogs->map(function ($timeLog): array {
            $hourlyRate = (float) $timeLog->hourly_rate ?? Team::memberHourlyRate(project: $timeLog->project, memberId: $timeLog->user_id);
            $paidAmount = $timeLog->is_paid ? round($timeLog->duration * $hourlyRate, 2) : 0;

            return [
                'id' => $timeLog->id,
                'user_id' => $timeLog->user_id,
                'user_name' => $timeLog->user ? $timeLog->user->name : null,
                'project_id' => $timeLog->project_id,
                'project_name' => $timeLog->project ? $timeLog->project->name : 'No Project',
                'start_timestamp' => Carbon::parse($timeLog->start_timestamp)->toDateTimeString(),
                'end_timestamp' => $timeLog->end_timestamp ? Carbon::parse($timeLog->end_timestamp)->toDateTimeString() : null,
                'duration' => $timeLog->duration ? round($timeLog->duration, 2) : 0,
                'note' => $timeLog->note,
                'is_paid' => $timeLog->is_paid,
                'hourly_rate' => $hourlyRate,
                'paid_amount' => $paidAmount,
                'currency' => $timeLog->currency ?? 'USD',
            ];
        });
    }

    public static function currency(Project $project)
    {
        $team = TeamStore::teamEntry(userId: $project->user_id, memberId: auth()->id());

        return $team instanceof Team ? $team->currency : auth()->user()->currency;
    }
}
