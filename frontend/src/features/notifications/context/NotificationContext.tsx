import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useAuth } from "../../auth/context/AuthContext";
import {
    fetchNotifications,
    fetchUnreadCount,
    markNotificationRead,
    markAllNotificationsRead,
} from "../../cases/lib/caseApi";
import type { CaseNotification } from "../../cases/types/caseTypes";

interface NotificationContextValue {
    notifications: CaseNotification[];
    unreadCount: number;
    loading: boolean;
    error: string | null;
    markRead: (id: number) => Promise<void>;
    markAll: () => Promise<void>;
    reload: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const { token } = useAuth();
    const [notifications, setNotifications] = useState<CaseNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const reload = useCallback(async () => {
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

    useEffect(() => { reload(); }, [reload]);

    const markRead = useCallback(async (id: number) => {
        if (!token) return;
        await markNotificationRead(id, token);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
    }, [token]);

    const markAll = useCallback(async () => {
        if (!token) return;
        await markAllNotificationsRead(token);
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
    }, [token]);

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, loading, error, markRead, markAll, reload }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotificationContext(): NotificationContextValue {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error("useNotificationContext must be used within NotificationProvider");
    return ctx;
}
