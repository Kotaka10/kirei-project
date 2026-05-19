import { Router, type Request, type Response } from "express";
import type { ChatCompletionMessageParam } from "openai/resources";
import { chat } from "../ai/chat.js";
import { getConnection } from "../ai/db/connection.js";

const router = Router();

const sessions = new Map<string, ChatCompletionMessageParam[]>();

router.post("/", async (req: Request, res: Response) => {
    const { message, session_id } = req.body as { message?: string; session_id?: string };

    if (!message || typeof message !== "string" || message.trim() === "") {
        res.status(400).json({ error: "メッセージを入力してください" });
        return;
    }

    const sessionId = session_id ?? crypto.randomUUID();
    const history = sessions.get(sessionId) ?? [];

    const conn = await getConnection();
    try {
        const result = await chat(conn, message.trim(), history);
        sessions.set(sessionId, result.history);
        res.json({ reply: result.reply, session_id: sessionId });
    } catch (err: any) {
        console.error("[/api/chat]", err);
        res.status(500).json({ error: err.message ?? "サーバーエラーが発生しました" });
    } finally {
        await conn.end();
    }
});

export default router;
