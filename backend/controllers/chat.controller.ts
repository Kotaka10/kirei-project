import type { Request, Response } from "express";
import { ChatService } from "../services/chat.service.js";
import { z } from "zod";

const SendMessageSchema = z.object({
    message:    z.string().min(1, "メッセージを入力してください").max(500, "500文字以内で入力してください"),
    session_id: z.string().optional(),
})

export class ChatController {
    private chatService = new ChatService();

    sendMessage = async (req: Request, res: Response): Promise<void> => {
        const parsed = SendMessageSchema.safeParse(req.body); // 安全にバリデーション
        if (!parsed.success) {
            res.status(400).json({
                error: parsed.error.issues[0]?.message ?? "入力が不正です",
            });

            return;
        }

        const user = req.user;
        if (!user) {
            res.status(401).json({ error: "認証が必要です" });
            return;
        }

        try {
            const result = await this.chatService.sendMessage(
                parsed.data.message,
                parsed.data.session_id,
                {
                    staffId: user.staff_id,
                    name:    user.name,
                    role:    user.role,
                }
            );
            res.json(result);
        } catch (err: any) {
            console.error(`[ChatController][${user.name}]`, err);
            res.status(500).json({ error: err.message ?? "エラーが発生しました" });
        }
    };

    resetSession = (req: Request, res: Response): void => {
        const user =       req.user!;
        const session_id = (req.query.session_id as string) ?? "default";

        this.chatService.resetSession(user.staff_id, session_id);
        res.json({ message: "会話履歴をリセットしました" });
    }
}