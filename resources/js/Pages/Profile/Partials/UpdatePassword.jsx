import { useRef } from 'react';
import { useForm } from '@inertiajs/react';
import { Button, Input } from '@/Components/UI';

export default function UpdatePassword() {
    const passwordInput = useRef();
    const currentPasswordInput = useRef();

    const { data, setData, errors, put, reset, processing, recentlySuccessful } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }
                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    return (
        <form onSubmit={updatePassword} className="space-y-5">
            <Input
                ref={currentPasswordInput}
                label="Current password"
                type="password"
                value={data.current_password}
                onChange={(e) => setData('current_password', e.target.value)}
                error={errors.current_password}
                placeholder="Your current password"
                autoComplete="current-password"
            />

            <Input
                ref={passwordInput}
                label="New password"
                type="password"
                value={data.password}
                onChange={(e) => setData('password', e.target.value)}
                error={errors.password}
                placeholder="At least 8 characters"
                autoComplete="new-password"
            />

            <Input
                label="Confirm new password"
                type="password"
                value={data.password_confirmation}
                onChange={(e) => setData('password_confirmation', e.target.value)}
                error={errors.password_confirmation}
                placeholder="Type it again"
                autoComplete="new-password"
            />

            <div className="flex items-center gap-4">
                <Button type="submit" loading={processing}>
                    Update password
                </Button>

                {recentlySuccessful && (
                    <p className="text-sm text-calm-600 flex items-center gap-1">
                        <CheckIcon className="w-4 h-4" />
                        Password updated!
                    </p>
                )}
            </div>
        </form>
    );
}

function CheckIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
    );
}
