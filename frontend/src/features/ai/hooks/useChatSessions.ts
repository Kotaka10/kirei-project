import { useState, useCallback } from "react";
import type { ChatSession } from "../types/sessionTypes";
import { fetchSessions, renameSession, deleteSession } from "../lib/sessionApi";
import { useAuth } from "../../auth/context/AuthContext";

export function useChatSessions() {
    const [sessions,   setSessions]   = useState<ChatSession[]>([]);
    const [isLoading,  setIsLoading]  = useState(false);
    const { token } = useAuth();

    const loadSessions = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const data = await fetchSessions(token);
            setSessions(data);
        } catch {
            // 失敗してもサイレントに継続
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    // 新規セッションが作られたとき or 最終更新日時を更新するとき
    const upsertSession = useCallback((session: ChatSession) => {
        setSessions(prev => {
            const idx = prev.findIndex(s => s.id === session.id);
            if (idx >= 0) {
                const next = [...prev];
                next[idx] = session;
                // updated_at 降順を維持
                return next.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
            }
            return [session, ...prev];
        });
    }, []);

    const rename = useCallback(async (sessionId: number, title: string) => {
        if (!token) return;
        await renameSession(sessionId, title, token);
        setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title } : s));
    }, [token]);

    const remove = useCallback(async (sessionId: number) => {
        if (!token) return;
        await deleteSession(sessionId, token);
        setSessions(prev => prev.filter(s => s.id !== sessionId));
    }, [token]);

    return { sessions, isLoading, loadSessions, upsertSession, rename, remove };
}