import type { Request, Response } from "express";
import * as jobService from "../services/jobService.js";

export class JobController {
    /** GET /api/jobs?date=YYYY-MM-DD */
    getJobs = async (req: Request, res: Response): Promise<void> => {
        const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);
        try {
            const jobs = await jobService.getJobs(date);
            res.json(jobs);
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    };

    /** GET /api/jobs/staff */
    getStaff = async (_req: Request, res: Response): Promise<void> => {
        try {
            const staff = await jobService.getActiveStaff();
            res.json(staff);
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    };
}
