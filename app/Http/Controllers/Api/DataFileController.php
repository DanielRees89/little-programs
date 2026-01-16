<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DataFile;
use App\Services\FileParserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DataFileController extends Controller
{
    public function __construct(
        protected FileParserService $fileParser
    ) {}

    /**
     * List all files for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $files = $request->user()
            ->dataFiles()
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($file) => $this->formatFile($file));

        return response()->json([
            'files' => $files,
        ]);
    }

    /**
     * Upload a new file.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:10240', // 10MB max
        ]);

        $uploadedFile = $request->file('file');
        $user = $request->user();

        // Store the file
        $path = $uploadedFile->store("user-files/{$user->id}", 'local');

        // Create the database record
        $dataFile = $user->dataFiles()->create([
            'name' => $uploadedFile->getClientOriginalName(),
            'path' => $path,
            'size' => $uploadedFile->getSize(),
            'mime_type' => $uploadedFile->getMimeType() ?? 'text/csv',
        ]);

        // Parse the file to extract metadata
        try {
            $metadata = $this->fileParser->parseCSV($path);
            
            $dataFile->update([
                'row_count' => $metadata['row_count'],
                'column_count' => $metadata['column_count'],
                'columns_metadata' => $metadata['columns_metadata'],
            ]);
        } catch (\Exception $e) {
            // Log error but don't fail the upload
            \Log::warning("Failed to parse CSV metadata: " . $e->getMessage());
        }

        return response()->json([
            'message' => 'File uploaded successfully',
            'file' => $this->formatFile($dataFile->fresh()),
        ], 201);
    }

    /**
     * Get file details with preview.
     */
    public function show(Request $request, DataFile $dataFile): JsonResponse
    {
        // Ensure user owns this file
        if ($dataFile->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        // Get preview data
        $preview = null;
        try {
            $preview = $this->fileParser->getPreview($dataFile->path, 20);
        } catch (\Exception $e) {
            \Log::warning("Failed to get file preview: " . $e->getMessage());
        }

        return response()->json([
            'file' => $this->formatFile($dataFile),
            'preview' => $preview,
        ]);
    }

    /**
     * Delete a file.
     */
    public function destroy(Request $request, DataFile $dataFile): JsonResponse
    {
        // Ensure user owns this file
        if ($dataFile->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $dataFile->delete(); // This also deletes from storage via model event

        return response()->json([
            'message' => 'File deleted successfully',
        ]);
    }

    /**
     * Download the original file.
     */
    public function download(Request $request, DataFile $dataFile)
    {
        // Ensure user owns this file
        if ($dataFile->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $fullPath = Storage::disk('local')->path($dataFile->path);

        if (!file_exists($fullPath)) {
            return response()->json(['message' => 'File not found on disk'], 404);
        }

        return response()->download($fullPath, $dataFile->name);
    }

    /**
     * Format a file for JSON response.
     */
    protected function formatFile(DataFile $file): array
    {
        return [
            'id' => $file->id,
            'name' => $file->name,
            'size' => $file->size,
            'formatted_size' => $file->formatted_size,
            'mime_type' => $file->mime_type,
            'row_count' => $file->row_count,
            'column_count' => $file->column_count,
            'columns_metadata' => $file->columns_metadata,
            'created_at' => $file->created_at->toISOString(),
            'updated_at' => $file->updated_at->toISOString(),
        ];
    }
}
