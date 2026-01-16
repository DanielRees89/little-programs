import { Head, Link, useForm } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import { Button, Card, Input } from '@/Components/UI';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'));
    };

    return (
        <GuestLayout>
            <Head title="Log in" />

            <div className="text-center mb-8">
                <h1 className="font-display text-3xl font-bold text-paper-900 mb-2">
                    Welcome back
                </h1>
                <p className="text-paper-500">
                    Sign in to continue building little programs
                </p>
            </div>

            {status && (
                <div className="mb-6 p-4 bg-calm-50 border border-calm-200 rounded-soft">
                    <p className="text-calm-700 text-sm">{status}</p>
                </div>
            )}

            <Card>
                <form onSubmit={submit} className="space-y-5">
                    <Input
                        label="Email"
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        error={errors.email}
                        placeholder="you@example.com"
                        autoComplete="username"
                        autoFocus
                    />

                    <Input
                        label="Password"
                        type="password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        error={errors.password}
                        placeholder="••••••••"
                        autoComplete="current-password"
                    />

                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={data.remember}
                                onChange={(e) => setData('remember', e.target.checked)}
                                className="w-4 h-4 rounded border-paper-300 text-punch-500 focus:ring-punch-500"
                            />
                            <span className="text-sm text-paper-600">Remember me</span>
                        </label>

                        {canResetPassword && (
                            <Link
                                href={route('password.request')}
                                className="text-sm text-paper-500 hover:text-punch-500 transition-colors"
                            >
                                Forgot password?
                            </Link>
                        )}
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        size="lg"
                        loading={processing}
                    >
                        Sign in
                    </Button>
                </form>
            </Card>

            <p className="text-center mt-6 text-paper-500">
                Don't have an account?{' '}
                <Link
                    href={route('register')}
                    className="text-punch-500 hover:text-punch-600 font-medium transition-colors"
                >
                    Sign up free
                </Link>
            </p>
        </GuestLayout>
    );
}
