<?php

namespace App\Services\Ai;

use Illuminate\Support\Facades\Log;
use Prism\Prism\Facades\Prism;
use Prism\Prism\ValueObjects\Messages\UserMessage;
use Prism\Prism\ValueObjects\Messages\AssistantMessage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class BaseAnthropicService
{
    protected string $model;
    protected int $maxRetries = 3;
    protected int $retryDelayMs = 1000;

    public function __construct()
    {
        $this->model = config('ai.default_model', 'claude-sonnet-4-20250514');
    }

    /**
     * Send a message to Claude and get a response (non-streaming)
     *
     * @param string $systemPrompt System instructions for Claude
     * @param array $messages Conversation messages
     * @param int $maxTokens Maximum tokens in response
     * @param float $temperature Sampling temperature (0.0 to 1.0)
     * @return array Response with content and metadata
     */
    public function sendMessage(
        string $systemPrompt,
        array $messages,
        int $maxTokens = 4096,
        float $temperature = 0.1
    ): array {
        $attempt = 0;
        $lastException = null;

        while ($attempt < $this->maxRetries) {
            try {
                $attempt++;

                Log::info('BaseAnthropicService: Sending message', [
                    'model' => $this->model,
                    'message_count' => count($messages),
                    'max_tokens' => $maxTokens,
                    'attempt' => $attempt,
                ]);

                $prism = Prism::text()
                    ->using('anthropic', $this->model)
                    ->withSystemPrompt($systemPrompt)
                    ->withMessages($this->convertToPrismMessages($messages))
                    ->withMaxTokens($maxTokens);

                // Add temperature if not default
                if ($temperature !== 1.0) {
                    $prism->usingTemperature($temperature);
                }

                $startTime = microtime(true);
                $response = $prism->asText();
                $executionTime = round((microtime(true) - $startTime) * 1000);

                Log::info('BaseAnthropicService: Response received', [
                    'execution_time_ms' => $executionTime,
                    'input_tokens' => $response->usage->promptTokens ?? 0,
                    'output_tokens' => $response->usage->completionTokens ?? 0,
                    'stop_reason' => $response->finishReason->name ?? 'unknown',
                ]);

                return [
                    'success' => true,
                    'response' => $response,
                    'content' => $response->text,
                    'usage' => [
                        'input_tokens' => $response->usage->promptTokens ?? 0,
                        'output_tokens' => $response->usage->completionTokens ?? 0,
                        'total_tokens' => ($response->usage->promptTokens ?? 0) + ($response->usage->completionTokens ?? 0),
                    ],
                    'execution_time_ms' => $executionTime,
                    'model' => $this->model,
                ];

            } catch (\Exception $e) {
                $lastException = $e;

                Log::warning('BaseAnthropicService: API call failed', [
                    'attempt' => $attempt,
                    'max_retries' => $this->maxRetries,
                    'error' => $e->getMessage(),
                    'error_code' => $e->getCode(),
                ]);

                if ($attempt < $this->maxRetries) {
                    $delay = $this->retryDelayMs * $attempt;
                    Log::info("Retrying in {$delay}ms...");
                    usleep($delay * 1000);
                }
            }
        }

        Log::error('BaseAnthropicService: All retries exhausted', [
            'error' => $lastException->getMessage(),
            'trace' => $lastException->getTraceAsString()
        ]);

        return [
            'success' => false,
            'error' => $lastException->getMessage(),
            'content' => null,
            'usage' => ['input_tokens' => 0, 'output_tokens' => 0, 'total_tokens' => 0],
        ];
    }

    /**
     * Stream a message to Claude using Server-Sent Events
     *
     * @param string $systemPrompt System instructions for Claude
     * @param array $messages Conversation messages
     * @param int $maxTokens Maximum tokens in response
     * @param float $temperature Sampling temperature
     * @param int $thinkingBudget Budget for extended thinking tokens
     * @return StreamedResponse
     */
    public function streamMessage(
        string $systemPrompt,
        array $messages,
        int $maxTokens = 16000,
        float $temperature = 1.0,
        int $thinkingBudget = 10000
    ): StreamedResponse {
        Log::info('BaseAnthropicService: Starting stream', [
            'model' => $this->model,
            'message_count' => count($messages),
            'max_tokens' => $maxTokens,
            'thinking_budget' => $thinkingBudget,
        ]);

        $prism = Prism::text()
            ->using('anthropic', $this->model)
            ->withSystemPrompt($systemPrompt)
            ->withMessages($this->convertToPrismMessages($messages))
            ->withMaxTokens($maxTokens)
            ->withProviderOptions([
                'thinking' => [
                    'type' => 'enabled',
                    'budget_tokens' => $thinkingBudget,
                ],
            ]);

        // Note: Extended thinking requires temperature = 1.0
        // Don't set temperature when using thinking

        return $prism->asEventStreamResponse();
    }

    /**
     * Build a Prism request object for streaming (used by controller)
     */
    public function buildStreamRequest(
        string $systemPrompt,
        array $messages,
        int $maxTokens = 16000,
        int $thinkingBudget = 10000
    ) {
        return Prism::text()
            ->using('anthropic', $this->model)
            ->withSystemPrompt($systemPrompt)
            ->withMessages($this->convertToPrismMessages($messages))
            ->withMaxTokens($maxTokens)
            ->withProviderOptions([
                'thinking' => [
                    'type' => 'enabled',
                    'budget_tokens' => $thinkingBudget,
                ],
            ]);
    }

    /**
     * Convert array messages to Prism message objects
     */
    protected function convertToPrismMessages(array $messages): array
    {
        $prismMessages = [];

        foreach ($messages as $message) {
            $role = $message['role'] ?? 'user';
            $content = $message['content'] ?? '';

            // Skip system messages - they go in withSystemPrompt
            if ($role === 'system') {
                continue;
            }

            if ($role === 'assistant') {
                $prismMessages[] = new AssistantMessage($content);
            } else {
                $prismMessages[] = new UserMessage($content);
            }
        }

        return $prismMessages;
    }

    /**
     * Set custom model
     */
    public function setModel(string $model): self
    {
        $this->model = $model;
        return $this;
    }

    /**
     * Set custom retry configuration
     */
    public function setRetryConfig(int $maxRetries, int $retryDelayMs): self
    {
        $this->maxRetries = $maxRetries;
        $this->retryDelayMs = $retryDelayMs;
        return $this;
    }

    /**
     * Get current model
     */
    public function getModel(): string
    {
        return $this->model;
    }
}
