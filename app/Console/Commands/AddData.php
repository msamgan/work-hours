<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Enums\TimeLogStatus;
use App\Models\Client;
use App\Models\Project;
use App\Models\Tag;
use App\Models\Task;
use App\Models\Team;
use App\Models\TimeLog;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\Console\Command\Command as CommandAlias;

final class AddData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:add-data {user_id? : The ID of the logged-in user}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Add sample data for all modules in the application';

    public function handle(): int
    {
        $loggedInUserId = $this->argument('user_id');

        if (! $loggedInUserId) {
            $this->error('User ID is required');

            return CommandAlias::FAILURE;
        }

        $user = User::query()->find($loggedInUserId);

        if (! $user) {
            $this->error('User not found');

            return CommandAlias::FAILURE;
        }

        $this->info('Starting to add sample data...');

        // Create team members
        $teamMembers = $this->createTeamMembers($user);
        $this->info('✓ Created 5 team members');

        // Create clients
        $clients = $this->createClients($user);
        $this->info('✓ Created 3 clients');

        // Create projects
        $projects = $this->createProjects($user, $clients);
        $this->info('✓ Created 5 projects');

        // Create tasks for projects
        $this->createTasks($projects);
        $this->info('✓ Created tasks for all projects');

        // Create tags
        $this->createTags($user);
        $this->info('✓ Created sample tags');

        // Create time logs for all team members
        $this->createTimeLogs($user, $teamMembers, $projects);
        $this->info('✓ Created time logs for all team members');

        $this->info('Sample data has been added successfully!');

        return CommandAlias::SUCCESS;
    }

    private function createTeamMembers(User $user): Collection
    {
        $teamMembers = collect();

        // Create 5 team members
        for ($i = 1; $i <= 5; $i++) {
            $member = User::query()->create([
                'name' => "Team Member {$i}",
                'email' => "team{$i}@example.com",
                'password' => Hash::make('password'),
                'hourly_rate' => random_int(15, 50),
                'currency' => 'USD',
                'email_verified_at' => now(),
            ]);

            // Create team relationship
            Team::query()->create([
                'user_id' => $user->id,
                'member_id' => $member->id,
                'hourly_rate' => $member->hourly_rate,
                'currency' => $member->currency,
                'non_monetary' => false,
            ]);

            $teamMembers->push($member);
        }

        return $teamMembers;
    }

    private function createClients(User $user): Collection
    {
        $clients = collect();

        for ($i = 1; $i <= 3; $i++) {
            $client = Client::query()->create([
                'user_id' => $user->id,
                'name' => "Client {$i}",
                'email' => "client{$i}@example.com",
                'contact_person' => "Contact Person {$i}",
                'phone' => "555-000-{$i}{$i}{$i}{$i}",
                'address' => "123 Client Street, Suite {$i}00, Client City",
                'notes' => "Sample client {$i} created for testing purposes",
            ]);

            $clients->push($client);
        }

        return $clients;
    }

    private function createProjects(User $user, Collection $clients): Collection
    {
        $projects = collect();

        for ($i = 1; $i <= 5; $i++) {
            $project = Project::query()->create([
                'user_id' => $user->id,
                'client_id' => $i <= 3 ? $clients[$i - 1]->id : null,
                'name' => "Project {$i}",
                'description' => "This is a sample project {$i} description.",
                'paid_amount' => 0,
            ]);

            $projects->push($project);
        }

        return $projects;
    }

    private function createTasks(Collection $projects): void
    {
        foreach ($projects as $project) {
            $taskCount = random_int(3, 7);

            for ($i = 1; $i <= $taskCount; $i++) {
                Task::query()->create([
                    'project_id' => $project->id,
                    'title' => "Task {$i} for {$project->name}",
                    'description' => "This is a sample task {$i} for project {$project->name}.",
                    'status' => random_int(0, 1) !== 0 ? 'completed' : 'pending',
                    'priority' => ['low', 'medium', 'high'][random_int(0, 2)],
                    'due_date' => now()->addDays(random_int(1, 30)),
                ]);
            }
        }
    }

    private function createTags(User $user): Collection
    {
        $tagNames = ['Development', 'Design', 'Bug Fix', 'Feature', 'Documentation', 'Meeting', 'Planning'];
        $tags = collect();

        foreach ($tagNames as $tagName) {
            $tag = Tag::query()->create([
                'user_id' => $user->id,
                'name' => $tagName,
            ]);

            $tags->push($tag);
        }

        return $tags;
    }

    private function createTimeLogs(User $user, Collection $teamMembers, Collection $projects): void
    {
        $allStatuses = TimeLogStatus::cases();

        // Create time logs for the authenticated user
        $this->createTimeLogsForUser($user, $projects, $allStatuses);

        // For each team member
        foreach ($teamMembers as $member) {
            $this->createTimeLogsForUser($member, $projects, $allStatuses);
        }
    }

    private function createTimeLogsForUser(User $user, Collection $projects, array $allStatuses): void
    {
        $logCount = random_int(5, 10);
        $usedStatuses = [];

        for ($i = 1; $i <= $logCount; $i++) {
            $project = $projects->random();
            $tasks = Task::query()->where('project_id', $project->id)->get();

            // Ensure we create proper time spans with positive durations
            $startDate = now()->subDays(random_int(1, 30));
            $endDate = (clone $startDate)->addHours(random_int(1, 8));
            $duration = $endDate->diffInMinutes($startDate) / 60;

            // Ensure we use each status at least once
            $statusIndex = 0;
            if (count($usedStatuses) < count($allStatuses)) {
                // Find an unused status
                foreach ($allStatuses as $index => $status) {
                    if (! in_array($status->value, $usedStatuses)) {
                        $statusIndex = $index;
                        $usedStatuses[] = $status->value;
                        break;
                    }
                }
            } else {
                // We've used all statuses at least once, so pick randomly
                $statusIndex = random_int(0, count($allStatuses) - 1);
            }

            TimeLog::query()->create([
                'user_id' => $user->id,
                'project_id' => $project->id,
                'task_id' => $tasks->isNotEmpty() ? $tasks->random()->id : null,
                'start_timestamp' => $startDate,
                'end_timestamp' => $endDate,
                'duration' => $duration,
                'is_paid' => random_int(0, 1),
                'hourly_rate' => $user->hourly_rate,
                'currency' => $user->currency,
                'note' => "Time log entry {$i} for {$user->name}",
                'status' => $allStatuses[$statusIndex]->value,
            ]);
        }
    }
}
