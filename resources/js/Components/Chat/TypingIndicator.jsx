export default function TypingIndicator() {
    return (
        <div className="bg-white border border-paper-200 rounded-card px-4 py-3 inline-block">
            <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-paper-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2 h-2 bg-paper-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2 h-2 bg-paper-400 rounded-full animate-bounce" />
            </div>
        </div>
    );
}
