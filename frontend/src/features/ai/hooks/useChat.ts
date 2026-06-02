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

    const sessionIdRef      = useRef<string | undefined>(undefined);
    // 進行中リクエストを中断するためのコントローラー
    const abortControllerRef = useRef<AbortController | null>(null);

    const sendMessage = useCallback(async (content: string) => {
        setError(null);

        if (!token) {
            setError("ログインが必要です");
            return;
        }

        // 前のリクエストが残っていれば中断してから新規送信
        abortControllerRef.current?.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;

        const userMsg: Message = {
            id:        crypto.randomUUID(),
            role:      "user",
            content,
            timestamp: new Date(),
        };

        const aiMsgId = crypto.randomUUID();
        const placeholderMsg: Message = {
            id:        aiMsgId,
            role:      "assistant",
            content:   "",
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMsg, placeholderMsg]);
        setIsLoading(true);

        try {
            const res = await sendChatMessage(
                content,
                sessionIdRef.current,
                token,
                (delta) => {
                    setMessages((prev) =>
                        prev.map((m) => m.id === aiMsgId ? { ...m, content: m.content + delta } : m)
                    );
                },
                controller.signal,
            );

            sessionIdRef.current = res.session_id;

            if (res.suggestions && res.suggestions.length > 0) {
                setMessages((prev) =>
                    prev.map((m) => m.id === aiMsgId ? { ...m, suggestions: res.suggestions } : m)
                );
            }

            if (res.assignment_requested) {
                window.dispatchEvent(new Event("approvals:updated"));
            }
        } catch (err: unknown) {
            // ユーザー操作による中断はエラー扱いしない
            if (err instanceof DOMException && err.name === "AbortError") return;
            const message = err instanceof Error ? err.message : "エラーが発生しました";
            setError(message);
            setMessages((prev) => prev.filter((m) => m.id !== userMsg.id && m.id !== aiMsgId));
        } finally {
            // このコントローラーがまだ現役のときだけローディングを解除
            if (abortControllerRef.current === controller) {
                setIsLoading(false);
            }
        }
    }, [token]);

    const clearHistory = useCallback(() => {
        // 進行中のSSEストリームを即座に中断
        abortControllerRef.current?.abort();
        abortControllerRef.current = null;

        setMessages([]);
        setIsLoading(false);
        setError(null);

        if (token && sessionIdRef.current) {
            resetChatSession(sessionIdRef.current, token).catch(() => {});
        }
        sessionIdRef.current = undefined;
    }, [token]);

    return { messages, isLoading, error, sendMessage, clearHistory };
}
