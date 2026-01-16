import { Head, useForm } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import { Button, Card, Input } from '@/Components/UI';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.store'));
    };

    return (
        <GuestLayout>
            <Head title="Reset password" />

            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-calm-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <LockOpenIcon className="w-8 h-8 text-calm-600" />
                </div>
                <h1 className="font-display text-3xl font-bold text-paper-900 mb-2">
                    Set a new password
                </h1>
                <p className="text-paper-500">
                    Almost there! Choose something secure you'll remember.
                </p>
            </div>

            <Card>
                <form onSubmit={submit} className="space-y-5">
                    <Input
                        label="Email"
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        error={errors.email}
                        autoComplete="username"
                        disabled
                    />

                    <Input
                        label="New password"
                        type="password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        error={errors.password}
                        placeholder="At least 8 characters"
                        autoComplete="new-password"
                        autoFocus
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

                    <Button
                        type="submit"
                        className="w-full"
                        size="lg"
                        loading={processing}
                    >
                        Reset password
                    </Button>
                </form>
            </Card>
        </GuestLayout>
    );
}

function LockOpenIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
    );
}
