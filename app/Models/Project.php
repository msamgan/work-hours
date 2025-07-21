<?php

declare(strict_types=1);

namespace App\Models;

use App\Policies\ProjectPolicy;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Carbon;

/**
 * Class Project
 *
 * @property int $id
 * @property int $user_id
 * @property int|null $client_id
 * @property string $name
 * @property string $description
 * @property float $paid_amount
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property User $user
 * @property Client|null $client
 * @property Collection|User[] $teamMembers
 * @property Collection|User[] $approvers
 */
#[UsePolicy(ProjectPolicy::class)]
final class Project extends Model
{
    protected $fillable = ['user_id', 'client_id', 'name', 'description', 'paid_amount'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function teamMembers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'project_team', 'project_id', 'member_id')
            ->withPivot('is_approver', 'hourly_rate', 'currency')
            ->withTimestamps();
    }

    public function approvers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'project_team', 'project_id', 'member_id')
            ->withPivot('is_approver', 'hourly_rate', 'currency')
            ->withTimestamps()
            ->wherePivot('is_approver', true);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function isCreator(int $userId): bool
    {
        return $this->user_id === $userId;
    }
}
