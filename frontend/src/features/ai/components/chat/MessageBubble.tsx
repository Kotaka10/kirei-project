import ReactMarkdown from "react-markdown";
import type { Message } from "../../types/chatTypes";

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
                <div className={`
                    px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm
                    ${isUser ? "bg-red-600 text-white rounded-br-sm" : "bg-white text-gray-800 border border-gray-100 rounded-bl-sm"}
                `}>
                    {isUser ? (
                        // ユーザーメッセージはそのまま表示
                        <span className="whitespace-pre-wrap">{message.content}</span>
                    ) : (
                        // AIメッセージはMarkdownとしてレンダリング（リンクも有効化）
                        <ReactMarkdown
                            components={{
                                a: ({ href, children }) => (
                                    <a
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline text-blue-600 hover:text-blue-800 break-all"
                                    >
                                        {children}
                                    </a>
                                ),
                                p:  ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                                ul: ({ children }) => <ul className="list-disc pl-4 mb-1 space-y-0.5">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal pl-4 mb-1 space-y-0.5">{children}</ol>,
                                li: ({ children }) => <li>{children}</li>,
                                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                code: ({ children }) => (
                                    <code className="bg-gray-100 rounded px-1 text-xs font-mono">{children}</code>
                                ),
                            }}
                        >
                            {message.content}
                        </ReactMarkdown>
                    )}
                </div>
                <span className="text-[10px] text-gray-400 px-1">{time}</span>
            </div>
        </div>
    )
}