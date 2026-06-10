import type { Request, Response } from "express";
import { CaseService } from "../services/case.service.js";
import { CaseClarificationNeededError } from "../services/caseAi.service.js";
import { CreateCaseSchema, UpdateCaseStatusSchema } from "../types/case.js";

export class CaseController {
    private readonly service = new CaseService();

    createCase = async (req: Request, res: Response): Promise<void> => {
        const parsed = CreateCaseSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: parsed.error.issues[0]?.message ?? "入力が不正です" });
            return;
        }
        const user = req.user;
        if (!user) { res.status(401).json({ error: "認証が必要です" }); return; }

        try {
            const result = await this.service.createCase(parsed.data.summary, user.staff_id);
            res.status(201).json(result);
        } catch (err: any) {
            if (err instanceof CaseClarificationNeededError) {
                res.status(422).json({
                    error:         err.message,
                    code:          "case_needs_clarification",
                    missingFields: err.missingFields,
                    questions:     err.questions,
                });
                return;
            }
            console.error("[CaseController.createCase]", err);
            res.status(500).json({ error: err.message ?? "案件の作成に失敗しました" });
        }
    };

    getCases = async (_req: Request, res: Response): Promise<void> => {
        try {
            const cases = await this.service.getCases();
            res.json(cases);
        } catch (err: any) {
            res.status(500).json({ error: err.message ?? "取得に失敗しました" });
        }
    };

    getCaseById = async (req: Request, res: Response): Promise<void> => {
        const id = parseInt(String(req.params.id), 10);
        if (isNaN(id)) { res.status(400).json({ error: "無効なIDです" }); return; }

        try {
            const c = await this.service.getCaseById(id);
            if (!c) { res.status(404).json({ error: "案件が見つかりません" }); return; }
            res.json(c);
        } catch (err: any) {
            res.status(500).json({ error: err.message ?? "取得に失敗しました" });
        }
    };

    updateStatus = async (req: Request, res: Response): Promise<void> => {
        const id = parseInt(String(req.params.id), 10);
        if (isNaN(id)) { res.status(400).json({ error: "無効なIDです" }); return; }

        const parsed = UpdateCaseStatusSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: parsed.error.issues[0]?.message ?? "入力が不正です" });
            return;
        }

        try {
            await this.service.updateStatus(id, parsed.data.status);
            res.json({ message: "ステータスを更新しました" });
        } catch (err: any) {
            res.status(500).json({ error: err.message ?? "更新に失敗しました" });
        }
    };

    getNotifications = async (req: Request, res: Response): Promise<void> => {
        const user = req.user;
        if (!user) { res.status(401).json({ error: "認証が必要です" }); return; }

        try {
            const notifications = await this.service.getNotifications(user.staff_id);
            res.json(notifications);
        } catch (err: any) {
            res.status(500).json({ error: err.message ?? "通知の取得に失敗しました" });
        }
    };

    markRead = async (req: Request, res: Response): Promise<void> => {
        const user = req.user;
        if (!user) { res.status(401).json({ error: "認証が必要です" }); return; }

        const id = parseInt(String(req.params.id), 10);
        if (isNaN(id)) { res.status(400).json({ error: "無効なIDです" }); return; }

        try {
            await this.service.markRead(id, user.staff_id);
            res.json({ message: "既読にしました" });
        } catch (err: any) {
            res.status(500).json({ error: err.message ?? "更新に失敗しました" });
        }
    };

    markAllRead = async (req: Request, res: Response): Promise<void> => {
        const user = req.user;
        if (!user) { res.status(401).json({ error: "認証が必要です" }); return; }

        try {
            await this.service.markAllRead(user.staff_id);
            res.json({ message: "すべて既読にしました" });
        } catch (err: any) {
            res.status(500).json({ error: err.message ?? "更新に失敗しました" });
        }
    };

    getUnreadCount = async (req: Request, res: Response): Promise<void> => {
        const user = req.user;
        if (!user) { res.status(401).json({ error: "認証が必要です" }); return; }

        try {
            const count = await this.service.getUnreadCount(user.staff_id);
            res.json({ count });
        } catch (err: any) {
            res.status(500).json({ error: err.message ?? "取得に失敗しました" });
        }
    };
}
