<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Script;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ScriptController extends Controller
{
    /**
     * List all scripts for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $scripts = $request->user()
            ->scripts()
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($script) => $this->formatScript($script));

        return response()->json([
            'scripts' => $scripts,
        ]);
    }

    /**
     * Create a new script.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'code' => 'required|string|max:50000',
            'language' => 'sometimes|string|in:python',
            'file_config' => 'nullable|array',
        ]);

        $script = $request->user()->scripts()->create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'code' => $validated['code'],
            'language' => $validated['language'] ?? 'python',
            'file_config' => $validated['file_config'] ?? null,
        ]);

        return response()->json([
            'message' => 'Script created successfully',
            'script' => $this->formatScript($script),
        ], 201);
    }

    /**
     * Get a specific script.
     */
    public function show(Request $request, Script $script): JsonResponse
    {
        // Ensure user owns this script
        if ($script->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        return response()->json([
            'script' => $this->formatScript($script),
        ]);
    }

    /**
     * Update a script.
     */
    public function update(Request $request, Script $script): JsonResponse
    {
        // Ensure user owns this script
        if ($script->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'code' => 'sometimes|required|string|max:50000',
            'language' => 'sometimes|string|in:python',
            'file_config' => 'nullable|array',
        ]);

        $script->update($validated);

        return response()->json([
            'message' => 'Script updated successfully',
            'script' => $this->formatScript($script->fresh()),
        ]);
    }

    /**
     * Delete a script.
     */
    public function destroy(Request $request, Script $script): JsonResponse
    {
        // Ensure user owns this script
        if ($script->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $script->delete();

        return response()->json([
            'message' => 'Script deleted successfully',
        ]);
    }

    /**
     * Format a script for JSON response.
     */
    protected function formatScript(Script $script): array
    {
        return [
            'id' => $script->id,
            'name' => $script->name,
            'description' => $script->description,
            'code' => $script->code,
            'language' => $script->language,
            'file_config' => $script->file_config,
            'run_count' => $script->run_count,
            'created_at' => $script->created_at->toISOString(),
            'updated_at' => $script->updated_at->toISOString(),
        ];
    }
}
