import type { Connection, RowDataPacket, ResultSetHeader } from "mysql2/promise";
import type { ChatCompletionMessageParam } from "openai/resources";

// ─── ドメイン型 ───────────────────────────────────────────────────────────────

export interface ChatSession {
    id:         number;
    title:      string;
    created_at: string;
    updated_at: string;
}

export interface ChatMessage {
    id:           number;
    session_id:   number;
    role:         "user" | "assistant";
    content:      string;
    suggestions?: string[];
    created_at:   string;
}

// ─── リポジトリ ───────────────────────────────────────────────────────────────

export class ChatHistoryRepository {

    /** セッションを新規作成してIDを返す */
    async create(
        conn:    Connection,
        staffId: number,
        title:   string,
    ): Promise<number> {
        const [result] = await conn.execute<ResultSetHeader>(
            "INSERT INTO chat_sessions (staff_id, title) VALUES (?, ?)",
            [staffId, title],
        );
        return result.insertId;
    }

    /** スタッフのセッション一覧を updated_at 降順で取得 */
    async findByStaffId(
        conn:    Connection,
        staffId: number,
    ): Promise<ChatSession[]> {
        const [rows] = await conn.query<RowDataPacket[]>(
            `SELECT id, title, created_at, updated_at
             FROM chat_sessions
             WHERE staff_id = ?
             ORDER BY updated_at DESC
             LIMIT 50`,
            [staffId],
        );
        return rows as ChatSession[];
    }

    /** セッションのメッセージ一覧を取得（所有者チェック付き） */
    async findMessagesBySessionId(
        conn:      Connection,
        sessionId: number,
        staffId:   number,
    ): Promise<ChatMessage[]> {
        const [rows] = await conn.query<RowDataPacket[]>(
            `SELECT cm.id, cm.session_id, cm.role, cm.content, cm.suggestions, cm.created_at
             FROM chat_messages cm
             JOIN chat_sessions cs ON cm.session_id = cs.id
             WHERE cm.session_id = ? AND cs.staff_id = ?
             ORDER BY cm.created_at ASC`,
            [sessionId, staffId],
        );
        return rows.map(r => {
            const msg: ChatMessage = {
                id:         r.id         as number,
                session_id: r.session_id as number,
                role:       r.role       as "user" | "assistant",
                content:    r.content    as string,
                created_at: r.created_at as string,
            };
            if (r.suggestions) {
                // mysql2 は JSON カラムを自動パースして配列で返す場合がある
                msg.suggestions = Array.isArray(r.suggestions)
                    ? (r.suggestions as string[])
                    : JSON.parse(r.suggestions as string) as string[];
            }
            return msg;
        });
    }

    /** AI の会話コンテキスト復元用（直近 40 件、user / assistant のみ） */
    async findHistoryForContext(
        conn:      Connection,
        sessionId: number,
        staffId:   number,
    ): Promise<ChatCompletionMessageParam[]> {
        const [rows] = await conn.query<RowDataPacket[]>(
            `SELECT cm.role, cm.content
             FROM chat_messages cm
             JOIN chat_sessions cs ON cm.session_id = cs.id
             WHERE cm.session_id = ? AND cs.staff_id = ?
             ORDER BY cm.created_at ASC
             LIMIT 40`,
            [sessionId, staffId],
        );
        return rows.map(r => ({
            role:    r.role    as "user" | "assistant",
            content: r.content as string,
        }));
    }

    /** user / assistant の 1 往復をまとめて保存し、セッションの updated_at を更新 */
    async saveExchange(
        conn:        Connection,
        sessionId:   number,
        userMessage: string,
        aiReply:     string,
        suggestions?: string[],
    ): Promise<void> {
        await conn.execute(
            "INSERT INTO chat_messages (session_id, role, content) VALUES (?, 'user', ?)",
            [sessionId, userMessage],
        );
        await conn.execute(
            "INSERT INTO chat_messages (session_id, role, content, suggestions) VALUES (?, 'assistant', ?, ?)",
            [sessionId, aiReply, suggestions ? JSON.stringify(suggestions) : null],
        );
        await conn.execute(
            "UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            [sessionId],
        );
    }

    /** セッションのタイトルを更新（所有者チェック付き） */
    async updateTitle(
        conn:      Connection,
        sessionId: number,
        staffId:   number,
        title:     string,
    ): Promise<void> {
        await conn.execute(
            "UPDATE chat_sessions SET title = ? WHERE id = ? AND staff_id = ?",
            [title, sessionId, staffId],
        );
    }

    /** セッションを削除（ON DELETE CASCADE で chat_messages も削除される） */
    async deleteById(
        conn:      Connection,
        sessionId: number,
        staffId:   number,
    ): Promise<void> {
        await conn.execute(
            "DELETE FROM chat_sessions WHERE id = ? AND staff_id = ?",
            [sessionId, staffId],
        );
    }
}