import { Router } from "express";
import { SkillController } from "../controllers/skill.controller.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();
const ctrl   = new SkillController();

router.get("/",                   authMiddleware, ctrl.getSkills);
router.get("/staff",              authMiddleware, ctrl.getAllStaffSkills);
router.get("/staff/:staffId",     authMiddleware, ctrl.getStaffSkills);
router.put("/staff/:staffId",     authMiddleware, ctrl.updateStaffSkills);
router.get("/requirements",       authMiddleware, ctrl.getServiceRequirements);

export default router;
