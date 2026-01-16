<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Models\DataFile;
use App\Services\PythonExecutionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Prism\Prism\Facades\Prism;
use Prism\Prism\Facades\Tool;
use Prism\Prism\ValueObjects\Messages\AssistantMessage;
use Prism\Prism\ValueObjects\Messages\UserMessage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ChatController extends Controller
{
    protected PythonExecutionService $pythonService;
    protected string $model;

    public function __construct(PythonExecutionService $pythonService)
    {
        $this->pythonService = $pythonService;
        $this->pythonService->setTimeout(config('ai.agentic.python_timeout', 120));
        $this->model = config('ai.default_model', 'claude-sonnet-4-20250514');
    }

    public function index(Request $request): JsonResponse
    {
        $conversations = $request->user()
            ->chatConversations()
            ->orderBy('last_message_at', 'desc')
            ->get()
            ->map(fn($conv) => $this->formatConversation($conv));

        return response()->json(['conversations' => $conversations]);
    }

    public function store(Request $request): JsonResponse
    {
        $conversation = $request->user()->chatConversations()->create([
            'title' => $request->input('title'),
            'last_message_at' => now(),
        ]);

        return response()->json([
            'message' => 'Conversation created',
            'conversation' => $this->formatConversation($conversation),
        ], 201);
    }

    public function show(Request $request, ChatConversation $conversation): JsonResponse
    {
        if ($conversation->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $messages = $conversation->messages()
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(fn($msg) => $this->formatMessage($msg));

        return response()->json([
            'conversation' => $this->formatConversation($conversation),
            'messages' => $messages,
        ]);
    }

    public function destroy(Request $request, ChatConversation $conversation): JsonResponse
    {
        if ($conversation->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $conversation->delete();
        return response()->json(['message' => 'Conversation deleted']);
    }

    /**
     * Preview a file generated during chat execution (images, PDFs)
     */
    public function previewFile(Request $request, string $executionId, string $filename): BinaryFileResponse|JsonResponse
    {
        // Security: Validate execution ID format
        if (!preg_match('/^temp_[a-zA-Z0-9]{16}$/', $executionId)) {
            return response()->json(['message' => 'Invalid execution ID'], 400);
        }

        // Security: Prevent directory traversal
        $filename = basename($filename);
        
        $filePath = $this->pythonService->getGeneratedFile($executionId, $filename);
        
        if (!$filePath || !file_exists($filePath)) {
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
            'json' => 'application/json',
            'csv' => 'text/csv',
            'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'xls' => 'application/vnd.ms-excel',
        ];

        $contentType = $contentTypes[$extension] ?? 'application/octet-stream';

        return response()->file($filePath, [
            'Content-Type' => $contentType,
            'Cache-Control' => 'private, max-age=3600',
        ]);
    }

    /**
     * Download a file generated during chat execution
     */
    public function downloadFile(Request $request, string $executionId, string $filename): BinaryFileResponse|JsonResponse
    {
        // Security: Validate execution ID format
        if (!preg_match('/^temp_[a-zA-Z0-9]{16}$/', $executionId)) {
            return response()->json(['message' => 'Invalid execution ID'], 400);
        }

        // Security: Prevent directory traversal
        $filename = basename($filename);
        
        $filePath = $this->pythonService->getGeneratedFile($executionId, $filename);
        
        if (!$filePath || !file_exists($filePath)) {
            return response()->json(['message' => 'File not found'], 404);
        }

        return response()->download($filePath, $filename);
    }

    /**
     * Single unified endpoint - AI decides when to use tools
     * Everything streams in real-time - thinking, tool calls, responses
     */
    public function sendMessage(Request $request, ChatConversation $conversation): StreamedResponse|JsonResponse
    {
        if ($conversation->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $validated = $request->validate([
            'message' => 'required|string|max:10000',
            'file_ids' => 'nullable|array',
            'file_ids.*' => 'exists:data_files,id',
        ]);

        $user = $request->user();

        // Get any attached files (just context, not a mode switch)
        $attachedFiles = collect();
        if (!empty($validated['file_ids'])) {
            $attachedFiles = DataFile::whereIn('id', $validated['file_ids'])
                ->where('user_id', $user->id)
                ->get();
        }

        // Also get any files previously attached in this conversation
        $conversationFileIds = $conversation->messages()
            ->whereNotNull('metadata->attached_files')
            ->get()
            ->pluck('metadata.attached_files')
            ->flatten(1)
            ->pluck('id')
            ->unique()
            ->toArray();

        $allFiles = DataFile::whereIn('id', array_merge(
            $attachedFiles->pluck('id')->toArray(),
            $conversationFileIds
        ))->where('user_id', $user->id)->get();

        // Save user message
        $userMessage = $conversation->messages()->create([
            'role' => 'user',
            'content' => $validated['message'],
            'metadata' => $attachedFiles->isNotEmpty() ? [
                'attached_files' => $attachedFiles->map(fn($f) => [
                    'id' => $f->id,
                    'name' => $f->name,
                ])->toArray()
            ] : null,
        ]);

        $conversation->touchLastMessage();
        $conversation->generateTitle();

        // Build message history
        $messageHistory = $conversation->messages()
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(fn($msg) => ['role' => $msg->role, 'content' => $msg->content])
            ->toArray();

        return $this->streamResponse(
            $conversation,
            $userMessage,
            $messageHistory,
            $user->name,
            $allFiles->toArray()
        );
    }

    /**
     * Unified streaming - AI always has tools, decides when to use them
     * Everything visible in real-time
     */
    protected function streamResponse(
        ChatConversation $conversation,
        ChatMessage $userMessage,
        array $messageHistory,
        string $userName,
        array $availableFiles
    ): StreamedResponse {
        return new StreamedResponse(function () use ($conversation, $userMessage, $messageHistory, $userName, $availableFiles) {
            // Disable all buffering for true real-time streaming
            while (ob_get_level()) ob_end_clean();
            
            $this->sendSSE('user_message', $this->formatMessage($userMessage));

            $executionResults = [];
            $allThinking = '';
            $finalContent = '';
            $code = null;
            $language = null;
            $stepsTaken = 0;
            $maxSteps = config('ai.agentic.max_steps', 10);

            try {
                // Prepare data files (if any exist)
                $dataFilePaths = $this->prepareDataFiles($availableFiles);
                
                // Build system prompt
                $systemPrompt = $this->loadPrompt('data-analysis', ['name' => $userName]);
                
                // Add file context if files are available
                if (!empty($availableFiles)) {
                    $systemPrompt .= $this->buildFileContext($availableFiles);
                }

                $prismMessages = $this->convertToPrismMessages($messageHistory);

                // Create the Python tool - always available, AI decides when to use
                $pythonTool = Tool::as('execute_python')
                    ->for('Execute Python code to analyze data. Use this when you have enough information from the user and want to write and test analysis code. The data is pre-loaded as `df`. Always test your code before presenting it.')
                    ->withStringParameter('code', 'The Python code to execute.');

                // Agentic loop - AI controls the flow
                while ($stepsTaken < $maxSteps) {
                    $stepsTaken++;

                    // Build request - tools always available
                    $prismBuilder = Prism::text()
                        ->using('anthropic', $this->model)
                        ->withSystemPrompt($systemPrompt)
                        ->withMessages($prismMessages)
                        ->withMaxTokens(config('ai.tokens.large', 32000))
                        ->withClientOptions(['timeout' => config('ai.agentic.timeout_seconds', 600)])
                        ->withProviderOptions([
                            'thinking' => [
                                'type' => 'enabled',
                                'budget_tokens' => config('ai.tokens.thinking_budget', 32000),
                            ],
                        ]);

                    // Only add tool if files are available (can't execute without data)
                    if (!empty($dataFilePaths)) {
                        $prismBuilder->withTools([$pythonTool]);
                    }

                    $response = $prismBuilder->asText();

                    // IMMEDIATELY stream thinking (always visible)
                    $thinking = $this->extractThinking($response);
                    if ($thinking) {
                        $allThinking .= ($allThinking ? "\n\n" : '') . $thinking;
                        $this->sendSSE('thinking', [
                            'content' => $thinking,
                            'full' => $allThinking,
                        ]);
                    }

                    // Check if AI decided to use tools
                    $toolCalls = $this->extractToolCalls($response);

                    if (!empty($toolCalls)) {
                        // AI decided to execute code - show it happening
                        foreach ($toolCalls as $tc) {
                            if ($tc['name'] === 'execute_python') {
                                $pythonCode = $tc['arguments']['code'] ?? '';

                                // Stream: show code being executed
                                $this->sendSSE('tool_call', [
                                    'tool' => 'execute_python',
                                    'code' => $pythonCode,
                                    'step' => $stepsTaken,
                                ]);

                                // Execute
                                $execResult = $this->pythonService->executeCode($pythonCode, $dataFilePaths);

                                // Extract execution ID from the directory path
                                $executionId = null;
                                if (!empty($execResult['execution_dir'])) {
                                    $executionId = basename($execResult['execution_dir']);
                                }

                                // Build file URLs for frontend
                                $chartsWithUrls = array_map(function ($chart) use ($executionId) {
                                    return [
                                        'filename' => $chart['filename'],
                                        'type' => $chart['type'],
                                        'size' => $chart['size'],
                                        'preview_url' => $executionId 
                                            ? "/api/chat/executions/{$executionId}/files/{$chart['filename']}"
                                            : null,
                                        'download_url' => $executionId 
                                            ? "/api/chat/executions/{$executionId}/files/{$chart['filename']}/download"
                                            : null,
                                    ];
                                }, $execResult['charts'] ?? []);

                                $filesWithUrls = array_map(function ($file) use ($executionId) {
                                    return [
                                        'filename' => $file['filename'],
                                        'type' => $file['type'],
                                        'size' => $file['size'],
                                        'preview_url' => $executionId 
                                            ? "/api/chat/executions/{$executionId}/files/{$file['filename']}"
                                            : null,
                                        'download_url' => $executionId 
                                            ? "/api/chat/executions/{$executionId}/files/{$file['filename']}/download"
                                            : null,
                                    ];
                                }, $execResult['files'] ?? []);

                                $record = [
                                    'code' => $pythonCode,
                                    'success' => $execResult['success'],
                                    'output' => $execResult['output'] ?? '',
                                    'error' => $execResult['error'] ?? null,
                                    'charts' => $chartsWithUrls,
                                    'files' => $filesWithUrls,
                                    'execution_id' => $executionId,
                                ];
                                $executionResults[] = $record;

                                // Stream: show result with URLs
                                $this->sendSSE('tool_result', $record);

                                // Add to conversation for AI to see
                                $resultText = $execResult['success']
                                    ? "✅ Code executed successfully.\n\nOutput:\n" . ($execResult['output'] ?: '(no output)')
                                    : "❌ Code failed.\n\nError:\n" . ($execResult['error'] ?? 'Unknown error');

                                if (!empty($chartsWithUrls)) {
                                    $resultText .= "\n\nGenerated charts: " . implode(', ', array_column($chartsWithUrls, 'filename'));
                                }
                                if (!empty($filesWithUrls)) {
                                    $resultText .= "\n\nGenerated files: " . implode(', ', array_column($filesWithUrls, 'filename'));
                                }

                                $prismMessages[] = new AssistantMessage($response->text ?: 'Let me test this code.');
                                $prismMessages[] = new UserMessage("Execution result:\n\n" . $resultText);
                            }
                        }
                        // Continue loop - AI will see results and decide next action
                        continue;
                    }

                    // No tool calls - AI is responding with final message
                    $finalContent = $response->text ?? '';

                    // Stream the response text
                    $chunks = mb_str_split($finalContent, 25);
                    foreach ($chunks as $chunk) {
                        $this->sendSSE('text_delta', ['delta' => $chunk]);
                        usleep(5000);
                    }

                    break; // Done
                }

                // Parse for code blocks in final response
                $parsed = $this->parseResponse($finalContent);
                $code = $parsed['code'];
                $language = $parsed['language'];

            } catch (\Exception $e) {
                Log::error('Chat error', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
                $this->sendSSE('error', ['message' => $e->getMessage()]);
                $finalContent = "I encountered an error: " . $e->getMessage();
            }

            // Save assistant message
            $assistantMessage = $conversation->messages()->create([
                'role' => 'assistant',
                'content' => $finalContent,
                'thinking' => $allThinking ?: null,
                'code' => $code,
                'language' => $language,
                'metadata' => [
                    'steps_taken' => $stepsTaken,
                    'execution_results' => $executionResults,
                    'had_tool_calls' => !empty($executionResults),
                ],
            ]);

            $conversation->touchLastMessage();

            $this->sendSSE('complete', ['assistant_message' => $this->formatMessage($assistantMessage)]);
            $this->sendSSE('done', []);

        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Connection' => 'keep-alive',
            'X-Accel-Buffering' => 'no',
        ]);
    }

    public function streamMessage(Request $request, ChatConversation $conversation): StreamedResponse|JsonResponse
    {
        return $this->sendMessage($request, $conversation);
    }

    protected function sendSSE(string $event, array $data): void
    {
        echo "event: {$event}\n";
        echo "data: " . json_encode($data) . "\n\n";
        flush();
    }

    protected function prepareDataFiles(array $files): array
    {
        $paths = [];
        foreach ($files as $file) {
            $path = is_array($file) ? ($file['path'] ?? null) : ($file->path ?? null);
            $name = is_array($file) ? ($file['name'] ?? 'data.csv') : ($file->name ?? 'data.csv');
            if ($path) {
                $fullPath = Storage::disk('local')->path($path);
                if (file_exists($fullPath)) {
                    $paths[] = ['path' => $fullPath, 'name' => $name];
                }
            }
        }
        return $paths;
    }

    protected function loadPrompt(string $name, array $vars = []): string
    {
        $path = resource_path("prompts/{$name}.md");
        if (!File::exists($path)) throw new \RuntimeException("Prompt '{$name}' not found");
        $content = File::get($path);
        foreach ($vars as $k => $v) $content = str_replace("{{$k}}", $v, $content);
        return $content;
    }

    protected function buildFileContext(array $files): string
    {
        $ctx = "\n\n---\n## Available Data Files\n\n";
        $ctx .= "You have access to the following data. When you're ready to analyze, use the `execute_python` tool.\n\n";
        
        foreach ($files as $i => $f) {
            $name = is_array($f) ? $f['name'] : $f->name;
            $rows = is_array($f) ? ($f['row_count'] ?? '?') : ($f->row_count ?? '?');
            $cols = is_array($f) ? ($f['column_count'] ?? '?') : ($f->column_count ?? '?');
            $meta = is_array($f) ? ($f['columns_metadata'] ?? []) : ($f->columns_metadata ?? []);
            $path = is_array($f) ? ($f['path'] ?? null) : ($f->path ?? null);
            
            $var = $i === 0 ? 'df' : 'df' . ($i + 1);
            $ctx .= "### {$name} → `{$var}`\n";
            $ctx .= "- **Size:** {$rows} rows × {$cols} columns\n";

            if (!empty($meta)) {
                $ctx .= "- **Columns:** " . implode(', ', array_slice(array_column($meta, 'name'), 0, 10));
                if (count($meta) > 10) $ctx .= "... +" . (count($meta) - 10) . " more";
                $ctx .= "\n";
            }

            // Preview first few rows
            if ($path) {
                $fullPath = Storage::disk('local')->path($path);
                if (file_exists($fullPath) && ($handle = fopen($fullPath, 'r'))) {
                    $preview = [];
                    for ($j = 0; $j < 4 && ($line = fgets($handle)); $j++) {
                        $preview[] = rtrim($line);
                    }
                    fclose($handle);
                    if (!empty($preview)) {
                        $ctx .= "\n```\n" . implode("\n", $preview) . "\n```\n";
                    }
                }
            }
            $ctx .= "\n";
        }
        return $ctx;
    }

    protected function convertToPrismMessages(array $msgs): array
    {
        $result = [];
        foreach ($msgs as $m) {
            if ($m['role'] === 'assistant') $result[] = new AssistantMessage($m['content']);
            elseif ($m['role'] === 'user') $result[] = new UserMessage($m['content']);
        }
        return $result;
    }

    protected function extractThinking($r): ?string
    {
        if (isset($r->additionalContent['thinking'])) return $r->additionalContent['thinking'];
        foreach ($r->steps ?? [] as $s) {
            if (isset($s->additionalContent['thinking'])) return $s->additionalContent['thinking'];
        }
        return null;
    }

    protected function extractToolCalls($r): array
    {
        $calls = [];
        foreach ($r->steps ?? [] as $s) {
            foreach ($s->toolCalls ?? [] as $tc) {
                $calls[] = ['name' => $tc->name, 'arguments' => $tc->arguments()];
            }
        }
        return $calls;
    }

    protected function parseResponse(string $c): array
    {
        $code = null;
        $lang = null;
        if (preg_match_all('/```(\w+)?\n(.*?)```/s', $c, $m, PREG_SET_ORDER)) {
            foreach ($m as $match) {
                $l = strtolower($match[1] ?? 'python');
                if ($l === 'python') { $lang = 'python'; $code = trim($match[2]); }
                elseif (!$code) { $lang = $l ?: 'text'; $code = trim($match[2]); }
            }
        }
        return ['content' => trim($c), 'code' => $code, 'language' => $lang];
    }

    protected function formatConversation(ChatConversation $c): array
    {
        return [
            'id' => $c->id,
            'title' => $c->title,
            'last_message_at' => $c->last_message_at?->toISOString(),
            'created_at' => $c->created_at->toISOString(),
            'updated_at' => $c->updated_at->toISOString(),
        ];
    }

    protected function formatMessage(ChatMessage $m): array
    {
        return [
            'id' => $m->id,
            'role' => $m->role,
            'content' => $m->content,
            'thinking' => $m->thinking,
            'code' => $m->code,
            'language' => $m->language,
            'metadata' => $m->metadata,
            'created_at' => $m->created_at->toISOString(),
        ];
    }
}
