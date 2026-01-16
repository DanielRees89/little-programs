<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class FileParserService
{
    /**
     * Maximum rows to scan for metadata detection.
     */
    protected int $maxScanRows = 100;

    /**
     * Maximum rows to include in preview.
     */
    protected int $previewRows = 10;

    /**
     * Parse a CSV file and extract metadata.
     */
    public function parseCSV(string $path): array
    {
        $fullPath = Storage::disk('local')->path($path);
        
        if (!file_exists($fullPath)) {
            throw new \Exception("File not found: {$path}");
        }

        $handle = fopen($fullPath, 'r');
        if ($handle === false) {
            throw new \Exception("Could not open file: {$path}");
        }

        try {
            // Read header row
            $headers = fgetcsv($handle);
            if ($headers === false) {
                throw new \Exception("Could not read CSV headers");
            }

            // Clean headers (remove BOM if present)
            $headers[0] = preg_replace('/^\xEF\xBB\xBF/', '', $headers[0]);
            $headers = array_map('trim', $headers);

            $columnCount = count($headers);
            $rowCount = 0;
            $sampleData = [];
            $columnTypes = array_fill(0, $columnCount, []);

            // Scan rows for metadata
            while (($row = fgetcsv($handle)) !== false) {
                $rowCount++;
                
                // Collect sample data for first N rows
                if ($rowCount <= $this->maxScanRows) {
                    foreach ($row as $index => $value) {
                        if ($index < $columnCount) {
                            $columnTypes[$index][] = $this->detectType($value);
                        }
                    }
                }

                // Store preview rows
                if ($rowCount <= $this->previewRows) {
                    $sampleData[] = array_slice($row, 0, $columnCount);
                }
            }

            // Build columns metadata
            $columnsMetadata = [];
            foreach ($headers as $index => $header) {
                $types = $columnTypes[$index] ?? [];
                $columnsMetadata[] = [
                    'name' => $header,
                    'type' => $this->determinePrimaryType($types),
                    'sample_values' => array_slice(
                        array_column($sampleData, $index),
                        0,
                        3
                    ),
                ];
            }

            return [
                'row_count' => $rowCount,
                'column_count' => $columnCount,
                'columns_metadata' => $columnsMetadata,
                'preview_data' => [
                    'headers' => $headers,
                    'rows' => $sampleData,
                ],
            ];
        } finally {
            fclose($handle);
        }
    }

    /**
     * Get preview data for a file.
     */
    public function getPreview(string $path, int $maxRows = 10): array
    {
        $fullPath = Storage::disk('local')->path($path);
        
        if (!file_exists($fullPath)) {
            throw new \Exception("File not found: {$path}");
        }

        $handle = fopen($fullPath, 'r');
        if ($handle === false) {
            throw new \Exception("Could not open file: {$path}");
        }

        try {
            // Read header row
            $headers = fgetcsv($handle);
            if ($headers === false) {
                return ['headers' => [], 'rows' => []];
            }

            // Clean headers
            $headers[0] = preg_replace('/^\xEF\xBB\xBF/', '', $headers[0]);
            $headers = array_map('trim', $headers);

            $rows = [];
            $count = 0;
            while (($row = fgetcsv($handle)) !== false && $count < $maxRows) {
                $rows[] = $row;
                $count++;
            }

            return [
                'headers' => $headers,
                'rows' => $rows,
            ];
        } finally {
            fclose($handle);
        }
    }

    /**
     * Detect the type of a value.
     */
    protected function detectType(mixed $value): string
    {
        if ($value === null || $value === '') {
            return 'null';
        }

        $value = trim($value);

        // Check for boolean
        if (in_array(strtolower($value), ['true', 'false', 'yes', 'no', '1', '0'])) {
            return 'boolean';
        }

        // Check for integer
        if (preg_match('/^-?\d+$/', $value)) {
            return 'integer';
        }

        // Check for float/decimal
        if (preg_match('/^-?\d*\.\d+$/', $value) || preg_match('/^-?\d+\.\d*$/', $value)) {
            return 'float';
        }

        // Check for date patterns
        if (preg_match('/^\d{4}-\d{2}-\d{2}/', $value) || 
            preg_match('/^\d{2}\/\d{2}\/\d{4}/', $value)) {
            return 'date';
        }

        return 'string';
    }

    /**
     * Determine the primary type from a collection of detected types.
     */
    protected function determinePrimaryType(array $types): string
    {
        // Remove nulls for type determination
        $types = array_filter($types, fn($t) => $t !== 'null');
        
        if (empty($types)) {
            return 'string';
        }

        $counts = array_count_values($types);
        arsort($counts);
        
        return array_key_first($counts);
    }
}
