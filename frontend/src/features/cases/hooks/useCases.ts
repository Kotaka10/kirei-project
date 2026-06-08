import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../auth/context/AuthContext";
import { fetchCases, createCase, updateCaseStatus } from "../lib/caseApi";
import type { CaseRecord, CreateCaseResponse } from "../types/caseTypes";

export function useCases() {
    const { token } = useAuth();
    const [cases, setCases] = useState<CaseRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        setError(null);
        try {
            const data = await fetchCases(token);
            setCases(data);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { load(); }, [load]);

    const create = useCallback(
        async (summary: string): Promise<CreateCaseResponse> => {
            if (!token) throw new Error("認証が必要です");
            const result = await createCase(summary, token);
            await load();
            return result;
        },
        [token, load],
    );

    const changeStatus = useCallback(
        async (id: number, status: "open" | "in_progress" | "closed") => {
            if (!token) return;
            await updateCaseStatus(id, status, token);
            await load();
        },
        [token, load],
    );

    return { cases, loading, error, create, changeStatus, reload: load };
}