<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Carbon\Carbon;

class ScriptExecution extends Model
{
    use HasFactory;

    /**
     * Execution status constants.
     */
    const STATUS_PENDING = 'pending';
    const STATUS_RUNNING = 'running';
    const STATUS_COMPLETED = 'completed';
    const STATUS_FAILED = 'failed';
    const STATUS_CANCELLED = 'cancelled';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_id',
        'script_id',
        'status',
        'output',
        'error_output',
        'result_data',
        'duration',
        'started_at',
        'completed_at',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'result_data' => 'array',
        'duration' => 'integer',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    /**
     * Get the user that owns the execution.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the script that was executed.
     */
    public function script(): BelongsTo
    {
        return $this->belongsTo(Script::class);
    }

    /**
     * Get the data files used in this execution.
     */
    public function dataFiles(): BelongsToMany
    {
        return $this->belongsToMany(DataFile::class, 'data_file_script_execution')
            ->withPivot('parameter_name')
            ->withTimestamps();
    }

    /**
     * Mark the execution as running.
     */
    public function markAsRunning(): void
    {
        $this->update([
            'status' => self::STATUS_RUNNING,
            'started_at' => now(),
        ]);
        
        // Refresh to ensure started_at is a proper Carbon instance
        $this->refresh();
    }

    /**
     * Calculate duration in milliseconds from started_at to now.
     */
    protected function calculateDuration(): ?int
    {
        if (!$this->started_at) {
            return null;
        }

        $startedAt = $this->started_at instanceof Carbon 
            ? $this->started_at 
            : Carbon::parse($this->started_at);
        
        $now = now();
        
        // Calculate as absolute difference in milliseconds
        $diffMs = abs($now->diffInMilliseconds($startedAt));
        
        // Ensure it's a positive integer within MySQL unsigned int range
        return min((int) $diffMs, 4294967295);
    }

    /**
     * Mark the execution as completed.
     */
    public function markAsCompleted(string $output, ?array $resultData = null): void
    {
        $this->update([
            'status' => self::STATUS_COMPLETED,
            'output' => $output,
            'result_data' => $resultData,
            'completed_at' => now(),
            'duration' => $this->calculateDuration(),
        ]);
    }

    /**
     * Mark the execution as failed.
     */
    public function markAsFailed(string $errorOutput): void
    {
        // Truncate error output if too long for the database
        $maxLength = 65535; // TEXT column limit
        if (strlen($errorOutput) > $maxLength) {
            $errorOutput = substr($errorOutput, 0, $maxLength - 100) . "\n\n... [truncated]";
        }

        $this->update([
            'status' => self::STATUS_FAILED,
            'error_output' => $errorOutput,
            'completed_at' => now(),
            'duration' => $this->calculateDuration(),
        ]);
    }

    /**
     * Mark the execution as cancelled.
     */
    public function markAsCancelled(): void
    {
        $this->update([
            'status' => self::STATUS_CANCELLED,
            'completed_at' => now(),
            'duration' => $this->calculateDuration(),
        ]);
    }

    /**
     * Check if the execution is still running.
     */
    public function isRunning(): bool
    {
        return $this->status === self::STATUS_RUNNING;
    }

    /**
     * Check if the execution is complete (success or failure).
     */
    public function isComplete(): bool
    {
        return in_array($this->status, [
            self::STATUS_COMPLETED,
            self::STATUS_FAILED,
            self::STATUS_CANCELLED,
        ]);
    }

    /**
     * Check if the execution was successful.
     */
    public function isSuccessful(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    /**
     * Get formatted duration for display.
     */
    public function getFormattedDurationAttribute(): ?string
    {
        if (!$this->duration) {
            return null;
        }

        if ($this->duration < 1000) {
            return "{$this->duration}ms";
        }

        $seconds = round($this->duration / 1000, 2);
        if ($seconds < 60) {
            return "{$seconds}s";
        }

        $minutes = floor($seconds / 60);
        $remainingSeconds = round($seconds % 60);
        return "{$minutes}m {$remainingSeconds}s";
    }
}
