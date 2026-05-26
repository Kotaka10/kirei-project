import type { AssignmentRequest } from "../types/approvalTypes";

const API_BASE = import.meta.env.VITE_API_URL ?? "https://waviness-unsightly-freely.ngrok-free.dev";

async function apiFetch<T>(path: string, token: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...options?.headers,
        },
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `APIエラー (${res.status})`);
    }
    return res.json() as Promise<T>;
}

export const approvalApi = {
    getPendingCount: (token: string) =>
        apiFetch<{ count: number }>("/api/assignments/pending/count", token),

    listRequests: (token: string, status?: string) =>
        apiFetch<AssignmentRequest[]>(
            `/api/assignments${status ? `?status=${status}` : ""}`,
            token
        ),

    approve: (token: string, id: number) =>
        apiFetch<AssignmentRequest>(`/api/assignments/${id}/approve`, token, { method: "PUT" }),

    reject: (token: string, id: number) =>
        apiFetch<AssignmentRequest>(`/api/assignments/${id}/reject`, token, { method: "PUT" }),
};
