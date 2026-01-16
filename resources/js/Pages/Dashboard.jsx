import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Card, Button } from '@/Components/UI';

export default function Dashboard() {
    const quickActions = [
        {
            title: 'Start chatting',
            description: "Tell the AI what you're trying to analyze. It'll write the code for you.",
            href: '/chat',
            icon: ChatIcon,
            color: 'punch',
            cta: 'Open chat',
        },
        {
            title: 'Browse your scripts',
            description: 'All your little programs, saved and ready to run again.',
            href: '/scripts',
            icon: ScriptsIcon,
            color: 'calm',
            cta: 'View scripts',
        },
        {
            title: 'Upload some data',
            description: 'Drop a CSV file and get it ready for analysis.',
            href: '/data',
            icon: DataIcon,
            color: 'paper',
            cta: 'Upload CSV',
        },
        {
            title: 'Run something',
            description: 'Pick a script, pick a file, see what happens.',
            href: '/playground',
            icon: PlayIcon,
            color: 'punch',
            cta: 'Go play',
        },
    ];

    return (
        <AppLayout title="Dashboard">
            <Head title="Dashboard" />

            <div className="max-w-5xl">
                {/* Welcome section */}
                <div className="mb-8">
                    <h2 className="font-display text-3xl font-bold text-paper-900 mb-2">
                        What do you want to do today?
                    </h2>
                    <p className="text-paper-500 text-lg">
                        Pick a starting point, or just wander around. No judgment here.
                    </p>
                </div>

                {/* Quick actions grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {quickActions.map((action) => (
                        <Link key={action.title} href={action.href}>
                            <Card
                                variant="interactive"
                                className="h-full group"
                            >
                                <div className="flex gap-4">
                                    <div className={`
                                        w-12 h-12 rounded-card flex items-center justify-center flex-shrink-0
                                        transition-transform duration-200 group-hover:scale-110
                                        ${action.color === 'punch' ? 'bg-punch-100' : ''}
                                        ${action.color === 'calm' ? 'bg-calm-100' : ''}
                                        ${action.color === 'paper' ? 'bg-paper-200' : ''}
                                    `}>
                                        <action.icon className={`
                                            w-6 h-6
                                            ${action.color === 'punch' ? 'text-punch-500' : ''}
                                            ${action.color === 'calm' ? 'text-calm-500' : ''}
                                            ${action.color === 'paper' ? 'text-paper-600' : ''}
                                        `} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-display font-semibold text-paper-900 mb-1">
                                            {action.title}
                                        </h3>
                                        <p className="text-paper-500 text-sm mb-3">
                                            {action.description}
                                        </p>
                                        <span className="text-sm font-medium text-punch-500 group-hover:text-punch-600">
                                            {action.cta} →
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>

                {/* Tips section */}
                <Card variant="outlined" className="bg-paper-50">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-calm-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <LightbulbIcon className="w-5 h-5 text-calm-600" />
                        </div>
                        <div>
                            <h3 className="font-display font-semibold text-paper-800 mb-1">
                                Pro tip
                            </h3>
                            <p className="text-paper-600 text-sm">
                                Start with the chat if you're not sure what you need. Just describe your data 
                                and what you want to learn from it. The AI will figure out the rest and write 
                                you a little program.
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        </AppLayout>
    );
}

// Icons
function ChatIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
        </svg>
    );
}

function ScriptsIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
        </svg>
    );
}

function DataIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
    );
}

function PlayIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
        </svg>
    );
}

function LightbulbIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
        </svg>
    );
}
