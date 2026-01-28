import { useState, useRef, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { EmptyState } from '@/Components/UI';
import { ChatMessage, ChatInput, SaveScriptModal, ResultsPanel } from '@/Components/Chat';

export default function ChatIndex({ conversation: initialConversation = null }) {
    const { chatConversations } = usePage().props;
    const [currentConversation, setCurrentConversation] = useState(initialConversation);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState('');
    const [error, setError] = useState(null);
    const [saveModal, setSaveModal] = useState({ isOpen: false, code: '', language: 'python' });
    
    // Results panel state
    const [showResults, setShowResults] = useState(false);
    const [currentResults, setCurrentResults] = useState([]);
    
    // Streaming state
    const [streamingMessage, setStreamingMessage] = useState(null);
    const [streamingThinking, setStreamingThinking] = useState('');
    const [streamingContent, setStreamingContent] = useState('');
    const [streamingExecutions, setStreamingExecutions] = useState([]);
    
    const messagesEndRef = useRef(null);
    const abortControllerRef = useRef(null);

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
    }, [messages, isLoading, streamingContent, streamingThinking, streamingExecutions]);

    // Open results panel when we get results with files
    useEffect(() => {
        if (currentResults.length > 0) {
            const hasFiles = currentResults.some(r => 
                (r.charts && r.charts.length > 0) || (r.files && r.files.length > 0)
            );
            if (hasFiles) {
                setShowResults(true);
            }
        }
    }, [currentResults]);

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
            setCurrentConversation(data.conversation);
            
            // Refresh the page to update sidebar conversations
            router.reload({ only: ['chatConversations'] });
            
            return data.conversation;
        } catch (err) {
            console.error('Error creating conversation:', err);
            setError('Failed to start conversation');
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

    const handleSend = async (content, attachedFiles = []) => {
        setError(null);

        let conversation = currentConversation;
        if (!conversation) {
            conversation = await createConversation();
            if (!conversation) return;
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
                    type: f.type 
                }))
            } : null,
        };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);
        setLoadingStatus('');
        
        // Reset all streaming state
        setStreamingMessage(null);
        setStreamingThinking('');
        setStreamingContent('');
        setStreamingExecutions([]);

        try {
            let fileIds = [];
            let uploadedFileInfo = [];
            if (attachedFiles.length > 0) {
                setLoadingStatus('Uploading files...');
                const uploadPromises = attachedFiles.map(file => uploadFile(file));
                const uploadedFiles = await Promise.all(uploadPromises);
                fileIds = uploadedFiles.map(f => f.id);
                uploadedFileInfo = uploadedFiles.map(f => ({
                    id: f.id,
                    name: f.name,
                    size: f.size,
                }));
            }

            if (uploadedFileInfo.length > 0) {
                setMessages(prev => prev.map(m => 
                    m.id === userMessage.id 
                        ? { ...m, metadata: { attached_files: uploadedFileInfo } }
                        : m
                ));
            }

            setLoadingStatus('Thinking...');
            await sendStreamingMessage(conversation.id, content, fileIds, userMessage.id);

            // Refresh sidebar conversations after message sent
            router.reload({ only: ['chatConversations'] });

        } catch (err) {
            console.error('Error sending message:', err);
            setIsLoading(false);
            setLoadingStatus('');
            setStreamingMessage(null);
            setStreamingExecutions([]);
            setError(err.message || 'Failed to get response');
            setMessages(prev => prev.filter(m => m.id !== userMessage.id));
        }
    };

    const sendStreamingMessage = async (conversationId, content, fileIds, tempUserMessageId) => {
        // Cancel any existing stream
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Create new abort controller for this request
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
                signal, // Add abort signal
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
                setStreamingMessage({
                    id: streamingMsgId,
                    role: 'assistant',
                    content: '',
                    thinking: '',
                    created_at: new Date().toISOString(),
                });

                const processEvent = (eventType, data) => {
                    switch (eventType) {
                        case 'thinking':
                            currentThinking = data.full || data.content || '';
                            setStreamingThinking(currentThinking);
                            setLoadingStatus('Thinking...');
                            break;

                        case 'tool_call':
                            setLoadingStatus(`Running Python (step ${data.step || 1})...`);
                            currentExecutions = [
                                ...currentExecutions,
                                {
                                    code: data.code,
                                    status: 'running',
                                    step: data.step,
                                }
                            ];
                            setStreamingExecutions([...currentExecutions]);
                            break;

                        case 'tool_result':
                            const lastIdx = currentExecutions.length - 1;
                            if (lastIdx >= 0) {
                                currentExecutions[lastIdx] = {
                                    ...currentExecutions[lastIdx],
                                    status: 'complete',
                                    success: data.success,
                                    output: data.output,
                                    error: data.error,
                                    charts: data.charts || [],
                                    files: data.files || [],
                                    execution_id: data.execution_id,
                                };
                                setStreamingExecutions([...currentExecutions]);
                                setCurrentResults([...currentExecutions.filter(e => e.status === 'complete')]);
                            }
                            
                            if (data.success) {
                                setLoadingStatus('Code executed successfully');
                            } else {
                                setLoadingStatus('Code failed, AI is fixing...');
                            }
                            break;

                        case 'text_delta':
                            const delta = data.delta || '';
                            currentContent += delta;
                            setStreamingContent(currentContent);
                            setLoadingStatus('');
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
                        setIsLoading(false);
                        setLoadingStatus('');
                        
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
                            setCurrentResults(message.metadata.execution_results);
                        }
                        
                        setMessages(prev => {
                            const filtered = prev.filter(m => m.id !== tempUserMessageId);
                            const realUserMessage = {
                                ...prev.find(m => m.id === tempUserMessageId),
                                id: `user-${Date.now()}`,
                            };
                            return [...filtered, realUserMessage, message];
                        });
                        
                        setStreamingMessage(null);
                        setStreamingThinking('');
                        setStreamingContent('');
                        setStreamingExecutions([]);
                        
                        resolve();
                    }
                };

                processStream();
            }).catch(error => {
                // Don't treat abort as an error
                if (error.name === 'AbortError') {
                    resolve(); // Resolve gracefully on abort
                    return;
                }
                setIsLoading(false);
                setLoadingStatus('');
                setStreamingMessage(null);
                setStreamingExecutions([]);
                reject(error);
            });
        });
    };

    const extractCode = (content) => {
        const match = content.match(/```python\n([\s\S]*?)```/);
        return match ? match[1].trim() : null;
    };

    const handleSaveScript = (message) => {
        let code = message.code;
        if (!code && message.metadata?.execution_results?.length > 0) {
            const lastSuccess = [...message.metadata.execution_results]
                .reverse()
                .find(e => e.success);
            code = lastSuccess?.code;
        }
        
        if (code) {
            setSaveModal({
                isOpen: true,
                code: code,
                language: message.language || 'python',
            });
        }
    };

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

            setSaveModal({ isOpen: false, code: '', language: 'python' });
        } catch (err) {
            console.error('Error saving script:', err);
            throw err;
        }
    };

    const loadConversation = async (conversation) => {
        setCurrentConversation(conversation);
        setMessages([]);
        setError(null);
        setStreamingMessage(null);
        setStreamingExecutions([]);
        setCurrentResults([]);

        try {
            const response = await fetch(`/api/chat/conversations/${conversation.id}`, {
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                },
                credentials: 'same-origin',
            });

            if (!response.ok) throw new Error('Failed to load conversation');

            const data = await response.json();
            setMessages(data.messages || []);
            
            const lastAgenticMessage = [...(data.messages || [])].reverse().find(m => 
                m.role === 'assistant' && m.metadata?.execution_results?.length > 0
            );
            if (lastAgenticMessage?.metadata?.execution_results) {
                setCurrentResults(lastAgenticMessage.metadata.execution_results);
            }
        } catch (err) {
            console.error('Error loading conversation:', err);
            setError('Failed to load conversation');
        }
    };

    const suggestions = [
        "Analyze the distribution of values in my data",
        "Find and visualize outliers",
        "Create a summary report with charts",
        "Export my analysis to Excel",
    ];

    const displayStreamingMessage = streamingMessage ? {
        ...streamingMessage,
        thinking: streamingThinking || null,
        content: streamingContent || '',
        metadata: {
            execution_results: streamingExecutions,
        },
    } : null;

    const hasResultFiles = currentResults.some(r => 
        (r.charts && r.charts.length > 0) || (r.files && r.files.length > 0)
    );

    return (
        <AppLayout title="Chat" currentConversationId={currentConversation?.id}>
            <Head title="Chat" />

            <div className="h-[calc(100vh-8rem)] flex">
                {/* Main chat area - now full width */}
                <div className={`flex-1 flex flex-col min-w-0 bg-white rounded-lg border border-paper-200 ${showResults && hasResultFiles ? 'lg:mr-4' : ''}`}>
                    {error && (
                        <div className="flex-shrink-0 mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center justify-between">
                            <span>{error}</span>
                            <button onClick={() => setError(null)} className="ml-2 text-red-500 hover:text-red-700 font-bold">✕</button>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto">
                        <div className="max-w-3xl mx-auto px-4 py-6">
                            {messages.length === 0 && !isLoading && !displayStreamingMessage ? (
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
                                                    ? () => {
                                                        setCurrentResults(message.metadata.execution_results);
                                                        setShowResults(true);
                                                    } 
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

                                    {isLoading && !displayStreamingMessage && (
                                        <LoadingIndicator status={loadingStatus} />
                                    )}
                                    
                                    {isLoading && displayStreamingMessage && loadingStatus && (
                                        <div className="flex items-center gap-2 text-sm text-paper-500 ml-12">
                                            <div className="w-4 h-4 border-2 border-punch-200 border-t-punch-500 rounded-full animate-spin"></div>
                                            {loadingStatus}
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
                                disabled={isLoading}
                                placeholder="Describe what you want to analyze..."
                            />
                        </div>
                    </div>
                </div>

                {/* Results panel */}
                {hasResultFiles && (
                    <div className={`hidden lg:block lg:w-96 lg:flex-shrink-0 transition-all duration-300 ${
                        showResults ? 'lg:opacity-100' : 'lg:opacity-0 lg:w-0 lg:overflow-hidden'
                    }`}>
                        <ResultsPanel
                            results={currentResults}
                            isVisible={showResults}
                            onClose={() => setShowResults(false)}
                        />
                    </div>
                )}

                {/* Mobile results button */}
                {hasResultFiles && !showResults && (
                    <button
                        onClick={() => setShowResults(true)}
                        className="lg:hidden fixed bottom-24 right-4 z-30 bg-punch-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
                    >
                        <ChartIcon className="w-5 h-5" />
                        View Results
                    </button>
                )}
            </div>

            <SaveScriptModal
                isOpen={saveModal.isOpen}
                onClose={() => setSaveModal({ isOpen: false, code: '', language: 'python' })}
                code={saveModal.code}
                language={saveModal.language}
                onSave={handleSaveToLibrary}
            />
        </AppLayout>
    );
}

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
                            <div className="w-5 h-5 border-2 border-punch-200 border-t-punch-500 rounded-full animate-spin"></div>
                        </div>
                        <div className="flex-1">
                            <p className="text-paper-700 text-sm font-medium">
                                {status || 'Thinking...'}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-1 mt-3">
                        <div className="w-2 h-2 bg-punch-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-punch-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-punch-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
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
