<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('chat_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chat_conversation_id')->constrained()->cascadeOnDelete();
            $table->string('role'); // 'user' or 'assistant'
            $table->longText('content'); // Main message content
            $table->longText('thinking')->nullable(); // AI thinking/reasoning block
            $table->longText('code')->nullable(); // Extracted code block
            $table->string('language')->nullable(); // Code language (python, etc.)
            $table->json('metadata')->nullable(); // Additional data (tokens used, model, etc.)
            $table->timestamps();

            // Index for faster queries
            $table->index(['chat_conversation_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chat_messages');
    }
};
