import type { Request, Response } from "express";
import { z } from "zod";
import { ChatHistoryService } from "../services/chatHistory.service.js";

const service = new ChatHistoryService();

export class ChatHistoryController {
    getSessions = async (req: Request, res: Response): Promise<void> => {
        try {
            const sessions = await service.getSessions(req.user!.staff_id);
            res.json(sessions);
        } catch {
            res.status(500).json({ error: "履歴の取得に失敗しました" });
        }
    };

    getMessages = async (req: Request, res: Response): Promise<void> => {
        const id = parseInt(req.params["id"] as string);
        if (isNaN(id)) { res.status(400).json({ error: "不正なIDです" }); return; }
        try {
            const messages = await service.getMessages(id, req.user!.staff_id);
            res.json(messages);
        } catch {
            res.status(500).json({ error: "メッセージの取得に失敗しました" });
        }
    };

    renameSession = async (req: Request, res: Response): Promise<void> => {
        const id = parseInt(req.params["id"] as string);
        if (isNaN(id)) { res.status(400).json({ error: "不正なIDです" }); return; }
        const parsed = z.object({ title: z.string().min(1).max(100) }).safeParse(req.body);
        if (!parsed.success) { res.status(400).json({ error: "タイトルが不正です" }); return; }
        try {
            await service.updateTitle(id, req.user!.staff_id, parsed.data.title);
            res.json({ message: "タイトルを更新しました" });
        } catch {
            res.status(500).json({ error: "更新に失敗しました" });
        }
    };

    deleteSession = async (req: Request, res: Response): Promise<void> => {
        const id = parseInt(req.params["id"] as string);
        if (isNaN(id)) { res.status(400).json({ error: "不正なIDです" }); return; }
        try {
            await service.deleteSession(id, req.user!.staff_id);
            res.json({ message: "削除しました" });
        } catch {
            res.status(500).json({ error: "削除に失敗しました" });
        }
    };
}