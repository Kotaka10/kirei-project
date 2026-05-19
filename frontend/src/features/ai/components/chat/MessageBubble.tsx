import type { Message } from "../../types/chat";

interface Props {
    message: Message;
}

export function MessageBubble({ message }: Props) {
    const isUser = message.role === "user";

    const time = message.timestamp.toLocaleTimeString("ja-JP", {
        hour:     "2-digit",
        minute:   "2-digit",
    });

    return (
        <div className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
            {/* アバター */}
            {!isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-600 flex items-center justify-center shadow-sm">
                    <span className="text-white text-xs font-bold">AI</span>
                </div>
            )}

            <div className={`flex flex-col gap-1 max-w-[75%] ${isUser ? "items-end" : "items-start"}`}>
                {/* 吹き出し */}
                {/* whitespace-pre-wrap = 改行維持, pre = 改行維持, wrap = 画面幅で折り返す */}
                <div className={`
                    px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm
                    ${isUser ? "bg-red-600 text-white rounded-br-sm" : "bg-white text-gray-800 border border-gray-100 rounded-bl-sm"}
                `}>
                    {message.content}
                </div>
                <span className="text-[10px] text-gray-400 px-1">{time}</span>
            </div>
        </div>
    )
}