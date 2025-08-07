<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Adapters\TrelloAdapter;
use App\Models\Project;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Msamgan\Lact\Attributes\Action;

final class TrelloBoardController extends Controller
{
    public function __construct(private readonly TrelloAdapter $trelloAdapter) {}

    /**
     * Display the Trello boards page.
     */
    public function index(): Response
    {
        return Inertia::render('trello/boards');
    }

    /**
     * Get all boards for the authenticated user.
     */
    public function getBoards(): Response
    {
        $user = Auth::user();
        $boards = [];
        $error = null;

        if (! $user->trello_token) {
            $error = 'No Trello authentication found.';
        } else {
            // Get the Trello API key from config or env directly with fallback
            $key = config('services.trello.client_id');

            if (! $key) {
                $error = 'Trello API key not configured.';
            } else {
                $boards = $this->trelloAdapter->getBoards($user->trello_token, $key);
            }
        }

        return Inertia::render('trello/boards', [
            'boards' => $boards,
            'error' => $error,
        ]);
    }

    /**
     * Get all lists for a specific board.
     */
    public function getBoardLists(string $boardId): JsonResponse
    {
        $user = Auth::user();

        if (! $user->trello_token) {
            return response()->json(['error' => 'No Trello authentication found.'], 401);
        }

        // Get the Trello API key from config or env directly with fallback
        $key = config('services.trello.client_id');

        if (! $key) {
            return response()->json(['error' => 'Trello API key not configured.'], 500);
        }

        $lists = $this->trelloAdapter->getBoardLists($user->trello_token, $key, $boardId);

        return response()->json($lists);
    }

    /**
     * Get all cards for a specific list.
     */
    public function getListCards(string $listId): JsonResponse
    {
        $user = Auth::user();

        if (! $user->trello_token) {
            return response()->json(['error' => 'No Trello authentication found.'], 401);
        }

        // Get the Trello API key from config or env directly with fallback
        $key = config('services.trello.client_id');

        if (! $key) {
            return response()->json(['error' => 'Trello API key not configured.'], 500);
        }

        $cards = $this->trelloAdapter->getListCards($user->trello_token, $key, $listId);

        return response()->json($cards);
    }

    /**
     * Import a board as a project and its cards as tasks.
     */
    public function importBoard(Request $request): JsonResponse
    {
        $request->validate([
            'board_id' => 'required|string',
            'board_name' => 'required|string',
        ]);

        $user = Auth::user();

        if (! $user->trello_token) {
            return response()->json(['error' => 'No Trello authentication found.'], 401);
        }

        try {
            // Get the Trello API key from config
            $key = config('services.trello.client_id');

            if (! $key) {
                return response()->json(['error' => 'Trello API key not configured.'], 500);
            }

            // Create project
            $project = Project::query()->updateOrCreate([
                'user_id' => $user->id,
                'name' => $request->board_name,
            ], [
                'description' => 'Imported from Trello',
                'source' => 'trello',
                'repo_id' => $request->board_id,
            ]);

            // Get all lists from the board
            $lists = $this->trelloAdapter->getBoardLists($user->trello_token, $key, $request->board_id);

            if (empty($lists)) {
                return response()->json([
                    'message' => 'Board successfully imported as project, but no lists were found.',
                    'project' => $project,
                ]);
            }

            $importedCount = 0;

            // Import cards from all lists
            foreach ($lists as $list) {
                $listId = $list['id'];
                $listName = $list['name'];

                // Skip archived/closed lists if needed
                if (isset($list['closed']) && $list['closed'] === true) {
                    continue;
                }

                // Fetch cards from this list
                $cards = $this->trelloAdapter->getListCards($user->trello_token, $key, $listId);

                if (empty($cards)) {
                    continue; // Skip to next list if no cards found
                }

                foreach ($cards as $card) {
                    // Create task from card
                    $task = $project->tasks()->updateOrCreate(
                        [
                            'title' => $card['name'],
                        ],
                        [
                            'description' => $card['desc'] ?? null,
                            'due_date' => isset($card['due']) ? Carbon::parse($card['due']) : null,
                            'status' => isset($card['closed']) ? 'completed' : 'pending',
                            'priority' => $this->getPriorityFromLabels($card['labels'] ?? []),
                            'is_imported' => true,
                        ]
                    );

                    // Store card metadata with list name in extra_data
                    $task->meta()->updateOrCreate(
                        ['task_id' => $task->id],
                        [
                            'source' => 'trello',
                            'source_number' => $card['id'],
                            'source_state' => isset($card['closed']) ? 'archived' : 'active',
                            'source_url' => $card['shortUrl'] ?? null,
                            'source_id' => $card['id'],
                            'extra_data' => [
                                'list_name' => $listName,
                                'list_id' => $listId,
                            ],
                        ]
                    );

                    $importedCount++;
                }
            }

            return response()->json([
                'message' => "Board successfully imported as project with {$importedCount} tasks from all lists",
                'project' => $project,
            ]);

        } catch (Exception $e) {
            Log::error('Error importing Trello board: ' . $e->getMessage());

            return response()->json([
                'error' => 'Failed to import board. ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Sync a project with its source Trello board
     */
    #[Action(method: 'POST', name: 'trello.projects.sync', params: ['project'], middleware: ['auth', 'verified'])]
    public function syncTrelloProject(Project $project): JsonResponse
    {
        $user = Auth::user();

        if (! $user->trello_token) {
            return response()->json(['error' => 'No Trello authentication found.'], 401);
        }

        if ($project->user_id !== $user->id) {
            return response()->json(['error' => 'You are not authorized to sync this project.'], 403);
        }

        if ($project->source !== 'trello') {
            return response()->json(['error' => 'This project is not linked to a Trello board.'], 400);
        }

        try {
            // Get the Trello API key from config
            $key = config('services.trello.client_id');

            if (! $key) {
                return response()->json(['error' => 'Trello API key not configured.'], 500);
            }

            // Get all lists from the board
            $lists = $this->trelloAdapter->getBoardLists($user->trello_token, $key, $project->repo_id);

            if (empty($lists)) {
                return response()->json([
                    'message' => 'No lists found in the Trello board.',
                    'success' => false,
                ]);
            }

            $importedCount = 0;
            $updatedCount = 0;

            // Import cards from all lists
            foreach ($lists as $list) {
                $listId = $list['id'];
                $listName = $list['name'];

                // Skip archived/closed lists if needed
                if (isset($list['closed']) && $list['closed'] === true) {
                    continue;
                }

                // Fetch cards from this list
                $cards = $this->trelloAdapter->getListCards($user->trello_token, $key, $listId);

                if (empty($cards)) {
                    continue; // Skip to next list if no cards found
                }

                foreach ($cards as $card) {
                    // Check if task already exists
                    $task = $project->tasks()
                        ->whereHas('meta', function ($query) use ($card): void {
                            $query->where('source', 'trello')
                                ->where('source_id', $card['id']);
                        })
                        ->first();

                    if ($task) {
                        // Update existing task
                        $task->update([
                            'title' => $card['name'],
                            'description' => $card['desc'] ?? null,
                            'due_date' => isset($card['due']) ? Carbon::parse($card['due']) : null,
                            'status' => isset($card['closed']) ? 'completed' : 'pending',
                            'priority' => $this->getPriorityFromLabels($card['labels'] ?? []),
                        ]);

                        // Update task metadata
                        $task->meta()->update([
                            'source_state' => isset($card['closed']) ? 'archived' : 'active',
                            'source_url' => $card['shortUrl'] ?? null,
                            'extra_data' => [
                                'list_name' => $listName,
                                'list_id' => $listId,
                            ],
                        ]);

                        $updatedCount++;
                    } else {
                        // Create new task
                        $task = $project->tasks()->create([
                            'title' => $card['name'],
                            'description' => $card['desc'] ?? null,
                            'due_date' => isset($card['due']) ? Carbon::parse($card['due']) : null,
                            'status' => isset($card['closed']) ? 'completed' : 'pending',
                            'priority' => $this->getPriorityFromLabels($card['labels'] ?? []),
                            'is_imported' => true,
                        ]);

                        // Store card metadata
                        $task->meta()->create([
                            'source' => 'trello',
                            'source_number' => $card['id'],
                            'source_state' => isset($card['closed']) ? 'archived' : 'active',
                            'source_url' => $card['shortUrl'] ?? null,
                            'source_id' => $card['id'],
                            'extra_data' => [
                                'list_name' => $listName,
                                'list_id' => $listId,
                            ],
                        ]);

                        $importedCount++;
                    }
                }
            }

            return response()->json([
                'message' => "Project successfully synced with {$importedCount} new tasks and {$updatedCount} updated tasks from Trello",
                'success' => true,
            ]);

        } catch (Exception $e) {
            Log::error('Error syncing Trello project: ' . $e->getMessage());

            return response()->json([
                'error' => 'Failed to sync project. ' . $e->getMessage(),
                'success' => false,
            ], 500);
        }
    }

    /**
     * Determine priority from Trello card labels
     */
    private function getPriorityFromLabels(array $labels): string
    {
        foreach ($labels as $label) {
            $name = mb_strtolower($label['name'] ?? '');
            if (str_contains($name, 'high')) {
                return 'high';
            }
            if (str_contains($name, 'medium')) {
                return 'medium';
            }

            if (str_contains($name, 'low')) {
                return 'low';
            }

            // Check colors as fallback
            $color = $label['color'] ?? '';
            if ($color === 'red') {
                return 'high';
            }
            if ($color === 'yellow') {
                return 'medium';
            }
            if ($color === 'green') {
                return 'low';
            }
        }

        return 'medium'; // Default priority
    }
}
