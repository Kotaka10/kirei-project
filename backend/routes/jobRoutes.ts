import { Router } from "express";
import { JobController } from "../controllers/job.controller.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();
const ctrl   = new JobController();

router.get("/",       authMiddleware, ctrl.getJobs);
router.get("/staff",  authMiddleware, ctrl.getStaff);

export default router;
