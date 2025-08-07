<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Carbon;
use Override;

/**
 * Class Tag
 *
 * @property int $id
 * @property string $name
 * @property string $color
 * @property int $user_id
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
final class Tag extends Model
{
    protected $fillable = [
        'name',
        'user_id',
        'color',
    ];

    /**
     * Generate a random hexadecimal color.
     */
    public static function generateRandomColor(): string
    {
        return '#' . mb_str_pad(dechex(mt_rand(0, 0xFFFFFF)), 6, '0', STR_PAD_LEFT);
    }

    /**
     * Get the time logs associated with the tag.
     */
    public function timeLogs(): BelongsToMany
    {
        return $this->belongsToMany(TimeLog::class);
    }

    /**
     * Get the tasks associated with the tag.
     */
    public function tasks(): BelongsToMany
    {
        return $this->belongsToMany(Task::class);
    }

    /**
     * Get the user that owns the tag.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The "booted" method of the model.
     */
    #[Override]
    protected static function booted(): void
    {
        self::creating(function (Tag $tag): void {
            if (! $tag->color) {
                $tag->color = self::generateRandomColor();
            }
        });
    }
}
