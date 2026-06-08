import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../auth/context/AuthContext";
import {
    fetchNotifications,
    fetchUnreadCount,
    markNotificationRead,
    markAllNotificationsRead,
} from "../../cases/lib/caseApi";
import type { CaseNotification } from "../../cases/types/caseTypes";

export function useNotifications() {
    const { token } = useAuth();
    const [notifications, setNotifications] = useState<CaseNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadAll = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        setError(null);
        try {
            const [data, countData] = await Promise.all([
                fetchNotifications(token),
                fetchUnreadCount(token),
            ]);
            setNotifications(data);
            setUnreadCount(countData.count);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    const loadCount = useCallback(async () => {
        if (!token) return;
        try {
            const data = await fetchUnreadCount(token);
            setUnreadCount(data.count);
        } catch { /* silent */ }
    }, [token]);

    useEffect(() => { loadAll(); }, [loadAll]);

    const markRead = useCallback(
        async (id: number) => {
            if (!token) return;
            await markNotificationRead(id, token);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        },
        [token],
    );

    const markAll = useCallback(async () => {
        if (!token) return;
        await markAllNotificationsRead(token);
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
    }, [token]);

    return { notifications, unreadCount, loading, error, markRead, markAll, reload: loadAll, loadCount };
}