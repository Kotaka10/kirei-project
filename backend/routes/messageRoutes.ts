import { Router } from "express";
import type { MessageController } from "../controllers/messageController.js";

export const createMessageRouter = (controller: MessageController) => {
    const router = Router();

    router.get("/", controller.getMessages);
    router.post("/", controller.createMessages);

    return router;
}