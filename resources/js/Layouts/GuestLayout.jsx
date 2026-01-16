import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="min-h-screen bg-paper-100 flex flex-col">
            {/* Header */}
            <header className="p-6">
                <Link href="/" className="inline-flex items-center gap-3 group">
                    <div className="w-10 h-10 bg-punch-500 rounded-card flex items-center justify-center group-hover:scale-105 transition-transform">
                        <span className="text-white font-display font-bold text-lg">LP</span>
                    </div>
                    <span className="font-display font-semibold text-paper-900 text-lg">
                        Little Programs
                    </span>
                </Link>
            </header>

            {/* Content */}
            <main className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-md">
                    {children}
                </div>
            </main>

            {/* Footer */}
            <footer className="p-6 text-center">
                <p className="text-paper-400 text-sm">
                    © {new Date().getFullYear()} Little Programs • 
                    <Link href="/" className="hover:text-paper-600 transition-colors ml-1">
                        Back to home
                    </Link>
                </p>
            </footer>
        </div>
    );
}
