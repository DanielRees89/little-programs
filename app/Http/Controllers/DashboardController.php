<?php

namespace App\Http\Controllers;

use App\Models\ChatConversation;
use App\Models\DataFile;
use App\Models\Script;
use App\Models\ScriptExecution;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Show the main dashboard.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('Dashboard', [
            'stats' => [
                'scripts_count' => $user->scripts()->count(),
                'files_count' => $user->dataFiles()->count(),
                'executions_count' => $user->scriptExecutions()->count(),
                'conversations_count' => $user->chatConversations()->count(),
            ],
            'recent_scripts' => $user->scripts()
                ->orderBy('updated_at', 'desc')
                ->limit(5)
                ->get(['id', 'name', 'description', 'run_count', 'updated_at']),
            'recent_files' => $user->dataFiles()
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get(['id', 'name', 'size', 'row_count', 'column_count', 'created_at']),
        ]);
    }

    /**
     * Show the chat page.
     */
    public function chat(Request $request): Response
    {
        $user = $request->user();
        $conversation = null;

        // Load specific conversation if requested
        if ($request->has('conversation')) {
            $conversation = $user->chatConversations()
                ->where('id', $request->get('conversation'))
                ->first(['id', 'title', 'last_message_at', 'created_at']);
        }

        return Inertia::render('Chat/Index', [
            'conversation' => $conversation,
        ]);
    }

    /**
     * Show the scripts page.
     */
    public function scripts(Request $request): Response
    {
        $user = $request->user();

        $scripts = $user->scripts()
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Scripts/Index', [
            'scripts' => $scripts,
        ]);
    }

    /**
     * Show the data files page.
     */
    public function data(Request $request): Response
    {
        $user = $request->user();

        $files = $user->dataFiles()
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($file) {
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
                ];
            });

        return Inertia::render('Data/Index', [
            'files' => $files,
        ]);
    }

    /**
     * Show the playground page.
     */
    public function playground(Request $request): Response
    {
        $user = $request->user();

        $scripts = $user->scripts()
            ->orderBy('name', 'asc')
            ->get(['id', 'name', 'description', 'code', 'language', 'file_config']);

        $files = $user->dataFiles()
            ->orderBy('name', 'asc')
            ->get()
            ->map(function ($file) {
                return [
                    'id' => $file->id,
                    'name' => $file->name,
                    'size' => $file->size,
                    'formatted_size' => $file->formatted_size,
                    'row_count' => $file->row_count,
                    'column_count' => $file->column_count,
                    'columns_metadata' => $file->columns_metadata,
                ];
            });

        $recentExecutions = $user->scriptExecutions()
            ->with(['script:id,name', 'dataFiles:id,name'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($exec) {
                return [
                    'id' => $exec->id,
                    'script_id' => $exec->script_id,
                    'script_name' => $exec->script?->name,
                    'status' => $exec->status,
                    'duration' => $exec->duration,
                    'created_at' => $exec->created_at->toISOString(),
                    'data_files' => $exec->dataFiles->map(fn ($f) => [
                        'id' => $f->id,
                        'name' => $f->name,
                    ]),
                ];
            });

        return Inertia::render('Playground/Index', [
            'scripts' => $scripts,
            'files' => $files,
            'recentExecutions' => $recentExecutions,
        ]);
    }
}
