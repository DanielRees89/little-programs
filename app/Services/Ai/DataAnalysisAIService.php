<?php

namespace App\Services\Ai;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DataAnalysisAIService extends BaseAnthropicService
{
    /**
     * Send a data analysis chat message (non-streaming)
     *
     * @param array $messages Conversation history
     * @param string $userName User's name for personalization
     * @param array $attachedFiles Optional array of DataFile models
     * @return array Parsed response with content, code, etc.
     */
    public function chat(array $messages, string $userName, array $attachedFiles = []): array
    {
        $systemPrompt = $this->loadPrompt('data-analysis', [
            'name' => $userName,
        ]);

        // If there are attached files, add their preview data to the system prompt
        if (!empty($attachedFiles)) {
            $systemPrompt .= $this->buildFileContext($attachedFiles);
        }

        $response = $this->sendMessage(
            $systemPrompt,
            $messages,
            config('ai.tokens.extended', 8000),
            config('ai.temperature.deterministic', 0.1)
        );

        if (!$response['success']) {
            return [
                'success' => false,
                'error' => $response['error'] ?? 'Failed to get AI response',
            ];
        }

        // Parse the response to extract code blocks
        $parsed = $this->parseResponse($response['content']);

        return [
            'success' => true,
            'content' => $parsed['content'],
            'thinking' => $parsed['thinking'],
            'code' => $parsed['code'],
            'language' => $parsed['language'],
            'usage' => $response['usage'],
            'model' => $response['model'],
            'execution_time_ms' => $response['execution_time_ms'],
        ];
    }

    /**
     * Stream a data analysis chat message using SSE
     *
     * @param array $messages Conversation history
     * @param string $userName User's name for personalization
     * @param array $attachedFiles Optional array of DataFile models
     * @return StreamedResponse
     */
    public function streamChat(array $messages, string $userName, array $attachedFiles = []): StreamedResponse
    {
        $systemPrompt = $this->loadPrompt('data-analysis', [
            'name' => $userName,
        ]);

        // If there are attached files, add their preview data to the system prompt
        if (!empty($attachedFiles)) {
            $systemPrompt .= $this->buildFileContext($attachedFiles);
        }

        Log::info('DataAnalysisAIService: Starting streaming chat', [
            'message_count' => count($messages),
            'attached_files' => count($attachedFiles),
        ]);

        return $this->streamMessage(
            $systemPrompt,
            $messages,
            config('ai.tokens.large', 16000),
            1.0, // Temperature must be 1.0 for extended thinking
            config('ai.tokens.thinking_budget', 10000)
        );
    }

    /**
     * Build a Prism request for streaming (allows controller to add callback)
     */
    public function buildStreamingRequest(array $messages, string $userName, array $attachedFiles = [])
    {
        $systemPrompt = $this->loadPrompt('data-analysis', [
            'name' => $userName,
        ]);

        if (!empty($attachedFiles)) {
            $systemPrompt .= $this->buildFileContext($attachedFiles);
        }

        return $this->buildStreamRequest(
            $systemPrompt,
            $messages,
            config('ai.tokens.large', 16000),
            config('ai.tokens.thinking_budget', 10000)
        );
    }

    /**
     * Build file context for the AI including preview data
     */
    protected function buildFileContext(array $files): string
    {
        $context = "\n\n---\n## Current Data Context\n\n";
        $context .= "The user has the following data files available. When writing code, remember that the data will be loaded as `df` automatically.\n\n";

        foreach ($files as $file) {
            // Handle both array and object
            $name = is_array($file) ? $file['name'] : $file->name;
            $rowCount = is_array($file) ? ($file['row_count'] ?? 'unknown') : ($file->row_count ?? 'unknown');
            $columnCount = is_array($file) ? ($file['column_count'] ?? 'unknown') : ($file->column_count ?? 'unknown');
            $columnsMetadata = is_array($file) ? ($file['columns_metadata'] ?? []) : ($file->columns_metadata ?? []);
            $path = is_array($file) ? ($file['path'] ?? null) : ($file->path ?? null);

            $context .= "### File: {$name}\n";
            $context .= "- **Rows:** {$rowCount}\n";
            $context .= "- **Columns:** {$columnCount}\n\n";

            if (!empty($columnsMetadata)) {
                $context .= "**Column Details:**\n";
                $context .= "| Column | Type | Sample Values |\n";
                $context .= "|--------|------|---------------|\n";

                foreach ($columnsMetadata as $col) {
                    $colName = $col['name'] ?? 'unknown';
                    $colType = $col['type'] ?? 'unknown';
                    $samples = isset($col['sample_values']) ? implode(', ', array_slice($col['sample_values'], 0, 3)) : 'N/A';
                    $context .= "| {$colName} | {$colType} | {$samples} |\n";
                }
                $context .= "\n";
            }

            // Try to get a preview of the actual data
            if ($path) {
                $preview = $this->getDataPreview($path);
                if ($preview) {
                    $context .= "**Data Preview (first 5 rows):**\n```\n{$preview}\n```\n\n";
                }
            }
        }

        return $context;
    }

    /**
     * Get a preview of the CSV data
     */
    protected function getDataPreview(string $path, int $maxRows = 5): ?string
    {
        try {
            $fullPath = Storage::disk('local')->path($path);

            if (!file_exists($fullPath)) {
                return null;
            }

            $handle = fopen($fullPath, 'r');
            if ($handle === false) {
                return null;
            }

            $lines = [];
            $count = 0;

            while (($line = fgets($handle)) !== false && $count <= $maxRows) {
                $lines[] = rtrim($line);
                $count++;
            }

            fclose($handle);

            return implode("\n", $lines);
        } catch (\Exception $e) {
            Log::warning('Failed to get data preview', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Load a prompt template from file and replace variables
     *
     * @param string $promptName Name of the prompt file (without .md)
     * @param array $variables Variables to replace in the template
     * @return string The processed prompt
     */
    protected function loadPrompt(string $promptName, array $variables = []): string
    {
        $promptsPath = config('ai.prompts_path', resource_path('prompts'));
        $filePath = "{$promptsPath}/{$promptName}.md";

        if (!File::exists($filePath)) {
            Log::error("Prompt file not found: {$filePath}");
            throw new \RuntimeException("Prompt template '{$promptName}' not found");
        }

        $content = File::get($filePath);

        // Replace variables in the format {variable_name}
        foreach ($variables as $key => $value) {
            $content = str_replace("{{$key}}", $value, $content);
        }

        return $content;
    }

    /**
     * Parse Claude's response to extract thinking blocks and code
     */
    public function parseResponse(string $content): array
    {
        $thinking = null;
        $code = null;
        $language = null;
        $cleanContent = $content;

        // Extract thinking block (for non-streaming responses)
        if (preg_match('/<thinking>(.*?)<\/thinking>/s', $content, $matches)) {
            $thinking = trim($matches[1]);
            $cleanContent = preg_replace('/<thinking>.*?<\/thinking>/s', '', $cleanContent);
        }

        // Extract the last Python code block (most likely the main script)
        if (preg_match_all('/```(\w+)?\n(.*?)```/s', $cleanContent, $matches, PREG_SET_ORDER)) {
            foreach ($matches as $match) {
                $lang = strtolower($match[1] ?? 'python');
                $codeBlock = trim($match[2]);

                // Prioritize Python code blocks
                if ($lang === 'python') {
                    $language = 'python';
                    $code = $codeBlock;
                } elseif ($code === null) {
                    // Take any code block if we haven't found Python yet
                    $language = $lang ?: 'text';
                    $code = $codeBlock;
                }
            }
        }

        // Clean up extra whitespace
        $cleanContent = trim($cleanContent);

        return [
            'content' => $cleanContent,
            'thinking' => $thinking,
            'code' => $code,
            'language' => $language,
        ];
    }

    /**
     * Get list of available prompt templates
     */
    public function getAvailablePrompts(): array
    {
        $promptsPath = config('ai.prompts_path', resource_path('prompts'));

        if (!File::isDirectory($promptsPath)) {
            return [];
        }

        $files = File::files($promptsPath);

        return array_map(function ($file) {
            return pathinfo($file->getFilename(), PATHINFO_FILENAME);
        }, $files);
    }
}
