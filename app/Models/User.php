<?php

declare(strict_types=1);

namespace App\Models;

use App\Policies\TeamPolicy;
use Database\Factories\UserFactory;
use Filament\Panel;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;

/**
 * The User model represents a user in the application.
 *
 * @property int $id
 * @property string $name
 * @property string $email
 * @property string $password
 * @property Carbon|null $email_verified_at
 * @property string|null $remember_token
 * @property string|null $github_token
 * @property float|null $hourly_rate
 * @property string|null $currency
 * @property mixed $unreadNotifications
 * @property Collection|Task[] $assignedTasks
 */
#[UsePolicy(TeamPolicy::class)]
final class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'github_token',
        'hourly_rate',
        'currency',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    public static function teamLeader(Project $project): self
    {
        return self::query()->where('id', $project->user_id)->firstOrFail();
    }

    public function projects(): HasMany
    {
        return $this->hasMany(Project::class);
    }

    public function currencies(): HasMany
    {
        return $this->hasMany(Currency::class)->orderBy('created_at', 'ASC');
    }

    public function assignedTasks(): BelongsToMany
    {
        return $this->belongsToMany(Task::class, 'task_user')
            ->withTimestamps();
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function canAccessPanel(Panel $panel): bool
    {
        return str_ends_with($this->email, '@workhours.us') && $this->hasVerifiedEmail();
    }
}
