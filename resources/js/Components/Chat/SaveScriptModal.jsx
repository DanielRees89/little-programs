import { useState } from 'react';
import { Button, Input, CodeBlock, Modal } from '@/Components/UI';

export default function SaveScriptModal({ isOpen, onClose, code, language = 'python', onSave }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) return;
        
        setSaving(true);
        try {
            await onSave({
                name: name.trim(),
                description: description.trim(),
                code,
                language,
            });
            // Reset and close
            setName('');
            setDescription('');
            onClose();
        } catch (error) {
            console.error('Failed to save script:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        setName('');
        setDescription('');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="lg">
            <Modal.Header onClose={handleClose}>
                <div className="flex items-center gap-3">
                    <Modal.Icon variant="punch">
                        <BookmarkIcon className="w-5 h-5 text-punch-500" />
                    </Modal.Icon>
                    <div>
                        <Modal.Title>Save to Library</Modal.Title>
                        <Modal.Description>Give your little program a name</Modal.Description>
                    </div>
                </div>
            </Modal.Header>

            <Modal.Body className="space-y-5">
                <Input
                    label="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Find Outliers, Sales Summary..."
                    autoFocus
                />

                <Input.Textarea
                    label="Description (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What does this script do? When would you use it?"
                    rows={2}
                />

                <div>
                    <label className="block font-display font-medium text-paper-800 mb-1.5">
                        Code Preview
                    </label>
                    <CodeBlock
                        code={code}
                        language={language}
                        maxHeight="200px"
                        showLineNumbers={false}
                    />
                </div>
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Cancel
                </Button>
                <Button 
                    onClick={handleSave} 
                    disabled={!name.trim()}
                    loading={saving}
                >
                    Save to Library
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

function BookmarkIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
        </svg>
    );
}
