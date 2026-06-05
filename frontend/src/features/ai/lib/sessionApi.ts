import type { ChatSession, SessionMessage } from "../types/sessionTypes";

const API_BASE = import.meta.env.VITE_API_URL ?? "https://waviness-unsightly-freely.ngrok-free.dev";

async function authFetch<T>(path: string, token: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Authorization:  `Bearer ${token}`,
            ...(options?.headers ?? {}),
        },
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `エラー（${res.status}）`);
    }
    return res.json() as Promise<T>;
}

export function fetchSessions(token: string): Promise<ChatSession[]> {
    return authFetch<ChatSession[]>("/api/chat/sessions", token);
}

export function fetchSessionMessages(sessionId: number, token: string): Promise<SessionMessage[]> {
    return authFetch<SessionMessage[]>(`/api/chat/sessions/${sessionId}`, token);
}

export function renameSession(sessionId: number, title: string, token: string): Promise<void> {
    return authFetch<void>(`/api/chat/sessions/${sessionId}`, token, {
        method: "PATCH",
        body:   JSON.stringify({ title }),
    });
}

export function deleteSession(sessionId: number, token: string): Promise<void> {
    return authFetch<void>(`/api/chat/sessions/${sessionId}`, token, {
        method: "DELETE",
    });
}