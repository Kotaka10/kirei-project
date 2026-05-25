import { Router } from "express";
import { AssignmentController } from "../controllers/assignment.controller.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();
const ctrl   = new AssignmentController();

router.get("/pending/count",   authMiddleware, ctrl.getPendingCount);
router.get("/",                authMiddleware, ctrl.listRequests);
router.post("/",               authMiddleware, ctrl.createRequest);
router.put("/:id/approve",     authMiddleware, ctrl.approveRequest);
router.put("/:id/reject",      authMiddleware, ctrl.rejectRequest);

export default router;
