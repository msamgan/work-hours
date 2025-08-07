<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Adapters\GitHubAdapter;
use App\Enums\TimeLogStatus;
use App\Http\Requests\StoreTimeLogRequest;
use App\Http\Requests\UpdateTimeLogRequest;
use App\Http\Stores\ProjectStore;
use App\Http\Stores\TimeLogStore;
use App\Imports\TimeLogImport;
use App\Models\Project;
use App\Models\Tag;
use App\Models\Task;
use App\Models\Team;
use App\Models\TimeLog;
use App\Models\User;
use App\Notifications\TimeLogEntry;
use App\Notifications\TimeLogPaid;
use App\Traits\ExportableTrait;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Log;
use Maatwebsite\Excel\Facades\Excel;
use Msamgan\Lact\Attributes\Action;
use PhpOffice\PhpSpreadsheet\Cell\DataValidation;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

final class TimeLogController extends Controller
{
    use ExportableTrait;

    public function __construct(private readonly GitHubAdapter $gitHubAdapter) {}

    public function index()
    {
        $timeLogs = TimeLogStore::timeLogs(baseQuery: $this->baseQuery());

        return Inertia::render('time-log/index', TimeLogStore::resData(timeLogs: $timeLogs));
    }

    /**
     * @throws Throwable
     */
    #[Action(method: 'post', name: 'time-log.store', middleware: ['auth', 'verified'])]
    public function store(StoreTimeLogRequest $request): void
    {
        DB::beginTransaction();

        try {
            $data = $request->validated();
            $data['user_id'] = auth()->id();

            $project = Project::query()->find($data['project_id']);

            $data['currency'] = $project ? TimeLogStore::currency(project: $project) : auth()->user()->currency;
            $data['hourly_rate'] = Team::memberHourlyRate(project: $project, memberId: auth()->id());

            $isLogCompleted = ! empty($data['start_timestamp']) && ! empty($data['end_timestamp']);

            if ($isLogCompleted) {
                $start = Carbon::parse($data['start_timestamp']);
                $end = Carbon::parse($data['end_timestamp']);

                // Ensure the end date is the same as the start date
                if ($start->format('Y-m-d') !== $end->format('Y-m-d')) {
                    $end = Carbon::parse($end->format('H:i:s'))->setDateFrom($start);
                    $data['end_timestamp'] = $end->toDateTimeString();
                }

                $data['duration'] = round(abs($start->diffInMinutes($end)) / 60, 2);

                if ($project && $project->isCreator(auth()->id())) {
                    $data['status'] = TimeLogStatus::APPROVED;
                    $data['approved_by'] = auth()->id();
                    $data['approved_at'] = Carbon::now();
                }
            }

            $markAsComplete = $data['mark_task_complete'] ?? false;
            $closeGitHubIssue = $data['close_github_issue'] ?? false;
            unset($data['mark_task_complete']);
            unset($data['close_github_issue']);
            unset($data['tags']);

            $timeLog = TimeLog::query()->create($data);

            $this->attachTags($request, $timeLog);

            if ($isLogCompleted && ! empty($data['task_id'])) {
                $task = Task::query()->find($data['task_id']);

                if ($task) {
                    // Mark task as complete if requested
                    if ($markAsComplete) {
                        $task->update(['status' => 'completed']);
                    }

                    // Close GitHub issue if requested and a task is imported from GitHub
                    if ($closeGitHubIssue && $task->is_imported && $task->meta && $task->meta->source === 'github' && $task->meta->source_state !== 'closed') {
                        $this->gitHubAdapter->closeGitHubIssue($task);
                    }
                }
            }

            DB::commit();

            if ($isLogCompleted) {
                $teamLeader = User::teamLeader(project: $timeLog->project);
                if (auth()->id() !== $teamLeader->getKey()) {
                    $teamLeader->notify(new TimeLogEntry($timeLog, auth()->user()));
                }
            }
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function create()
    {
        $projects = ProjectStore::userProjects(userId: auth()->id());

        // Get all tasks assigned to the user
        $tasks = Task::query()
            ->whereHas('assignees', function ($query): void {
                $query->where('users.id', auth()->id());
            })
            ->with('meta')
            ->get(['id', 'title', 'project_id', 'is_imported'])
            ->map(fn ($task): array => [
                'id' => $task->id,
                'title' => $task->title,
                'project_id' => $task->project_id,
                'is_imported' => $task->is_imported,
                'meta' => [
                    'source' => $task->meta?->source,
                    'source_state' => $task->meta?->source_state,
                ],
            ]);

        return Inertia::render('time-log/create', [
            'projects' => $projects,
            'tasks' => $tasks,
        ]);
    }

    /**
     * @throws Throwable
     */
    #[Action(method: 'put', name: 'time-log.update', params: ['timeLog'], middleware: ['auth', 'verified'])]
    public function update(UpdateTimeLogRequest $request, TimeLog $timeLog): void
    {
        Gate::authorize('update', $timeLog);

        DB::beginTransaction();
        try {
            $data = $request->validated();

            $project = Project::query()->find($data['project_id']);
            $data['currency'] = $project ? TimeLogStore::currency(project: $project) : auth()->user()->currency;
            $data['hourly_rate'] = Team::memberHourlyRate(project: $project, memberId: auth()->id());

            $isLogCompleted = ! empty($data['start_timestamp']) && ! empty($data['end_timestamp']);

            if ($isLogCompleted) {
                $start = Carbon::parse($data['start_timestamp']);
                $end = Carbon::parse($data['end_timestamp']);

                // Ensure the end date is the same as the start date
                if ($start->format('Y-m-d') !== $end->format('Y-m-d')) {
                    $end = Carbon::parse($end->format('H:i:s'))->setDateFrom($start);
                    $data['end_timestamp'] = $end->toDateTimeString();
                }

                $data['duration'] = round(abs($start->diffInMinutes($end)) / 60, 2);

                if ($project && $project->isCreator(auth()->id())) {
                    $data['status'] = 'approved';
                    $data['approved_by'] = auth()->id();
                    $data['approved_at'] = Carbon::now();
                }
            }

            $markAsComplete = $data['mark_task_complete'] ?? false;
            $closeGitHubIssue = $data['close_github_issue'] ?? false;

            unset($data['mark_task_complete']);
            unset($data['close_github_issue']);
            unset($data['tags']);

            $timeLog->update($data);

            $this->attachTags($request, $timeLog);

            if ($isLogCompleted && ! empty($data['task_id']) && $markAsComplete) {
                $task = Task::query()->find($data['task_id']);
                if ($task) {
                    $task->update(['status' => 'completed']);
                }

                // Close GitHub issue if requested and a task is imported from GitHub
                if ($closeGitHubIssue && $task && $task->is_imported && $task->meta && $task->meta->source === 'github' && $task->meta->source_state !== 'closed') {
                    $this->gitHubAdapter->closeGitHubIssue($task);
                }
            }

            DB::commit();

            if ($isLogCompleted) {
                $teamLeader = User::teamLeader(project: $timeLog->project);
                if (auth()->id() !== $teamLeader->getKey()) {
                    $teamLeader->notify(new TimeLogEntry($timeLog, auth()->user()));
                }
            }

        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function edit(TimeLog $timeLog)
    {
        Gate::authorize('update', $timeLog);

        $projects = ProjectStore::userProjects(userId: auth()->id());

        // Get all tasks assigned to the user
        $tasks = Task::query()
            ->whereHas('assignees', function ($query): void {
                $query->where('users.id', auth()->id());
            })
            ->get(['id', 'title', 'project_id', 'is_imported'])
            ->map(fn ($task): array => [
                'id' => $task->id,
                'title' => $task->title,
                'project_id' => $task->project_id,
                'is_imported' => $task->is_imported,
                'meta' => [
                    'source' => $task->meta?->source,
                    'source_state' => $task->meta?->source_state,
                ],
            ]);

        $timeLog->load('tags');

        return Inertia::render('time-log/edit', [
            'timeLog' => [
                'id' => $timeLog->id,
                'project_id' => $timeLog->project_id,
                'task_id' => $timeLog->task_id,
                'start_timestamp' => $timeLog->start_timestamp,
                'end_timestamp' => $timeLog->end_timestamp,
                'duration' => $timeLog->duration,
                'note' => $timeLog->note,
                'tags' => $timeLog->tags->pluck('name'),
            ],
            'projects' => $projects,
            'tasks' => $tasks,
        ]);
    }

    /**
     * Delete the specified time log.
     *
     * @throws Throwable
     */
    #[Action(method: 'delete', name: 'time-log.destroy', params: ['timeLog'], middleware: ['auth', 'verified'])]
    public function destroy(TimeLog $timeLog): void
    {
        Gate::authorize('delete', $timeLog);

        DB::beginTransaction();
        try {
            $timeLog->delete();
            DB::commit();
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Mark selected time logs as paid
     *
     * @throws Throwable
     */
    #[Action(method: 'post', name: 'time-log.mark-as-paid', middleware: ['auth', 'verified'])]
    public function markAsPaid(): void
    {
        $timeLogIds = request('time_log_ids', []);

        abort_if(empty($timeLogIds), 400, 'No time logs selected.');

        DB::beginTransaction();
        try {
            $timeLogs = TimeLog::query()
                ->whereIn('id', $timeLogIds)
                ->get();

            $currentUser = auth()->user();
            $projectAmounts = [];
            $invalidLogs = [];

            foreach ($timeLogs as $timeLog) {
                if (empty($timeLog->start_timestamp) || empty($timeLog->end_timestamp)) {
                    $invalidLogs[] = $timeLog->id;

                    continue;
                }

                // Check if the time log is approved
                if ($timeLog->status !== TimeLogStatus::APPROVED) {
                    $invalidLogs[] = $timeLog->id;

                    continue;
                }

                $hourlyRate = Team::memberHourlyRate(project: $timeLog->project, memberId: $timeLog->user_id);
                $timeLog->update([
                    'is_paid' => true,
                    'hourly_rate' => $hourlyRate,
                ]);

                $amount = $timeLog->duration * $hourlyRate;

                if (! isset($projectAmounts[$timeLog->project_id])) {
                    $projectAmounts[$timeLog->project_id] = 0;
                }

                $projectAmounts[$timeLog->project_id] += $amount;

                // Send notifications
                $teamLeader = User::teamLeader(project: $timeLog->project);
                $timeLogOwner = User::query()->find($timeLog->user_id);

                // If current user is team leader, notify the team member
                if ($currentUser->id === $teamLeader->id && $currentUser->id !== $timeLogOwner->id) {
                    $timeLogOwner->notify(new TimeLogPaid($timeLog, $currentUser));
                }

                // If current user is team member, notify the team leader
                if ($currentUser->id !== $teamLeader->id && $currentUser->id === $timeLogOwner->id) {
                    $teamLeader->notify(new TimeLogPaid($timeLog, $currentUser));
                }
            }

            foreach ($projectAmounts as $projectId => $amount) {
                $project = Project::query()->find($projectId);
                if ($project) {
                    $project->paid_amount += $amount;
                    $project->save();
                }
            }

            DB::commit();

            // If there were any invalid logs, flash a message to the user
            if ($invalidLogs !== []) {
                $count = count($invalidLogs);
                $message = $count === 1
                    ? "1 time log entry was skipped because it doesn't have both start and end timestamps or is not approved."
                    : "$count time log entries were skipped because they don't have both start and end timestamps or are not approved.";

                session()->flash('warning', $message);
            }
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Export time logs to CSV
     */
    #[Action(method: 'get', name: 'time-log.export', middleware: ['auth', 'verified'])]
    public function export(): StreamedResponse
    {
        $timeLogs = TimeLogStore::timeLogs(baseQuery: $this->baseQuery());
        $mappedTimeLogs = TimeLogStore::timeLogExportMapper(timeLogs: $timeLogs);
        $headers = TimeLogStore::timeLogExportHeaders();
        $filename = 'time_logs_' . Carbon::now()->format('Y-m-d') . '.csv';

        return $this->exportToCsv($mappedTimeLogs, $headers, $filename);
    }

    /**
     * Import time logs from Excel
     *
     * @throws Throwable
     */
    #[Action(method: 'post', name: 'time-log.import', middleware: ['auth', 'verified'])]
    public function import(Request $request): JsonResponse
    {
        $request->validate(['file' => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:2048']]);

        DB::beginTransaction();
        try {
            $import = new TimeLogImport();
            Excel::import($import, $request->file('file'));

            $errors = $import->getErrors();
            $successCount = $import->getSuccessCount();

            if (count($errors) > 0) {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'message' => 'Import failed. No records were imported.',
                    'errors' => $errors,
                ], 422);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => $successCount . ' time logs imported successfully.',
                'errors' => $errors,
            ]);
        } catch (Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Import failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generate a sample Excel template for time log import
     */
    #[Action(method: 'get', name: 'time-log.template', middleware: ['auth', 'verified'])]
    public function template(): StreamedResponse
    {
        $projects = ProjectStore::userProjects(userId: auth()->id())->pluck('name')->toArray();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        $sheet->setCellValue('A1', 'Project');
        $sheet->setCellValue('B1', 'Start Timestamp');
        $sheet->setCellValue('C1', 'End Timestamp');
        $sheet->setCellValue('D1', 'Note');

        for ($row = 2; $row <= 100; $row++) {
            $validation = $sheet->getCell('A' . $row)->getDataValidation();
            $validation->setType(DataValidation::TYPE_LIST);
            $validation->setErrorStyle(DataValidation::STYLE_INFORMATION);
            $validation->setAllowBlank(false);
            $validation->setShowDropDown(true);
            $validation->setFormula1('"' . implode(',', $projects) . '"');
        }

        $sheet->setCellValue('A2', $projects[0] ?? '');
        $sheet->setCellValue('B2', Carbon::now()->format('Y-m-d H:i:s'));
        $sheet->setCellValue('C2', Carbon::now()->addHours(2)->format('Y-m-d H:i:s'));
        $sheet->setCellValue('D2', 'Example note');

        foreach (range('A', 'D') as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);
        $filename = 'time_log_template_' . Carbon::now()->format('Y-m-d') . '.xlsx';

        return response()->streamDownload(function () use ($writer): void {
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    /**
     * Attach tags to a time log
     */
    public function attachTags(Request $request, TimeLog $timeLog): JsonResponse
    {
        $tags = $request->input('tags', []);
        $tagIds = [];

        foreach ($tags as $tagName) {
            $tag = Tag::query()->firstOrCreate([
                'name' => $tagName,
                'user_id' => $request->user()->id,
            ]);

            $tagIds[] = $tag->id;
        }

        // Sync the tags with the time log
        $timeLog->tags()->sync($tagIds);

        return response()->json([
            'success' => true,
            'tags' => $timeLog->tags,
        ]);
    }

    /**
     * Get tags for a time log
     */
    public function getTags(TimeLog $timeLog): JsonResponse
    {
        return response()->json($timeLog->tags);
    }

    private function baseQuery()
    {
        return TimeLog::query()->where('user_id', auth()->id());
    }
}
