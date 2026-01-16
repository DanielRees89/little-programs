import { Head, useForm } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import { Button, Card, Input } from '@/Components/UI';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <GuestLayout>
            <Head title="Forgot password" />

            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-paper-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <KeyIcon className="w-8 h-8 text-paper-500" />
                </div>
                <h1 className="font-display text-3xl font-bold text-paper-900 mb-2">
                    Forgot your password?
                </h1>
                <p className="text-paper-500">
                    No worries! Enter your email and we'll send you a reset link.
                </p>
            </div>

            {status && (
                <div className="mb-6 p-4 bg-calm-50 border border-calm-200 rounded-soft">
                    <p className="text-calm-700 text-sm flex items-center gap-2">
                        <CheckCircleIcon className="w-5 h-5" />
                        {status}
                    </p>
                </div>
            )}

            <Card>
                <form onSubmit={submit} className="space-y-5">
                    <Input
                        label="Email address"
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        error={errors.email}
                        placeholder="you@example.com"
                        autoComplete="username"
                        autoFocus
                    />

                    <Button
                        type="submit"
                        className="w-full"
                        size="lg"
                        loading={processing}
                    >
                        Send reset link
                    </Button>
                </form>
            </Card>
        </GuestLayout>
    );
}

function KeyIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
        </svg>
    );
}

function CheckCircleIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}
