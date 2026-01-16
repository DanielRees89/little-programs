import { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';

const navigation = [
    {
        name: 'Chat',
        href: '/chat',
        icon: ChatIcon,
        description: 'Talk to your AI buddy',
        hasDropdown: true,
    },
    {
        name: 'Scripts',
        href: '/scripts',
        icon: ScriptsIcon,
        description: 'Your little programs',
    },
    {
        name: 'Data',
        href: '/data',
        icon: DataIcon,
        description: 'CSVs and uploads',
    },
    {
        name: 'Playground',
        href: '/playground',
        icon: PlaygroundIcon,
        description: 'Run and experiment',
    },
];

export default function AppLayout({ children, title, currentConversationId = null }) {
    const { auth, chatConversations = [] } = usePage().props;
    const { url } = usePage();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [chatDropdownOpen, setChatDropdownOpen] = useState(false);

    const isActive = (href) => url.startsWith(href);

    // Auto-open chat dropdown when on chat page
    useEffect(() => {
        if (isActive('/chat')) {
            setChatDropdownOpen(true);
        }
    }, [url]);

    const handleNewConversation = () => {
        router.visit('/chat', {
            data: { new: true },
            preserveState: false,
        });
    };

    const handleConversationClick = (conversationId) => {
        router.visit(`/chat?conversation=${conversationId}`);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="min-h-screen bg-paper-100">
            {/* Sidebar */}
            <aside
                className={`
                    fixed top-0 left-0 z-40
                    h-screen
                    bg-white
                    border-r border-paper-200
                    transition-all duration-300
                    ${sidebarOpen ? 'w-64' : 'w-20'}
                `}
            >
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-paper-200">
                    <Link href="/dashboard" className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-punch-500 rounded-card flex items-center justify-center">
                            <span className="text-white font-display font-bold text-lg">LP</span>
                        </div>
                        {sidebarOpen && (
                            <span className="font-display font-semibold text-paper-900">
                                Little Programs
                            </span>
                        )}
                    </Link>
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 rounded-soft hover:bg-paper-100 text-paper-500"
                    >
                        <CollapseIcon collapsed={!sidebarOpen} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="p-3 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 140px)' }}>
                    {navigation.map((item) => (
                        <div key={item.name}>
                            {item.hasDropdown ? (
                                // Chat item with dropdown
                                <div>
                                    <button
                                        onClick={() => {
                                            if (sidebarOpen) {
                                                setChatDropdownOpen(!chatDropdownOpen);
                                            } else {
                                                router.visit(item.href);
                                            }
                                        }}
                                        className={`
                                            w-full flex items-center gap-3
                                            px-3 py-2.5
                                            rounded-soft
                                            transition-all duration-200
                                            group
                                            ${isActive(item.href)
                                                ? 'bg-punch-50 text-punch-600'
                                                : 'text-paper-600 hover:bg-paper-100 hover:text-paper-900'
                                            }
                                        `}
                                    >
                                        <item.icon
                                            className={`w-5 h-5 flex-shrink-0 ${
                                                isActive(item.href) ? 'text-punch-500' : 'text-paper-400 group-hover:text-paper-600'
                                            }`}
                                        />
                                        {sidebarOpen && (
                                            <>
                                                <div className="flex-1 min-w-0 text-left">
                                                    <p className="font-medium truncate">{item.name}</p>
                                                    <p className={`text-xs truncate ${
                                                        isActive(item.href) ? 'text-punch-400' : 'text-paper-400'
                                                    }`}>
                                                        {item.description}
                                                    </p>
                                                </div>
                                                <ChevronIcon 
                                                    className={`w-4 h-4 transition-transform duration-200 ${
                                                        chatDropdownOpen ? 'rotate-180' : ''
                                                    } ${isActive(item.href) ? 'text-punch-400' : 'text-paper-400'}`}
                                                />
                                            </>
                                        )}
                                    </button>

                                    {/* Dropdown content */}
                                    {sidebarOpen && chatDropdownOpen && (
                                        <div className="mt-1 ml-3 pl-5 border-l-2 border-paper-200 space-y-1">
                                            {/* New conversation button */}
                                            <button
                                                onClick={handleNewConversation}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-punch-600 hover:bg-punch-50 rounded-soft transition-colors"
                                            >
                                                <PlusIcon className="w-4 h-4" />
                                                <span className="font-medium">New conversation</span>
                                            </button>

                                            {/* Conversation list */}
                                            {chatConversations.length > 0 ? (
                                                <div className="space-y-0.5 max-h-64 overflow-y-auto">
                                                    {chatConversations.map((conv) => (
                                                        <button
                                                            key={conv.id}
                                                            onClick={() => handleConversationClick(conv.id)}
                                                            className={`
                                                                w-full flex flex-col items-start
                                                                px-3 py-2
                                                                text-left text-sm
                                                                rounded-soft
                                                                transition-colors
                                                                ${currentConversationId === conv.id
                                                                    ? 'bg-punch-100 text-punch-700'
                                                                    : 'text-paper-600 hover:bg-paper-100'
                                                                }
                                                            `}
                                                        >
                                                            <span className="truncate w-full font-medium">
                                                                {conv.title || 'New conversation'}
                                                            </span>
                                                            <span className={`text-xs ${
                                                                currentConversationId === conv.id
                                                                    ? 'text-punch-400'
                                                                    : 'text-paper-400'
                                                            }`}>
                                                                {formatDate(conv.updated_at)}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="px-3 py-2 text-xs text-paper-400">
                                                    No conversations yet
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                // Regular nav item
                                <Link
                                    href={item.href}
                                    className={`
                                        flex items-center gap-3
                                        px-3 py-2.5
                                        rounded-soft
                                        transition-all duration-200
                                        group
                                        ${isActive(item.href)
                                            ? 'bg-punch-50 text-punch-600'
                                            : 'text-paper-600 hover:bg-paper-100 hover:text-paper-900'
                                        }
                                    `}
                                >
                                    <item.icon
                                        className={`w-5 h-5 flex-shrink-0 ${
                                            isActive(item.href) ? 'text-punch-500' : 'text-paper-400 group-hover:text-paper-600'
                                        }`}
                                    />
                                    {sidebarOpen && (
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{item.name}</p>
                                            <p className={`text-xs truncate ${
                                                isActive(item.href) ? 'text-punch-400' : 'text-paper-400'
                                            }`}>
                                                {item.description}
                                            </p>
                                        </div>
                                    )}
                                    {isActive(item.href) && sidebarOpen && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-punch-500" />
                                    )}
                                </Link>
                            )}
                        </div>
                    ))}
                </nav>

                {/* User section at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-paper-200 bg-white">
                    <div className={`
                        flex items-center gap-3
                        px-3 py-2
                        rounded-soft
                        hover:bg-paper-100
                        cursor-pointer
                        transition-colors
                    `}>
                        <div className="w-8 h-8 bg-calm-100 rounded-full flex items-center justify-center">
                            <span className="text-calm-600 font-display font-semibold text-sm">
                                {auth.user.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        {sidebarOpen && (
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-paper-900 truncate">
                                    {auth.user.name}
                                </p>
                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    className="text-xs text-paper-400 hover:text-punch-500"
                                >
                                    Sign out
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <main
                className={`
                    transition-all duration-300
                    ${sidebarOpen ? 'ml-64' : 'ml-20'}
                `}
            >
                {/* Header */}
                {title && (
                    <header className="h-16 bg-white border-b border-paper-200 flex items-center px-6">
                        <h1 className="font-display font-semibold text-xl text-paper-900">
                            {title}
                        </h1>
                    </header>
                )}

                {/* Page content */}
                <div className="p-6">
                    {children}
                </div>
            </main>
        </div>
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
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125" />
        </svg>
    );
}

function PlaygroundIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
        </svg>
    );
}

function CollapseIcon({ collapsed }) {
    return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            {collapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            )}
        </svg>
    );
}

function ChevronIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
    );
}

function PlusIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
    );
}
