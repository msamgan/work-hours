<?php

declare(strict_types=1);

namespace App\Http\Stores;

use App\Enums\TimeLogStatus;
use App\Http\QueryFilters\TimeLog\EndDateFilter;
use App\Http\QueryFilters\TimeLog\IsPaidFilter;
use App\Http\QueryFilters\TimeLog\ProjectIdFilter;
use App\Http\QueryFilters\TimeLog\StartDateFilter;
use App\Http\QueryFilters\TimeLog\StatusFilter;
use App\Http\QueryFilters\TimeLog\TagFilter;
use App\Http\QueryFilters\TimeLog\UserIdFilter;
use App\Models\Client;
use App\Models\Project;
use App\Models\Tag;
use App\Models\Team;
use App\Models\TimeLog;
use App\Models\User;
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
            ->where('status', TimeLogStatus::APPROVED)
            ->orderBy('start_timestamp', 'desc')
            ->with('user')
            ->take($limit)
            ->get(['start_timestamp', 'end_timestamp', 'duration', 'user_id']);
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
                StatusFilter::class,
                TagFilter::class,
            ])
            ->thenReturn()
            ->with(['user', 'project', 'task', 'tags'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public static function totalHours(array $teamMembersIds): float
    {
        return TimeLog::query()
            ->whereIn('user_id', $teamMembersIds)
            ->where('status', TimeLogStatus::APPROVED)
            ->sum('duration');
    }

    public static function unpaidHours(array $teamMembersIds)
    {
        return TimeLog::query()
            ->whereIn('user_id', $teamMembersIds)
            ->where('is_paid', false)
            ->where('status', TimeLogStatus::APPROVED)
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
            ->where('status', TimeLogStatus::APPROVED)
            ->get();
    }

    public static function unpaidTimeLogs(int $teamMemberId): Collection
    {
        // Alias for unpaidTimeLog to fix the error in InvoiceController
        return self::unpaidTimeLog($teamMemberId);
    }

    public static function unpaidTimeLogsByClient(int $clientId): Collection
    {
        // Get the client
        $client = Client::query()->findOrFail($clientId);

        // Get all projects for the client
        $projects = ClientStore::clientProjects($client);

        // Get all time logs for these projects
        $timeLogs = new Collection();
        foreach ($projects as $project) {
            $projectTimeLogs = TimeLog::query()
                ->with('project')
                ->where('project_id', $project->id)
                ->where('is_paid', false)
                ->where('status', TimeLogStatus::APPROVED)
                ->get();

            $timeLogs = $timeLogs->concat($projectTimeLogs);
        }

        return $timeLogs;
    }

    public static function unpaidTimeLogsGroupedByProject(int $clientId): array
    {
        // Get unpaid time logs for the client
        $timeLogs = self::unpaidTimeLogsByClient($clientId);

        // Get client for hourly rate and currency
        $client = Client::query()->find($clientId);

        // Group time logs by project
        $groupedTimeLogs = [];

        foreach ($timeLogs as $timeLog) {
            $projectId = $timeLog->project_id;
            $projectName = $timeLog->project->name;

            if (! isset($groupedTimeLogs[$projectId])) {
                // Use client's hourly_rate and currency if available, otherwise fall back to user's values
                $hourlyRate = ($client && $client->hourly_rate) ? $client->hourly_rate : (auth()->user()->hourly_rate ?? 0);
                $currency = ($client && $client->currency) ? $client->currency : (auth()->user()->currency ?? 'USD');

                $groupedTimeLogs[$projectId] = [
                    'project_id' => $projectId,
                    'project_name' => $projectName,
                    'total_hours' => 0,
                    'hourly_rate' => $hourlyRate,
                    'currency' => $currency,
                    'time_logs' => [],
                ];
            }

            // Add time log to the project group
            $groupedTimeLogs[$projectId]['time_logs'][] = $timeLog;

            // Add duration to total hours
            $groupedTimeLogs[$projectId]['total_hours'] += $timeLog->duration;
        }

        // Convert to an indexed array
        return array_values($groupedTimeLogs);
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
            ->where('status', TimeLogStatus::APPROVED)
            ->get();
    }

    public static function currency(Project $project)
    {
        $team = TeamStore::teamEntry(userId: $project->user_id, memberId: auth()->id());

        return $team instanceof Team ? $team->currency : auth()->user()->currency;
    }

    public static function resData(\Illuminate\Support\Collection $timeLogs): array
    {
        $timeLogStats = self::stats($timeLogs);
        $tags = Tag::query()->where('user_id', auth()->id())->get(['id', 'name']);

        return [
            'timeLogs' => self::timeLogMapper($timeLogs),
            'filters' => self::filters(),
            'projects' => ProjectStore::userProjects(userId: auth()->id()),
            'totalDuration' => $timeLogStats['total_duration'],
            'unpaidHours' => $timeLogStats['unpaid_hours'],
            'paidHours' => $timeLogStats['paid_hours'],
            'weeklyAverage' => $timeLogStats['weekly_average'],
            'unpaidAmountsByCurrency' => $timeLogStats['unpaid_amounts_by_currency'],
            'paidAmountsByCurrency' => $timeLogStats['paid_amounts_by_currency'],
            'tags' => $tags,
        ];
    }

    public static function stats(\Illuminate\Support\Collection $timeLogs): array
    {
        $approvedLogs = $timeLogs->where('status', TimeLogStatus::APPROVED);
        $totalDuration = round($approvedLogs->sum('duration'), 2);

        return [
            'total_duration' => $totalDuration,
            'unpaid_hours' => round($approvedLogs->where('is_paid', false)->sum('duration'), 2),
            'paid_hours' => round($approvedLogs->where('is_paid', true)->sum('duration'), 2),
            'weekly_average' => $totalDuration > 0 ? round($totalDuration / 7, 2) : 0,
            'unpaid_amounts_by_currency' => self::unpaidAmountFromLogs($approvedLogs),
            'paid_amounts_by_currency' => self::paidAmountFromLogs($approvedLogs),
        ];
    }

    public static function unpaidAmountFromLogs(\Illuminate\Support\Collection $timeLogs): array
    {
        $unpaidAmounts = [];

        $timeLogs->each(function (TimeLog $timeLog) use (&$unpaidAmounts): void {
            $hourlyRate = Team::memberHourlyRate(project: $timeLog->project, memberId: $timeLog->user_id);
            $currency = $timeLog->currency ?? 'USD';

            if (! $timeLog['is_paid'] && $timeLog['status'] === TimeLogStatus::APPROVED) {
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

            if ($timeLog['is_paid'] && $timeLog['status'] === TimeLogStatus::APPROVED) {
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

    public static function timeLogMapper(\Illuminate\Support\Collection $timeLogs): \Illuminate\Support\Collection
    {
        return $timeLogs->map(function ($timeLog): array {
            $hourlyRate = (float) $timeLog->hourly_rate ?? Team::memberHourlyRate(project: $timeLog->project, memberId: $timeLog->user_id);
            $paidAmount = $timeLog->is_paid ? round($timeLog->duration * $hourlyRate, 2) : 0;

            $approverName = null;
            if ($timeLog->approved_by) {
                $approver = User::query()->find($timeLog->approved_by);
                $approverName = $approver ? $approver->name : null;
            }

            $isNonMonetary = Team::isMemberNonMonetary(userId: $timeLog->project->user_id, memberId: $timeLog->user_id);

            return [
                'id' => $timeLog->id,
                'user_id' => $timeLog->user_id,
                'user_name' => $timeLog->user ? $timeLog->user->name : null,
                'project_id' => $timeLog->project_id,
                'project_name' => $timeLog->project ? $timeLog->project->name : 'No Project',
                'task_id' => $timeLog->task_id,
                'task_title' => $timeLog->task ? $timeLog->task->title : null,
                'task_description' => $timeLog->task ? $timeLog->task->description : null,
                'task_status' => $timeLog->task ? $timeLog->task->status : null,
                'task_priority' => $timeLog->task ? $timeLog->task->priority : null,
                'task_due_date' => $timeLog->task && $timeLog->task->due_date ? Carbon::parse($timeLog->task->due_date)->toDateString() : null,
                'start_timestamp' => Carbon::parse($timeLog->start_timestamp)->toDateTimeString(),
                'end_timestamp' => $timeLog->end_timestamp ? Carbon::parse($timeLog->end_timestamp)->toDateTimeString() : null,
                'duration' => $timeLog->duration ? round($timeLog->duration, 2) : 0,
                'note' => $timeLog->note,
                'is_paid' => $timeLog->is_paid,
                'hourly_rate' => $hourlyRate,
                'paid_amount' => $paidAmount,
                'currency' => $timeLog->currency ?? 'USD',
                'status' => $timeLog->status,
                'approved_by' => $timeLog->approved_by,
                'approver_name' => $approverName,
                'comment' => $timeLog->comment,
                'user_non_monetary' => $isNonMonetary,
                'tags' => $timeLog->tags ? $timeLog->tags->map(fn ($tag): array => [
                    'id' => $tag->id,
                    'name' => $tag->name,
                    'color' => $tag->color ?? '#032C95', // Default to blue if no color is set
                ]) : [],
            ];
        });
    }

    public static function timeLogExportMapper(\Illuminate\Support\Collection $timeLogs): \Illuminate\Support\Collection
    {
        $map = self::timeLogMapper($timeLogs);

        return $map->map(fn ($timeLog): array => [
            $timeLog['user_name'],
            $timeLog['project_name'],
            $timeLog['task_title'] ?? 'No Task',
            $timeLog['task_status'] ?? '',
            $timeLog['task_priority'] ?? '',
            $timeLog['task_due_date'] ?? '',
            $timeLog['start_timestamp'],
            $timeLog['end_timestamp'],
            $timeLog['duration'],
            $timeLog['note'],
            $timeLog['is_paid'] ? 'Yes' : 'No',
            $timeLog['hourly_rate'],
            $timeLog['paid_amount'],
            $timeLog['currency'],
            $timeLog['status']?->value,
            $timeLog['approver_name'] ?? '',
            $timeLog['comment'] ?? '',
        ]);
    }

    public static function timeLogExportHeaders(): array
    {
        return [
            'User Name',
            'Project Name',
            'Task Title',
            'Task Status',
            'Task Priority',
            'Task Due Date',
            'Start Timestamp',
            'End Timestamp',
            'Duration (hours)',
            'Note',
            'Is Paid',
            'Hourly Rate',
            'Paid Amount',
            'Currency',
            'Status',
            'Approver Name',
            'Comment',
        ];
    }

    public static function filters(): array
    {
        return [
            'start-date' => request('start-date', ''),
            'end-date' => request('end-date', ''),
            'project' => request('project', ''),
            'is-paid' => request('is-paid', ''),
            'status' => request('status', ''),
            'tag' => request('tag', ''),
        ];
    }
}
