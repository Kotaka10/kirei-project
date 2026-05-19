export function TypingIndicator() {
    return (
        <div className="flex items-end gap-2">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-600 flex items-center justify-center shadow-sm">
                <span className="text-white text-xs font-bold">AI</span>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1 items-center h-4">
                    {[0, 1, 2].map((i) => (
                        <span
                            key={i}
                            className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s`}}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}