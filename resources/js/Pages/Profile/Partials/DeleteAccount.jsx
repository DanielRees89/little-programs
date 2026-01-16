import { useState, useRef } from 'react';
import { useForm } from '@inertiajs/react';
import { Button, Input } from '@/Components/UI';

export default function DeleteAccount() {
    const [confirming, setConfirming] = useState(false);
    const passwordInput = useRef();

    const { data, setData, delete: destroy, processing, reset, errors } = useForm({
        password: '',
    });

    const confirmDeletion = () => {
        setConfirming(true);
        setTimeout(() => passwordInput.current?.focus(), 100);
    };

    const closeModal = () => {
        setConfirming(false);
        reset();
    };

    const deleteAccount = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current?.focus(),
            onFinish: () => reset(),
        });
    };

    return (
        <>
            <div className="flex items-start gap-4">
                <div className="flex-1">
                    <p className="text-paper-600 text-sm">
                        Once you delete your account, all of your data—scripts, uploaded files, 
                        and chat history—will be permanently removed. This action cannot be undone.
                    </p>
                </div>
                <Button
                    variant="ghost"
                    onClick={confirmDeletion}
                    className="text-red-600 hover:bg-red-50 hover:text-red-700 flex-shrink-0"
                >
                    Delete account
                </Button>
            </div>

            {/* Confirmation Modal */}
            {confirming && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-paper-900/50 backdrop-blur-sm"
                        onClick={closeModal}
                    />

                    {/* Modal */}
                    <div className="relative bg-white rounded-card shadow-lifted max-w-md w-full p-6 animate-bounce-soft">
                        <div className="mb-6">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <WarningIcon className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="font-display font-semibold text-xl text-paper-900 mb-2">
                                Are you absolutely sure?
                            </h3>
                            <p className="text-paper-500 text-sm">
                                This will permanently delete your account and all associated data. 
                                Enter your password to confirm.
                            </p>
                        </div>

                        <form onSubmit={deleteAccount} className="space-y-5">
                            <Input
                                ref={passwordInput}
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                error={errors.password}
                                placeholder="Enter your password"
                                autoComplete="current-password"
                            />

                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={closeModal}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    loading={processing}
                                    className="flex-1 bg-red-600 hover:bg-red-700 focus-visible:ring-red-500"
                                >
                                    Delete account
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

function WarningIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
    );
}
