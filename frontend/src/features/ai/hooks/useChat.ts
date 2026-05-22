import { useState, useRef, useCallback } from "react";
import type { Message } from "../types/chatTypes";
import { sendChatMessage } from "../lib/api";
import { resetChatSession } from "../../auth/lib/api";
import { useAuth } from "../../auth/context/AuthContext";

export function useChat() {
    const [messages,  setMessages]  = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error,     setError]     = useState<string | null>(null);

    const { token } = useAuth();

    // 再レンダリングせず値保持　useRefは再レンダリングしても値が消えない
    const sessionIdRef = useRef<string | undefined>(undefined);

    const sendMessage = useCallback(async (content: string) => {
        setError(null);

        if (!token) {
            setError("ログインが必要です");
            return;
        }

        const userMsg: Message = {
            id:        crypto.randomUUID(),
            role:      "user",
            content,
            timestamp: new Date(),
        }
        setMessages((prev) => [...prev, userMsg]);
        setIsLoading(true);

        try {
            const res = await sendChatMessage(content, sessionIdRef.current, token);

            sessionIdRef.current = res.session_id;

            const aiMsg: Message = {
                id:        crypto.randomUUID(),
                role:      "assistant",
                content:   res.reply,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, aiMsg]);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "エラーが発生しました";
            setError(message);
            setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    const clearHistory = useCallback(() => {
        setMessages([]);
        setError(null);
        if (token && sessionIdRef.current) {
            resetChatSession(sessionIdRef.current, token).catch(() => {});
        }
        sessionIdRef.current = undefined;
    }, [token]);

    return { messages, isLoading, error, sendMessage, clearHistory };
}
