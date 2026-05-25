import type { Request, Response } from "express";
import * as skillService from "../services/skillService.js";

export class SkillController {
    /** GET /api/skills */
    getSkills = async (_req: Request, res: Response): Promise<void> => {
        try {
            res.json(await skillService.getAllSkills());
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    };

    /** GET /api/skills/staff */
    getAllStaffSkills = async (_req: Request, res: Response): Promise<void> => {
        try {
            res.json(await skillService.getAllStaffWithSkills());
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    };

    /** GET /api/skills/staff/:staffId */
    getStaffSkills = async (req: Request, res: Response): Promise<void> => {
        const staffId = Number(req.params.staffId);
        if (isNaN(staffId)) { res.status(400).json({ error: "staffId が不正です" }); return; }

        try {
            const data = await skillService.getStaffSkills(staffId);
            if (!data) { res.status(404).json({ error: "スタッフが見つかりません" }); return; }
            res.json(data);
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    };

    /** PUT /api/skills/staff/:staffId — supervisorのみ */
    updateStaffSkills = async (req: Request, res: Response): Promise<void> => {
        if (req.user?.role !== "supervisor") {
            res.status(403).json({ error: "スキル更新は管理者のみ可能です" });
            return;
        }
        const staffId = Number(req.params.staffId);
        if (isNaN(staffId)) { res.status(400).json({ error: "staffId が不正です" }); return; }

        const skills: { skill_id: number; level: number }[] = req.body.skills ?? [];
        const invalid = skills.find(s => s.level < 1 || s.level > 5);
        if (invalid) { res.status(400).json({ error: "level は 1〜5 の整数で指定してください" }); return; }

        try {
            res.json(await skillService.updateStaffSkills(staffId, skills));
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    };

    /** GET /api/skills/requirements */
    getServiceRequirements = async (_req: Request, res: Response): Promise<void> => {
        try {
            res.json(await skillService.getServiceRequirements());
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    };
}
