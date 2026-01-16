<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChatConversation extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_id',
        'title',
        'last_message_at',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'last_message_at' => 'datetime',
    ];

    /**
     * Get the user that owns the conversation.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the messages in the conversation.
     */
    public function messages(): HasMany
    {
        return $this->hasMany(ChatMessage::class)->orderBy('created_at', 'asc');
    }

    /**
     * Get the latest message.
     */
    public function latestMessage()
    {
        return $this->hasOne(ChatMessage::class)->latestOfMany();
    }

    /**
     * Update the last message timestamp.
     */
    public function touchLastMessage(): void
    {
        $this->update(['last_message_at' => now()]);
    }

    /**
     * Generate a title from the first user message.
     */
    public function generateTitle(): void
    {
        if ($this->title) {
            return;
        }

        $firstMessage = $this->messages()
            ->where('role', 'user')
            ->first();

        if ($firstMessage) {
            // Take first 50 characters of the message
            $title = \Str::limit($firstMessage->content, 50);
            $this->update(['title' => $title]);
        }
    }
}
