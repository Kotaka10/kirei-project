import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../auth/context/AuthContext";
import { approvalApi } from "../lib/api";
import type { AssignmentRequest } from "../types/approvalTypes";

export function useApprovals(statusFilter?: string) {
    const { token } = useAuth();
    const [requests, setRequests] = useState<AssignmentRequest[]>([]);
    const [loading,  setLoading]  = useState(false);
    const [error,    setError]    = useState<string | null>(null);

    const fetchRequests = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        setError(null);
        try {
            const data = await approvalApi.listRequests(token, statusFilter);
            setRequests(data);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [token, statusFilter]);

    useEffect(() => { fetchRequests(); }, [fetchRequests]);

    const approve = async (id: number) => {
        if (!token) return;
        await approvalApi.approve(token, id);
        await fetchRequests();
        window.dispatchEvent(new Event("approvals:updated"));
    };

    const reject = async (id: number) => {
        if (!token) return;
        await approvalApi.reject(token, id);
        await fetchRequests();
        window.dispatchEvent(new Event("approvals:updated"));
    };

    return { requests, loading, error, approve, reject, refetch: fetchRequests };
}

export function usePendingCount() {
    const { token, user } = useAuth();
    const [count, setCount] = useState(0);

    const fetchCount = useCallback(async () => {
        if (!token || user?.role !== "supervisor") return;
        try {
            const { count: c } = await approvalApi.getPendingCount(token);
            setCount(c);
        } catch {
            // badge はサイレント失敗
        }
    }, [token, user]);

    useEffect(() => {
        fetchCount();
        const id = setInterval(fetchCount, 30_000);
        window.addEventListener("approvals:updated", fetchCount);
        return () => {
            clearInterval(id);
            window.removeEventListener("approvals:updated", fetchCount);
        };
    }, [fetchCount]);

    return count;
}
