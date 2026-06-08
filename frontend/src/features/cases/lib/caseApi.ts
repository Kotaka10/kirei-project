import type { CaseRecord, CaseNotification, CreateCaseResponse } from "../types/caseTypes";

const API_BASE = import.meta.env.VITE_API_URL ?? "https://waviness-unsightly-freely.ngrok-free.dev";

async function authFetch<T>(path: string, token: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...(options?.headers ?? {}),
        },
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `エラー（${res.status}）`);
    }
    return res.json() as Promise<T>;
}

export function fetchCases(token: string): Promise<CaseRecord[]> {
    return authFetch<CaseRecord[]>("/api/cases", token);
}

export function fetchCaseById(id: number, token: string): Promise<CaseRecord> {
    return authFetch<CaseRecord>(`/api/cases/${id}`, token);
}

export function createCase(summary: string, token: string): Promise<CreateCaseResponse> {
    return authFetch<CreateCaseResponse>("/api/cases", token, {
        method: "POST",
        body: JSON.stringify({ summary }),
    });
}

export function updateCaseStatus(
    id: number,
    status: "open" | "in_progress" | "closed",
    token: string,
): Promise<void> {
    return authFetch<void>(`/api/cases/${id}/status`, token, {
        method: "PATCH",
        body: JSON.stringify({ status }),
    });
}

export function fetchNotifications(token: string): Promise<CaseNotification[]> {
    return authFetch<CaseNotification[]>("/api/cases/notifications/me", token);
}

export function fetchUnreadCount(token: string): Promise<{ count: number }> {
    return authFetch<{ count: number }>("/api/cases/notifications/unread-count", token);
}

export function markNotificationRead(id: number, token: string): Promise<void> {
    return authFetch<void>(`/api/cases/notifications/${id}/read`, token, { method: "PATCH" });
}

export function markAllNotificationsRead(token: string): Promise<void> {
    return authFetch<void>("/api/cases/notifications/read-all", token, { method: "PATCH" });
}