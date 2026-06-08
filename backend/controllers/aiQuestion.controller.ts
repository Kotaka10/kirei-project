import type { Request, Response } from "express";
import { AiQuestionService } from "../services/aiQuestion.service.js";

export class AiQuestionController {
    private readonly service = new AiQuestionService();

    getFrequentQuestions = async (req: Request, res: Response): Promise<void> => {
        const user = req.user;
        if (!user) {
            res.status(401).json({ error: "認証が必要です" });
            return;
        }

        try {
            const result = await this.service.getFrequentQuestions({
                staffId: user.staff_id,
                name:    user.name,
                role:    user.role,
            });
            res.json(result);
        } catch (err: any) {
            console.error(`[AiQuestionController][${user.name}]`, err);
            res.status(500).json({ error: "質問候補の取得に失敗しました" });
        }
    };
}
