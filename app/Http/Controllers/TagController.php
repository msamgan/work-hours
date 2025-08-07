<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Tag;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

final class TagController extends Controller
{
    /**
     * Display the tag management interface
     */
    public function index()
    {
        $tags = Tag::query()->where('user_id', auth()->id())
            ->orderBy('name')
            ->paginate(20);

        return Inertia::render('tags/index', [
            'tags' => $tags,
        ]);
    }

    /**
     * Return a list of tags for autocomplete
     */
    public function autocomplete(Request $request): JsonResponse
    {
        $query = $request->input('query', '');
        $user = $request->user();

        $tags = Tag::query()->where('user_id', $user->id)
            ->where('name', 'like', "%{$query}%")
            ->orderBy('name')
            ->get(['id', 'name'])
            ->unique('name');

        return response()->json($tags);
    }

    /**
     * Store a new tag
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:50',
        ]);

        $tag = Tag::query()->firstOrCreate([
            'name' => $validated['name'],
            'user_id' => $request->user()->id,
        ]);

        return response()->json($tag);
    }

    /**
     * Update a tag
     */
    public function update(Request $request, Tag $tag): JsonResponse
    {
        if ($tag->user_id !== auth()->id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:50',
            'color' => 'nullable|string|regex:/^#[0-9a-fA-F]{6}$/',
        ]);

        $existingTag = Tag::query()->where('user_id', auth()->id())
            ->where('name', $validated['name'])
            ->where('id', '!=', $tag->id)
            ->first();

        if ($existingTag) {
            return response()->json([
                'error' => 'You already have a tag with this name',
            ], 422);
        }

        $tag->update([
            'name' => $validated['name'],
            'color' => $validated['color'] ?? Tag::generateRandomColor(),
        ]);

        return response()->json($tag);
    }

    /**
     * Delete a tag
     */
    public function destroy(Tag $tag): JsonResponse
    {
        // Check if the tag belongs to the current user
        if ($tag->user_id !== auth()->id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Delete the tag
        $tag->delete();

        return response()->json(['success' => true]);
    }
}
