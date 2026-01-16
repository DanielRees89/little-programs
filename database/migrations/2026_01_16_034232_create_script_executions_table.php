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
        Schema::create('script_executions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('script_id')->nullable()->constrained()->nullOnDelete();
            $table->string('status')->default('pending'); // pending, running, completed, failed, cancelled
            $table->longText('output')->nullable(); // stdout
            $table->longText('error_output')->nullable(); // stderr
            $table->json('result_data')->nullable(); // Parsed results (charts, tables, stats)
            $table->unsignedInteger('duration')->nullable(); // Execution time in milliseconds
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            // Index for faster queries
            $table->index(['user_id', 'created_at']);
            $table->index(['status']);
        });

        // Pivot table for data files used in each execution
        Schema::create('data_file_script_execution', function (Blueprint $table) {
            $table->id();
            $table->foreignId('script_execution_id')->constrained()->cascadeOnDelete();
            $table->foreignId('data_file_id')->constrained()->cascadeOnDelete();
            $table->string('parameter_name')->nullable(); // Which file input this was assigned to
            $table->timestamps();

            // Prevent duplicate file assignments
            $table->unique(['script_execution_id', 'data_file_id', 'parameter_name'], 'execution_file_param_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('data_file_script_execution');
        Schema::dropIfExists('script_executions');
    }
};
