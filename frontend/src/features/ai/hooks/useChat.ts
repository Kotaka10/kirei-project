import { useState, useRef, useCallback, useEffect } from "react";
import type { Message } from "../types/chatTypes";
import { sendChatMessage } from "../lib/api";
import { fetchSessionMessages } from "../lib/sessionApi";
import { useAuth } from "../../auth/context/AuthContext";

interface UseChatOptions {
    activeSessionId:  number | null;
    onSessionCreated: (sessionId: number) => void;
}

export function useChat({ activeSessionId, onSessionCreated }: UseChatOptions) {
    const [messages,  setMessages]  = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error,     setError]     = useState<string | null>(null);

    const { token } = useAuth();
    const abortControllerRef = useRef<AbortController | null>(null); // AbortControllerはWeb標準API

    // セッション切り替え時: DBからメッセージを復元
    useEffect(() => {
        abortControllerRef.current?.abort();
        abortControllerRef.current = null;
        setError(null);

        if (activeSessionId === null) {
            setMessages([]);
            setIsLoading(false);
            return;
        }

        if (!token) return;

        setIsLoading(true);
        fetchSessionMessages(activeSessionId, token)
            .then(msgs => {
                setMessages(msgs
                    .filter(m => m.content) // contentが空のメッセージを除外する
                    .map(m => ({
                        id:          String(m.id),
                        role:        m.role,
                        content:     m.content,
                        timestamp:   new Date(m.created_at),
                        suggestions: m.suggestions,
                    }))
                );
            })
            .catch(() => setError("履歴の読み込みに失敗しました"))
            .finally(() => setIsLoading(false));
    }, [activeSessionId, token]);

    const sendMessage = useCallback(async (content: string) => {
        setError(null);
        if (!token) { setError("ログインが必要です"); return; }

        abortControllerRef.current?.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;

        const isNewSession = activeSessionId === null;

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

        setMessages(prev => [...prev, userMsg, placeholderMsg]);
        setIsLoading(true);

        try {
            const res = await sendChatMessage(
                content,
                activeSessionId !== null ? String(activeSessionId) : undefined,
                token,
                delta => {
                    setMessages(prev =>
                        prev.map(m => m.id === aiMsgId ? { ...m, content: m.content + delta } : m)
                    );
                },
                controller.signal,
            );

            // 新規セッションの場合は親に通知
            if (isNewSession && res.session_id) {
                onSessionCreated(parseInt(res.session_id, 10));
            }

            if (res.suggestions && res.suggestions.length > 0) {
                setMessages(prev =>
                    prev.map(m => m.id === aiMsgId ? { ...m, suggestions: res.suggestions } : m)
                );
            }

            if (res.assignment_requested) {
                window.dispatchEvent(new Event("approvals:updated"));
            }
        } catch (err: unknown) {
            if (err instanceof DOMException && err.name === "AbortError") return;
            const message = err instanceof Error ? err.message : "エラーが発生しました";
            setError(message);
            setMessages(prev => prev.filter(m => m.id !== userMsg.id && m.id !== aiMsgId));
        } finally {
            if (abortControllerRef.current === controller) setIsLoading(false);
        }
    }, [token, activeSessionId, onSessionCreated]);

    return { messages, isLoading, error, sendMessage };
}