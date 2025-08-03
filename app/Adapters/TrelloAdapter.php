<?php

declare(strict_types=1);

namespace App\Adapters;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Exception;
use Illuminate\Http\Client\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;

final class TrelloAdapter
{
    private const string API_BASE_URL = 'https://api.trello.com/1';

    /**
     * Get the authenticated user's boards from Trello.
     *
     * @param  string  $token  The Trello API token
     * @param  string  $key  The Trello API key
     * @return array|JsonResponse The boards or an error response
     */
    public function getBoards(string $token, string $key): array|JsonResponse
    {
        return $this->makeTrelloRequest(
            $token,
            $key,
            self::API_BASE_URL . '/members/me/boards',
            ['fields' => 'name,url,desc'],
            'Failed to fetch boards from Trello.',
            'boards'
        );
    }

    /**
     * Get lists from a Trello board.
     *
     * @param  string  $token  The Trello API token
     * @param  string  $key  The Trello API key
     * @param  string  $boardId  The Trello board ID
     * @return array|JsonResponse The lists or an error response
     */
    public function getBoardLists(string $token, string $key, string $boardId): array|JsonResponse
    {
        return $this->makeTrelloRequest(
            $token,
            $key,
            self::API_BASE_URL . "/boards/{$boardId}/lists",
            ['fields' => 'name,id'],
            "Failed to fetch lists from Trello board: {$boardId}.",
            'lists'
        );
    }

    /**
     * Get cards from a Trello list.
     *
     * @param  string  $token  The Trello API token
     * @param  string  $key  The Trello API key
     * @param  string  $listId  The Trello list ID
     * @return array|JsonResponse The cards or an error response
     */
    public function getListCards(string $token, string $key, string $listId): array|JsonResponse
    {
        return $this->makeTrelloRequest(
            $token,
            $key,
            self::API_BASE_URL . "/lists/{$listId}/cards",
            ['fields' => 'name,desc,url,due,labels'],
            "Failed to fetch cards from Trello list: {$listId}.",
            'cards'
        );
    }

    /**
     * Redirect the user to the Trello authentication page.
     */
    public function redirectToTrello(): RedirectResponse
    {
        return Socialite::driver('trello')
            ->scopes(['read', 'write'])
            ->redirect();
    }

    /**
     * Handle the Trello callback and authenticate the user.
     *
     * @return array{user: User, token: string, key: string}
     *
     * @throws Exception
     */
    public function handleTrelloCallback(): array
    {
        $trelloUser = Socialite::driver('trello')->user();

        $user = User::query()->where('email', $trelloUser->getEmail())->first();

        if (! $user) {
            $user = User::query()->create([
                'name' => $trelloUser->getName(),
                'email' => $trelloUser->getEmail(),
                'password' => Hash::make(bin2hex(random_bytes(16))),
                'email_verified_at' => now(),
            ]);
        }

        return [
            'user' => $user,
            'token' => $trelloUser->token,
            'key' => config('services.trello.key'),
        ];
    }

    /**
     * Create a Trello card for a task
     *
     * @param  Task  $task  The task to create a card for
     * @return bool|array False if failed, or array with card details if successful
     */
    public function createTrelloCard(Task $task): bool|array
    {
        try {
            $tokenKey = $this->getTaskUserTokenAndKey($task);
            if (! $tokenKey) {
                return false;
            }

            $boardInfo = $this->getBoardInfoFromTask($task);
            if (! $boardInfo) {
                return false;
            }

            $payload = [
                'name' => $task->title,
                'desc' => $task->description ?? '',
                'idList' => $boardInfo['default_list_id'],
                'key' => $tokenKey['key'],
                'token' => $tokenKey['token'],
            ];

            if ($task->due_date) {
                $payload['due'] = $task->due_date->format('c');
            }

            if ($task->priority) {
                // Create or assign a label based on priority
                $labels = $this->createOrGetLabelsByPriority($tokenKey, $boardInfo['board_id'], $task->priority);
                if ($labels !== []) {
                    $payload['idLabels'] = implode(',', $labels);
                }
            }

            $response = Http::post(self::API_BASE_URL . '/cards', $payload);

            if ($response->successful()) {
                $cardData = $response->json();
                $task->update(['is_imported' => true]);
                $task->meta()->updateOrCreate(
                    ['task_id' => $task->id],
                    [
                        'source' => 'trello',
                        'source_number' => $cardData['id'],
                        'source_state' => $cardData['closed'] ? 'archived' : 'active',
                        'source_url' => $cardData['url'],
                        'source_id' => $cardData['id'],
                    ]
                );

                return $cardData;
            }

            return false;
        } catch (Exception $e) {
            $this->logError('Error creating Trello card', $task, $e);

            return false;
        }
    }

    /**
     * Update a Trello card using the Trello API
     *
     * @param  Task  $task  The task containing Trello card information
     * @return bool Whether the card was successfully updated
     */
    public function updateTrelloCard(Task $task): bool
    {
        try {
            if (! $this->validateTaskCardData($task)) {
                return false;
            }

            $tokenKey = $this->getTaskUserTokenAndKey($task);
            if (! $tokenKey) {
                return false;
            }

            $payload = [
                'name' => $task->title,
                'desc' => $task->description ?? '',
                'key' => $tokenKey['key'],
                'token' => $tokenKey['token'],
            ];

            if ($task->due_date) {
                $payload['due'] = $task->due_date->format('c');
            }

            // Set card state based on task status
            $isClosed = $task->status === 'completed';
            $payload['closed'] = $isClosed;

            $response = $this->makeTrelloCardRequest(
                $tokenKey['token'],
                $tokenKey['key'],
                $task->meta->source_id,
                $payload,
                'PUT'
            );

            if ($response instanceof Response && $response->successful()) {
                $task->meta->update(['source_state' => $isClosed ? 'archived' : 'active']);

                return true;
            }

            return false;
        } catch (Exception $e) {
            $this->logError('Error updating Trello card', $task, $e);

            return false;
        }
    }

    /**
     * Archive a Trello card using the Trello API
     *
     * @param  Task  $task  The task containing Trello card information
     * @return bool Whether the card was successfully archived
     */
    public function archiveTrelloCard(Task $task): bool
    {
        try {
            if (! $this->validateTaskCardData($task)) {
                return false;
            }

            $tokenKey = $this->getTaskUserTokenAndKey($task);
            if (! $tokenKey) {
                return false;
            }

            $response = $this->makeTrelloCardRequest(
                $tokenKey['token'],
                $tokenKey['key'],
                $task->meta->source_id,
                ['closed' => true],
                'PUT'
            );

            if ($response instanceof Response && $response->successful()) {
                $task->meta->update(['source_state' => 'archived']);

                return true;
            }

            return false;
        } catch (Exception $e) {
            $this->logError('Error archiving Trello card', $task, $e);

            return false;
        }
    }

    /**
     * Delete a Trello card using the Trello API
     *
     * @param  Task  $task  The task containing Trello card information
     * @return bool Whether the card was successfully deleted
     */
    public function deleteTrelloCard(Task $task): bool
    {
        try {
            if (! $this->validateTaskCardData($task)) {
                return false;
            }

            $tokenKey = $this->getTaskUserTokenAndKey($task);
            if (! $tokenKey) {
                return false;
            }

            $response = $this->makeTrelloCardRequest(
                $tokenKey['token'],
                $tokenKey['key'],
                $task->meta->source_id,
                [],
                'DELETE'
            );

            return $response instanceof Response && $response->successful();
        } catch (Exception $e) {
            $this->logError('Error deleting Trello card', $task, $e);

            return false;
        }
    }

    /**
     * Make a request to the Trello API with error handling.
     *
     * @param  string  $token  The Trello API token
     * @param  string  $key  The Trello API key
     * @param  string  $url  The API endpoint URL
     * @param  array  $params  The query parameters
     * @param  string|null  $errorMessage  Custom error message on failure
     * @param  string|null  $resourceType  Type of resource being fetched (for error logging)
     * @param  bool  $returnErrorResponse  Whether to return an error response on failure
     * @return array|JsonResponse|null The response data or an error response
     */
    private function makeTrelloRequest(
        string $token,
        string $key,
        string $url,
        array $params = [],
        ?string $errorMessage = null,
        ?string $resourceType = null,
        bool $returnErrorResponse = true
    ): JsonResponse|array|null {
        try {
            // Add auth parameters to the request
            $params['token'] = $token;
            $params['key'] = $key;

            $response = Http::get($url, $params);

            if ($response->failed() && $returnErrorResponse) {
                $message = $errorMessage ?? 'Failed to fetch data from Trello.';

                return response()->json(['error' => $message], 500);
            }

            return $response->successful() ? $response->json() : null;
        } catch (Exception $e) {
            Log::error("Error fetching Trello {$resourceType}: " . $e->getMessage());

            if ($returnErrorResponse) {
                return response()->json([
                    'error' => 'An error occurred while fetching ' . ($resourceType ?? 'data') . '.',
                ], 500);
            }

            return null;
        }
    }

    /**
     * Extract board information from project
     */
    private function extractBoardInfo(Project $project): array
    {
        try {
            // Expected format: "Board Name|board_id|default_list_id"
            $parts = explode('|', $project->name);
            if (count($parts) >= 3) {
                return [
                    'board_name' => $parts[0],
                    'board_id' => $parts[1],
                    'default_list_id' => $parts[2],
                ];
            }

            // Fallback to just assuming the project name is the board name
            return [
                'board_name' => $project->name,
                'board_id' => null,
                'default_list_id' => null,
            ];
        } catch (Exception $e) {
            Log::error('Error extracting board info: ' . $e->getMessage(), [
                'project_id' => $project->id,
                'project_name' => $project->name,
            ]);

            return [];
        }
    }

    /**
     * Get user token and key for task's project
     */
    private function getTaskUserTokenAndKey(Task $task): ?array
    {
        $user = $task->project->user;

        if (! $user || ! $user->trello_token) {
            return null;
        }

        return [
            'token' => $user->trello_token,
            'key' => config('services.trello.key'),
        ];
    }

    /**
     * Validate that task has required Trello card data
     */
    private function validateTaskCardData(Task $task): bool
    {
        return $task->meta && $task->meta->source_url && $task->meta->source_id;
    }

    /**
     * Get board info from a task
     */
    private function getBoardInfoFromTask(Task $task): ?array
    {
        $project = $task->project;
        $boardInfo = $this->extractBoardInfo($project);

        if ($boardInfo === [] || ! isset($boardInfo['board_id']) || ! $boardInfo['board_id']) {
            Log::error('Invalid Trello board configuration', [
                'task_id' => $task->id,
                'project_id' => $project->id,
                'project_name' => $project->name,
            ]);

            return null;
        }

        return $boardInfo;
    }

    /**
     * Make a Trello card-related request
     */
    private function makeTrelloCardRequest(
        string $token,
        string $key,
        string $cardId,
        array $payload,
        string $method = 'PUT'
    ): ?Response {
        $url = self::API_BASE_URL . "/cards/{$cardId}";

        // Add auth parameters to the payload
        $payload['token'] = $token;
        $payload['key'] = $key;

        try {
            return Http::$method($url, $payload);
        } catch (Exception $e) {
            Log::error('Error making Trello card request: ' . $e->getMessage(), [
                'url' => $url,
                'method' => $method,
            ]);

            return null;
        }
    }

    /**
     * Create or get labels based on priority
     */
    private function createOrGetLabelsByPriority(array $tokenKey, string $boardId, string $priority): array
    {
        $labelMapping = [
            'high' => ['color' => 'red', 'name' => 'High Priority'],
            'medium' => ['color' => 'yellow', 'name' => 'Medium Priority'],
            'low' => ['color' => 'green', 'name' => 'Low Priority'],
        ];

        if (! isset($labelMapping[$priority])) {
            return [];
        }

        try {
            // Get existing labels first
            $existingLabels = $this->makeTrelloRequest(
                $tokenKey['token'],
                $tokenKey['key'],
                self::API_BASE_URL . "/boards/{$boardId}/labels",
                [],
                null,
                null,
                false
            );

            if (! $existingLabels || ! is_array($existingLabels)) {
                return [];
            }

            // Check if label already exists
            foreach ($existingLabels as $label) {
                if (mb_strtolower($label['name'] ?? '') === mb_strtolower($labelMapping[$priority]['name'])) {
                    return [$label['id']];
                }
            }

            // Create a new label
            $response = Http::post(self::API_BASE_URL . "/boards/{$boardId}/labels", [
                'name' => $labelMapping[$priority]['name'],
                'color' => $labelMapping[$priority]['color'],
                'token' => $tokenKey['token'],
                'key' => $tokenKey['key'],
            ]);

            if ($response->successful()) {
                $label = $response->json();

                return [$label['id']];
            }

            return [];
        } catch (Exception $e) {
            Log::error('Error managing Trello labels: ' . $e->getMessage());

            return [];
        }
    }

    /**
     * Log an error with task context
     */
    private function logError(string $message, Task $task, Exception $exception): void
    {
        Log::error($message . ':', [
            'task_id' => $task->id,
            'error' => $exception->getMessage(),
        ]);
    }
}
