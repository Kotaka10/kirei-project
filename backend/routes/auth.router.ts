import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";

const router = Router();
const ctrl = new AuthController();

router.post("/login", ctrl.login);
router.get("/me", ctrl.me);

export default router;