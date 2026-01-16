<?php

return [
    'default_model' => env('ANTHROPIC_MODEL', 'claude-sonnet-4-20250514'),

    'tokens' => [
        'default' => 4096,
        'extended' => 8000,
        'large' => 32000,
        'max_output' => 64000,
        'thinking_budget' => 32000,
    ],

    'temperature' => [
        'deterministic' => 0.1,
        'low' => 0.3,
        'medium' => 0.5,
        'creative' => 0.7,
    ],

    'prompts_path' => resource_path('prompts'),

    'streaming' => [
        'chunk_size' => 20,
        'delay_us' => 1500,
        'keepalive_interval' => 2.0,
    ],

    'agentic' => [
        'max_steps' => 10,
        'timeout_seconds' => 600,
        'python_timeout' => 120,
    ],
];
