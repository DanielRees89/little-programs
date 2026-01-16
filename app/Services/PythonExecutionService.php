<?php

namespace App\Services;

use App\Models\DataFile;
use App\Models\Script;
use App\Models\ScriptExecution;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PythonExecutionService
{
    /**
     * Execution timeout in seconds
     */
    protected int $timeout = 60;

    /**
     * Working directory for executions
     */
    protected string $executionsPath;

    public function __construct()
    {
        $this->executionsPath = storage_path('app/executions');
    }

    /**
     * Execute code directly without a ScriptExecution model
     * Used by AI agent tool for testing scripts
     *
     * @param string $code Python code to execute
     * @param array $dataFiles Array of ['path' => '/full/path/to/file.csv', 'name' => 'file.csv']
     * @return array ['success' => bool, 'output' => string, 'error' => string|null, 'charts' => array, 'files' => array]
     */
    public function executeCode(string $code, array $dataFiles = []): array
    {
        // Create a temporary execution directory
        $tempId = 'temp_' . Str::random(16);
        $executionDir = $this->prepareExecutionDirectory($tempId);

        try {
            // Prepare the Python script with file loading
            $preparedScript = $this->prepareScript($code, $dataFiles, $executionDir);
            $scriptPath = "{$executionDir}/script.py";
            file_put_contents($scriptPath, $preparedScript);

            Log::info('PythonExecutionService: Executing code directly', [
                'temp_id' => $tempId,
                'file_count' => count($dataFiles),
            ]);

            // Run the Python script
            $result = Process::path($executionDir)
                ->timeout($this->timeout)
                ->run("python3 {$scriptPath} 2>&1");

            $output = $result->output();
            $exitCode = $result->exitCode();

            Log::info('PythonExecutionService: Direct execution completed', [
                'temp_id' => $tempId,
                'exit_code' => $exitCode,
                'output_length' => strlen($output),
            ]);

            if ($exitCode === 0) {
                // Parse results (find generated files, etc.)
                $resultData = $this->parseResults($executionDir, $output);

                return [
                    'success' => true,
                    'output' => $output,
                    'error' => null,
                    'charts' => $resultData['charts'] ?? [],
                    'files' => $resultData['files'] ?? [],
                    'execution_dir' => $executionDir,
                ];
            } else {
                return [
                    'success' => false,
                    'output' => $output,
                    'error' => $output,
                    'charts' => [],
                    'files' => [],
                    'execution_dir' => $executionDir,
                ];
            }

        } catch (\Symfony\Component\Process\Exception\ProcessTimedOutException $e) {
            Log::warning('PythonExecutionService: Direct execution timed out', [
                'temp_id' => $tempId,
            ]);

            return [
                'success' => false,
                'output' => '',
                'error' => "Execution timed out after {$this->timeout} seconds",
                'charts' => [],
                'files' => [],
                'execution_dir' => $executionDir,
            ];

        } catch (\Exception $e) {
            Log::error('PythonExecutionService: Direct execution failed', [
                'temp_id' => $tempId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'output' => '',
                'error' => $e->getMessage(),
                'charts' => [],
                'files' => [],
                'execution_dir' => $executionDir ?? null,
            ];
        }
    }

    /**
     * Execute a script with the given data files
     */
    public function execute(ScriptExecution $execution, string $code, array $dataFiles): array
    {
        $executionDir = $this->prepareExecutionDirectory($execution->id);

        try {
            // Mark as running
            $execution->markAsRunning();

            // Prepare the Python script with file loading
            $preparedScript = $this->prepareScript($code, $dataFiles, $executionDir);
            $scriptPath = "{$executionDir}/script.py";
            file_put_contents($scriptPath, $preparedScript);

            Log::info('PythonExecutionService: Starting execution', [
                'execution_id' => $execution->id,
                'script_path' => $scriptPath,
                'file_count' => count($dataFiles),
            ]);

            // Run the Python script
            $result = Process::path($executionDir)
                ->timeout($this->timeout)
                ->run("python3 {$scriptPath} 2>&1");

            $output = $result->output();
            $exitCode = $result->exitCode();

            Log::info('PythonExecutionService: Execution completed', [
                'execution_id' => $execution->id,
                'exit_code' => $exitCode,
                'output_length' => strlen($output),
            ]);

            if ($exitCode === 0) {
                // Parse results (find generated files, etc.)
                $resultData = $this->parseResults($executionDir, $output);
                
                $execution->markAsCompleted($output, $resultData);

                return [
                    'success' => true,
                    'output' => $output,
                    'result_data' => $resultData,
                    'execution_id' => $execution->id,
                ];
            } else {
                $execution->markAsFailed($output);

                return [
                    'success' => false,
                    'error' => $output,
                    'execution_id' => $execution->id,
                ];
            }

        } catch (\Symfony\Component\Process\Exception\ProcessTimedOutException $e) {
            Log::warning('PythonExecutionService: Execution timed out', [
                'execution_id' => $execution->id,
            ]);

            $execution->markAsFailed("Execution timed out after {$this->timeout} seconds");

            return [
                'success' => false,
                'error' => "Execution timed out after {$this->timeout} seconds",
                'execution_id' => $execution->id,
            ];

        } catch (\Exception $e) {
            Log::error('PythonExecutionService: Execution failed', [
                'execution_id' => $execution->id,
                'error' => $e->getMessage(),
            ]);

            $execution->markAsFailed($e->getMessage());

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'execution_id' => $execution->id,
            ];
        }
    }

    /**
     * Prepare the execution directory
     */
    protected function prepareExecutionDirectory($executionId): string
    {
        $dir = "{$this->executionsPath}/{$executionId}";
        
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        return $dir;
    }

    /**
     * Prepare the Python script with imports and file loading
     */
    protected function prepareScript(string $code, array $dataFiles, string $executionDir): string
    {
        $imports = $this->getStandardImports();
        $fileLoading = $this->generateFileLoadingCode($dataFiles);
        $outputDir = "OUTPUT_DIR = '{$executionDir}'";

        // Check if the code already has imports
        $hasImports = preg_match('/^import\s|^from\s/m', $code);

        if ($hasImports) {
            // Insert file loading after imports but before main code
            // Find the last import line
            $lines = explode("\n", $code);
            $lastImportIndex = -1;
            
            foreach ($lines as $index => $line) {
                if (preg_match('/^import\s|^from\s/', trim($line))) {
                    $lastImportIndex = $index;
                }
            }

            if ($lastImportIndex >= 0) {
                // Insert after last import
                array_splice($lines, $lastImportIndex + 1, 0, [
                    '',
                    '# === Auto-injected setup ===',
                    $outputDir,
                    $fileLoading,
                    '# === End auto-injected setup ===',
                    '',
                ]);
                return implode("\n", $lines);
            }
        }

        // No imports found, prepend everything
        return <<<PYTHON
{$imports}

# === Auto-injected setup ===
{$outputDir}
{$fileLoading}
# === End auto-injected setup ===

{$code}
PYTHON;
    }

    /**
     * Get standard Python imports
     */
    protected function getStandardImports(): string
    {
        return <<<'PYTHON'
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

# Excel export
try:
    import openpyxl
    from openpyxl.styles import Font, PatternFill, Border, Side, Alignment
except ImportError:
    pass

# PDF export
try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import letter, A4, landscape
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch, cm
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image, PageBreak
except ImportError:
    pass
PYTHON;
    }

    /**
     * Generate code to load data files into DataFrames
     */
    protected function generateFileLoadingCode(array $dataFiles): string
    {
        if (empty($dataFiles)) {
            return "df = pd.DataFrame()  # No data file provided";
        }

        $code = "# Load data files\n";
        
        // First file is always 'df'
        $firstFile = array_shift($dataFiles);
        $path = $firstFile['path'] ?? $firstFile;
        $code .= "df = pd.read_csv('{$path}')\n";

        // Additional files get named variables
        foreach ($dataFiles as $index => $file) {
            $varName = "df" . ($index + 2);
            $path = $file['path'] ?? $file;
            $code .= "{$varName} = pd.read_csv('{$path}')\n";
        }

        return $code;
    }

    /**
     * Parse execution results to find generated files
     */
    protected function parseResults(string $executionDir, string $output): array
    {
        $results = [
            'charts' => [],
            'files' => [],
            'tables' => [],
            'stats' => [],
        ];

        // Find generated image files
        $imageExtensions = ['png', 'jpg', 'jpeg', 'svg', 'pdf'];
        foreach ($imageExtensions as $ext) {
            $pattern = "{$executionDir}/*.{$ext}";
            foreach (glob($pattern) as $file) {
                $filename = basename($file);
                if ($filename !== 'script.py') {
                    $results['charts'][] = [
                        'filename' => $filename,
                        'path' => $file,
                        'type' => $ext,
                        'size' => filesize($file),
                    ];
                }
            }
        }

        // Find generated data files
        $dataExtensions = ['csv', 'xlsx', 'xls', 'json'];
        foreach ($dataExtensions as $ext) {
            $pattern = "{$executionDir}/*.{$ext}";
            foreach (glob($pattern) as $file) {
                $filename = basename($file);
                $results['files'][] = [
                    'filename' => $filename,
                    'path' => $file,
                    'type' => $ext,
                    'size' => filesize($file),
                ];
            }
        }

        // Try to detect table output in stdout
        if (preg_match_all('/^\s*[\w]+\s+[\w]+.*$/m', $output, $matches)) {
            // Could be table data, but we'll leave parsing to the frontend
        }

        return $results;
    }

    /**
     * Get a generated file from an execution
     */
    public function getGeneratedFile($executionId, string $filename): ?string
    {
        $path = "{$this->executionsPath}/{$executionId}/{$filename}";
        
        if (file_exists($path) && is_file($path)) {
            return $path;
        }

        return null;
    }

    /**
     * Clean up old execution directories
     */
    public function cleanupOldExecutions(int $olderThanDays = 7): int
    {
        $cutoff = now()->subDays($olderThanDays)->timestamp;
        $cleaned = 0;

        if (!is_dir($this->executionsPath)) {
            return 0;
        }

        foreach (scandir($this->executionsPath) as $dir) {
            if ($dir === '.' || $dir === '..') {
                continue;
            }

            $path = "{$this->executionsPath}/{$dir}";
            if (is_dir($path) && filemtime($path) < $cutoff) {
                $this->deleteDirectory($path);
                $cleaned++;
            }
        }

        return $cleaned;
    }

    /**
     * Recursively delete a directory
     */
    protected function deleteDirectory(string $dir): void
    {
        if (!is_dir($dir)) {
            return;
        }

        $files = array_diff(scandir($dir), ['.', '..']);
        
        foreach ($files as $file) {
            $path = "{$dir}/{$file}";
            is_dir($path) ? $this->deleteDirectory($path) : unlink($path);
        }

        rmdir($dir);
    }

    /**
     * Set execution timeout
     */
    public function setTimeout(int $seconds): self
    {
        $this->timeout = $seconds;
        return $this;
    }
}
