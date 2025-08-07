<?php

declare(strict_types=1);

namespace App\Http\Stores;

use App\Http\QueryFilters\Project\ClientFilter;
use App\Http\QueryFilters\Project\CreatedDateFromFilter;
use App\Http\QueryFilters\Project\CreatedDateToFilter;
use App\Http\QueryFilters\Project\SearchFilter;
use App\Http\QueryFilters\Project\TeamMemberFilter;
use App\Models\Project;
use App\Models\Team;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pipeline\Pipeline;
use Illuminate\Support\Collection;

final class ProjectStore
{
    public static function userProjects(int $userId): Collection
    {
        $ownedProjectsQuery = Project::query()
            ->where('user_id', $userId)
            ->with(['teamMembers', 'approvers', 'user', 'client', 'tasks', 'timeLogs', 'tasks.assignees']);

        $assignedProjectsQuery = Project::query()
            ->whereHas('teamMembers', function ($query) use ($userId): void {
                $query->where('users.id', $userId);
            })
            ->where('user_id', '!=', $userId)
            ->with(['teamMembers', 'approvers', 'user', 'client', 'tasks', 'timeLogs', 'tasks.assignees']);

        $ownedProjects = self::applyFilterPipeline($ownedProjectsQuery)->get();
        $assignedProjects = self::applyFilterPipeline($assignedProjectsQuery)->get();

        return $ownedProjects->concat($assignedProjects);
    }

    public static function teamMembers(Project $project, bool $includeCreator = true): Collection
    {
        $teamMembers = $project->teamMembers()
            ->get()
            ->map(fn ($member): array => [
                'id' => $member->id,
                'name' => $member->name,
                'email' => $member->email,
            ]);

        $creatorIncluded = $teamMembers->contains(fn ($member): bool => $member['id'] === $project->user_id);

        if (! $creatorIncluded && $includeCreator) {
            $teamMembers->push([
                'id' => $project->user->id,
                'name' => $project->user->name,
                'email' => $project->user->email,
            ]);
        }

        return $teamMembers;
    }

    public static function exportTimeLogsMapper(Collection $timeLogs): Collection
    {
        return $timeLogs->map(fn ($timeLog): array => [
            'id' => $timeLog->id,
            'user_name' => $timeLog->user ? $timeLog->user->name : 'Unknown',
            'start_timestamp' => Carbon::parse($timeLog->start_timestamp)->toDateTimeString(),
            'end_timestamp' => $timeLog->end_timestamp ? Carbon::parse($timeLog->end_timestamp)->toDateTimeString() : 'In Progress',
            'duration' => $timeLog->duration ? round($timeLog->duration, 2) : 0,
            'is_paid' => $timeLog->is_paid ? 'Paid' : 'Unpaid',
            'note' => $timeLog->note,
            'hourly_rate' => $timeLog->hourly_rate ?: Team::memberHourlyRate(project: $timeLog->project, memberId: $timeLog->user_id),
        ]);
    }

    public static function projectExportMapper(Collection $projects): Collection
    {
        return $projects->map(fn ($project): array => [
            'id' => $project->id,
            'name' => $project->name,
            'description' => $project->description,
            'owner' => $project->user->name,
            'team_members' => $project->teamMembers->pluck('name')->implode(', '),
            'approvers' => $project->approvers->pluck('name')->implode(', '),
            'created_at' => Carbon::parse($project->created_at)->toDateTimeString(),
        ]);
    }

    private static function applyFilterPipeline(Builder $query): Builder
    {
        return app(Pipeline::class)
            ->send($query)
            ->through([
                ClientFilter::class,
                TeamMemberFilter::class,
                CreatedDateFromFilter::class,
                CreatedDateToFilter::class,
                SearchFilter::class,
            ])
            ->thenReturn();
    }
}
