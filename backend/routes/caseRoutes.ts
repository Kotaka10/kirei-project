import { Router } from "express";
import { CaseController } from "../controllers/case.controller.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();
const ctrl   = new CaseController();

// 案件
router.get("/",          authMiddleware, ctrl.getCases);
router.post("/",         authMiddleware, ctrl.createCase);
router.get("/:id",       authMiddleware, ctrl.getCaseById);
router.patch("/:id/status", authMiddleware, ctrl.updateStatus);

// 通知
router.get("/notifications/me",         authMiddleware, ctrl.getNotifications);
router.get("/notifications/unread-count", authMiddleware, ctrl.getUnreadCount);
router.patch("/notifications/read-all", authMiddleware, ctrl.markAllRead);
router.patch("/notifications/:id/read", authMiddleware, ctrl.markRead);

export default router;