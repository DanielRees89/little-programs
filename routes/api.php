<?php

use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\DataFileController;
use App\Http\Controllers\Api\ExecutionController;
use App\Http\Controllers\Api\ScriptController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| These routes are loaded by the application and are assigned to the "api"
| middleware group. All routes here require authentication via web session.
|
*/

Route::middleware(['web', 'auth'])->group(function () {
    // Data Files
    Route::get('/files', [DataFileController::class, 'index']);
    Route::post('/files', [DataFileController::class, 'store']);
    Route::get('/files/{dataFile}', [DataFileController::class, 'show']);
    Route::delete('/files/{dataFile}', [DataFileController::class, 'destroy']);
    Route::get('/files/{dataFile}/download', [DataFileController::class, 'download']);

    // Scripts
    Route::get('/scripts', [ScriptController::class, 'index']);
    Route::post('/scripts', [ScriptController::class, 'store']);
    Route::get('/scripts/{script}', [ScriptController::class, 'show']);
    Route::put('/scripts/{script}', [ScriptController::class, 'update']);
    Route::delete('/scripts/{script}', [ScriptController::class, 'destroy']);

    // Chat Conversations
    Route::get('/chat/conversations', [ChatController::class, 'index']);
    Route::post('/chat/conversations', [ChatController::class, 'store']);
    Route::get('/chat/conversations/{conversation}', [ChatController::class, 'show']);
    Route::delete('/chat/conversations/{conversation}', [ChatController::class, 'destroy']);
    Route::post('/chat/conversations/{conversation}/messages', [ChatController::class, 'sendMessage']);
    Route::post('/chat/conversations/{conversation}/messages/stream', [ChatController::class, 'streamMessage']);
    
    // Chat Execution Files (for AI-generated files)
    Route::get('/chat/executions/{executionId}/files/{filename}', [ChatController::class, 'previewFile'])
        ->where('executionId', 'temp_[a-zA-Z0-9]+');
    Route::get('/chat/executions/{executionId}/files/{filename}/download', [ChatController::class, 'downloadFile'])
        ->where('executionId', 'temp_[a-zA-Z0-9]+');

    // Script Executions
    Route::get('/executions', [ExecutionController::class, 'index']);
    Route::post('/executions', [ExecutionController::class, 'store']);
    Route::get('/executions/{execution}', [ExecutionController::class, 'show']);
    Route::post('/executions/{execution}/cancel', [ExecutionController::class, 'cancel']);
    Route::get('/executions/{execution}/files/{filename}', [ExecutionController::class, 'getFile']);
    Route::get('/executions/{execution}/files/{filename}/download', [ExecutionController::class, 'downloadFile']);
});
