import { useReducer, useRef, useEffect, useCallback } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { EmptyState } from '@/Components/UI';
import { ChatMessage, ChatInput, SaveScriptModal, ResultsPanel } from '@/Components/Chat';

// ============================================================================
// State Management with useReducer
// ============================================================================

const initialState = {
    conversation: null,
    messages: [],
    loading: { isLoading: false, status: '' },
    error: null,
    saveModal: { isOpen: false, code: '', language: 'python' },
    results: { show: false, items: [] },
    streaming: {
        message: null,
        thinking: '',
        content: '',
        executions: [],
    },
};

const ActionTypes = {
    SET_CONVERSATION: 'SET_CONVERSATION',
    SET_MESSAGES: 'SET_MESSAGES',
    ADD_MESSAGE: 'ADD_MESSAGE',
    UPDATE_MESSAGE: 'UPDATE_MESSAGE',
    REMOVE_MESSAGE: 'REMOVE_MESSAGE',
    FINALIZE_MESSAGES: 'FINALIZE_MESSAGES',
    SET_LOADING: 'SET_LOADING',
    SET_ERROR: 'SET_ERROR',
    CLEAR_ERROR: 'CLEAR_ERROR',
    OPEN_SAVE_MODAL: 'OPEN_SAVE_MODAL',
    CLOSE_SAVE_MODAL: 'CLOSE_SAVE_MODAL',
    SET_RESULTS: 'SET_RESULTS',
    SHOW_RESULTS: 'SHOW_RESULTS',
    HIDE_RESULTS: 'HIDE_RESULTS',
    START_STREAMING: 'START_STREAMING',
    UPDATE_STREAMING_THINKING: 'UPDATE_STREAMING_THINKING',
    UPDATE_STREAMING_CONTENT: 'UPDATE_STREAMING_CONTENT',
    ADD_STREAMING_EXECUTION: 'ADD_STREAMING_EXECUTION',
    UPDATE_STREAMING_EXECUTION: 'UPDATE_STREAMING_EXECUTION',
    RESET_STREAMING: 'RESET_STREAMING',
    LOAD_CONVERSATION: 'LOAD_CONVERSATION',
};

function chatReducer(state, action) {
    switch (action.type) {
        case ActionTypes.SET_CONVERSATION:
            return { ...state, conversation: action.payload };

        case ActionTypes.SET_MESSAGES:
            return { ...state, messages: action.payload };

        case ActionTypes.ADD_MESSAGE:
            return { ...state, messages: [...state.messages, action.payload] };

        case ActionTypes.UPDATE_MESSAGE:
            return {
                ...state,
                messages: state.messages.map(m =>
                    m.id === action.payload.id ? { ...m, ...action.payload.updates } : m
                ),
            };

        case ActionTypes.REMOVE_MESSAGE:
            return {
                ...state,
                messages: state.messages.filter(m => m.id !== action.payload),
            };

        case ActionTypes.FINALIZE_MESSAGES: {
            const { tempId, userMessage, assistantMessage } = action.payload;
            const filtered = state.messages.filter(m => m.id !== tempId);
            return {
                ...state,
                messages: [...filtered, userMessage, assistantMessage],
            };
        }

        case ActionTypes.SET_LOADING:
            return {
                ...state,
                loading: { ...state.loading, ...action.payload },
            };

        case ActionTypes.SET_ERROR:
            return { ...state, error: action.payload };

        case ActionTypes.CLEAR_ERROR:
            return { ...state, error: null };

        case ActionTypes.OPEN_SAVE_MODAL:
            return {
                ...state,
                saveModal: { isOpen: true, ...action.payload },
            };

        case ActionTypes.CLOSE_SAVE_MODAL:
            return {
                ...state,
                saveModal: { isOpen: false, code: '', language: 'python' },
            };

        case ActionTypes.SET_RESULTS:
            return {
                ...state,
                results: { ...state.results, items: action.payload },
            };

        case ActionTypes.SHOW_RESULTS:
            return {
                ...state,
                results: { ...state.results, show: true },
            };

        case ActionTypes.HIDE_RESULTS:
            return {
                ...state,
                results: { ...state.results, show: false },
            };

        case ActionTypes.START_STREAMING:
            return {
                ...state,
                streaming: {
                    message: action.payload,
                    thinking: '',
                    content: '',
                    executions: [],
                },
            };

        case ActionTypes.UPDATE_STREAMING_THINKING:
            return {
                ...state,
                streaming: { ...state.streaming, thinking: action.payload },
            };

        case ActionTypes.UPDATE_STREAMING_CONTENT:
            return {
                ...state,
                streaming: {
                    ...state.streaming,
                    content: state.streaming.content + action.payload,
                },
            };

        case ActionTypes.ADD_STREAMING_EXECUTION:
            return {
                ...state,
                streaming: {
                    ...state.streaming,
                    executions: [...state.streaming.executions, action.payload],
                },
            };

        case ActionTypes.UPDATE_STREAMING_EXECUTION: {
            const executions = [...state.streaming.executions];
            const lastIdx = executions.length - 1;
            if (lastIdx >= 0) {
                executions[lastIdx] = { ...executions[lastIdx], ...action.payload };
            }
            return {
                ...state,
                streaming: { ...state.streaming, executions },
                results: {
                    ...state.results,
                    items: executions.filter(e => e.status === 'complete'),
                },
            };
        }

        case ActionTypes.RESET_STREAMING:
            return {
                ...state,
                streaming: {
                    message: null,
                    thinking: '',
                    content: '',
                    executions: [],
                },
            };

        case ActionTypes.LOAD_CONVERSATION:
            return {
                ...state,
                conversation: action.payload.conversation,
                messages: [],
                error: null,
                streaming: initialState.streaming,
                results: { show: false, items: [] },
            };

        default:
            return state;
    }
}

// ============================================================================
// Main Component
// ============================================================================

export default function ChatIndex({ conversation: initialConversation = null }) {
    const { chatConversations } = usePage().props;
    const [state, dispatch] = useReducer(chatReducer, {
        ...initialState,
        conversation: initialConversation,
    });

    const messagesEndRef = useRef(null);
    const abortControllerRef = useRef(null);

    // Destructure state for easier access
    const {
        conversation,
        messages,
        loading,
        error,
        saveModal,
        results,
        streaming,
    } = state;

    // ========================================================================
    // Effects
    // ========================================================================

    // Cleanup abort controller on unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    // Load conversation from URL or initial prop
    useEffect(() => {
        if (initialConversation) {
            loadConversation(initialConversation);
        }
    }, [initialConversation?.id]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading.isLoading, streaming.content, streaming.thinking, streaming.executions]);

    // Open results panel when we get results with files
    useEffect(() => {
        if (results.items.length > 0) {
            const hasFiles = results.items.some(r =>
                (r.charts && r.charts.length > 0) || (r.files && r.files.length > 0)
            );
            if (hasFiles) {
                dispatch({ type: ActionTypes.SHOW_RESULTS });
            }
        }
    }, [results.items]);

    // ========================================================================
    // API Functions
    // ========================================================================

    const createConversation = async () => {
        try {
            const response = await fetch('/api/chat/conversations', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                },
                credentials: 'same-origin',
            });

            if (!response.ok) throw new Error('Failed to create conversation');

            const data = await response.json();
            dispatch({ type: ActionTypes.SET_CONVERSATION, payload: data.conversation });
            router.reload({ only: ['chatConversations'] });
            return data.conversation;
        } catch (err) {
            console.error('Error creating conversation:', err);
            dispatch({ type: ActionTypes.SET_ERROR, payload: 'Failed to start conversation' });
            return null;
        }
    };

    const uploadFile = async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/files', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                'Accept': 'application/json',
            },
            credentials: 'same-origin',
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Upload failed');
        }

        return (await response.json()).file;
    };

    const loadConversation = async (conv) => {
        dispatch({ type: ActionTypes.LOAD_CONVERSATION, payload: { conversation: conv } });

        try {
            const response = await fetch(`/api/chat/conversations/${conv.id}`, {
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                },
                credentials: 'same-origin',
            });

            if (!response.ok) throw new Error('Failed to load conversation');

            const data = await response.json();
            dispatch({ type: ActionTypes.SET_MESSAGES, payload: data.messages || [] });

            const lastAgenticMessage = [...(data.messages || [])].reverse().find(m =>
                m.role === 'assistant' && m.metadata?.execution_results?.length > 0
            );
            if (lastAgenticMessage?.metadata?.execution_results) {
                dispatch({ type: ActionTypes.SET_RESULTS, payload: lastAgenticMessage.metadata.execution_results });
            }
        } catch (err) {
            console.error('Error loading conversation:', err);
            dispatch({ type: ActionTypes.SET_ERROR, payload: 'Failed to load conversation' });
        }
    };

    // ========================================================================
    // Event Handlers
    // ========================================================================

    const handleSend = useCallback(async (content, attachedFiles = []) => {
        dispatch({ type: ActionTypes.CLEAR_ERROR });

        let conv = conversation;
        if (!conv) {
            conv = await createConversation();
            if (!conv) return;
        }

        const userMessage = {
            id: `temp-${Date.now()}`,
            role: 'user',
            content,
            created_at: new Date().toISOString(),
            metadata: attachedFiles.length > 0 ? {
                attached_files: attachedFiles.map(f => ({
                    name: f.name,
                    size: f.size,
                    type: f.type,
                })),
            } : null,
        };

        dispatch({ type: ActionTypes.ADD_MESSAGE, payload: userMessage });
        dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: true, status: '' } });
        dispatch({ type: ActionTypes.RESET_STREAMING });

        try {
            let fileIds = [];
            if (attachedFiles.length > 0) {
                dispatch({ type: ActionTypes.SET_LOADING, payload: { status: 'Uploading files...' } });
                const uploadedFiles = await Promise.all(attachedFiles.map(uploadFile));
                fileIds = uploadedFiles.map(f => f.id);

                dispatch({
                    type: ActionTypes.UPDATE_MESSAGE,
                    payload: {
                        id: userMessage.id,
                        updates: {
                            metadata: {
                                attached_files: uploadedFiles.map(f => ({
                                    id: f.id,
                                    name: f.name,
                                    size: f.size,
                                })),
                            },
                        },
                    },
                });
            }

            dispatch({ type: ActionTypes.SET_LOADING, payload: { status: 'Thinking...' } });
            await sendStreamingMessage(conv.id, content, fileIds, userMessage.id);
            router.reload({ only: ['chatConversations'] });
        } catch (err) {
            console.error('Error sending message:', err);
            dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false, status: '' } });
            dispatch({ type: ActionTypes.RESET_STREAMING });
            dispatch({ type: ActionTypes.SET_ERROR, payload: err.message || 'Failed to get response' });
            dispatch({ type: ActionTypes.REMOVE_MESSAGE, payload: userMessage.id });
        }
    }, [conversation]);

    const sendStreamingMessage = async (conversationId, content, fileIds, tempUserMessageId) => {
        // Cancel any existing stream
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();
        const { signal } = abortControllerRef.current;

        return new Promise((resolve, reject) => {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;

            fetch(`/api/chat/conversations/${conversationId}/messages/stream`, {
                method: 'POST',
                headers: {
                    'Accept': 'text/event-stream',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                credentials: 'same-origin',
                signal,
                body: JSON.stringify({
                    message: content,
                    file_ids: fileIds.length > 0 ? fileIds : undefined,
                }),
            }).then(async response => {
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || errorData.message || 'Stream request failed');
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();

                let currentThinking = '';
                let currentContent = '';
                let currentExecutions = [];
                let buffer = '';
                let finalMessage = null;

                const streamingMsgId = `streaming-${Date.now()}`;
                dispatch({
                    type: ActionTypes.START_STREAMING,
                    payload: {
                        id: streamingMsgId,
                        role: 'assistant',
                        content: '',
                        thinking: '',
                        created_at: new Date().toISOString(),
                    },
                });

                const processEvent = (eventType, data) => {
                    switch (eventType) {
                        case 'thinking':
                            currentThinking = data.full || data.content || '';
                            dispatch({ type: ActionTypes.UPDATE_STREAMING_THINKING, payload: currentThinking });
                            dispatch({ type: ActionTypes.SET_LOADING, payload: { status: 'Thinking...' } });
                            break;

                        case 'tool_call':
                            dispatch({ type: ActionTypes.SET_LOADING, payload: { status: `Running Python (step ${data.step || 1})...` } });
                            const newExec = { code: data.code, status: 'running', step: data.step };
                            currentExecutions = [...currentExecutions, newExec];
                            dispatch({ type: ActionTypes.ADD_STREAMING_EXECUTION, payload: newExec });
                            break;

                        case 'tool_result':
                            const execUpdate = {
                                status: 'complete',
                                success: data.success,
                                output: data.output,
                                error: data.error,
                                charts: data.charts || [],
                                files: data.files || [],
                                execution_id: data.execution_id,
                            };
                            const lastIdx = currentExecutions.length - 1;
                            if (lastIdx >= 0) {
                                currentExecutions[lastIdx] = { ...currentExecutions[lastIdx], ...execUpdate };
                            }
                            dispatch({ type: ActionTypes.UPDATE_STREAMING_EXECUTION, payload: execUpdate });

                            if (data.success) {
                                dispatch({ type: ActionTypes.SET_LOADING, payload: { status: 'Code executed successfully' } });
                            } else {
                                dispatch({ type: ActionTypes.SET_LOADING, payload: { status: 'Code failed, AI is fixing...' } });
                            }
                            break;

                        case 'text_delta':
                            const delta = data.delta || '';
                            currentContent += delta;
                            dispatch({ type: ActionTypes.UPDATE_STREAMING_CONTENT, payload: delta });
                            dispatch({ type: ActionTypes.SET_LOADING, payload: { status: '' } });
                            break;

                        case 'complete':
                            finalMessage = data.assistant_message;
                            break;

                        case 'error':
                            throw new Error(data.message || 'Stream error');

                        case 'done':
                            break;
                    }
                };

                const processLine = (line) => {
                    if (line.startsWith('event:')) {
                        buffer = line.slice(6).trim();
                        return;
                    }

                    if (line.startsWith('data:')) {
                        const jsonStr = line.slice(5).trim();
                        if (!jsonStr || jsonStr === '[DONE]') return;

                        try {
                            const data = JSON.parse(jsonStr);
                            const eventType = buffer || data.type || 'unknown';
                            processEvent(eventType, data);
                            buffer = '';
                        } catch (e) {
                            if (!(e instanceof SyntaxError)) {
                                console.error('Error processing stream event:', e);
                            }
                        }
                    }
                };

                const processStream = async () => {
                    let lineBuffer = '';

                    try {
                        while (true) {
                            const { done, value } = await reader.read();
                            if (done) break;

                            lineBuffer += decoder.decode(value, { stream: true });
                            const lines = lineBuffer.split('\n');
                            lineBuffer = lines.pop() || '';

                            for (const line of lines) {
                                const trimmed = line.trim();
                                if (trimmed) processLine(trimmed);
                            }
                        }

                        if (lineBuffer.trim()) {
                            processLine(lineBuffer.trim());
                        }
                    } finally {
                        dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false, status: '' } });

                        const message = finalMessage || {
                            id: streamingMsgId,
                            role: 'assistant',
                            content: currentContent,
                            thinking: currentThinking || null,
                            code: extractCode(currentContent),
                            language: 'python',
                            created_at: new Date().toISOString(),
                            metadata: {
                                execution_results: currentExecutions.filter(e => e.status === 'complete'),
                                had_tool_calls: currentExecutions.length > 0,
                            },
                        };

                        if (message.metadata?.execution_results) {
                            dispatch({ type: ActionTypes.SET_RESULTS, payload: message.metadata.execution_results });
                        }

                        dispatch({
                            type: ActionTypes.FINALIZE_MESSAGES,
                            payload: {
                                tempId: tempUserMessageId,
                                userMessage: {
                                    ...messages.find(m => m.id === tempUserMessageId),
                                    id: `user-${Date.now()}`,
                                },
                                assistantMessage: message,
                            },
                        });

                        dispatch({ type: ActionTypes.RESET_STREAMING });
                        resolve();
                    }
                };

                processStream();
            }).catch(error => {
                if (error.name === 'AbortError') {
                    resolve();
                    return;
                }
                dispatch({ type: ActionTypes.SET_LOADING, payload: { isLoading: false, status: '' } });
                dispatch({ type: ActionTypes.RESET_STREAMING });
                reject(error);
            });
        });
    };

    const extractCode = (content) => {
        // Extract all Python code blocks, not just the first one
        const matches = content.matchAll(/```python\n([\s\S]*?)```/g);
        const codeBlocks = Array.from(matches).map(m => m[1].trim());
        return codeBlocks.length > 0 ? codeBlocks.join('\n\n# ---\n\n') : null;
    };

    const handleSaveScript = useCallback((message) => {
        let code = message.code;
        if (!code && message.metadata?.execution_results?.length > 0) {
            const lastSuccess = [...message.metadata.execution_results]
                .reverse()
                .find(e => e.success);
            code = lastSuccess?.code;
        }

        if (code) {
            dispatch({
                type: ActionTypes.OPEN_SAVE_MODAL,
                payload: { code, language: message.language || 'python' },
            });
        }
    }, []);

    const handleSaveToLibrary = async (scriptData) => {
        try {
            const response = await fetch('/api/scripts', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                },
                credentials: 'same-origin',
                body: JSON.stringify(scriptData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to save script');
            }

            dispatch({ type: ActionTypes.CLOSE_SAVE_MODAL });
        } catch (err) {
            console.error('Error saving script:', err);
            throw err;
        }
    };

    const handleViewResults = useCallback((executionResults) => {
        dispatch({ type: ActionTypes.SET_RESULTS, payload: executionResults });
        dispatch({ type: ActionTypes.SHOW_RESULTS });
    }, []);

    // ========================================================================
    // Derived State
    // ========================================================================

    const suggestions = [
        "Analyze the distribution of values in my data",
        "Find and visualize outliers",
        "Create a summary report with charts",
        "Export my analysis to Excel",
    ];

    const displayStreamingMessage = streaming.message ? {
        ...streaming.message,
        thinking: streaming.thinking || null,
        content: streaming.content || '',
        metadata: { execution_results: streaming.executions },
    } : null;

    const hasResultFiles = results.items.some(r =>
        (r.charts && r.charts.length > 0) || (r.files && r.files.length > 0)
    );

    // ========================================================================
    // Render
    // ========================================================================

    return (
        <AppLayout title="Chat" currentConversationId={conversation?.id}>
            <Head title="Chat" />

            <div className="h-[calc(100vh-8rem)] flex">
                {/* Main chat area */}
                <div className={`flex-1 flex flex-col min-w-0 bg-white rounded-lg border border-paper-200 ${results.show && hasResultFiles ? 'lg:mr-4' : ''}`}>
                    {error && (
                        <div className="flex-shrink-0 mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center justify-between">
                            <span>{error}</span>
                            <button
                                onClick={() => dispatch({ type: ActionTypes.CLEAR_ERROR })}
                                className="ml-2 text-red-500 hover:text-red-700 font-bold"
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto">
                        <div className="max-w-3xl mx-auto px-4 py-6">
                            {messages.length === 0 && !loading.isLoading && !displayStreamingMessage ? (
                                <div className="h-full min-h-[400px] flex items-center justify-center">
                                    <EmptyState
                                        illustration="chat"
                                        title="Start a conversation"
                                        description="Describe your data and what you want to learn. Attach CSV files to give context."
                                        action={
                                            <div className="text-center">
                                                <p className="text-paper-400 text-sm mb-4">Try something like:</p>
                                                <div className="flex flex-wrap gap-2 justify-center max-w-md">
                                                    {suggestions.map((suggestion) => (
                                                        <button
                                                            key={suggestion}
                                                            onClick={() => handleSend(suggestion)}
                                                            className="px-3 py-1.5 bg-paper-100 hover:bg-paper-200 text-paper-600 text-sm rounded-full transition-colors"
                                                        >
                                                            {suggestion}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        }
                                    />
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {messages.map((message) => (
                                        <ChatMessage
                                            key={message.id}
                                            message={message}
                                            onSaveScript={
                                                (message.code || message.metadata?.execution_results?.some(e => e.code))
                                                    ? () => handleSaveScript(message)
                                                    : null
                                            }
                                            onViewResults={
                                                message.metadata?.execution_results?.some(r => r.charts?.length > 0 || r.files?.length > 0)
                                                    ? () => handleViewResults(message.metadata.execution_results)
                                                    : null
                                            }
                                        />
                                    ))}

                                    {displayStreamingMessage && (
                                        <ChatMessage
                                            key="streaming"
                                            message={displayStreamingMessage}
                                            isStreaming={true}
                                        />
                                    )}

                                    {loading.isLoading && !displayStreamingMessage && (
                                        <LoadingIndicator status={loading.status} />
                                    )}

                                    {loading.isLoading && displayStreamingMessage && loading.status && (
                                        <div className="flex items-center gap-2 text-sm text-paper-500 ml-12">
                                            <div className="w-4 h-4 border-2 border-punch-200 border-t-punch-500 rounded-full animate-spin" />
                                            {loading.status}
                                        </div>
                                    )}

                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-shrink-0 border-t border-paper-200 bg-paper-50 rounded-b-lg">
                        <div className="max-w-3xl mx-auto px-4 py-4">
                            <ChatInput
                                onSend={handleSend}
                                disabled={loading.isLoading}
                                placeholder="Describe what you want to analyze..."
                            />
                        </div>
                    </div>
                </div>

                {/* Results panel */}
                {hasResultFiles && (
                    <div className={`hidden lg:block lg:w-96 lg:flex-shrink-0 transition-all duration-300 ${
                        results.show ? 'lg:opacity-100' : 'lg:opacity-0 lg:w-0 lg:overflow-hidden'
                    }`}>
                        <ResultsPanel
                            results={results.items}
                            isVisible={results.show}
                            onClose={() => dispatch({ type: ActionTypes.HIDE_RESULTS })}
                        />
                    </div>
                )}

                {/* Mobile results button */}
                {hasResultFiles && !results.show && (
                    <button
                        onClick={() => dispatch({ type: ActionTypes.SHOW_RESULTS })}
                        className="lg:hidden fixed bottom-24 right-4 z-30 bg-punch-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
                    >
                        <ChartIcon className="w-5 h-5" />
                        View Results
                    </button>
                )}
            </div>

            <SaveScriptModal
                isOpen={saveModal.isOpen}
                onClose={() => dispatch({ type: ActionTypes.CLOSE_SAVE_MODAL })}
                code={saveModal.code}
                language={saveModal.language}
                onSave={handleSaveToLibrary}
            />
        </AppLayout>
    );
}

// ============================================================================
// Helper Components
// ============================================================================

function LoadingIndicator({ status }) {
    return (
        <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-punch-100 flex items-center justify-center flex-shrink-0">
                <SparkleIcon className="w-4 h-4 text-punch-500" />
            </div>
            <div className="flex-1">
                <div className="bg-paper-50 rounded-lg p-4 border border-paper-200">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-5 h-5 border-2 border-punch-200 border-t-punch-500 rounded-full animate-spin" />
                        </div>
                        <div className="flex-1">
                            <p className="text-paper-700 text-sm font-medium">
                                {status || 'Thinking...'}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-1 mt-3">
                        <div className="w-2 h-2 bg-punch-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-punch-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-punch-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function SparkleIcon({ className }) {
    return (
        <svg className={className} fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zm0 13a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zm-7-5a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 013 10zm13 0a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 0116 10z" />
        </svg>
    );
}

function ChartIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
    );
}
