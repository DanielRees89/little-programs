import { useState } from 'react';
import { Button, Modal, CodeBlock } from '@/Components/UI';

export default function ScriptDetailModal({ isOpen, onClose, script, onRun, onEdit, onDelete }) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    if (!script) return null;

    const handleDelete = () => {
        onDelete(script);
        setShowDeleteConfirm(false);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <Modal.Header onClose={onClose}>
                <div className="flex items-center gap-3">
                    <Modal.Icon variant="calm">
                        <CodeIcon className="w-5 h-5 text-calm-600" />
                    </Modal.Icon>
                    <div className="flex-1 min-w-0">
                        <Modal.Title>{script.name}</Modal.Title>
                        {script.description && (
                            <Modal.Description>{script.description}</Modal.Description>
                        )}
                    </div>
                    <span className="px-2 py-1 bg-calm-100 text-calm-700 text-xs font-mono rounded-pill flex-shrink-0">
                        {script.language || 'python'}
                    </span>
                </div>
            </Modal.Header>

            <Modal.Body>
                {/* Stats row */}
                <div className="flex items-center gap-6 mb-4 text-sm text-paper-500">
                    <div className="flex items-center gap-1.5">
                        <ClockIcon className="w-4 h-4" />
                        <span>Created {formatDate(script.created_at)}</span>
                    </div>
                    {script.run_count > 0 && (
                        <div className="flex items-center gap-1.5">
                            <PlayIcon className="w-4 h-4" />
                            <span>Run {script.run_count} times</span>
                        </div>
                    )}
                    {script.last_run_at && (
                        <div className="flex items-center gap-1.5">
                            <RefreshIcon className="w-4 h-4" />
                            <span>Last run {formatDate(script.last_run_at)}</span>
                        </div>
                    )}
                </div>

                {/* Code block */}
                <CodeBlock
                    code={script.code}
                    language={script.language || 'python'}
                    title={script.name}
                    maxHeight="350px"
                    onRun={onRun ? () => onRun(script) : null}
                />

                {/* Delete confirmation */}
                {showDeleteConfirm && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-card">
                        <p className="text-red-700 text-sm mb-3">
                            Are you sure you want to delete <strong>{script.name}</strong>? This cannot be undone.
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowDeleteConfirm(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleDelete}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                Yes, delete it
                            </Button>
                        </div>
                    </div>
                )}
            </Modal.Body>

            <Modal.Footer>
                <div className="flex items-center justify-between w-full">
                    <Button
                        variant="ghost"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                        <TrashIcon className="w-4 h-4" />
                        Delete
                    </Button>
                    <div className="flex gap-2">
                        {onEdit && (
                            <Button variant="secondary" onClick={() => onEdit(script)}>
                                <EditIcon className="w-4 h-4" />
                                Edit
                            </Button>
                        )}
                        {onRun && (
                            <Button onClick={() => onRun(script)}>
                                <PlayIcon className="w-4 h-4" />
                                Run in Playground
                            </Button>
                        )}
                    </div>
                </div>
            </Modal.Footer>
        </Modal>
    );
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Icons
function CodeIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
        </svg>
    );
}

function ClockIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}

function PlayIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
        </svg>
    );
}

function RefreshIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
    );
}

function TrashIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
    );
}

function EditIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
        </svg>
    );
}
