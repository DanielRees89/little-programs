<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ScriptExecution;
use App\Services\PythonExecutionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ExecutionController extends Controller
{
    public function __construct(
        protected PythonExecutionService $pythonService
    ) {}

    /**
     * List executions for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $executions = ScriptExecution::whereHas('script', function ($query) use ($request) {
            $query->where('user_id', $request->user()->id);
        })
            ->with(['script:id,name', 'dataFile:id,name'])
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();

        return response()->json([
            'executions' => $executions,
        ]);
    }

    /**
     * Create and run a new execution.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'script_id' => 'required|exists:scripts,id',
            'data_file_id' => 'required|exists:data_files,id',
        ]);

        $user = $request->user();

        // Verify ownership
        $script = $user->scripts()->findOrFail($validated['script_id']);
        $dataFile = $user->dataFiles()->findOrFail($validated['data_file_id']);

        // Create execution record
        $execution = ScriptExecution::create([
            'script_id' => $script->id,
            'data_file_id' => $dataFile->id,
            'status' => 'pending',
        ]);

        // Run the execution
        $result = $this->pythonService->execute(
            $execution,
            $script->code,
            [['path' => storage_path('app/' . $dataFile->path), 'name' => $dataFile->name]]
        );

        return response()->json([
            'execution' => $execution->fresh(),
            'result' => $result,
        ], 201);
    }

    /**
     * Get a specific execution.
     */
    public function show(Request $request, ScriptExecution $execution): JsonResponse
    {
        // Verify ownership through script
        if ($execution->script->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $execution->load(['script:id,name,code', 'dataFile:id,name']);

        return response()->json([
            'execution' => $execution,
        ]);
    }

    /**
     * Cancel a running execution.
     */
    public function cancel(Request $request, ScriptExecution $execution): JsonResponse
    {
        if ($execution->script->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        if ($execution->status === 'running') {
            $execution->markAsFailed('Cancelled by user');
        }

        return response()->json([
            'execution' => $execution->fresh(),
        ]);
    }

    /**
     * Get a file from a completed execution.
     */
    public function getFile(Request $request, ScriptExecution $execution, string $filename): BinaryFileResponse|JsonResponse
    {
        if ($execution->script->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $path = $this->pythonService->getGeneratedFile($execution->id, $filename);

        if (!$path) {
            return response()->json(['message' => 'File not found'], 404);
        }

        return response()->file($path);
    }

    /**
     * Download a file from a completed execution.
     */
    public function downloadFile(Request $request, ScriptExecution $execution, string $filename): BinaryFileResponse|JsonResponse
    {
        if ($execution->script->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $path = $this->pythonService->getGeneratedFile($execution->id, $filename);

        if (!$path) {
            return response()->json(['message' => 'File not found'], 404);
        }

        return response()->download($path, $filename);
    }

    /**
     * Get a file from a temporary execution directory (for agentic results).
     */
    public function getTempFile(Request $request): BinaryFileResponse|JsonResponse
    {
        $dir = $request->query('dir');
        $filename = $request->query('filename');

        if (!$dir || !$filename) {
            return response()->json(['message' => 'Missing parameters'], 400);
        }

        // Security: ensure the directory is within our executions path
        $executionsPath = storage_path('app/executions');
        $realDir = realpath($dir);
        
        if (!$realDir || !str_starts_with($realDir, $executionsPath)) {
            Log::warning('Attempted access to file outside executions directory', [
                'dir' => $dir,
                'filename' => $filename,
            ]);
            return response()->json(['message' => 'Invalid directory'], 403);
        }

        $filePath = $realDir . '/' . basename($filename);

        if (!file_exists($filePath) || !is_file($filePath)) {
            return response()->json(['message' => 'File not found'], 404);
        }

        // Determine content type
        $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        $contentTypes = [
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'gif' => 'image/gif',
            'svg' => 'image/svg+xml',
            'pdf' => 'application/pdf',
            'csv' => 'text/csv',
            'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'xls' => 'application/vnd.ms-excel',
            'json' => 'application/json',
        ];

        $contentType = $contentTypes[$extension] ?? 'application/octet-stream';

        return response()->file($filePath, [
            'Content-Type' => $contentType,
        ]);
    }

    /**
     * Download a file from a temporary execution directory.
     */
    public function downloadTempFile(Request $request): BinaryFileResponse|JsonResponse
    {
        $dir = $request->query('dir');
        $filename = $request->query('filename');

        if (!$dir || !$filename) {
            return response()->json(['message' => 'Missing parameters'], 400);
        }

        // Security: ensure the directory is within our executions path
        $executionsPath = storage_path('app/executions');
        $realDir = realpath($dir);
        
        if (!$realDir || !str_starts_with($realDir, $executionsPath)) {
            return response()->json(['message' => 'Invalid directory'], 403);
        }

        $filePath = $realDir . '/' . basename($filename);

        if (!file_exists($filePath) || !is_file($filePath)) {
            return response()->json(['message' => 'File not found'], 404);
        }

        return response()->download($filePath, $filename);
    }
}
