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
            'default_list_id' => 'required|string',
        ]);

        $user = Auth::user();

        if (! $user->trello_token) {
            return response()->json(['error' => 'No Trello authentication found.'], 401);
        }

        try {
            // Format project name to store Trello IDs
            $projectName = $request->board_name . '|' . $request->board_id . '|' . $request->default_list_id;

            // Create or update project
            $project = Project::query()->updateOrCreate([
                'user_id' => $user->id,
                'name' => $projectName,
            ], [
                'description' => 'Imported from Trello',
                'source' => 'trello',
            ]);

            return response()->json([
                'message' => 'Board successfully imported as project',
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
     * Import all cards from a list as tasks.
     */
    public function importListCards(Request $request, string $projectId): JsonResponse
    {
        $request->validate([
            'list_id' => 'required|string',
        ]);

        $user = Auth::user();

        if (! $user->trello_token) {
            return response()->json(['error' => 'No Trello authentication found.'], 401);
        }

        $project = Project::query()->find($projectId);

        if (! $project || $project->user_id !== $user->id) {
            return response()->json(['error' => 'Project not found or not authorized.'], 404);
        }

        try {
            // Get the Trello API key from config or env directly with fallback
            $key = config('services.trello.client_id');

            if (! $key) {
                return response()->json(['error' => 'Trello API key not configured.'], 500);
            }

            $cards = $this->trelloAdapter->getListCards($user->trello_token, $key, $request->list_id);

            if ($cards instanceof JsonResponse) {
                return $cards;
            }

            $importedCount = 0;

            foreach ($cards as $card) {
                // Create task from card
                $task = $project->tasks()->updateOrCreate(
                    [
                        'meta->source_id' => $card['id'],
                        'meta->source' => 'trello',
                    ],
                    [
                        'title' => $card['name'],
                        'description' => $card['desc'] ?? null,
                        'due_date' => isset($card['due']) ? Carbon::parse($card['due']) : null,
                        'status' => $card['closed'] ? 'completed' : 'pending',
                        'priority' => $this->getPriorityFromLabels($card['labels'] ?? []),
                        'is_imported' => true,
                    ]
                );

                // Store card metadata
                $task->meta()->updateOrCreate(
                    ['task_id' => $task->id],
                    [
                        'source' => 'trello',
                        'source_number' => $card['id'],
                        'source_state' => $card['closed'] ? 'archived' : 'active',
                        'source_url' => $card['shortUrl'] ?? null,
                        'source_id' => $card['id'],
                    ]
                );

                $importedCount++;
            }

            return response()->json([
                'message' => "{$importedCount} cards successfully imported as tasks",
            ]);

        } catch (Exception $e) {
            Log::error('Error importing Trello cards: ' . $e->getMessage());

            return response()->json([
                'error' => 'Failed to import cards. ' . $e->getMessage(),
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
