import { Head, Link, useForm } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import { Button, Card } from '@/Components/UI';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();
        post(route('verification.send'));
    };

    return (
        <GuestLayout>
            <Head title="Verify email" />

            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-punch-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MailIcon className="w-8 h-8 text-punch-500" />
                </div>
                <h1 className="font-display text-3xl font-bold text-paper-900 mb-2">
                    Check your inbox
                </h1>
                <p className="text-paper-500">
                    We sent you a verification link. Click it to confirm your email.
                </p>
            </div>

            {status === 'verification-link-sent' && (
                <div className="mb-6 p-4 bg-calm-50 border border-calm-200 rounded-soft">
                    <p className="text-calm-700 text-sm flex items-center gap-2">
                        <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
                        A fresh verification link has been sent to your email!
                    </p>
                </div>
            )}

            <Card>
                <div className="space-y-5">
                    <p className="text-paper-600 text-sm">
                        Didn't get the email? Check your spam folder, or request a new link below.
                    </p>

                    <form onSubmit={submit}>
                        <Button
                            type="submit"
                            className="w-full"
                            variant="secondary"
                            loading={processing}
                        >
                            Resend verification email
                        </Button>
                    </form>

                    <div className="pt-4 border-t border-paper-200">
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="w-full text-center text-sm text-paper-500 hover:text-punch-500 transition-colors"
                        >
                            Sign out and try a different email
                        </Link>
                    </div>
                </div>
            </Card>
        </GuestLayout>
    );
}

function MailIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
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
