import type { ChatCompletionMessageParam } from "openai/resources";
import type { UserContext } from "../types/auth.js";
import { chat } from "../ai/chat.js";
import { getConnection } from "../db/connection.js";

export class ChatService {
    private sessions = new Map<string, ChatCompletionMessageParam[]>();

    private buildSessionKey(staffId: number, sessionId: string): string {
        return `staff_${staffId}_${sessionId}`;
    }

    async sendMessage(
        message: string,
        sessionId: string = "default",
        ctx: UserContext,
        onChunk: (delta: string) => void,
    ) {
        const key     = this.buildSessionKey(ctx.staffId, sessionId);
        const history = this.sessions.get(key) ?? [];

        const conn = await getConnection();
        try {
            const { reply, history: newHistory, assignmentRequested } = await chat(
                conn,
                message,
                history,
                ctx,
                onChunk,
            );

            // tool ロールが先頭に残らないよう、最初の user メッセージから始める
            const trimmed = newHistory.slice(-40);
            const firstUserIdx = trimmed.findIndex(m => m.role === "user");
            this.sessions.set(key, firstUserIdx > 0 ? trimmed.slice(firstUserIdx) : trimmed);

            return { reply, session_id: sessionId, assignment_requested: assignmentRequested };
        } finally {
            await conn.end();
        }
    }

    resetSession(staffId: number, sessionId: string = "default"): void {
        const key = this.buildSessionKey(staffId, sessionId);
        this.sessions.delete(key);
    }
}