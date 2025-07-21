<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\StoreProjectRequest;
use App\Http\Requests\UpdateProjectRequest;
use App\Http\Stores\ClientStore;
use App\Http\Stores\ProjectStore;
use App\Http\Stores\TeamStore;
use App\Http\Stores\TimeLogStore;
use App\Models\Project;
use App\Models\TimeLog;
use App\Traits\ExportableTrait;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Msamgan\Lact\Attributes\Action;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

final class ProjectController extends Controller
{
    use ExportableTrait;

    public function index()
    {
        return Inertia::render('project/index');
    }

    #[Action(method: 'get', name: 'project.list', middleware: ['auth', 'verified'])]
    public function projects(): Collection
    {
        return ProjectStore::userProjects(userId: auth()->id());
    }

    /**
     * @throws Throwable
     */
    #[Action(method: 'post', name: 'project.store', middleware: ['auth', 'verified'])]
    public function store(StoreProjectRequest $request): void
    {
        DB::beginTransaction();
        try {
            $project = Project::query()->create([
                'user_id' => auth()->id(),
                'name' => $request->input('name'),
                'description' => $request->input('description'),
                'client_id' => $request->input('client_id'),
            ]);

            if ($request->has('team_members')) {
                $teamMembers = collect($request->input('team_members'))->mapWithKeys(function ($memberId) use ($request) {
                    $isApprover = $request->has('approvers') && in_array($memberId, $request->input('approvers'), true);

                    // Default values
                    $hourlyRate = 0;
                    $currency = 'USD';

                    // Find the team member data if it exists
                    if ($request->has('team_members_data')) {
                        $memberData = collect($request->input('team_members_data'))
                            ->firstWhere('id', $memberId);

                        if ($memberData) {
                            $hourlyRate = $memberData['hourly_rate'];
                            $currency = $memberData['currency'];
                        }
                    }

                    return [$memberId => [
                        'is_approver' => $isApprover,
                        'hourly_rate' => $hourlyRate,
                        'currency' => $currency,
                    ]];
                })->toArray();

                $project->teamMembers()->sync($teamMembers);
            }

            DB::commit();
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function create()
    {
        $teamMembers = TeamStore::teamMembers(userId: auth()->id());

        $clients = ClientStore::userClients(auth()->id())
            ->map(fn ($client): array => [
                'id' => $client->id,
                'name' => $client->name,
            ]);

        return Inertia::render('project/create', [
            'teamMembers' => $teamMembers,
            'clients' => $clients,
        ]);
    }

    public function edit(Project $project)
    {
        Gate::authorize('update', $project);

        $teamMembers = TeamStore::teamMembers(userId: auth()->id());

        $assignedTeamMembers = $project->teamMembers->pluck('id')->toArray();
        $assignedApprovers = $project->approvers->pluck('id')->toArray();

        // Get team members data including hourly_rate and currency
        $assignedTeamMembersData = $project->teamMembers->map(function ($member) {
            return [
                'id' => $member->id,
                'hourly_rate' => $member->pivot->hourly_rate ?? 0,
                'currency' => $member->pivot->currency ?? 'USD',
            ];
        })->toArray();

        $clients = ClientStore::userClients(auth()->id())
            ->map(fn ($client): array => [
                'id' => $client->id,
                'name' => $client->name,
            ]);

        return Inertia::render('project/edit', [
            'project' => $project,
            'teamMembers' => $teamMembers,
            'assignedTeamMembers' => $assignedTeamMembers,
            'assignedApprovers' => $assignedApprovers,
            'assignedTeamMembersData' => $assignedTeamMembersData,
            'clients' => $clients,
        ]);
    }

    /**
     * @throws Throwable
     */
    #[Action(method: 'put', name: 'project.update', params: ['project'], middleware: ['auth', 'verified'])]
    public function update(UpdateProjectRequest $request, Project $project): void
    {
        Gate::authorize('update', $project);

        DB::beginTransaction();
        try {
            $project->update($request->only(['name', 'description', 'client_id']));

            if ($request->has('team_members')) {
                $teamMembers = collect($request->input('team_members'))->mapWithKeys(function ($memberId) use ($request) {
                    $isApprover = $request->has('approvers') && in_array($memberId, $request->input('approvers'), true);

                    // Default values
                    $hourlyRate = 0;
                    $currency = 'USD';

                    // Find the team member data if it exists
                    if ($request->has('team_members_data')) {
                        $memberData = collect($request->input('team_members_data'))
                            ->firstWhere('id', $memberId);

                        if ($memberData) {
                            $hourlyRate = $memberData['hourly_rate'];
                            $currency = $memberData['currency'];
                        }
                    }

                    return [$memberId => [
                        'is_approver' => $isApprover,
                        'hourly_rate' => $hourlyRate,
                        'currency' => $currency,
                    ]];
                })->toArray();

                $project->teamMembers()->sync($teamMembers);
            } else {
                $project->teamMembers()->detach();
            }

            DB::commit();
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * @throws Throwable
     */
    #[Action(method: 'delete', name: 'project.destroy', params: ['project'], middleware: ['auth', 'verified'])]
    public function destroy(Project $project): void
    {
        Gate::authorize('delete', $project);

        DB::beginTransaction();
        try {
            $project->delete();
            DB::commit();
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    #[Action(method: 'get', name: 'project.export', middleware: ['auth', 'verified'])]
    public function projectExport(): StreamedResponse
    {
        $headers = ['ID', 'Name', 'Description', 'Owner', 'Team Members', 'Approvers', 'Created At'];
        $filename = 'projects_' . Carbon::now()->format('Y-m-d') . '.csv';

        return $this->exportToCsv(ProjectStore::projectExportMapper(
            projects: ProjectStore::userProjects(userId: auth()->id())),
            $headers,
            $filename
        );
    }

    #[Action(method: 'get', name: 'project.export-time-logs', middleware: ['auth', 'verified'])]
    public function exportTimeLogs(): StreamedResponse
    {
        request()->validate([
            'project_id' => ['required', 'integer', 'exists:projects,id'],
        ]);

        $project = Project::query()->findOrFail(request('project_id'));

        abort_if($project->user_id !== auth()->id(), 403, 'Unauthorized action.');

        Gate::authorize('viewTimeLogs', $project);

        $timeLogs = TimeLogStore::timeLogs(baseQuery: $this->baseTimeLogQuery($project));
        $mappedTimeLogs = TimeLogStore::timeLogExportMapper(timeLogs: $timeLogs);
        $headers = TimeLogStore::timeLogExportHeaders();
        $filename = 'project_time_logs_' . $project->name . '_' . Carbon::now()->format('Y-m-d') . '.csv';

        return $this->exportToCsv($mappedTimeLogs, $headers, $filename);
    }

    public function timeLogs(Project $project)
    {
        Gate::authorize('viewTimeLogs', $project);

        $timeLogs = TimeLogStore::timeLogs(baseQuery: $this->baseTimeLogQuery($project));

        $teamMembers = ProjectStore::teamMembers(project: $project);

        return Inertia::render('project/time-logs', [
            'project' => $project,
            'teamMembers' => $teamMembers,
            ...TimeLogStore::resData(timeLogs: $timeLogs),
        ]);
    }

    private function baseTimeLogQuery(Project $project)
    {
        return TimeLog::query()->where('project_id', $project->getKey());
    }
}
