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

final class GitHubAdapter
{
    private const string API_BASE_URL = 'https://api.github.com';

    /**
     * Get the authenticated user's personal repositories from GitHub.
     *
     * @param  string  $token  The GitHub access token
     * @return array|JsonResponse The repositories or an error response
     */
    public function getPersonalRepositories(string $token): array|JsonResponse
    {
        return $this->makeGitHubRequest(
            $token,
            self::API_BASE_URL . '/user/repos',
            ['per_page' => 100, 'sort' => 'updated'],
            'Failed to fetch repositories from GitHub.',
            'repositories'
        );
    }

    /**
     * Get the authenticated user's organization repositories from GitHub.
     *
     * @param  string  $token  The GitHub access token
     * @return array|JsonResponse The repositories or an error response
     */
    public function getOrganizationRepositories(string $token): array|JsonResponse
    {
        $orgsResponse = $this->makeGitHubRequest(
            $token,
            self::API_BASE_URL . '/user/orgs',
            ['per_page' => 100],
            'Failed to fetch organizations from GitHub.',
            'organizations'
        );

        if ($orgsResponse instanceof JsonResponse) {
            return $orgsResponse;
        }

        $organizations = $orgsResponse;
        $allOrgRepos = [];

        foreach ($organizations as $org) {
            $reposResponse = $this->makeGitHubRequest(
                $token,
                self::API_BASE_URL . "/orgs/{$org['login']}/repos",
                ['per_page' => 100, 'sort' => 'updated'],
                null,
                null,
                false
            );

            if ($reposResponse && ! ($reposResponse instanceof JsonResponse)) {
                $repos = $reposResponse;
                foreach ($repos as $repo) {
                    $repo['organization'] = $org['login'];
                    $allOrgRepos[] = $repo;
                }
            }
        }

        return $allOrgRepos;
    }

    /**
     * Redirect the user to the GitHub authentication page.
     */
    public function redirectToGitHub(): RedirectResponse
    {
        return Socialite::driver('github')
            ->scopes(['repo', 'read:org', 'user:email'])
            ->redirect();
    }

    /**
     * Handle the GitHub callback and authenticate the user.
     *
     * @return array{user: User, token: string}
     *
     * @throws Exception
     */
    public function handleGitHubCallback(): array
    {
        $githubUser = Socialite::driver('github')->user();

        $user = User::query()->where('email', $githubUser->getEmail())->first();

        if (! $user) {
            $user = User::query()->create([
                'name' => $githubUser->getName(),
                'email' => $githubUser->getEmail(),
                'password' => Hash::make(bin2hex(random_bytes(16))),
                'email_verified_at' => now(),
            ]);
        }

        return [
            'user' => $user,
            'token' => $githubUser->token,
        ];
    }

    /**
     * Get issues from a GitHub repository.
     *
     * @param  string  $token  The GitHub access token
     * @param  string  $repoOwner  The repository owner (user or organization)
     * @param  string  $repoName  The repository name
     * @return array|JsonResponse The issues or an error response
     */
    public function getRepositoryIssues(string $token, string $repoOwner, string $repoName): array|JsonResponse
    {
        $url = self::API_BASE_URL . "/repos/{$repoOwner}/{$repoName}/issues";
        $params = [
            'state' => 'all',
            'per_page' => 100, // Maximum number of issues per page
            'sort' => 'created',
            'direction' => 'desc',
        ];

        return $this->makeGitHubRequest(
            $token,
            $url,
            $params,
            "Failed to fetch issues from GitHub repository: {$repoOwner}/{$repoName}.",
            'issues'
        );
    }

    /**
     * Close a GitHub issue using the GitHub API
     *
     * @param  Task  $task  The task containing GitHub issue information
     * @return bool Whether the issue was successfully closed
     */
    public function closeGitHubIssue(Task $task): bool
    {
        return $this->updateIssueState($task, 'closed');
    }

    /**
     * Create a GitHub issue for a task
     *
     * @param  Task  $task  The task to create an issue for
     * @return bool|array False if failed, or array with issue details if successful
     */
    public function createGitHubIssue(Task $task): bool|array
    {
        try {
            $token = $this->getTaskUserToken($task);
            if (! $token) {
                return false;
            }

            // Start with default labels
            $labels = [$task->priority, $task->status];

            // Add tags if they exist
            if ($task->tags->isNotEmpty()) {
                foreach ($task->tags as $tag) {
                    $labels[] = $tag->name;
                }
            }

            $payload = [
                'title' => $task->title,
                'body' => $task->description ?? '',
                'labels' => $labels,
            ];

            if ($task->due_date) {
                $payload['body'] .= "\n\nDue date: " . $task->due_date->format('Y-m-d');
            }

            $repoInfo = $this->exportRepoInfo($task->project);
            $repoOwner = $repoInfo['owner'];
            $repoName = $repoInfo['repo'];

            $response = Http::withToken($token)
                ->post(self::API_BASE_URL . "/repos/{$repoOwner}/{$repoName}/issues", $payload);

            if ($response->successful()) {
                $issueData = $response->json();
                $task->update(['is_imported' => true]);
                $task->meta()->updateOrCreate(
                    ['task_id' => $task->id],
                    [
                        'source' => 'github',
                        'source_number' => $issueData['number'],
                        'source_state' => $issueData['state'],
                        'source_url' => $issueData['html_url'],
                        'source_id' => $issueData['id'],
                    ]
                );

                return $issueData;
            }

            return false;
        } catch (Exception $e) {
            $this->logError('Error creating GitHub issue', $task, $e);

            return false;
        }
    }

    /**
     * Update a GitHub issue using the GitHub API
     *
     * @param  Task  $task  The task containing GitHub issue information
     * @return bool Whether the issue was successfully updated
     */
    public function updateGitHubIssue(Task $task): bool
    {
        try {
            if (! $this->validateTaskIssueData($task)) {
                return false;
            }

            $token = $this->getTaskUserToken($task);
            if (! $token) {
                return false;
            }

            $repoInfo = $this->getRepoInfoFromTask($task);
            if (! $repoInfo) {
                return false;
            }

            // Start with default labels
            $labels = [$task->priority, $task->status];

            // Add tags if they exist
            if ($task->tags->isNotEmpty()) {
                foreach ($task->tags as $tag) {
                    $labels[] = $tag->name;
                }
            }

            $payload = [
                'title' => $task->title,
                'body' => $task->description ?? '',
                'labels' => $labels,
            ];

            // Set issue state based on task status
            $payload['state'] = $task->status === 'completed' ? 'closed' : 'open';

            $response = $this->makeGitHubIssueRequest(
                $token,
                $repoInfo['owner'],
                $repoInfo['repo'],
                $task->meta->source_number,
                $payload,
                'PATCH'
            );

            if ($response instanceof Response && $response->successful()) {
                $task->meta->update(['source_state' => $payload['state']]);

                return true;
            }

            return false;
        } catch (Exception $e) {
            $this->logError('Error updating GitHub issue', $task, $e);

            return false;
        }
    }

    /**
     * Delete a GitHub issue using the GitHub API
     *
     * @param  Task  $task  The task containing GitHub issue information
     * @return bool Whether the issue was successfully deleted
     */
    public function deleteGitHubIssue(Task $task): bool
    {
        try {
            if (! $this->validateTaskIssueData($task)) {
                return false;
            }

            $token = $this->getTaskUserToken($task);
            if (! $token) {
                return false;
            }

            $repoInfo = $this->getRepoInfoFromTask($task);
            if (! $repoInfo) {
                return false;
            }

            // GitHub API doesn't allow deleting issues, so we close it instead
            // with a comment indicating it was deleted from the application
            $response = $this->makeGitHubIssueRequest(
                $token,
                $repoInfo['owner'],
                $repoInfo['repo'],
                $task->meta->source_number,
                ['state' => 'closed'],
                'PATCH'
            );

            if ($response instanceof Response && $response->successful()) {
                // Add a comment indicating the issue was deleted from the application
                $this->makeGitHubIssueRequest(
                    $token,
                    $repoInfo['owner'],
                    $repoInfo['repo'],
                    $task->meta->source_number,
                    ['body' => 'This issue was deleted from the Work Hours application.'],
                    'POST',
                    '/comments'
                );

                return true;
            }

            return false;
        } catch (Exception $e) {
            $this->logError('Error deleting GitHub issue', $task, $e);

            return false;
        }
    }

    /**
     * Make a request to the GitHub API with error handling.
     *
     * @param  string  $token  The GitHub access token
     * @param  string  $url  The API endpoint URL
     * @param  array  $params  The query parameters
     * @param  string|null  $errorMessage  Custom error message on failure
     * @param  string|null  $resourceType  Type of resource being fetched (for error logging)
     * @param  bool  $returnErrorResponse  Whether to return an error response on failure
     * @return array|JsonResponse|null The response data or an error response
     */
    private function makeGitHubRequest(
        string $token,
        string $url,
        array $params = [],
        ?string $errorMessage = null,
        ?string $resourceType = null,
        bool $returnErrorResponse = true
    ): JsonResponse|array|null {
        try {
            $response = Http::withToken($token)->get($url, $params);

            if ($response->failed() && $returnErrorResponse) {
                $message = $errorMessage ?? 'Failed to fetch data from GitHub.';

                return response()->json(['error' => $message], 500);
            }

            return $response->successful() ? $response->json() : null;
        } catch (Exception $e) {
            Log::error("Error fetching GitHub {$resourceType}: " . $e->getMessage());

            if ($returnErrorResponse) {
                return response()->json([
                    'error' => 'An error occurred while fetching ' . ($resourceType ?? 'data') . '.',
                ], 500);
            }

            return null;
        }
    }

    /**
     * Extract repository information from project name
     */
    private function exportRepoInfo(Project $project): array
    {
        try {
            [$owner, $repo] = explode('/', $project->name, 2);

            return [
                'owner' => $owner,
                'repo' => $repo,
            ];
        } catch (Exception $e) {
            Log::error('Error extracting repo info: ' . $e->getMessage(), [
                'project_id' => $project->id,
                'project_name' => $project->name,
            ]);

            return [];
        }
    }

    /**
     * Update a GitHub issue state
     */
    private function updateIssueState(Task $task, string $state): bool
    {
        try {
            if (! $this->validateTaskIssueData($task)) {
                return false;
            }

            $token = $this->getTaskUserToken($task);
            if (! $token) {
                return false;
            }

            $repoInfo = $this->getRepoInfoFromTask($task);
            if (! $repoInfo) {
                return false;
            }

            $response = $this->makeGitHubIssueRequest(
                $token,
                $repoInfo['owner'],
                $repoInfo['repo'],
                $task->meta->source_number,
                ['state' => $state],
                'PATCH'
            );

            if ($response instanceof Response && $response->successful()) {
                $task->meta->update(['source_state' => $state]);

                return true;
            }

            return false;
        } catch (Exception $e) {
            $this->logError("Error updating GitHub issue state to {$state}", $task, $e);

            return false;
        }
    }

    /**
     * Get user token for task's project
     */
    private function getTaskUserToken(Task $task): ?string
    {
        $user = $task->project->user;

        return $user?->github_token;
    }

    /**
     * Validate that task has required GitHub issue data
     */
    private function validateTaskIssueData(Task $task): bool
    {
        return $task->meta && $task->meta->source_url && $task->meta->source_number;
    }

    /**
     * Get repository info from a task
     */
    private function getRepoInfoFromTask(Task $task): ?array
    {
        $project = $task->project;
        $repoInfo = $this->exportRepoInfo($project);

        if ($repoInfo === []) {
            Log::error('Invalid GitHub issue URL format', [
                'task_id' => $task->id,
                'url' => $task->meta->source_url,
            ]);

            return null;
        }

        return $repoInfo;
    }

    /**
     * Make a GitHub issue-related request
     */
    private function makeGitHubIssueRequest(
        string $token,
        string $owner,
        string $repo,
        string $issueNumber,
        array $payload,
        string $method = 'PATCH',
        string $suffix = ''
    ): ?Response {
        $url = self::API_BASE_URL . "/repos/{$owner}/{$repo}/issues/{$issueNumber}{$suffix}";

        try {
            return Http::withToken($token)->$method($url, $payload);
        } catch (Exception $e) {
            Log::error('Error making GitHub issue request: ' . $e->getMessage(), [
                'url' => $url,
                'method' => $method,
            ]);

            return null;
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
