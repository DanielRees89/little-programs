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
            'file' => 'required|file|mimes:csv,txt,json,pdf,png,jpg,jpeg,gif,webp,xls,xlsx|max:10240', // 10MB max
        ]);

        $uploadedFile = $request->file('file');
        $user = $request->user();

        // Store the file
        $path = $uploadedFile->store("user-files/{$user->id}", 'local');

        // Determine mime type
        $mimeType = $uploadedFile->getMimeType() ?? $this->guessMimeType($uploadedFile->getClientOriginalExtension());

        // Create the database record
        $dataFile = $user->dataFiles()->create([
            'name' => $uploadedFile->getClientOriginalName(),
            'path' => $path,
            'size' => $uploadedFile->getSize(),
            'mime_type' => $mimeType,
        ]);

        // Parse the file to extract metadata (only for CSV/data files)
        if ($this->isDataFile($mimeType)) {
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

        // Get preview data (only for data files)
        $preview = null;
        if ($this->isDataFile($dataFile->mime_type)) {
            try {
                $preview = $this->fileParser->getPreview($dataFile->path, 20);
            } catch (\Exception $e) {
                \Log::warning("Failed to get file preview: " . $e->getMessage());
            }
        }

        // For images, provide a URL for preview
        $imageUrl = null;
        if ($this->isImageFile($dataFile->mime_type)) {
            $imageUrl = route('api.files.image', $dataFile);
        }

        return response()->json([
            'file' => $this->formatFile($dataFile),
            'preview' => $preview,
            'image_url' => $imageUrl,
        ]);
    }

    /**
     * Serve image file for preview.
     */
    public function image(Request $request, DataFile $dataFile)
    {
        // Ensure user owns this file
        if ($dataFile->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        // Ensure it's an image
        if (!$this->isImageFile($dataFile->mime_type)) {
            return response()->json(['message' => 'Not an image file'], 400);
        }

        $fullPath = Storage::disk('local')->path($dataFile->path);

        if (!file_exists($fullPath)) {
            return response()->json(['message' => 'File not found on disk'], 404);
        }

        return response()->file($fullPath, [
            'Content-Type' => $dataFile->mime_type,
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
            'is_image' => $this->isImageFile($file->mime_type),
            'is_data_file' => $this->isDataFile($file->mime_type),
            'created_at' => $file->created_at->toISOString(),
            'updated_at' => $file->updated_at->toISOString(),
        ];
    }

    /**
     * Check if mime type is an image.
     */
    protected function isImageFile(?string $mimeType): bool
    {
        if (!$mimeType) return false;
        return str_starts_with($mimeType, 'image/');
    }

    /**
     * Check if mime type is a data/CSV file.
     */
    protected function isDataFile(?string $mimeType): bool
    {
        if (!$mimeType) return false;
        
        $dataTypes = [
            'text/csv',
            'text/plain',
            'application/csv',
            'application/json',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];
        
        return in_array($mimeType, $dataTypes);
    }

    /**
     * Guess mime type from extension.
     */
    protected function guessMimeType(string $extension): string
    {
        return match (strtolower($extension)) {
            'csv' => 'text/csv',
            'txt' => 'text/plain',
            'json' => 'application/json',
            'pdf' => 'application/pdf',
            'png' => 'image/png',
            'jpg', 'jpeg' => 'image/jpeg',
            'gif' => 'image/gif',
            'webp' => 'image/webp',
            'xls' => 'application/vnd.ms-excel',
            'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            default => 'application/octet-stream',
        };
    }
}
