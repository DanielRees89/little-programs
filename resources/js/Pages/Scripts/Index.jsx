import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Card, EmptyState, Button, Input } from '@/Components/UI';
import { ScriptDetailModal } from '@/Components/Scripts';

export default function ScriptsIndex({ scripts: initialScripts = [] }) {
    const [scripts, setScripts] = useState(initialScripts);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedScript, setSelectedScript] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState(null);

    // Filter scripts based on search
    const filteredScripts = scripts.filter(script => {
        const query = searchQuery.toLowerCase();
        return (
            script.name.toLowerCase().includes(query) ||
            script.description?.toLowerCase().includes(query)
        );
    });

    const handleScriptClick = (script) => {
        setSelectedScript(script);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedScript(null);
    };

    const handleRunScript = (script) => {
        router.visit(`/playground?script=${script.id}`);
    };

    const handleDeleteScript = async (script) => {
        if (!confirm(`Are you sure you want to delete "${script.name}"?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/scripts/${script.id}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                },
                credentials: 'same-origin',
            });

            if (!response.ok) {
                throw new Error('Delete failed');
            }

            setScripts(scripts.filter(s => s.id !== script.id));
            
            if (selectedScript?.id === script.id) {
                handleCloseModal();
            }
        } catch (err) {
            console.error('Delete error:', err);
            setError('Failed to delete script');
        }
    };

    const handleUpdateScript = async (scriptId, updates) => {
        try {
            const response = await fetch(`/api/scripts/${scriptId}`, {
                method: 'PUT',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                },
                credentials: 'same-origin',
                body: JSON.stringify(updates),
            });

            if (!response.ok) {
                throw new Error('Update failed');
            }

            const data = await response.json();
            
            setScripts(scripts.map(s => 
                s.id === scriptId ? data.script : s
            ));
            
            if (selectedScript?.id === scriptId) {
                setSelectedScript(data.script);
            }

            return data.script;
        } catch (err) {
            console.error('Update error:', err);
            setError('Failed to update script');
            throw err;
        }
    };

    return (
        <AppLayout title="Scripts">
            <Head title="Scripts" />

            <div className="max-w-6xl">
                {/* Error message */}
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-soft text-red-700">
                        {error}
                        <button 
                            onClick={() => setError(null)}
                            className="ml-2 text-red-500 hover:text-red-700"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Header with search and action */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex-1 max-w-md">
                        <Input
                            type="text"
                            placeholder="Search scripts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full"
                        />
                    </div>
                    <Link href="/chat">
                        <Button icon={PlusIcon}>
                            New script
                        </Button>
                    </Link>
                </div>

                {/* Scripts grid or empty state */}
                {scripts.length === 0 ? (
                    <Card className="py-12">
                        <EmptyState
                            illustration="scripts"
                            title="No scripts yet"
                            description="Chat with the AI to create your first little program. Once you save it, it'll show up here."
                            action={
                                <Link href="/chat">
                                    <Button>Start chatting</Button>
                                </Link>
                            }
                        />
                    </Card>
                ) : filteredScripts.length === 0 ? (
                    <Card className="py-12">
                        <EmptyState
                            illustration="search"
                            title="No matches found"
                            description={`We couldn't find any scripts matching "${searchQuery}". Try a different search term.`}
                            action={
                                <Button variant="secondary" onClick={() => setSearchQuery('')}>
                                    Clear search
                                </Button>
                            }
                        />
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredScripts.map((script) => (
                            <ScriptCard
                                key={script.id}
                                script={script}
                                onClick={() => handleScriptClick(script)}
                            />
                        ))}
                    </div>
                )}

                {/* Script count */}
                {scripts.length > 0 && (
                    <p className="text-paper-400 text-sm mt-6 text-center">
                        {filteredScripts.length} of {scripts.length} scripts
                    </p>
                )}
            </div>

            {/* Detail Modal */}
            <ScriptDetailModal
                isOpen={showModal}
                onClose={handleCloseModal}
                script={selectedScript}
                onRun={handleRunScript}
                onDelete={handleDeleteScript}
                onUpdate={handleUpdateScript}
            />
        </AppLayout>
    );
}

function ScriptCard({ script, onClick }) {
    return (
        <Card
            variant="script"
            className="group cursor-pointer"
            onClick={onClick}
        >
            <div className="flex items-start justify-between mb-3">
                <span className="px-2 py-0.5 bg-calm-100 text-calm-700 text-xs font-mono rounded-pill">
                    {script.language || 'python'}
                </span>
                {script.run_count > 0 && (
                    <span className="text-xs text-paper-400">
                        {script.run_count} runs
                    </span>
                )}
            </div>

            <h3 className="font-display font-semibold text-paper-900 mb-1 group-hover:text-punch-600 transition-colors">
                {script.name}
            </h3>

            {script.description && (
                <p className="text-paper-500 text-sm mb-4 line-clamp-2">
                    {script.description}
                </p>
            )}

            {/* Code preview */}
            <div className="bg-paper-900 rounded-soft p-3 mb-4 overflow-hidden">
                <pre className="text-xs text-paper-300 font-mono line-clamp-3">
                    <code>{script.code}</code>
                </pre>
            </div>

            <div className="flex items-center justify-between text-xs text-paper-400">
                <span>{formatDate(script.created_at)}</span>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-punch-500 font-medium">
                    View details →
                </span>
            </div>
        </Card>
    );
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Created today';
    if (diffDays === 1) return 'Created yesterday';
    if (diffDays < 7) return `Created ${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function PlusIcon({ className }) {
    return (
        <svg className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
    );
}
