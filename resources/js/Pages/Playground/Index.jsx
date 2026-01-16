import { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Card, Button, EmptyState, Modal } from '@/Components/UI';
import { OutputPanel } from '@/Components/Visualizations';

export default function PlaygroundIndex({
    scripts: initialScripts = [],
    files: initialFiles = [],
    recentExecutions: initialExecutions = [],
}) {
    const [scripts] = useState(initialScripts);
    const [files] = useState(initialFiles);
    const [selectedScript, setSelectedScript] = useState(null);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [showScriptPicker, setShowScriptPicker] = useState(false);
    const [showFilePicker, setShowFilePicker] = useState(false);

    // Handle URL params for pre-selection
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const scriptId = params.get('script');
        const fileId = params.get('file');

        if (scriptId) {
            const script = scripts.find(s => s.id === parseInt(scriptId));
            if (script) setSelectedScript(script);
        }
        if (fileId) {
            const file = files.find(f => f.id === parseInt(fileId));
            if (file) setSelectedFiles([file]);
        }
    }, [scripts, files]);

    // Reset when script changes
    useEffect(() => {
        setSelectedFiles([]);
        setResult(null);
        setError(null);
    }, [selectedScript]);

    const canRun = selectedScript && selectedFiles.length > 0 && !isRunning;

    const handleRun = async () => {
        setIsRunning(true);
        setResult(null);
        setError(null);

        try {
            const response = await fetch('/api/executions', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    script_id: selectedScript.id,
                    file_ids: selectedFiles.map(f => f.id),
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || data.message || 'Execution failed');
            }

            setResult({
                execution: data.execution,
                output: data.output,
                resultData: data.result_data,
            });

        } catch (err) {
            console.error('Execution error:', err);
            setError(err.message || 'Failed to run script');
        } finally {
            setIsRunning(false);
        }
    };

    const handleFileSelect = (file) => {
        if (!selectedFiles.find(f => f.id === file.id)) {
            setSelectedFiles([file]); // Single file for now
        }
        setShowFilePicker(false);
    };

    return (
        <AppLayout title="Playground">
            <Head title="Playground" />

            <div className="max-w-6xl">
                {/* Error display */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-soft text-red-700">
                        {error}
                        <button 
                            onClick={() => setError(null)}
                            className="ml-2 text-red-500 hover:text-red-700"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Setup area */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Script selector */}
                    <Card>
                        <Card.Header>
                            <div className="flex items-center gap-3">
                                <StepBadge step={1} active={!!selectedScript} />
                                <div>
                                    <Card.Title>Pick a script</Card.Title>
                                    <Card.Description>Choose what analysis to run</Card.Description>
                                </div>
                            </div>
                        </Card.Header>
                        <Card.Content>
                            {selectedScript ? (
                                <SelectedItem
                                    icon={<CodeIcon className="w-6 h-6 text-calm-600" />}
                                    label={selectedScript.name}
                                    sublabel={`${selectedScript.language} • ${selectedScript.run_count || 0} runs`}
                                    accentColor="calm"
                                    onSelect={() => setShowScriptPicker(true)}
                                    onClear={() => setSelectedScript(null)}
                                />
                            ) : (
                                <EmptySelector
                                    icon={<CodeIcon className="w-6 h-6 text-paper-400" />}
                                    title="No script selected"
                                    description={scripts.length > 0 ? "Click to choose a script" : "Create scripts in Chat first"}
                                    onSelect={() => scripts.length > 0 && setShowScriptPicker(true)}
                                    action={scripts.length === 0 && (
                                        <Button variant="secondary" size="sm" onClick={() => router.visit('/chat')}>
                                            Create one
                                        </Button>
                                    )}
                                />
                            )}
                        </Card.Content>
                    </Card>

                    {/* File selector */}
                    <Card>
                        <Card.Header>
                            <div className="flex items-center gap-3">
                                <StepBadge step={2} active={selectedFiles.length > 0} />
                                <div>
                                    <Card.Title>Pick a file</Card.Title>
                                    <Card.Description>Select the data to analyze</Card.Description>
                                </div>
                            </div>
                        </Card.Header>
                        <Card.Content>
                            {!selectedScript ? (
                                <div className="text-center py-6 text-paper-400">
                                    <p>Select a script first</p>
                                </div>
                            ) : selectedFiles.length > 0 ? (
                                <SelectedItem
                                    icon={<FileIcon className="w-6 h-6 text-punch-500" />}
                                    label={selectedFiles[0].name}
                                    sublabel={`${selectedFiles[0].formatted_size || formatFileSize(selectedFiles[0].size)} • ${selectedFiles[0].row_count?.toLocaleString()} rows`}
                                    accentColor="punch"
                                    onSelect={() => setShowFilePicker(true)}
                                    onClear={() => setSelectedFiles([])}
                                />
                            ) : (
                                <EmptySelector
                                    icon={<FileIcon className="w-6 h-6 text-paper-400" />}
                                    title="No file selected"
                                    description={files.length > 0 ? "Click to choose a file" : "Upload files in Data first"}
                                    onSelect={() => files.length > 0 && setShowFilePicker(true)}
                                    action={files.length === 0 && (
                                        <Button variant="secondary" size="sm" onClick={() => router.visit('/data')}>
                                            Upload one
                                        </Button>
                                    )}
                                />
                            )}
                        </Card.Content>
                    </Card>
                </div>

                {/* Run button */}
                <div className="flex justify-center mb-6">
                    <Button
                        size="lg"
                        disabled={!canRun}
                        loading={isRunning}
                        onClick={handleRun}
                        className="px-12"
                    >
                        {isRunning ? 'Running analysis...' : 'Run analysis'}
                    </Button>
                </div>

                {/* Running indicator */}
                {isRunning && (
                    <Card className="mb-6 border-calm-200 bg-calm-50">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-calm-100 rounded-full flex items-center justify-center">
                                <LoadingSpinner className="w-5 h-5 text-calm-600" />
                            </div>
                            <div>
                                <p className="font-medium text-calm-800">Running your analysis...</p>
                                <p className="text-sm text-calm-600">
                                    Executing <strong>{selectedScript?.name}</strong> on {selectedFiles[0]?.name}
                                </p>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Results area */}
                <Card padding="none">
                    <div className="p-4 border-b border-paper-200">
                        <h3 className="font-display font-semibold text-paper-800">
                            {result ? 'Analysis Complete' : 'Results'}
                        </h3>
                        {result && (
                            <p className="text-sm text-paper-500">
                                {selectedScript?.name} • {result.execution?.duration ? `${result.execution.duration}ms` : 'Completed'}
                            </p>
                        )}
                    </div>

                    <div className="p-5">
                        {!result ? (
                            <EmptyState
                                illustration="results"
                                title="Nothing to show yet"
                                description="Pick a script and file, then hit run. The output will appear here."
                            />
                        ) : (
                            <ResultDisplay result={result} />
                        )}
                    </div>
                </Card>
            </div>

            {/* Script Picker Modal */}
            <PickerModal
                isOpen={showScriptPicker}
                onClose={() => setShowScriptPicker(false)}
                title="Select a script"
                items={scripts}
                selectedId={selectedScript?.id}
                onSelect={(script) => {
                    setSelectedScript(script);
                    setShowScriptPicker(false);
                }}
                renderItem={(script, isSelected) => (
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-soft flex items-center justify-center ${isSelected ? 'bg-calm-100' : 'bg-paper-100'}`}>
                            <CodeIcon className={`w-5 h-5 ${isSelected ? 'text-calm-600' : 'text-paper-500'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-paper-900 truncate">{script.name}</p>
                            <p className="text-sm text-paper-500 truncate">{script.description || 'No description'}</p>
                        </div>
                    </div>
                )}
                emptyState={
                    <EmptyState
                        illustration="scripts"
                        title="No scripts yet"
                        description="Create your first script by chatting with the AI"
                        action={<Button size="sm" onClick={() => router.visit('/chat')}>Go to Chat</Button>}
                    />
                }
            />

            {/* File Picker Modal */}
            <PickerModal
                isOpen={showFilePicker}
                onClose={() => setShowFilePicker(false)}
                title="Select a file"
                items={files}
                selectedId={selectedFiles[0]?.id}
                onSelect={handleFileSelect}
                renderItem={(file, isSelected) => (
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-soft flex items-center justify-center ${isSelected ? 'bg-punch-100' : 'bg-paper-100'}`}>
                            <FileIcon className={`w-5 h-5 ${isSelected ? 'text-punch-500' : 'text-paper-500'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-paper-900 truncate">{file.name}</p>
                            <p className="text-sm text-paper-500">
                                {file.formatted_size || formatFileSize(file.size)} • {file.row_count?.toLocaleString()} rows
                            </p>
                        </div>
                    </div>
                )}
                emptyState={
                    <EmptyState
                        illustration="data"
                        title="No files yet"
                        description="Upload a CSV file to get started"
                        action={<Button size="sm" onClick={() => router.visit('/data')}>Go to Data</Button>}
                    />
                }
            />
        </AppLayout>
    );
}

// Step badge component
function StepBadge({ step, active }) {
    return (
        <div className={`
            w-8 h-8 rounded-full flex items-center justify-center text-sm font-display font-bold
            ${active ? 'bg-calm-100 text-calm-600' : 'bg-paper-200 text-paper-500'}
        `}>
            {step}
        </div>
    );
}

// Selected item display
function SelectedItem({ icon, label, sublabel, accentColor, onSelect, onClear }) {
    const colors = {
        calm: 'bg-calm-50 border-calm-300',
        punch: 'bg-punch-50 border-punch-300',
    };

    return (
        <div
            className={`flex items-center gap-3 p-3 border-2 rounded-soft cursor-pointer ${colors[accentColor]}`}
            onClick={onSelect}
        >
            <div className="w-10 h-10 bg-white rounded-soft flex items-center justify-center shadow-sm">
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-medium text-paper-900 truncate">{label}</p>
                {sublabel && <p className="text-sm text-paper-500">{sublabel}</p>}
            </div>
            <button
                onClick={(e) => { e.stopPropagation(); onClear(); }}
                className="p-1.5 hover:bg-white/50 rounded transition-colors"
            >
                <XIcon className="w-4 h-4 text-paper-400" />
            </button>
        </div>
    );
}

// Empty selector display
function EmptySelector({ icon, title, description, onSelect, action }) {
    return (
        <div
            className={`
                flex flex-col items-center justify-center py-6
                border-2 border-dashed border-paper-200 rounded-soft
                ${onSelect ? 'cursor-pointer hover:border-paper-300 hover:bg-paper-50' : ''}
                transition-colors
            `}
            onClick={onSelect}
        >
            <div className="w-12 h-12 bg-paper-100 rounded-full flex items-center justify-center mb-3">
                {icon}
            </div>
            <p className="font-medium text-paper-700">{title}</p>
            <p className="text-sm text-paper-400 mb-3">{description}</p>
            {action}
        </div>
    );
}

// Picker modal component
function PickerModal({ isOpen, onClose, title, items, selectedId, onSelect, renderItem, emptyState }) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} size="md">
            <Modal.Header onClose={onClose}>
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {items.length === 0 ? emptyState : (
                    <div className="space-y-2">
                        {items.map((item) => {
                            const isSelected = item.id === selectedId;
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => onSelect(item)}
                                    className={`
                                        p-3 rounded-soft cursor-pointer transition-all
                                        ${isSelected ? 'bg-paper-100 ring-2 ring-punch-400' : 'hover:bg-paper-50 border border-paper-200'}
                                    `}
                                >
                                    {renderItem(item, isSelected)}
                                </div>
                            );
                        })}
                    </div>
                )}
            </Modal.Body>
        </Modal>
    );
}

// Result display
function ResultDisplay({ result }) {
    if (!result) return null;

    const { output, resultData, execution } = result;

    return (
        <div className="space-y-6">
            {/* Generated charts */}
            {resultData?.charts && resultData.charts.length > 0 && (
                <div className="space-y-4">
                    <h4 className="font-medium text-paper-700">Generated Charts</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {resultData.charts.map((chart, i) => (
                            <div key={i} className="border border-paper-200 rounded-soft overflow-hidden">
                                <img
                                    src={`/api/executions/${execution.id}/files/${chart.filename}`}
                                    alt={chart.filename}
                                    className="w-full h-auto"
                                />
                                <div className="p-2 bg-paper-50 text-sm text-paper-600">
                                    {chart.filename}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Generated files */}
            {resultData?.files && resultData.files.length > 0 && (
                <div className="space-y-2">
                    <h4 className="font-medium text-paper-700">Generated Files</h4>
                    <div className="space-y-2">
                        {resultData.files.map((file, i) => (
                            <a
                                key={i}
                                href={`/api/executions/${execution.id}/files/${file.filename}/download`}
                                className="flex items-center gap-3 p-3 bg-paper-50 hover:bg-paper-100 rounded-soft transition-colors"
                            >
                                <FileIcon className="w-5 h-5 text-calm-600" />
                                <span className="flex-1 text-paper-700">{file.filename}</span>
                                <span className="text-sm text-paper-400">{formatFileSize(file.size)}</span>
                                <DownloadIcon className="w-4 h-4 text-paper-400" />
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* Text output */}
            {output && (
                <div>
                    <h4 className="font-medium text-paper-700 mb-2">Output</h4>
                    <div className="bg-paper-900 rounded-card p-4 overflow-auto max-h-[400px]">
                        <pre className="text-paper-100 text-sm font-mono whitespace-pre-wrap">{output}</pre>
                    </div>
                </div>
            )}

            {/* Error output */}
            {execution?.error_output && (
                <div>
                    <h4 className="font-medium text-red-700 mb-2">Errors</h4>
                    <div className="bg-red-900 rounded-card p-4 overflow-auto max-h-[200px]">
                        <pre className="text-red-100 text-sm font-mono whitespace-pre-wrap">{execution.error_output}</pre>
                    </div>
                </div>
            )}
        </div>
    );
}

// Utility
function formatFileSize(bytes) {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Icons
function CodeIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
        </svg>
    );
}

function FileIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
    );
}

function XIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
}

function DownloadIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
    );
}

function LoadingSpinner({ className }) {
    return (
        <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
    );
}
