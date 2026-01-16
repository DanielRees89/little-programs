import { Head, Link } from '@inertiajs/react';

export default function Welcome({ auth, laravelVersion, phpVersion }) {
    return (
        <>
            <Head title="Little Programs - AI Data Analysis Made Simple" />
            
            <div className="min-h-screen bg-paper-100">
                {/* Navigation */}
                <nav className="fixed top-0 left-0 right-0 z-50 bg-paper-100/80 backdrop-blur-sm border-b border-paper-200">
                    <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-punch-500 rounded-card flex items-center justify-center">
                                <span className="text-white font-display font-bold text-lg">LP</span>
                            </div>
                            <span className="font-display font-semibold text-paper-900 text-lg">
                                Little Programs
                            </span>
                        </Link>

                        {/* Auth links */}
                        <div className="flex items-center gap-3">
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="px-4 py-2 bg-punch-500 text-white font-display font-semibold rounded-soft hover:bg-punch-600 transition-colors"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={route('login')}
                                        className="px-4 py-2 text-paper-600 font-medium hover:text-paper-900 transition-colors"
                                    >
                                        Log in
                                    </Link>
                                    <Link
                                        href={route('register')}
                                        className="px-4 py-2 bg-punch-500 text-white font-display font-semibold rounded-soft hover:bg-punch-600 transition-colors"
                                    >
                                        Get started
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </nav>

                {/* Hero section */}
                <section className="pt-32 pb-20 px-6">
                    <div className="max-w-4xl mx-auto text-center">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-calm-100 text-calm-700 rounded-pill text-sm font-medium mb-8">
                            <SparkleIcon className="w-4 h-4" />
                            AI-powered data analysis
                        </div>

                        {/* Headline */}
                        <h1 className="font-display text-5xl md:text-6xl font-bold text-paper-900 mb-6 leading-tight">
                            Turn your data into
                            <span className="relative mx-3">
                                <span className="relative z-10">little programs</span>
                                <span className="absolute bottom-2 left-0 right-0 h-3 bg-punch-200 -z-0 -rotate-1"></span>
                            </span>
                        </h1>

                        {/* Subheadline */}
                        <p className="text-xl text-paper-500 max-w-2xl mx-auto mb-10 leading-relaxed">
                            Drop a CSV, tell us what you're curious about, and watch the AI write 
                            Python scripts that answer your questions. No coding required.
                        </p>

                        {/* CTA buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href={route('register')}
                                className="w-full sm:w-auto px-8 py-4 bg-punch-500 text-white font-display font-semibold text-lg rounded-card hover:bg-punch-600 transition-all hover:-translate-y-0.5 shadow-soft hover:shadow-lifted"
                            >
                                Start for free
                            </Link>
                            <Link
                                href="#how-it-works"
                                className="w-full sm:w-auto px-8 py-4 bg-white text-paper-700 font-display font-semibold text-lg rounded-card border-2 border-paper-200 hover:border-paper-300 transition-colors"
                            >
                                See how it works
                            </Link>
                        </div>

                        {/* Trust note */}
                        <p className="text-paper-400 text-sm mt-6">
                            Free to use • No credit card required • Your data stays private
                        </p>
                    </div>
                </section>

                {/* How it works */}
                <section id="how-it-works" className="py-20 px-6 bg-white">
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="font-display text-3xl md:text-4xl font-bold text-paper-900 mb-4">
                                Three steps. That's it.
                            </h2>
                            <p className="text-paper-500 text-lg">
                                We made it simple on purpose.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {/* Step 1 */}
                            <div className="text-center">
                                <div className="w-16 h-16 bg-punch-100 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3">
                                    <span className="font-display font-bold text-2xl text-punch-500">1</span>
                                </div>
                                <h3 className="font-display font-semibold text-xl text-paper-900 mb-3">
                                    Drop your data
                                </h3>
                                <p className="text-paper-500">
                                    Drag a CSV file onto the page. We'll keep it safe and private.
                                </p>
                            </div>

                            {/* Step 2 */}
                            <div className="text-center">
                                <div className="w-16 h-16 bg-calm-100 rounded-2xl flex items-center justify-center mx-auto mb-6 -rotate-2">
                                    <span className="font-display font-bold text-2xl text-calm-600">2</span>
                                </div>
                                <h3 className="font-display font-semibold text-xl text-paper-900 mb-3">
                                    Ask a question
                                </h3>
                                <p className="text-paper-500">
                                    Tell the AI what you want to know. Plain English works great.
                                </p>
                            </div>

                            {/* Step 3 */}
                            <div className="text-center">
                                <div className="w-16 h-16 bg-paper-200 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-2">
                                    <span className="font-display font-bold text-2xl text-paper-600">3</span>
                                </div>
                                <h3 className="font-display font-semibold text-xl text-paper-900 mb-3">
                                    Get your program
                                </h3>
                                <p className="text-paper-500">
                                    The AI writes Python code, runs it, and shows you the results.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section className="py-20 px-6">
                    <div className="max-w-5xl mx-auto">
                        <div className="grid md:grid-cols-2 gap-6">
                            <FeatureCard
                                icon={ChatIcon}
                                title="Chat-based interface"
                                description="Just describe what you want. Find outliers, spot trends, compare columns—whatever you need."
                                color="punch"
                            />
                            <FeatureCard
                                icon={CodeIcon}
                                title="Real Python code"
                                description="See exactly what's running. Learn from it, modify it, or just trust it and move on."
                                color="calm"
                            />
                            <FeatureCard
                                icon={LibraryIcon}
                                title="Build a library"
                                description="Save scripts that work. Run them again on new data. Build your collection."
                                color="calm"
                            />
                            <FeatureCard
                                icon={LockIcon}
                                title="Private by default"
                                description="Your data never leaves your account. We don't look at it, sell it, or train on it."
                                color="punch"
                            />
                        </div>
                    </div>
                </section>

                {/* CTA section */}
                <section className="py-20 px-6">
                    <div className="max-w-3xl mx-auto">
                        <div className="bg-paper-900 rounded-2xl p-12 text-center relative overflow-hidden">
                            {/* Decorative elements */}
                            <div className="absolute top-4 left-4 w-8 h-8 border-2 border-paper-700 rounded-lg rotate-12"></div>
                            <div className="absolute bottom-6 right-8 w-6 h-6 bg-punch-500/20 rounded-full"></div>
                            <div className="absolute top-1/2 right-4 w-4 h-4 border-2 border-calm-500/30 rounded-full"></div>

                            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4 relative z-10">
                                Ready to analyze something?
                            </h2>
                            <p className="text-paper-400 text-lg mb-8 relative z-10">
                                Your first little program is just a conversation away.
                            </p>
                            <Link
                                href={route('register')}
                                className="inline-flex px-8 py-4 bg-punch-500 text-white font-display font-semibold text-lg rounded-card hover:bg-punch-400 transition-all hover:-translate-y-0.5 relative z-10"
                            >
                                Get started free
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="py-12 px-6 border-t border-paper-200">
                    <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-punch-500 rounded-soft flex items-center justify-center">
                                <span className="text-white font-display font-bold text-sm">LP</span>
                            </div>
                            <span className="text-paper-400 text-sm">
                                © {new Date().getFullYear()} Little Programs
                            </span>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                            <a href="#" className="text-paper-500 hover:text-paper-700 transition-colors">
                                Privacy
                            </a>
                            <a href="#" className="text-paper-500 hover:text-paper-700 transition-colors">
                                Terms
                            </a>
                            <a href="#" className="text-paper-500 hover:text-paper-700 transition-colors">
                                Contact
                            </a>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}

// Feature card component
function FeatureCard({ icon: Icon, title, description, color }) {
    return (
        <div className="bg-white rounded-card p-6 border border-paper-200 hover:shadow-card transition-shadow">
            <div className={`
                w-12 h-12 rounded-card flex items-center justify-center mb-4
                ${color === 'punch' ? 'bg-punch-100' : 'bg-calm-100'}
            `}>
                <Icon className={`w-6 h-6 ${color === 'punch' ? 'text-punch-500' : 'text-calm-600'}`} />
            </div>
            <h3 className="font-display font-semibold text-lg text-paper-900 mb-2">
                {title}
            </h3>
            <p className="text-paper-500">
                {description}
            </p>
        </div>
    );
}

// Icons
function SparkleIcon({ className }) {
    return (
        <svg className={className} fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zm0 13a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zm-7-5a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 013 10zm13 0a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 0116 10zm-9.536 4.536a.75.75 0 010-1.06l1.06-1.061a.75.75 0 011.061 1.06l-1.06 1.061a.75.75 0 01-1.061 0zm6.011-6.011a.75.75 0 010-1.06l1.06-1.061a.75.75 0 111.061 1.06l-1.06 1.061a.75.75 0 01-1.061 0zm-6.01 0a.75.75 0 01-1.061 0l-1.06-1.06a.75.75 0 011.06-1.061l1.061 1.06a.75.75 0 010 1.061zm6.01 6.011a.75.75 0 01-1.06 0l-1.061-1.06a.75.75 0 011.06-1.061l1.061 1.06a.75.75 0 010 1.061z" />
        </svg>
    );
}

function ChatIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
        </svg>
    );
}

function CodeIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
        </svg>
    );
}

function LibraryIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
        </svg>
    );
}

function LockIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
    );
}
