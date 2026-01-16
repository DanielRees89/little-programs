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
        Schema::create('data_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name'); // Original filename
            $table->string('path'); // Storage path
            $table->unsignedBigInteger('size'); // File size in bytes
            $table->string('mime_type')->default('text/csv');
            $table->unsignedInteger('row_count')->nullable();
            $table->unsignedInteger('column_count')->nullable();
            $table->json('columns_metadata')->nullable(); // Column names, types, sample values
            $table->timestamps();

            // Index for faster queries
            $table->index(['user_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('data_files');
    }
};
