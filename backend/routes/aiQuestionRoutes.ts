import { Router } from "express";
import { AiQuestionController } from "../controllers/aiQuestion.controller.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();
const ctrl   = new AiQuestionController();

router.get("/frequent", authMiddleware, ctrl.getFrequentQuestions);

export default router;
