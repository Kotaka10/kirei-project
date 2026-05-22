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
    ) {
        const key     = this.buildSessionKey(ctx.staffId, sessionId);
        const history = this.sessions.get(key) ?? [];

        const conn = await getConnection();
        try {
            const { reply, history: newHistory } = await chat(
                conn,
                message,
                history,
                ctx
            );

            this.sessions.set(key, newHistory.slice(-40));

            return { reply, session_id: sessionId };
        } finally {
            await conn.end();
        }
    }

    resetSession(staffId: number, sessionId: string = "default"): void {
        const key = this.buildSessionKey(staffId, sessionId);
        this.sessions.delete(key);
    }
}