import { ChatRequestSchema, type ChatResponse } from "../types/chatTypes";

const API_BASE = import.meta.env.VITE_API_URL ?? "https://waviness-unsightly-freely.ngrok-free.dev";

export async function sendChatMessage(
    message: string,
    sessionId?: string,
    token?: string,
    onChunk?: (delta: string) => void,
): Promise<ChatResponse> {
    const parsed = ChatRequestSchema.safeParse({ message, session_id: sessionId });
    if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? "入力が不正です");
    }

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify(parsed.data),
    });

    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `サーバーエラー（${res.status}）`);
    }

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let accumulated = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = JSON.parse(line.slice(6));

            if (data.delta !== undefined) {
                accumulated += data.delta;
                onChunk?.(data.delta);
            } else if (data.done) {
                return {
                    reply:                accumulated,
                    session_id:           data.session_id,
                    assignment_requested: data.assignment_requested ?? false,
                };
            } else if (data.error) {
                throw new Error(data.error);
            }
        }
    }

    throw new Error("ストリームが予期せず終了しました");
}
