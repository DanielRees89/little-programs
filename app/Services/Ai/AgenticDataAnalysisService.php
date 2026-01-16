<?php

namespace App\Services\Ai;

use App\Services\PythonExecutionService;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Prism\Prism\Facades\Prism;
use Prism\Prism\Facades\Tool;
use Prism\Prism\Enums\FinishReason;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AgenticDataAnalysisService extends BaseAnthropicService
{
    protected PythonExecutionService $pythonService;
    protected array $dataFilePaths = [];
    protected array $executionResults = [];
    protected int $maxSteps;
    protected int $timeout;

    public function __construct(PythonExecutionService $pythonService)
    {
        parent::__construct();
        $this->pythonService = $pythonService;
        $this->maxSteps = config('ai.agentic.max_steps', 10);
        $this->timeout = config('ai.agentic.timeout_seconds', 600);
        
        $pythonTimeout = config('ai.agentic.python_timeout', 120);
        $this->pythonService->setTimeout($pythonTimeout);
    }

    /**
     * Stream an agentic chat with real-time updates
     * Shows thinking, tool calls, and responses as they happen
     */
    public function streamAgenticChat(array $messages, string $userName, array $attachedFiles = []): StreamedResponse
    {
        return new StreamedResponse(function () use ($messages, $userName, $attachedFiles) {
            // Disable output buffering for real-time streaming
            if (ob_get_level()) ob_end_clean();
            
            // Prepare file paths for execution
            $this->prepareDataFiles($attachedFiles);
            $this->executionResults = [];

            // Load system prompt
            $systemPrompt = $this->loadPrompt('data-analysis', ['name' => $userName]);
            if (!empty($attachedFiles)) {
                $systemPrompt .= $this->buildFileContext($attachedFiles);
            }

            $this->sendEvent('status', ['message' => 'Starting analysis...']);

            try {
                $conversationMessages = $this->convertToPrismMessages($messages);
                $step = 0;
                $allThinking = '';
                $finalContent = '';

                while ($step < $this->maxSteps) {
                    $step++;
                    $this->sendEvent('step', ['step' => $step, 'max_steps' => $this->maxSteps]);

                    // Create tool for this iteration
                    $executePythonTool = $this->createPythonExecutionToolWithCallback();

                    // Build request
                    $prism = Prism::text()
                        ->using('anthropic', $this->model)
                        ->withSystemPrompt($systemPrompt)
                        ->withMessages($conversationMessages)
                        ->withMaxTokens(config('ai.tokens.large', 32000))
                        ->withTools([$executePythonTool])
                        ->withClientOptions([
                            'timeout' => $this->timeout,
                            'connect_timeout' => 30,
                        ])
                        ->withProviderOptions([
                            'thinking' => [
                                'type' => 'enabled',
                                'budget_tokens' => config('ai.tokens.thinking_budget', 32000),
                            ],
                        ]);

                    // Get response (we can't truly stream with tools, but we show progress)
                    $this->sendEvent('status', ['message' => 'Thinking...']);
                    
                    $response = $prism->asText();

                    // Extract and send thinking
                    $thinking = $this->extractThinking($response);
                    if ($thinking) {
                        $allThinking .= ($allThinking ? "\n\n---\n\n" : '') . $thinking;
                        $this->sendEvent('thinking', ['content' => $thinking, 'full' => $allThinking]);
                    }

                    // Check for tool calls
                    $hasToolCall = false;
                    foreach ($response->steps as $responseStep) {
                        if (!empty($responseStep->toolCalls)) {
                            $hasToolCall = true;
                            foreach ($responseStep->toolCalls as $toolCall) {
                                if ($toolCall->name === 'execute_python') {
                                    $code = $toolCall->arguments()['code'] ?? '';
                                    
                                    // Send tool call event
                                    $this->sendEvent('tool_call', [
                                        'tool' => 'execute_python',
                                        'code' => $code,
                                    ]);

                                    // Execute and send result
                                    $result = $this->executePythonCode($code);
                                    $this->sendEvent('tool_result', [
                                        'success' => $this->executionResults[count($this->executionResults) - 1]['success'],
                                        'output' => $this->executionResults[count($this->executionResults) - 1]['output'] ?? '',
                                        'error' => $this->executionResults[count($this->executionResults) - 1]['error'] ?? null,
                                        'charts' => $this->executionResults[count($this->executionResults) - 1]['charts'] ?? [],
                                        'files' => $this->executionResults[count($this->executionResults) - 1]['files'] ?? [],
                                        'execution_dir' => $this->executionResults[count($this->executionResults) - 1]['execution_dir'] ?? null,
                                    ]);

                                    // Add tool result to conversation for next iteration
                                    $conversationMessages[] = new \Prism\Prism\ValueObjects\Messages\AssistantMessage(
                                        $response->text ?: "I'll execute this code to verify it works."
                                    );
                                    $conversationMessages[] = new \Prism\Prism\ValueObjects\Messages\UserMessage(
                                        "Tool result:\n" . $result
                                    );
                                }
                            }
                        }
                    }

                    // If no tool call, we have the final response
                    if (!$hasToolCall || $response->finishReason === FinishReason::Stop) {
                        $finalContent = $response->text;
                        
                        // Stream the final content in chunks
                        $chunks = str_split($finalContent, 50);
                        foreach ($chunks as $chunk) {
                            $this->sendEvent('text_delta', ['delta' => $chunk]);
                            usleep(10000); // Small delay for visual effect
                        }
                        
                        break;
                    }
                }

                // Parse the response for code
                $parsed = $this->parseResponse($finalContent);

                // Send completion
                $this->sendEvent('complete', [
                    'content' => $finalContent,
                    'thinking' => $allThinking,
                    'code' => $parsed['code'],
                    'language' => $parsed['language'],
                    'execution_results' => $this->executionResults,
                    'steps_taken' => $step,
                ]);

            } catch (\Exception $e) {
                Log::error('AgenticDataAnalysisService streaming error', [
                    'error' => $e->getMessage(),
                ]);
                $this->sendEvent('error', ['message' => $e->getMessage()]);
            }

            $this->sendEvent('done', []);

        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'Connection' => 'keep-alive',
            'X-Accel-Buffering' => 'no',
        ]);
    }

    /**
     * Send an SSE event
     */
    protected function sendEvent(string $type, array $data): void
    {
        echo "event: {$type}\n";
        echo "data: " . json_encode($data) . "\n\n";
        
        if (ob_get_level()) ob_flush();
        flush();
    }

    /**
     * Non-streaming version (kept for compatibility)
     */
    public function chat(array $messages, string $userName, array $attachedFiles = []): array
    {
        try {
            $this->prepareDataFiles($attachedFiles);
            $this->executionResults = [];

            $systemPrompt = $this->loadPrompt('data-analysis', ['name' => $userName]);
            if (!empty($attachedFiles)) {
                $systemPrompt .= $this->buildFileContext($attachedFiles);
            }

            Log::info('AgenticDataAnalysisService: Starting agentic chat', [
                'message_count' => count($messages),
                'attached_files' => count($attachedFiles),
                'max_steps' => $this->maxSteps,
            ]);

            $executePythonTool = $this->createPythonExecutionTool();

            $startTime = microtime(true);

            $prism = Prism::text()
                ->using('anthropic', $this->model)
                ->withSystemPrompt($systemPrompt)
                ->withMessages($this->convertToPrismMessages($messages))
                ->withMaxTokens(config('ai.tokens.large', 32000))
                ->withTools([$executePythonTool])
                ->withMaxSteps($this->maxSteps)
                ->withClientOptions([
                    'timeout' => $this->timeout,
                    'connect_timeout' => 30,
                ])
                ->withProviderOptions([
                    'thinking' => [
                        'type' => 'enabled',
                        'budget_tokens' => config('ai.tokens.thinking_budget', 32000),
                    ],
                ]);

            $response = $prism->asText();
            $executionTime = round((microtime(true) - $startTime) * 1000);

            $thinking = $this->extractThinking($response);
            $parsed = $this->parseResponse($response->text);
            $lastExecution = $this->getLastSuccessfulExecution();

            return [
                'success' => true,
                'content' => $parsed['content'],
                'thinking' => $thinking ?? $parsed['thinking'],
                'code' => $parsed['code'],
                'language' => $parsed['language'],
                'execution_results' => $this->executionResults,
                'last_execution' => $lastExecution,
                'usage' => [
                    'input_tokens' => $response->usage->promptTokens ?? 0,
                    'output_tokens' => $response->usage->completionTokens ?? 0,
                    'total_tokens' => ($response->usage->promptTokens ?? 0) + ($response->usage->completionTokens ?? 0),
                ],
                'model' => $this->model,
                'execution_time_ms' => $executionTime,
                'steps_taken' => count($response->steps),
            ];

        } catch (\Exception $e) {
            Log::error('AgenticDataAnalysisService: Error', [
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'content' => null,
                'execution_results' => $this->executionResults,
            ];
        }
    }

    protected function createPythonExecutionTool()
    {
        return Tool::as('execute_python')
            ->for('Execute Python code against the uploaded data files to verify it works.')
            ->withStringParameter('code', 'The Python code to execute.')
            ->using(function (string $code): string {
                return $this->executePythonCode($code);
            });
    }

    protected function createPythonExecutionToolWithCallback()
    {
        return Tool::as('execute_python')
            ->for('Execute Python code against the uploaded data files to verify it works.')
            ->withStringParameter('code', 'The Python code to execute.');
    }

    protected function executePythonCode(string $code): string
    {
        Log::info('AgenticDataAnalysisService: Executing Python code', [
            'code_length' => strlen($code),
        ]);

        $result = $this->pythonService->executeCode($code, $this->dataFilePaths);

        $executionRecord = [
            'code' => $code,
            'success' => $result['success'],
            'output' => $result['output'] ?? '',
            'error' => $result['error'] ?? null,
            'charts' => $result['charts'] ?? [],
            'files' => $result['files'] ?? [],
            'execution_dir' => $result['execution_dir'] ?? null,
            'timestamp' => now()->toIso8601String(),
        ];
        $this->executionResults[] = $executionRecord;

        if ($result['success']) {
            $response = "✅ Execution Successful\n\nOutput:\n" . ($result['output'] ?: '(No output)');
            if (!empty($result['charts'])) {
                $response .= "\n\nCharts Generated: " . implode(', ', array_column($result['charts'], 'filename'));
            }
            if (!empty($result['files'])) {
                $response .= "\n\nFiles Generated: " . implode(', ', array_column($result['files'], 'filename'));
            }
            return $response;
        } else {
            return "❌ Execution Failed\n\nError:\n" . ($result['error'] ?? 'Unknown error');
        }
    }

    protected function prepareDataFiles(array $files): void
    {
        $this->dataFilePaths = [];
        foreach ($files as $file) {
            $path = is_array($file) ? ($file['path'] ?? null) : ($file->path ?? null);
            $name = is_array($file) ? ($file['name'] ?? 'data.csv') : ($file->name ?? 'data.csv');
            if ($path) {
                $fullPath = Storage::disk('local')->path($path);
                if (file_exists($fullPath)) {
                    $this->dataFilePaths[] = ['path' => $fullPath, 'name' => $name];
                }
            }
        }
    }

    protected function buildFileContext(array $files): string
    {
        $context = "\n\n---\n## Current Data Context\n\n";
        foreach ($files as $index => $file) {
            $name = is_array($file) ? $file['name'] : $file->name;
            $rowCount = is_array($file) ? ($file['row_count'] ?? 'unknown') : ($file->row_count ?? 'unknown');
            $columnCount = is_array($file) ? ($file['column_count'] ?? 'unknown') : ($file->column_count ?? 'unknown');
            $columnsMetadata = is_array($file) ? ($file['columns_metadata'] ?? []) : ($file->columns_metadata ?? []);
            $path = is_array($file) ? ($file['path'] ?? null) : ($file->path ?? null);

            $varName = $index === 0 ? 'df' : 'df' . ($index + 1);
            $context .= "### File: {$name} (loaded as `{$varName}`)\n";
            $context .= "- Rows: {$rowCount}, Columns: {$columnCount}\n";

            if (!empty($columnsMetadata)) {
                $context .= "| Column | Type | Samples |\n|--------|------|------|\n";
                foreach ($columnsMetadata as $col) {
                    $samples = isset($col['sample_values']) ? implode(', ', array_slice($col['sample_values'], 0, 3)) : '';
                    $context .= "| {$col['name']} | {$col['type']} | {$samples} |\n";
                }
            }

            if ($path) {
                $preview = $this->getDataPreview($path);
                if ($preview) $context .= "\n```\n{$preview}\n```\n";
            }
            $context .= "\n";
        }
        return $context;
    }

    protected function getDataPreview(string $path, int $maxRows = 5): ?string
    {
        try {
            $fullPath = Storage::disk('local')->path($path);
            if (!file_exists($fullPath)) return null;
            $handle = fopen($fullPath, 'r');
            if (!$handle) return null;
            $lines = [];
            $count = 0;
            while (($line = fgets($handle)) !== false && $count <= $maxRows) {
                $lines[] = rtrim($line);
                $count++;
            }
            fclose($handle);
            return implode("\n", $lines);
        } catch (\Exception $e) {
            return null;
        }
    }

    protected function loadPrompt(string $promptName, array $variables = []): string
    {
        $filePath = config('ai.prompts_path', resource_path('prompts')) . "/{$promptName}.md";
        if (!File::exists($filePath)) throw new \RuntimeException("Prompt '{$promptName}' not found");
        $content = File::get($filePath);
        foreach ($variables as $key => $value) {
            $content = str_replace("{{$key}}", $value, $content);
        }
        return $content;
    }

    public function parseResponse(string $content): array
    {
        $thinking = null;
        $code = null;
        $language = null;
        $cleanContent = $content;

        if (preg_match('/<thinking>(.*?)<\/thinking>/s', $content, $matches)) {
            $thinking = trim($matches[1]);
            $cleanContent = preg_replace('/<thinking>.*?<\/thinking>/s', '', $cleanContent);
        }

        if (preg_match_all('/```(\w+)?\n(.*?)```/s', $cleanContent, $matches, PREG_SET_ORDER)) {
            foreach ($matches as $match) {
                $lang = strtolower($match[1] ?? 'python');
                if ($lang === 'python') {
                    $language = 'python';
                    $code = trim($match[2]);
                } elseif (!$code) {
                    $language = $lang ?: 'text';
                    $code = trim($match[2]);
                }
            }
        }

        return ['content' => trim($cleanContent), 'thinking' => $thinking, 'code' => $code, 'language' => $language];
    }

    protected function extractThinking($response): ?string
    {
        if (isset($response->additionalContent['thinking'])) {
            return $response->additionalContent['thinking'];
        }
        foreach ($response->steps as $step) {
            if (isset($step->additionalContent['thinking'])) {
                return $step->additionalContent['thinking'];
            }
        }
        return null;
    }

    protected function getLastSuccessfulExecution(): ?array
    {
        for ($i = count($this->executionResults) - 1; $i >= 0; $i--) {
            if ($this->executionResults[$i]['success']) return $this->executionResults[$i];
        }
        return null;
    }

    public function getExecutionResults(): array
    {
        return $this->executionResults;
    }
}
