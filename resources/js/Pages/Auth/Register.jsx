import { Head, Link, useForm } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import { Button, Card, Input } from '@/Components/UI';

export default function Register() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('register'));
    };

    return (
        <GuestLayout>
            <Head title="Sign up" />

            <div className="text-center mb-8">
                <h1 className="font-display text-3xl font-bold text-paper-900 mb-2">
                    Create your account
                </h1>
                <p className="text-paper-500">
                    Start building little programs in seconds
                </p>
            </div>

            <Card>
                <form onSubmit={submit} className="space-y-5">
                    <Input
                        label="Name"
                        type="text"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        error={errors.name}
                        placeholder="What should we call you?"
                        autoComplete="name"
                        autoFocus
                    />

                    <Input
                        label="Email"
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        error={errors.email}
                        placeholder="you@example.com"
                        autoComplete="username"
                    />

                    <Input
                        label="Password"
                        type="password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        error={errors.password}
                        placeholder="At least 8 characters"
                        autoComplete="new-password"
                        hint="Make it something you'll remember"
                    />

                    <Input
                        label="Confirm password"
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
                        Create account
                    </Button>

                    <p className="text-xs text-paper-400 text-center">
                        By signing up, you agree to our{' '}
                        <a href="#" className="text-paper-500 hover:text-punch-500 transition-colors">
                            Terms of Service
                        </a>{' '}
                        and{' '}
                        <a href="#" className="text-paper-500 hover:text-punch-500 transition-colors">
                            Privacy Policy
                        </a>
                    </p>
                </form>
            </Card>

            <p className="text-center mt-6 text-paper-500">
                Already have an account?{' '}
                <Link
                    href={route('login')}
                    className="text-punch-500 hover:text-punch-600 font-medium transition-colors"
                >
                    Sign in
                </Link>
            </p>
        </GuestLayout>
    );
}
