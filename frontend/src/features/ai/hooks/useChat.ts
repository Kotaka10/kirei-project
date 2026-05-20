import { useState, useRef, useCallback } from "react";
import type { Message } from "../types/chatTypes";
import { sendChatMessage } from "../lib/api";

export function useChat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 再レンダリングせず値保持　useRefは再レンダリングしても値が消えない
    const sessionIdRef = useRef<string | undefined>(undefined);

    const sendMessage = useCallback(async (content: string) => {
        setError(null);

        const userMsg: Message = {
            id:        crypto.randomUUID(),
            role:      "user",
            content,
            timestamp: new Date(),
        }
        setMessages((prev) => [...prev, userMsg]);
        setIsLoading(true);

        try {
            const res = await sendChatMessage(content, sessionIdRef.current);

            sessionIdRef.current = res.session_id;

            const aiMsg: Message = {
                id:        crypto.randomUUID(),
                role:      "assistant",
                content:   res.reply,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, aiMsg]);
        } catch (err: any) {
            setError(err.message ?? "エラーが発生しました");
            setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
        } finally {
            setIsLoading(false);
        }
    }, []);

    const clearHistory = useCallback(() => {
        setMessages([]);
        setError(null);
        sessionIdRef.current = undefined;
    }, []);

    return { messages, isLoading, error, sendMessage, clearHistory };
}

// メッセージ管理
// ↓
// API送信
// ↓
// ローディング管理
// ↓
// エラー管理
// ↓
// 会話履歴管理