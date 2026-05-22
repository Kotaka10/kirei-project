import { LoginResponseSchema, type LoginRequest, type LoginResponse } from "../types/authTypes";

const API_BASE = import.meta.env.VITE_API_URL ?? "https://waviness-unsightly-freely.ngrok-free.dev";

export async function loginApi(data: LoginRequest): Promise<LoginResponse> {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(data),
    });

    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `ログインに失敗しました（${res.status}）`);
    }

    const json      = await res.json();
    const validated = LoginResponseSchema.safeParse(json);
    if (!validated.success) {
        throw new Error("APIレスポンスの形式が不正です");
    }

    return validated.data;
}

export async function resetChatSession(sessionId: string, token: string): Promise<void> {
    await fetch(`${API_BASE}/api/chat/session?session_id=${encodeURIComponent(sessionId)}`, {
        method:  "DELETE",
        headers: { Authorization: `Bearer ${token}` },
    });
}
