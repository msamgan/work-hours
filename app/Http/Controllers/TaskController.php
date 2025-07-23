<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Http\Stores\ProjectStore;
use App\Http\Stores\TaskStore;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Notifications\TaskAssigned;
use App\Notifications\TaskCompleted;
use App\Traits\ExportableTrait;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Msamgan\Lact\Attributes\Action;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

final class TaskController extends Controller
{
    use ExportableTrait;

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $projects = ProjectStore::userProjects(userId: auth()->id())
            ->map(fn ($project): array => [
                'id' => $project->id,
                'name' => $project->name,
            ]);

        return Inertia::render('task/index', [
            'projects' => $projects,
        ]);
    }

    #[Action(method: 'get', name: 'task.list', middleware: ['auth', 'verified'])]
    public function tasks(): Collection
    {
        $filters = request()->only([
            'status',
            'priority',
            'project_id',
            'due_date_from',
            'due_date_to',
            'search',
        ]);

        return TaskStore::userTasks(userId: auth()->id(), filters: $filters);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $projects = ProjectStore::userProjects(userId: auth()->id())
            ->map(fn ($project): array => [
                'id' => $project->id,
                'name' => $project->name,
            ]);

        return Inertia::render('task/create', [
            'projects' => $projects,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @throws Throwable
     */
    #[Action(method: 'post', name: 'task.store', middleware: ['auth', 'verified'])]
    public function store(StoreTaskRequest $request): void
    {
        DB::beginTransaction();
        try {
            $task = Task::query()->create([
                'project_id' => $request->input('project_id'),
                'title' => $request->input('title'),
                'description' => $request->input('description'),
                'status' => $request->input('status'),
                'priority' => $request->input('priority', 'medium'),
                'due_date' => $request->input('due_date'),
            ]);

            if ($request->has('assignees')) {
                $task->assignees()->sync($request->input('assignees'));

                // Load the project relationship for the notification
                $task->load('project');

                // Send notification to all assignees
                $assigneeIds = $request->input('assignees');
                $users = User::query()->whereIn('id', $assigneeIds)->get();
                foreach ($users as $user) {
                    $user->notify(new TaskAssigned($task, auth()->user()));
                }
            }

            DB::commit();
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Display the specified resource.
     */
    #[Action(method: 'get', name: 'task.show', params: ['task'], middleware: ['auth', 'verified'])]
    public function show(Task $task): Task
    {
        // Load relationships
        $task->load(['project', 'assignees']);

        // Check if user has access to this task
        $isProjectOwner = $task->project->user_id === auth()->id();
        $isTeamMember = $task->project->teamMembers->contains('id', auth()->id());
        $isAssignee = $task->assignees->contains('id', auth()->id());

        abort_if(! $isProjectOwner && ! $isTeamMember && ! $isAssignee, 403, 'Unauthorized action.');

        return $task;
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Task $task)
    {
        // Load relationships
        $task->load(['project', 'assignees']);

        // Check if a user has access to edit this task
        $isProjectOwner = $task->project->user_id === auth()->id();

        abort_if(! $isProjectOwner, 403, 'Unauthorized action.');

        $projects = ProjectStore::userProjects(userId: auth()->id())
            ->map(fn ($project): array => [
                'id' => $project->id,
                'name' => $project->name,
            ]);

        // Get potential assignees (project team members and owner)
        $potentialAssignees = collect([$task->project->user])
            ->concat($task->project->teamMembers)
            ->unique('id')
            ->map(fn ($user): array => [
                'id' => $user->id,
                'name' => $user->name,
            ]);

        $assignedUsers = $task->assignees->pluck('id')->toArray();

        return Inertia::render('task/edit', [
            'task' => $task,
            'projects' => $projects,
            'potentialAssignees' => $potentialAssignees,
            'assignedUsers' => $assignedUsers,
        ]);
    }

    /**
     * Update the specified resource in storage.
     *
     * @throws Throwable
     */
    #[Action(method: 'put', name: 'task.update', params: ['task'], middleware: ['auth', 'verified'])]
    public function update(UpdateTaskRequest $request, Task $task): void
    {
        // Check if user has access to update this task
        $isProjectOwner = $task->project->user_id === auth()->id();
        $isAssignee = $task->assignees->contains('id', auth()->id());

        abort_if(! $isProjectOwner && ! $isAssignee, 403, 'Unauthorized action.');

        DB::beginTransaction();
        try {
            // Store the old status to check if it's being changed to completed
            $oldStatus = $task->status;

            // Get current assignees before update
            $currentAssigneeIds = $task->assignees->pluck('id')->toArray();

            // If the project owner, allow full update
            if ($isProjectOwner) {
                $task->update($request->only(['title', 'description', 'status', 'priority', 'due_date']));

                if ($request->has('assignees')) {
                    $newAssigneeIds = $request->input('assignees');
                    $task->assignees()->sync($newAssigneeIds);

                    // Find newly added assignees
                    $addedAssigneeIds = array_diff($newAssigneeIds, $currentAssigneeIds);

                    if ($addedAssigneeIds !== []) {
                        // Load the project relationship for the notification
                        $task->load('project');

                        // Send notification only to newly assigned users
                        $newUsers = User::query()->whereIn('id', $addedAssigneeIds)->get();
                        foreach ($newUsers as $user) {
                            $user->notify(new TaskAssigned($task, auth()->user()));
                        }
                    }
                } else {
                    $task->assignees()->detach();
                }
            } else {
                // If assignee, only allow status update
                $task->update($request->only(['status']));
            }

            // Check if the status was changed to complete by someone other than the project owner
            if ($oldStatus !== 'completed' && $request->input('status') === 'completed' && ! $isProjectOwner) {
                // Load the project relationship for the notification if not already loaded
                if (! $task->relationLoaded('project')) {
                    $task->load('project');
                }

                // Get the project owner (task creator)
                $projectOwner = User::query()->find($task->project->user_id);

                // Send a notification to the project owner
                $projectOwner->notify(new TaskCompleted($task, auth()->user()));
            }

            DB::commit();
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Remove the specified resource from storage.
     *
     * @throws Throwable
     */
    #[Action(method: 'delete', name: 'task.destroy', params: ['task'], middleware: ['auth', 'verified'])]
    public function destroy(Task $task): void
    {
        // Check if user has access to delete this task
        $isProjectOwner = $task->project->user_id === auth()->id();

        abort_if(! $isProjectOwner, 403, 'Unauthorized action.');

        DB::beginTransaction();
        try {
            // Detach all assignees first
            $task->assignees()->detach();

            // Delete the task
            $task->delete();

            DB::commit();
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Export tasks to CSV.
     */
    #[Action(method: 'get', name: 'task.export', middleware: ['auth', 'verified'])]
    public function exportTasks(): StreamedResponse
    {
        $tasks = TaskStore::userTasks(userId: auth()->id());
        $mappedTasks = TaskStore::taskExportMapper(tasks: $tasks);
        $headers = TaskStore::taskExportHeaders();
        $filename = 'tasks_' . Carbon::now()->format('Y-m-d') . '.csv';

        return $this->exportToCsv($mappedTasks, $headers, $filename);
    }

    /**
     * Get potential assignees for a project.
     */
    #[Action(method: 'get', name: 'task.potential-assignees', params: ['project'], middleware: ['auth', 'verified'])]
    public function potentialAssignees(Project $project): Collection
    {
        $isProjectOwner = $project->user_id === auth()->id();
        $isTeamMember = $project->teamMembers->contains('id', auth()->id());

        abort_if(! $isProjectOwner && ! $isTeamMember, 403, 'Unauthorized action.');

        // Get potential assignees (project team members and owner)
        return collect([$project->user])
            ->concat($project->teamMembers)
            ->unique('id')
            ->map(fn ($user): array => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ]);
    }
}
