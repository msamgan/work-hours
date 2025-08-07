<?php

declare(strict_types=1);

namespace App\Http\Stores;

use App\Http\QueryFilters\Task\DueDateFromFilter;
use App\Http\QueryFilters\Task\DueDateToFilter;
use App\Http\QueryFilters\Task\PriorityFilter;
use App\Http\QueryFilters\Task\ProjectIdFilter;
use App\Http\QueryFilters\Task\SearchFilter;
use App\Http\QueryFilters\Task\StatusFilter;
use App\Http\QueryFilters\Task\TagFilter;
use App\Models\Project;
use App\Models\Task;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pipeline\Pipeline;
use Illuminate\Support\Collection;

final class TaskStore
{
    public static function userTasks(int $userId): Collection
    {
        $ownedProjectTasksQuery = Task::query()
            ->whereHas('project', function ($query) use ($userId): void {
                $query->where('user_id', $userId);
            })
            ->with(['project', 'assignees', 'meta', 'tags'])
            ->orderByDesc('created_at');

        // Get tasks assigned to the user
        $assignedTasksQuery = Task::query()
            ->whereHas('assignees', function ($query) use ($userId): void {
                $query->where('users.id', $userId);
            })
            ->with(['project', 'assignees', 'meta', 'tags'])
            ->orderByDesc('created_at');

        $ownedProjectTasks = self::applyFilterPipeline($ownedProjectTasksQuery)->get();
        $assignedTasks = self::applyFilterPipeline($assignedTasksQuery)->get();

        // Combine and remove duplicates
        return $ownedProjectTasks->concat($assignedTasks)->unique('id');
    }

    public static function projectTasks(Project $project): Collection
    {
        return Task::query()
            ->where('project_id', $project->id)
            ->with(['assignees'])
            ->get();
    }

    public static function taskExportMapper(Collection $tasks): Collection
    {
        return $tasks->map(fn ($task): array => [
            'id' => $task->id,
            'project' => $task->project->name,
            'title' => $task->title,
            'description' => $task->description,
            'status' => ucfirst(str_replace('_', ' ', $task->status)),
            'priority' => ucfirst((string) $task->priority),
            'due_date' => $task->due_date ? Carbon::parse($task->due_date)->toDateString() : 'No due date',
            'assignees' => $task->assignees->pluck('name')->implode(', '),
            'created_at' => Carbon::parse($task->created_at)->toDateTimeString(),
        ]);
    }

    public static function taskExportHeaders(): array
    {
        return [
            'ID',
            'Project',
            'Title',
            'Description',
            'Status',
            'Priority',
            'Due Date',
            'Assignees',
            'Created At',
        ];
    }

    private static function applyFilterPipeline(Builder $query): Builder
    {
        return app(Pipeline::class)
            ->send($query)
            ->through([
                StatusFilter::class,
                PriorityFilter::class,
                ProjectIdFilter::class,
                DueDateFromFilter::class,
                DueDateToFilter::class,
                TagFilter::class,
                SearchFilter::class,
            ])
            ->thenReturn();
    }
}
