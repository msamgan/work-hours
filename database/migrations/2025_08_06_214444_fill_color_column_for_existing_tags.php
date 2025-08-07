<?php

declare(strict_types=1);

use App\Models\Tag;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Get all existing tags that don't have a color value
        $tags = DB::table('tags')->whereNull('color')->get();

        // Update each tag with a random color
        foreach ($tags as $tag) {
            DB::table('tags')
                ->where('id', $tag->id)
                ->update(['color' => Tag::generateRandomColor()]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Since we're just populating data, no need for a rollback action
        // But we could set color to null for all tags if needed
        // DB::table('tags')->update(['color' => null]);
    }
};
