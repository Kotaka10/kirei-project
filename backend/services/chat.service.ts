import type { ChatCompletionMessageParam } from "openai/resources";
import type { Connection } from "mysql2/promise";
import type { UserContext } from "../types/auth.js";
import { chat } from "../ai/chat.js";
import { getConnection } from "../db/connection.js";
import { AiQuestionRepository } from "../repositories/aiQuestionRepository.js";
import { ChatHistoryRepository } from "../repositories/chatHistoryRepository.js";

export class ChatService {
    // サーバー再起動までのインメモリキャッシュ（DB が応答源、パフォーマンス用途）
    private readonly sessions     = new Map<string, ChatCompletionMessageParam[]>();
    private readonly repo         = new ChatHistoryRepository();
    private readonly questionRepo = new AiQuestionRepository();

    private buildKey(staffId: number, sessionId: number): string {
        return `staff_${staffId}_session_${sessionId}`;
    }

    private generateTitle(firstMessage: string): string {
        return firstMessage.length > 30 ? firstMessage.slice(0, 30) + "…" : firstMessage;
    }

    async sendMessage(
        message:   string,
        sessionId: string | undefined,
        ctx:       UserContext,
        onChunk:   (delta: string) => void,
    ) {
        const conn = await getConnection();
        let dbSessionId: number;

        try {
            if (!sessionId || isNaN(parseInt(sessionId, 10))) {
                // 新規セッション: リポジトリ経由で作成
                dbSessionId = await this.repo.create(conn, ctx.staffId, this.generateTitle(message));
            } else {
                dbSessionId = parseInt(sessionId, 10);
            }

            const key = this.buildKey(ctx.staffId, dbSessionId);

            // キャッシュになければ DB から会話コンテキストを復元
            if (!this.sessions.has(key)) {
                const history = await this.repo.findHistoryForContext(conn, dbSessionId, ctx.staffId);
                this.sessions.set(key, history);
            }

            const history = this.sessions.get(key) ?? [];

            const { reply, history: newHistory, assignmentRequested, suggestions } = await chat(
                conn,
                message,
                history,
                ctx,
                onChunk,
            );

            // インメモリ更新（先頭が tool ロールにならないよう user から始める）
            const trimmed      = newHistory.slice(-40);
            const firstUserIdx = trimmed.findIndex(m => m.role === "user");
            this.sessions.set(key, firstUserIdx > 0 ? trimmed.slice(firstUserIdx) : trimmed);

            const popularSuggestions = await this.findPopularQuestionSuggestions(conn);
            const responseSuggestions = popularSuggestions.length > 0 ? popularSuggestions : suggestions;

            // DB 永続化
            await this.repo.saveExchange(conn, dbSessionId, message, reply, responseSuggestions);

            return {
                reply,
                session_id:           String(dbSessionId),
                assignment_requested: assignmentRequested,
                suggestions:          responseSuggestions,
            };
        } finally {
            await conn.end();
        }
    }

    private async findPopularQuestionSuggestions(conn: Connection): Promise<string[]> {
        const rows = await this.questionRepo.findFrequentQuestions(conn, 3);
        return rows
            .map(row => normalizeSuggestion(row.question))
            .filter((question): question is string => question !== null);
    }

    resetSession(staffId: number, sessionId: string = "default"): void {
        const numId = parseInt(sessionId, 10);
        if (!isNaN(numId)) {
            this.sessions.delete(this.buildKey(staffId, numId));
        }
    }
}

function normalizeSuggestion(question: string): string | null {
    const normalized = question.replace(/\s+/g, " ").trim();
    if (!normalized) return null;
    return normalized.slice(0, 60);
}
