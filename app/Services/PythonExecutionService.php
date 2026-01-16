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
    protected int $timeout = 60;
    protected string $executionsPath;
    protected string $sessionsPath;

    public function __construct()
    {
        $this->executionsPath = storage_path('app/executions');
        $this->sessionsPath = storage_path('app/sessions');
    }

    /**
     * Execute code directly without a ScriptExecution model
     */
    public function executeCode(string $code, array $dataFiles = [], ?string $sessionId = null): array
    {
        $tempId = 'temp_' . Str::random(16);
        $executionDir = $this->prepareExecutionDirectory($tempId);
        $sessionDir = $sessionId ? $this->getSessionDirectory($sessionId) : null;

        try {
            $originalDfNames = $this->getOriginalDataFrameNames(count($dataFiles));
            $preparedScript = $this->prepareScript($code, $dataFiles, $executionDir, $sessionDir, $originalDfNames);
            $scriptPath = "{$executionDir}/script.py";
            file_put_contents($scriptPath, $preparedScript);

            Log::info('PythonExecutionService: Executing code', [
                'temp_id' => $tempId,
                'file_count' => count($dataFiles),
                'session_id' => $sessionId,
            ]);

            $result = Process::path($executionDir)
                ->timeout($this->timeout)
                ->run("python3 {$scriptPath} 2>&1");

            $output = $result->output();
            $exitCode = $result->exitCode();

            Log::info('PythonExecutionService: Execution completed', [
                'temp_id' => $tempId,
                'exit_code' => $exitCode,
                'output_length' => strlen($output),
            ]);

            if ($exitCode === 0) {
                $resultData = $this->parseResults($executionDir, $output);
                return [
                    'success' => true,
                    'output' => $this->cleanOutput($output),
                    'error' => null,
                    'charts' => $resultData['charts'] ?? [],
                    'files' => $resultData['files'] ?? [],
                    'execution_dir' => $executionDir,
                ];
            } else {
                return [
                    'success' => false,
                    'output' => $output,
                    'error' => $this->cleanOutput($output),
                    'charts' => [],
                    'files' => [],
                    'execution_dir' => $executionDir,
                ];
            }
        } catch (\Symfony\Component\Process\Exception\ProcessTimedOutException $e) {
            Log::warning('PythonExecutionService: Execution timed out', ['temp_id' => $tempId]);
            return [
                'success' => false,
                'output' => '',
                'error' => "Execution timed out after {$this->timeout} seconds",
                'charts' => [],
                'files' => [],
                'execution_dir' => $executionDir,
            ];
        } catch (\Exception $e) {
            Log::error('PythonExecutionService: Execution failed', [
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
     * Execute a script with the given data files (ScriptExecution model version)
     */
    public function execute(ScriptExecution $execution, string $code, array $dataFiles): array
    {
        $executionDir = $this->prepareExecutionDirectory($execution->id);

        try {
            $execution->markAsRunning();
            $originalDfNames = $this->getOriginalDataFrameNames(count($dataFiles));
            $preparedScript = $this->prepareScript($code, $dataFiles, $executionDir, null, $originalDfNames);
            $scriptPath = "{$executionDir}/script.py";
            file_put_contents($scriptPath, $preparedScript);

            Log::info('PythonExecutionService: Starting execution', [
                'execution_id' => $execution->id,
                'file_count' => count($dataFiles),
            ]);

            $result = Process::path($executionDir)
                ->timeout($this->timeout)
                ->run("python3 {$scriptPath} 2>&1");

            $output = $result->output();
            $exitCode = $result->exitCode();

            if ($exitCode === 0) {
                $resultData = $this->parseResults($executionDir, $output);
                $execution->markAsCompleted($this->cleanOutput($output), $resultData);
                return [
                    'success' => true,
                    'output' => $this->cleanOutput($output),
                    'result_data' => $resultData,
                    'execution_id' => $execution->id,
                ];
            } else {
                $execution->markAsFailed($this->cleanOutput($output));
                return [
                    'success' => false,
                    'error' => $this->cleanOutput($output),
                    'execution_id' => $execution->id,
                ];
            }
        } catch (\Symfony\Component\Process\Exception\ProcessTimedOutException $e) {
            $execution->markAsFailed("Execution timed out after {$this->timeout} seconds");
            return [
                'success' => false,
                'error' => "Execution timed out after {$this->timeout} seconds",
                'execution_id' => $execution->id,
            ];
        } catch (\Exception $e) {
            $execution->markAsFailed($e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'execution_id' => $execution->id,
            ];
        }
    }

    protected function getSessionDirectory(string $sessionId): string
    {
        $dir = "{$this->sessionsPath}/{$sessionId}";
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        return $dir;
    }

    protected function getOriginalDataFrameNames(int $fileCount): array
    {
        if ($fileCount === 0) {
            return ['df'];
        }
        $names = ['df'];
        for ($i = 2; $i <= $fileCount; $i++) {
            $names[] = "df{$i}";
        }
        return $names;
    }

    protected function prepareExecutionDirectory($executionId): string
    {
        $dir = "{$this->executionsPath}/{$executionId}";
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        return $dir;
    }

    /**
     * Prepare the Python script - ALWAYS prepend our setup to ensure df is available
     */
    protected function prepareScript(
        string $code,
        array $dataFiles,
        string $executionDir,
        ?string $sessionDir,
        array $originalDfNames
    ): string {
        // Always start with our complete setup
        $setup = $this->getCompleteSetup($dataFiles, $executionDir, $sessionDir, $originalDfNames);
        
        // Remove any duplicate imports from user code to avoid conflicts
        $cleanedCode = $this->removeDuplicateImports($code);
        
        // Combine setup + user code
        $script = $setup . "\n\n# ========== USER CODE ==========\n\n" . $cleanedCode;
        
        // Add session save at the end if session is enabled
        if ($sessionDir) {
            $script .= "\n\n" . $this->generateSessionSaveCode($sessionDir, $originalDfNames);
        }
        
        return $script;
    }

    /**
     * Get complete setup code that's always prepended
     */
    protected function getCompleteSetup(
        array $dataFiles,
        string $executionDir,
        ?string $sessionDir,
        array $originalDfNames
    ): string {
        $imports = $this->getStandardImports();
        $outputDir = "OUTPUT_DIR = '{$executionDir}'";
        $fileLoading = $this->generateFileLoadingCode($dataFiles);
        $sessionRestore = $sessionDir ? $this->generateSessionRestoreCode($sessionDir, $originalDfNames) : '';

        return <<<PYTHON
# ========== AUTO-GENERATED SETUP (DO NOT MODIFY) ==========
{$imports}

{$outputDir}

{$fileLoading}
{$sessionRestore}
# ========== END SETUP ==========
PYTHON;
    }

    /**
     * Remove common imports from user code since we provide them
     * Uses specific patterns to avoid removing submodule imports we don't provide
     */
    protected function removeDuplicateImports(string $code): string
    {
        $lines = explode("\n", $code);
        $filteredLines = [];
        
        // More specific patterns - only remove exact imports we provide
        $skipPatterns = [
            // Pandas
            '/^import pandas\s*(as pd)?$/',
            '/^from pandas import/',
            
            // Numpy
            '/^import numpy\s*(as np)?$/',
            '/^from numpy import/',
            
            // Matplotlib - be specific about what we provide
            '/^import matplotlib$/',
            '/^import matplotlib\s*$/',
            '/^matplotlib\.use\s*\(/',
            '/^import matplotlib\.pyplot\s*(as plt)?/',
            '/^from matplotlib\.pyplot import/',
            '/^import matplotlib\.dates\s*(as mdates)?/',
            '/^from matplotlib\.dates import/',
            '/^import matplotlib\.patches\s*(as mpatches)?/',
            '/^from matplotlib\.patches import/',
            '/^import matplotlib\.patheffects/',
            '/^from matplotlib\.patheffects import/',
            
            // Seaborn
            '/^import seaborn\s*(as sns)?$/',
            '/^from seaborn import/',
            
            // Datetime
            '/^from datetime import/',
            '/^import datetime$/',
            
            // Warnings
            '/^import warnings$/',
            '/^warnings\.filterwarnings/',
            
            // Openpyxl - we provide these
            '/^import openpyxl/',
            '/^from openpyxl import/',
            '/^from openpyxl\./',
            
            // Reportlab - we provide these
            '/^from reportlab/',
            '/^import reportlab/',
            
            // OS
            '/^import os$/',
        ];
        
        foreach ($lines as $line) {
            $trimmedLine = trim($line);
            $skip = false;
            
            foreach ($skipPatterns as $pattern) {
                if (preg_match($pattern, $trimmedLine)) {
                    $skip = true;
                    break;
                }
            }
            
            if (!$skip) {
                $filteredLines[] = $line;
            }
        }
        
        // Remove leading blank lines
        while (!empty($filteredLines) && trim($filteredLines[0]) === '') {
            array_shift($filteredLines);
        }
        
        return implode("\n", $filteredLines);
    }

    /**
     * Generate code to restore DataFrames from session
     */
    protected function generateSessionRestoreCode(string $sessionDir, array $originalDfNames): string
    {
        $originalDfList = "'" . implode("', '", $originalDfNames) . "'";

        return <<<PYTHON
# Restore persisted variables from previous executions
_session_dir = '{$sessionDir}'
_original_dfs = [{$originalDfList}]
if os.path.exists(_session_dir):
    for _f in os.listdir(_session_dir):
        if _f.endswith('.pkl'):
            _var_name = _f[:-4]
            if _var_name not in _original_dfs and not _var_name.startswith('_'):
                try:
                    globals()[_var_name] = pd.read_pickle(os.path.join(_session_dir, _f))
                except Exception:
                    pass
PYTHON;
    }

    /**
     * Generate code to save DataFrames to session
     */
    protected function generateSessionSaveCode(string $sessionDir, array $originalDfNames): string
    {
        $originalDfList = "'" . implode("', '", $originalDfNames) . "'";

        return <<<PYTHON
# ========== AUTO-SAVE SESSION VARIABLES ==========
_session_dir = '{$sessionDir}'
_original_dfs = [{$originalDfList}]
os.makedirs(_session_dir, exist_ok=True)
for _var_name in list(globals().keys()):
    if _var_name.startswith('_'):
        continue
    if _var_name in _original_dfs:
        continue
    if _var_name in ['pd', 'np', 'plt', 'sns', 'os', 'datetime', 'timedelta', 'warnings', 'mpatches', 'patheffects']:
        continue
    _obj = globals()[_var_name]
    if isinstance(_obj, pd.DataFrame):
        try:
            _obj.to_pickle(os.path.join(_session_dir, f'{_var_name}.pkl'))
        except Exception:
            pass
PYTHON;
    }

    /**
     * Get standard Python imports - includes ALL commonly used matplotlib submodules
     */
    protected function getStandardImports(): string
    {
        return <<<'PYTHON'
import os
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import matplotlib.patches as mpatches
import matplotlib.patheffects as patheffects
from matplotlib.patches import FancyBboxPatch, Rectangle, Circle, Wedge, Polygon
from matplotlib.collections import PatchCollection
import seaborn as sns
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

# Set default style for better looking charts
plt.style.use('seaborn-v0_8-whitegrid')
sns.set_palette('husl')

# Excel support
try:
    import openpyxl
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill, Border, Side, Alignment, NamedStyle
    from openpyxl.utils.dataframe import dataframe_to_rows
    from openpyxl.chart import BarChart, LineChart, PieChart, Reference
    from openpyxl.formatting.rule import ColorScaleRule
except ImportError:
    pass

# PDF support
try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import letter, A4, landscape
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch, cm
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image, PageBreak
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
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
            return "# No data files provided\ndf = pd.DataFrame()";
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
     * Clean output by removing setup/teardown messages
     */
    protected function cleanOutput(string $output): string
    {
        // Remove lines that are clearly from our auto-generated code
        $lines = explode("\n", $output);
        $filtered = array_filter($lines, function ($line) {
            $trimmed = trim($line);
            if (str_starts_with($trimmed, '# ========== AUTO')) return false;
            if (str_starts_with($trimmed, '_session_dir')) return false;
            if (str_starts_with($trimmed, '_original_dfs')) return false;
            return true;
        });
        return trim(implode("\n", $filtered));
    }

    /**
     * Parse execution results to find generated files
     */
    protected function parseResults(string $executionDir, string $output): array
    {
        $results = [
            'charts' => [],
            'files' => [],
        ];

        // Find image files
        foreach (['png', 'jpg', 'jpeg', 'svg'] as $ext) {
            foreach (glob("{$executionDir}/*.{$ext}") as $file) {
                $filename = basename($file);
                $results['charts'][] = [
                    'filename' => $filename,
                    'path' => $file,
                    'type' => $ext,
                    'size' => filesize($file),
                ];
            }
        }

        // Find data/document files
        foreach (['csv', 'xlsx', 'xls', 'json', 'pdf'] as $ext) {
            foreach (glob("{$executionDir}/*.{$ext}") as $file) {
                $filename = basename($file);
                $results['files'][] = [
                    'filename' => $filename,
                    'path' => $file,
                    'type' => $ext,
                    'size' => filesize($file),
                ];
            }
        }

        return $results;
    }

    public function getGeneratedFile($executionId, string $filename): ?string
    {
        $path = "{$this->executionsPath}/{$executionId}/{$filename}";
        return (file_exists($path) && is_file($path)) ? $path : null;
    }

    public function clearSession(string $sessionId): bool
    {
        $sessionDir = "{$this->sessionsPath}/{$sessionId}";
        if (is_dir($sessionDir)) {
            $this->deleteDirectory($sessionDir);
            return true;
        }
        return false;
    }

    public function cleanupOldExecutions(int $olderThanDays = 7): int
    {
        return $this->cleanupOldDirectories($this->executionsPath, $olderThanDays);
    }

    public function cleanupOldSessions(int $olderThanDays = 30): int
    {
        return $this->cleanupOldDirectories($this->sessionsPath, $olderThanDays);
    }

    protected function cleanupOldDirectories(string $basePath, int $olderThanDays): int
    {
        $cutoff = now()->subDays($olderThanDays)->timestamp;
        $cleaned = 0;

        if (!is_dir($basePath)) return 0;

        foreach (scandir($basePath) as $dir) {
            if ($dir === '.' || $dir === '..') continue;
            $path = "{$basePath}/{$dir}";
            if (is_dir($path) && filemtime($path) < $cutoff) {
                $this->deleteDirectory($path);
                $cleaned++;
            }
        }
        return $cleaned;
    }

    protected function deleteDirectory(string $dir): void
    {
        if (!is_dir($dir)) return;
        foreach (array_diff(scandir($dir), ['.', '..']) as $file) {
            $path = "{$dir}/{$file}";
            is_dir($path) ? $this->deleteDirectory($path) : unlink($path);
        }
        rmdir($dir);
    }

    public function setTimeout(int $seconds): self
    {
        $this->timeout = $seconds;
        return $this;
    }
}
