import { Link, useForm, usePage } from '@inertiajs/react';
import { Button, Input } from '@/Components/UI';

export default function UpdateProfileInformation({ mustVerifyEmail, status }) {
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: user.name,
        email: user.email,
    });

    const submit = (e) => {
        e.preventDefault();
        patch(route('profile.update'));
    };

    return (
        <form onSubmit={submit} className="space-y-5">
            <Input
                label="Name"
                type="text"
                value={data.name}
                onChange={(e) => setData('name', e.target.value)}
                error={errors.name}
                placeholder="Your name"
                autoComplete="name"
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

            {mustVerifyEmail && user.email_verified_at === null && (
                <div className="p-4 bg-punch-50 border border-punch-200 rounded-soft">
                    <p className="text-sm text-punch-700">
                        Your email address is unverified.{' '}
                        <Link
                            href={route('verification.send')}
                            method="post"
                            as="button"
                            className="underline hover:text-punch-800 font-medium"
                        >
                            Click here to resend the verification email.
                        </Link>
                    </p>

                    {status === 'verification-link-sent' && (
                        <p className="mt-2 text-sm text-calm-600 font-medium">
                            A new verification link has been sent to your email.
                        </p>
                    )}
                </div>
            )}

            <div className="flex items-center gap-4">
                <Button type="submit" loading={processing}>
                    Save changes
                </Button>

                {recentlySuccessful && (
                    <p className="text-sm text-calm-600 flex items-center gap-1">
                        <CheckIcon className="w-4 h-4" />
                        Saved!
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
