<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Script extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_id',
        'name',
        'description',
        'code',
        'language',
        'file_config',
        'run_count',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'file_config' => 'array',
        'run_count' => 'integer',
    ];

    /**
     * Get the user that owns the script.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the executions for the script.
     */
    public function executions(): HasMany
    {
        return $this->hasMany(ScriptExecution::class);
    }

    /**
     * Increment the run count.
     */
    public function incrementRunCount(): void
    {
        $this->increment('run_count');
    }
}
