import { ChatRequestSchema, ChatResponseSchema, type ChatResponse } from "../types/chatTypes";

const API_BASE = import.meta.env.VITE_API_URL ?? "https://waviness-unsightly-freely.ngrok-free.dev";

export async function sendChatMessage(
    message: string,
    sessionId?: string,
    token?: string,
): Promise<ChatResponse> {
    // safeParse = zod検証　zodに元々含まれる標準メソッド
    const parsed = ChatRequestSchema.safeParse({ message, session_id: sessionId });
    if (!parsed.success) {
        const firstError = parsed.error.issues[0]?.message ?? "入力が不正です";
        throw new Error(firstError);
    }

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify(parsed.data), // parsed.data = バリデーション済みデータ
    })

    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `サーバーエラー（${res.status}）`);
    }

    const json = await res.json();

    const validated = ChatResponseSchema.safeParse(json);
    if (!validated.success) {
        throw new Error("APIレスポンスの形式が不正です");
    }

    return validated.data;
}