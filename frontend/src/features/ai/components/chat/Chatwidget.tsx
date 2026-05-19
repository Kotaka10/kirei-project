import { useState } from "react";
import { ChatWindow } from "./Chatwindow";

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
            { isOpen && (
                <div className="animate-in slide-in-from-bottom-4 fade-in duration-200">
                    <ChatWindow onClose={() => setIsOpen(false)} />
                </div>
            )}
            <button
                onClick={() => setIsOpen((prev) => !prev)}
                className="
                    w-14 h-14 rounded-full bg-red-600 shadow-lg flex items-center justify-center
                    hover:bg-red-700 hover: scale-105 active:scale-50 transition-all duration-200
                "
                aria-label="AIチャットを開く"
            >
                {isOpen ? (
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                ) : (
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                    </svg>
                )}
            </button>
        </div>
    );
}