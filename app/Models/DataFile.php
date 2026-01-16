<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Facades\Storage;

class DataFile extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_id',
        'name',
        'path',
        'size',
        'mime_type',
        'row_count',
        'column_count',
        'columns_metadata',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'size' => 'integer',
        'row_count' => 'integer',
        'column_count' => 'integer',
        'columns_metadata' => 'array',
    ];

    /**
     * Get the user that owns the file.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the executions that used this file.
     */
    public function executions(): BelongsToMany
    {
        return $this->belongsToMany(ScriptExecution::class, 'data_file_script_execution')
            ->withPivot('parameter_name')
            ->withTimestamps();
    }

    /**
     * Get the full storage path.
     */
    public function getFullPathAttribute(): string
    {
        return Storage::disk('local')->path($this->path);
    }

    /**
     * Get human-readable file size.
     */
    public function getFormattedSizeAttribute(): string
    {
        $bytes = $this->size;
        $units = ['B', 'KB', 'MB', 'GB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, 2) . ' ' . $units[$i];
    }

    /**
     * Delete the file from storage when model is deleted.
     */
    protected static function booted(): void
    {
        static::deleting(function (DataFile $file) {
            Storage::disk('local')->delete($file->path);
        });
    }
}
