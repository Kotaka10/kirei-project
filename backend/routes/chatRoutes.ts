import { Router } from "express";
import { ChatController } from "../controllers/chat.controller.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();
const ctrl   = new ChatController();

router.post  ("/",       authMiddleware, ctrl.sendMessage);
router.delete("/session", authMiddleware, ctrl.resetSession);

export default router;