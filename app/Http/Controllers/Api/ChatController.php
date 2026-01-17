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
use Prism\Prism\ValueObjects\Media\Image;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ChatController extends Controller
{
    protected PythonExecutionService $pythonService;
    protected string $model;

    protected array $imageMimeTypes = [
        'image/png',
        'image/jpeg',
        'image/gif',
        'image/webp',
    ];

    protected array $dataMimeTypes = [
        'text/csv',
        'text/plain',
        'application/csv',
        'application/json',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    public function __construct(PythonExecutionService $pythonService)
    {
        $this->pythonService = $pythonService;
        $this->pythonService->setTimeout(config('ai.agentic.python_timeout', 120));
        $this->model = config('ai.default_model', 'claude-sonnet-4-20250514');
    }

    protected function sanitizeUtf8(?string $text): string
    {
        if ($text === null) {
            return '';
        }
        $text = mb_convert_encoding($text, 'UTF-8', 'UTF-8');
        $text = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $text);
        if (!mb_check_encoding($text, 'UTF-8')) {
            $text = mb_convert_encoding($text, 'UTF-8', 'ISO-8859-1');
        }
        return $text;
    }

    protected function truncateOutput(string $output, int $maxLength = 50000): string
    {
        if (strlen($output) <= $maxLength) {
            return $output;
        }
        $truncated = substr($output, 0, $maxLength);
        return $truncated . "\n\n... [Output truncated - " . number_format(strlen($output) - $maxLength) . " characters omitted]";
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

    public function previewFile(Request $request, string $executionId, string $filename): BinaryFileResponse|JsonResponse
    {
        // Support both session-based and temp-based execution IDs
        if (!preg_match('/^(session_\d+|temp_[a-zA-Z0-9]{16})$/', $executionId)) {
            return response()->json(['message' => 'Invalid execution ID'], 400);
        }

        $filename = basename($filename);
        $filePath = $this->pythonService->getGeneratedFile($executionId, $filename);
        
        if (!$filePath || !file_exists($filePath)) {
            return response()->json(['message' => 'File not found'], 404);
        }

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

        return response()->file($filePath, [
            'Content-Type' => $contentTypes[$extension] ?? 'application/octet-stream',
            'Cache-Control' => 'private, max-age=3600',
        ]);
    }

    public function downloadFile(Request $request, string $executionId, string $filename): BinaryFileResponse|JsonResponse
    {
        // Support both session-based and temp-based execution IDs
        if (!preg_match('/^(session_\d+|temp_[a-zA-Z0-9]{16})$/', $executionId)) {
            return response()->json(['message' => 'Invalid execution ID'], 400);
        }

        $filename = basename($filename);
        $filePath = $this->pythonService->getGeneratedFile($executionId, $filename);
        
        if (!$filePath || !file_exists($filePath)) {
            return response()->json(['message' => 'File not found'], 404);
        }

        return response()->download($filePath, $filename);
    }

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

        $attachedFiles = collect();
        if (!empty($validated['file_ids'])) {
            $attachedFiles = DataFile::whereIn('id', $validated['file_ids'])
                ->where('user_id', $user->id)
                ->get();
        }

        $conversationDataFileIds = $conversation->messages()
            ->whereNotNull('metadata->attached_files')
            ->get()
            ->pluck('metadata.attached_files')
            ->flatten(1)
            ->filter(fn($f) => empty($f['is_image']))
            ->pluck('id')
            ->unique()
            ->toArray();

        $currentDataFileIds = $attachedFiles
            ->filter(fn($f) => $this->isDataFile($f->mime_type))
            ->pluck('id')
            ->toArray();

        $allDataFiles = DataFile::whereIn('id', array_merge(
            $currentDataFileIds,
            $conversationDataFileIds
        ))->where('user_id', $user->id)->get();

        $userMessage = $conversation->messages()->create([
            'role' => 'user',
            'content' => $this->sanitizeUtf8($validated['message']),
            'metadata' => $attachedFiles->isNotEmpty() ? [
                'attached_files' => $attachedFiles->map(fn($f) => [
                    'id' => $f->id,
                    'name' => $f->name,
                    'mime_type' => $f->mime_type,
                    'is_image' => $this->isImageFile($f->mime_type),
                    'path' => $f->path,
                ])->toArray()
            ] : null,
        ]);

        $conversation->touchLastMessage();
        $conversation->generateTitle();

        $messageHistory = $this->buildMessageHistory($conversation, $user);

        return $this->streamResponse(
            $conversation,
            $userMessage,
            $messageHistory,
            $user->name,
            $allDataFiles->toArray()
        );
    }

    protected function buildMessageHistory(ChatConversation $conversation, $user): array
    {
        return $conversation->messages()
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($msg) use ($user) {
                $data = [
                    'role' => $msg->role,
                    'content' => $this->sanitizeUtf8($msg->content),
                    'images' => [],
                ];
                
                if ($msg->role === 'user' && !empty($msg->metadata['attached_files'])) {
                    foreach ($msg->metadata['attached_files'] as $fileInfo) {
                        if (!empty($fileInfo['is_image']) && !empty($fileInfo['path'])) {
                            $fullPath = Storage::disk('local')->path($fileInfo['path']);
                            if (file_exists($fullPath)) {
                                $data['images'][] = [
                                    'path' => $fullPath,
                                    'name' => $fileInfo['name'] ?? 'image',
                                ];
                            }
                        }
                    }
                }
                
                return $data;
            })
            ->toArray();
    }

    protected function streamResponse(
        ChatConversation $conversation,
        ChatMessage $userMessage,
        array $messageHistory,
        string $userName,
        array $availableDataFiles
    ): StreamedResponse {
        return new StreamedResponse(function () use ($conversation, $userMessage, $messageHistory, $userName, $availableDataFiles) {
            while (ob_get_level()) ob_end_clean();
            
            $this->sendSSE('user_message', $this->formatMessage($userMessage));

            $executionResults = [];
            $allThinking = '';
            $finalContent = '';
            $code = null;
            $language = null;
            $stepsTaken = 0;
            $maxSteps = config('ai.agentic.max_steps', 80);

            try {
                $dataFilePaths = $this->prepareDataFiles($availableDataFiles);
                $systemPrompt = $this->loadPrompt('data-analysis', ['name' => $userName]);
                
                if (!empty($dataFilePaths)) {
                    $systemPrompt .= $this->buildFileContext($availableDataFiles);
                }

                $prismMessages = $this->convertToPrismMessages($messageHistory);
                
                Log::info('Starting agent loop', [
                    'message_count' => count($prismMessages),
                    'has_data_files' => !empty($dataFilePaths),
                    'max_steps' => $maxSteps,
                ]);

                $pythonTool = null;
                if (!empty($dataFilePaths)) {
                    $pythonTool = Tool::as('execute_python')
                        ->for('Execute Python code to analyze data, create visualizations, or generate files (PDF, Excel, etc.). The data is pre-loaded as pandas DataFrames (df, df2, etc.). Use this tool as many times as needed to complete the analysis.')
                        ->withStringParameter('code', 'The Python code to execute.');
                }

                $hadToolCalls = false;

                while ($stepsTaken < $maxSteps) {
                    $stepsTaken++;
                    
                    Log::info('Agent step', ['step' => $stepsTaken]);

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

                    if ($pythonTool) {
                        $prismBuilder->withTools([$pythonTool]);
                    }

                    $response = $prismBuilder->asText();
                    
                    $responseText = $response->text ?? '';
                    
                    Log::info('Agent response', [
                        'step' => $stepsTaken,
                        'text_length' => strlen($responseText),
                        'has_steps' => !empty($response->steps),
                        'step_count' => count($response->steps ?? []),
                    ]);

                    $thinking = $this->extractThinking($response);
                    if ($thinking) {
                        $allThinking .= ($allThinking ? "\n\n" : '') . $this->sanitizeUtf8($thinking);
                        $this->sendSSE('thinking', [
                            'content' => $this->sanitizeUtf8($thinking),
                            'full' => $allThinking,
                        ]);
                    }

                    $toolCalls = $this->extractToolCalls($response);
                    
                    Log::info('Tool calls extracted', ['count' => count($toolCalls)]);

                    if (!empty($toolCalls)) {
                        $hadToolCalls = true;
                        
                        foreach ($toolCalls as $tc) {
                            if ($tc['name'] === 'execute_python') {
                                $pythonCode = $tc['arguments']['code'] ?? '';

                                $this->sendSSE('tool_call', [
                                    'tool' => 'execute_python',
                                    'code' => $pythonCode,
                                    'step' => $stepsTaken,
                                ]);

                                $execResult = $this->pythonService->executeCode($pythonCode, $dataFilePaths, (string) $conversation->id);
                                
                                // Use the execution_id from the result (handles both session and temp)
                                $executionId = $execResult['execution_id'] ?? null;
                                
                                // Fallback to basename if execution_id not set (legacy support)
                                if (!$executionId && !empty($execResult['execution_dir'])) {
                                    $executionId = basename($execResult['execution_dir']);
                                }

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

                                $cleanOutput = $this->sanitizeUtf8($execResult['output'] ?? '');
                                $cleanOutput = $this->truncateOutput($cleanOutput);
                                $cleanError = $this->sanitizeUtf8($execResult['error'] ?? '');

                                $record = [
                                    'code' => $pythonCode,
                                    'success' => $execResult['success'],
                                    'output' => $cleanOutput,
                                    'error' => $cleanError ?: null,
                                    'charts' => $chartsWithUrls,
                                    'files' => $filesWithUrls,
                                    'execution_id' => $executionId,
                                ];
                                $executionResults[] = $record;

                                $this->sendSSE('tool_result', $record);

                                $resultText = $execResult['success']
                                    ? "✅ Code executed successfully.\n\nOutput:\n" . ($cleanOutput ?: '(no output)')
                                    : "❌ Code failed.\n\nError:\n" . ($cleanError ?: 'Unknown error');

                                if (!empty($chartsWithUrls)) {
                                    $resultText .= "\n\nGenerated charts: " . implode(', ', array_column($chartsWithUrls, 'filename'));
                                }
                                if (!empty($filesWithUrls)) {
                                    $resultText .= "\n\nGenerated files: " . implode(', ', array_column($filesWithUrls, 'filename'));
                                }

                                $resultText = $this->truncateOutput($resultText, 30000);

                                $assistantText = $this->sanitizeUtf8($responseText) ?: 'Running analysis...';
                                $prismMessages[] = new AssistantMessage($assistantText);
                                $prismMessages[] = new UserMessage("Tool execution result:\n\n" . $resultText);
                            }
                        }
                        continue;
                    }

                    $finalContent = $this->sanitizeUtf8($responseText);
                    
                    Log::info('Final response received', ['length' => strlen($finalContent)]);

                    if (!empty($finalContent)) {
                        $chunks = mb_str_split($finalContent, 25);
                        foreach ($chunks as $chunk) {
                            $this->sendSSE('text_delta', ['delta' => $chunk]);
                            usleep(5000);
                        }
                    }

                    break;
                }

                if ($stepsTaken >= $maxSteps && $hadToolCalls && empty($finalContent)) {
                    Log::warning('Hit max steps, requesting final summary');
                    
                    $prismMessages[] = new UserMessage(
                        "You've completed your analysis. Please provide a summary of what you found and what files were generated. Do not run any more code."
                    );
                    
                    $summaryResponse = Prism::text()
                        ->using('anthropic', $this->model)
                        ->withSystemPrompt($systemPrompt)
                        ->withMessages($prismMessages)
                        ->withMaxTokens(config('ai.tokens.medium', 8000))
                        ->withClientOptions(['timeout' => 120])
                        ->asText();
                    
                    $finalContent = $this->sanitizeUtf8($summaryResponse->text ?? 'Analysis complete. Please check the generated files above.');
                    
                    $chunks = mb_str_split($finalContent, 25);
                    foreach ($chunks as $chunk) {
                        $this->sendSSE('text_delta', ['delta' => $chunk]);
                        usleep(5000);
                    }
                }

                if (empty($finalContent) && !empty($executionResults)) {
                    $finalContent = "I've completed the analysis. You can see the execution results above, including any generated charts and files.";
                    
                    $chunks = mb_str_split($finalContent, 25);
                    foreach ($chunks as $chunk) {
                        $this->sendSSE('text_delta', ['delta' => $chunk]);
                        usleep(5000);
                    }
                }

                $parsed = $this->parseResponse($finalContent);
                $code = $parsed['code'];
                $language = $parsed['language'];

            } catch (\Exception $e) {
                Log::error('Chat error', [
                    'error' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => $e->getTraceAsString()
                ]);
                $this->sendSSE('error', ['message' => $e->getMessage()]);
                $finalContent = "I encountered an error: " . $e->getMessage();
            }

            $assistantMessage = $conversation->messages()->create([
                'role' => 'assistant',
                'content' => $finalContent,
                'thinking' => $allThinking ?: null,
                'code' => $code,
                'language' => $language,
                'metadata' => [
                    'steps_taken' => $stepsTaken,
                    'execution_results' => $executionResults,
                    'had_tool_calls' => $hadToolCalls,
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
        echo "data: " . json_encode($data, JSON_INVALID_UTF8_SUBSTITUTE | JSON_PARTIAL_OUTPUT_ON_ERROR) . "\n\n";
        flush();
    }

    protected function prepareDataFiles(array $files): array
    {
        $paths = [];
        foreach ($files as $file) {
            $path = is_array($file) ? ($file['path'] ?? null) : ($file->path ?? null);
            $name = is_array($file) ? ($file['name'] ?? 'data.csv') : ($file->name ?? 'data.csv');
            $mimeType = is_array($file) ? ($file['mime_type'] ?? '') : ($file->mime_type ?? '');
            
            if ($path && $this->isDataFile($mimeType)) {
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
        $ctx .= "You have access to the following data files. Use the `execute_python` tool to analyze them.\n\n";
        
        $dataFileIndex = 0;
        foreach ($files as $f) {
            $mimeType = is_array($f) ? ($f['mime_type'] ?? '') : ($f->mime_type ?? '');
            
            if (!$this->isDataFile($mimeType)) {
                continue;
            }
            
            $name = is_array($f) ? $f['name'] : $f->name;
            $rows = is_array($f) ? ($f['row_count'] ?? '?') : ($f->row_count ?? '?');
            $cols = is_array($f) ? ($f['column_count'] ?? '?') : ($f->column_count ?? '?');
            $meta = is_array($f) ? ($f['columns_metadata'] ?? []) : ($f->columns_metadata ?? []);
            $path = is_array($f) ? ($f['path'] ?? null) : ($f->path ?? null);
            
            $var = $dataFileIndex === 0 ? 'df' : 'df' . ($dataFileIndex + 1);
            $ctx .= "### {$name} → `{$var}`\n";
            $ctx .= "- **Size:** {$rows} rows × {$cols} columns\n";

            if (!empty($meta)) {
                $ctx .= "- **Columns:** " . implode(', ', array_slice(array_column($meta, 'name'), 0, 10));
                if (count($meta) > 10) $ctx .= "... +" . (count($meta) - 10) . " more";
                $ctx .= "\n";
            }

            if ($path) {
                $fullPath = Storage::disk('local')->path($path);
                if (file_exists($fullPath) && ($handle = fopen($fullPath, 'r'))) {
                    $preview = [];
                    for ($j = 0; $j < 4 && ($line = fgets($handle)); $j++) {
                        $preview[] = $this->sanitizeUtf8(rtrim($line));
                    }
                    fclose($handle);
                    if (!empty($preview)) {
                        $ctx .= "\n```\n" . implode("\n", $preview) . "\n```\n";
                    }
                }
            }
            $ctx .= "\n";
            $dataFileIndex++;
        }
        
        return $ctx;
    }

    protected function convertToPrismMessages(array $msgs): array
    {
        $result = [];
        foreach ($msgs as $m) {
            $content = $this->sanitizeUtf8($m['content'] ?? '');
            
            if ($m['role'] === 'assistant') {
                $result[] = new AssistantMessage($content);
            } elseif ($m['role'] === 'user') {
                $images = [];
                
                if (!empty($m['images'])) {
                    foreach ($m['images'] as $imgInfo) {
                        $path = $imgInfo['path'];
                        $name = $imgInfo['name'] ?? 'image.png';
                        
                        if (!file_exists($path)) {
                            Log::warning('Image file not found', ['path' => $path]);
                            continue;
                        }
                        
                        try {
                            $image = Image::fromLocalPath(path: $path)->as($name);
                            $images[] = $image;
                        } catch (\Exception $e) {
                            Log::error('Failed to create Image object', [
                                'path' => $path,
                                'error' => $e->getMessage(),
                            ]);
                        }
                    }
                }
                
                if (!empty($images)) {
                    $result[] = new UserMessage($content, $images);
                } else {
                    $result[] = new UserMessage($content);
                }
            }
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

    protected function isImageFile(?string $mimeType): bool
    {
        if (!$mimeType) return false;
        return in_array($mimeType, $this->imageMimeTypes);
    }

    protected function isDataFile(?string $mimeType): bool
    {
        if (!$mimeType) return false;
        return in_array($mimeType, $this->dataMimeTypes);
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
