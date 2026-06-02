import type { Request, Response } from "express";
import * as assignmentService from "../services/assignment.service.js";

export class AssignmentController {
    /** POST /api/assignments — 割り振りリクエスト作成（全ロール） */
    createRequest = async (req: Request, res: Response): Promise<void> => {
        const { booking_id, target_staff_id, note } = req.body;
        const requested_by = req.user!.staff_id; //.  req.user! は null や undefined じゃないと俺は保証する　という意味

        if (!booking_id || !target_staff_id) {
            res.status(400).json({ error: "booking_id と target_staff_id は必須です" });
            return;
        }

        try {
            const created = await assignmentService.createRequest({
                booking_id:      Number(booking_id),
                target_staff_id: Number(target_staff_id),
                requested_by,
                note,
            });
            res.status(201).json(created);
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    };

    /** GET /api/assignments — リクエスト一覧（supervisor: 全件 / 他: 自分が申請分のみ） */
    listRequests = async (req: Request, res: Response): Promise<void> => {
        const isSupervisor = req.user?.role === "supervisor";
        const status       = req.query.status as string | undefined;

        const filters: { status?: string; requestedBy?: number } = {};
        if (status) filters.status = status;
        if (!isSupervisor) filters.requestedBy = req.user!.staff_id;

        try {
            const requests = await assignmentService.listRequests(filters);
            res.json(requests);
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    };

    /** GET /api/assignments/pending/count — 未承認件数（ヘッダーバッジ用） */
    getPendingCount = async (req: Request, res: Response): Promise<void> => {
        if (req.user?.role !== "supervisor") {
            res.json({ count: 0 });
            return;
        }
        try {
            const count = await assignmentService.getPendingCount();
            res.json({ count });
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    };

    /** PUT /api/assignments/:id/approve — 承認（supervisor のみ） */
    approveRequest = async (req: Request, res: Response): Promise<void> => {
        if (req.user?.role !== "supervisor") {
            res.status(403).json({ error: "承認は管理者のみ可能です" });
            return;
        }
        try {
            const updated = await assignmentService.approveRequest(
                Number(req.params.id),
                req.user!.staff_id
            );
            res.json(updated);
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    };

    /** PUT /api/assignments/:id/reject — 却下（supervisor のみ） */
    rejectRequest = async (req: Request, res: Response): Promise<void> => {
        if (req.user?.role !== "supervisor") {
            res.status(403).json({ error: "却下は管理者のみ可能です" });
            return;
        }
        try {
            const updated = await assignmentService.rejectRequest(
                Number(req.params.id),
                req.user!.staff_id
            );
            res.json(updated);
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    };
}
