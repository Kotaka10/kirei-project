import { Router } from "express";
import { ChatHistoryController } from "../controllers/chatHistory.controller.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();
const ctrl   = new ChatHistoryController();

router.get   ("/",    authMiddleware, ctrl.getSessions);    // GET    /api/chat/sessions
router.get   ("/:id", authMiddleware, ctrl.getMessages);    // GET    /api/chat/sessions/:id
router.patch ("/:id", authMiddleware, ctrl.renameSession);  // PATCH  /api/chat/sessions/:id
router.delete("/:id", authMiddleware, ctrl.deleteSession);  // DELETE /api/chat/sessions/:id

export default router;