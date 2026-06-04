import { getConnection } from "../db/connection.js";
import { ChatHistoryRepository } from "../repositories/chatHistoryRepository.js";

// ドメイン型はリポジトリから再エクスポート（コントローラー側のインポートパスを変えない）
export type { ChatSession, ChatMessage } from "../repositories/chatHistoryRepository.js";

const repo = new ChatHistoryRepository();

export class ChatHistoryService {

    /** 最初のメッセージからセッションタイトルを生成するユーティリティ */
    generateTitle(firstMessage: string): string {
        return firstMessage.length > 30 ? firstMessage.slice(0, 30) + "…" : firstMessage;
    }

    async getSessions(staffId: number) {
        const conn = await getConnection();
        try {
            return await repo.findByStaffId(conn, staffId);
        } finally {
            await conn.end();
        }
    }

    async getMessages(sessionId: number, staffId: number) {
        const conn = await getConnection();
        try {
            return await repo.findMessagesBySessionId(conn, sessionId, staffId);
        } finally {
            await conn.end();
        }
    }

    async updateTitle(sessionId: number, staffId: number, title: string): Promise<void> {
        const conn = await getConnection();
        try {
            await repo.updateTitle(conn, sessionId, staffId, title);
        } finally {
            await conn.end();
        }
    }

    async deleteSession(sessionId: number, staffId: number): Promise<void> {
        const conn = await getConnection();
        try {
            await repo.deleteById(conn, sessionId, staffId);
        } finally {
            await conn.end();
        }
    }
}