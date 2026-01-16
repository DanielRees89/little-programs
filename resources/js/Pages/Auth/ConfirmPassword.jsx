import { Head, useForm } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import { Button, Card, Input } from '@/Components/UI';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors } = useForm({
        password: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.confirm'));
    };

    return (
        <GuestLayout>
            <Head title="Confirm password" />

            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-paper-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShieldIcon className="w-8 h-8 text-paper-500" />
                </div>
                <h1 className="font-display text-3xl font-bold text-paper-900 mb-2">
                    Confirm your password
                </h1>
                <p className="text-paper-500">
                    This is a secure area. Please enter your password to continue.
                </p>
            </div>

            <Card>
                <form onSubmit={submit} className="space-y-5">
                    <Input
                        label="Password"
                        type="password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        error={errors.password}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        autoFocus
                    />

                    <Button
                        type="submit"
                        className="w-full"
                        size="lg"
                        loading={processing}
                    >
                        Confirm
                    </Button>
                </form>
            </Card>
        </GuestLayout>
    );
}

function ShieldIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
    );
}
