import ReactMarkdown from "react-markdown";
import type { Message } from "../../types/chatTypes";

interface Props {
    message: Message;
    onDocumentClick?: (path: string) => void;
}

export function MessageBubble({ message, onDocumentClick }: Props) {
    const isUser = message.role === "user";

    const time = message.timestamp.toLocaleTimeString("ja-JP", {
        hour:     "2-digit",
        minute:   "2-digit",
    });

    return (
        <div className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
            {/* アバター */}
            {!isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#48bcb6] flex items-center justify-center shadow-sm">
                    <span className="text-white text-xs font-bold">AI</span>
                </div>
            )}

            <div className={`flex flex-col gap-1 max-w-[75%] ${isUser ? "items-end" : "items-start"}`}>
                {/* 吹き出し */}
                <div className={`
                    px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm
                    ${isUser
                        ? "bg-[#48bcb6] text-white rounded-br-sm"
                        : "bg-[#e8fbf8] text-gray-800 border border-[#b7e7e2] rounded-bl-sm"
                    }
                `}>
                    {isUser ? (
                        // ユーザーメッセージはそのまま表示
                        <span className="whitespace-pre-wrap">{message.content}</span>
                    ) : (
                        // AIメッセージはMarkdownとしてレンダリング（リンクも有効化）
                        <ReactMarkdown
                            components={{
                                a: ({ href, children }) => {
                                    // 書類リンクはモーダルプレビューで開く
                                    if (href?.startsWith("/api/documents/") && onDocumentClick) {
                                        return (
                                            <button
                                                onClick={() => onDocumentClick(href)}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 mt-1 rounded-lg bg-[#e8fbf8] border border-[#48bcb6] text-[#48bcb6] text-xs font-medium hover:opacity-90 transition-opacity"
                                            >
                                                📄 {children}
                                            </button>
                                        );
                                    }
                                    return (
                                        <a
                                            href={href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="underline text-[#2a9f99] hover:text-[#1f817c] break-all"
                                        >
                                            {children}
                                        </a>
                                    );
                                },
                                p:  ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                                ul: ({ children }) => <ul className="list-disc pl-4 mb-1 space-y-0.5">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal pl-4 mb-1 space-y-0.5">{children}</ol>,
                                li: ({ children }) => <li>{children}</li>,
                                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                code: ({ children }) => (
                                    <code className="bg-white/80 border border-[#b7e7e2] rounded px-1 text-xs font-mono text-[#1f817c]">{children}</code>
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
