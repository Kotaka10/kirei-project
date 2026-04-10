import type { Request, Response } from "express";
import type { MessageService } from "../services/messageService.js";

export const createMessageController = (service: MessageService) => {
    return {
        getMessages: (req: Request, res: Response) => {
            const messages = service.getMessages();
            res.json(messages);
        }
    }
}

export type MessageController = ReturnType<typeof createMessageController>;